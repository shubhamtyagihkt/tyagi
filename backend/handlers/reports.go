package handlers

import (
	"net/http"
	"strings"
	"time"

	"autoparts-app/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ReportsHandler struct {
	DB *gorm.DB
}

type reportResponse struct {
	TotalSalesRevenue float64 `json:"total_sales_revenue"`
	TotalPurchaseCost float64 `json:"total_purchase_cost"`
	GrossProfit       float64 `json:"gross_profit"`
	TotalExpenses     float64 `json:"total_expenses"`
	NetProfit         float64 `json:"net_profit"`
}

type skuPurchaseAgg struct {
	SKUID       string  `json:"sku_id"`
	TotalQty    int64   `json:"total_qty"`
	TotalAmount float64 `json:"total_amount"`
}

type skuSalesAgg struct {
	SKUID        string  `json:"sku_id"`
	TotalQty     int64   `json:"total_qty"`
	TotalRevenue float64 `json:"total_revenue"`
}

type fifoPurchaseLayer struct {
	SKUID     string
	QtyLeft   int
	UnitPrice float64
}

func NewReportsHandler(db *gorm.DB) *ReportsHandler {
	return &ReportsHandler{DB: db}
}

func (h *ReportsHandler) Summary(c *gin.Context) {
	var (
		fromFilter bool
		toFilter   bool
		from       time.Time
		to         time.Time
	)

	dateFrom := strings.TrimSpace(c.Query("date_from"))
	if dateFrom != "" {
		parsedFrom, err := parseDateBoundary(dateFrom, false)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date_from format, use YYYY-MM-DD"})
			return
		}
		fromFilter = true
		from = parsedFrom
	}

	dateTo := strings.TrimSpace(c.Query("date_to"))
	if dateTo != "" {
		parsedTo, err := parseDateBoundary(dateTo, true)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date_to format, use YYYY-MM-DD"})
			return
		}
		toFilter = true
		to = parsedTo
	}

	totalSalesRevenue, _, err := h.salesData(fromFilter, from, toFilter, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	totalPurchaseCost, err := h.fifoPurchaseCost(fromFilter, from, toFilter, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	totalExpenses, err := h.totalExpenses(fromFilter, from, toFilter, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	grossProfit := totalSalesRevenue - totalPurchaseCost
	netProfit := grossProfit - totalExpenses

	c.JSON(http.StatusOK, reportResponse{
		TotalSalesRevenue: totalSalesRevenue,
		TotalPurchaseCost: totalPurchaseCost,
		GrossProfit:       grossProfit,
		TotalExpenses:     totalExpenses,
		NetProfit:         netProfit,
	})
}

func (h *ReportsHandler) salesData(fromFilter bool, from time.Time, toFilter bool, to time.Time) (float64, []skuSalesAgg, error) {
	query := h.DB.Model(&models.Sale{}).Select("sku_id, COALESCE(SUM(qty), 0) AS total_qty, COALESCE(SUM(qty * sale_price), 0) AS total_revenue")
	if fromFilter {
		query = query.Where("date >= ?", from)
	}
	if toFilter {
		query = query.Where("date <= ?", to)
	}
	query = query.Group("sku_id")

	var salesBySKU []skuSalesAgg
	if err := query.Scan(&salesBySKU).Error; err != nil {
		return 0, nil, err
	}

	var totalSalesRevenue float64
	for _, row := range salesBySKU {
		totalSalesRevenue += row.TotalRevenue
	}

	return totalSalesRevenue, salesBySKU, nil
}

func (h *ReportsHandler) fifoPurchaseCost(fromFilter bool, from time.Time, toFilter bool, to time.Time) (float64, error) {
	purchaseQuery := h.DB.Model(&models.Purchase{})
	if toFilter {
		purchaseQuery = purchaseQuery.Where("date <= ?", to)
	}

	var purchases []models.Purchase
	if err := purchaseQuery.Order("date asc, id asc").Find(&purchases).Error; err != nil {
		return 0, err
	}

	layersBySKU := make(map[string][]fifoPurchaseLayer)
	for _, purchase := range purchases {
		layersBySKU[purchase.SKUID] = append(layersBySKU[purchase.SKUID], fifoPurchaseLayer{
			SKUID:     purchase.SKUID,
			QtyLeft:   purchase.Qty,
			UnitPrice: purchase.PurchasePrice,
		})
	}

	saleQuery := h.DB.Model(&models.Sale{}).Where("(sale_type = ? OR sale_type = ?)", "", "item")
	if toFilter {
		saleQuery = saleQuery.Where("date <= ?", to)
	}

	var sales []models.Sale
	if err := saleQuery.Order("date asc, id asc").Find(&sales).Error; err != nil {
		return 0, err
	}

	var totalCost float64
	for _, sale := range sales {
		countCost := true
		if fromFilter && sale.Date.Before(from) {
			countCost = false
		}

		remaining := sale.Qty
		layers := layersBySKU[sale.SKUID]
		for index := range layers {
			if remaining <= 0 {
				break
			}
			if layers[index].QtyLeft <= 0 {
				continue
			}

			usedQty := remaining
			if layers[index].QtyLeft < usedQty {
				usedQty = layers[index].QtyLeft
			}
			if countCost {
				totalCost += float64(usedQty) * layers[index].UnitPrice
			}

			layers[index].QtyLeft -= usedQty
			remaining -= usedQty
		}
		layersBySKU[sale.SKUID] = layers
	}

	return totalCost, nil
}

func (h *ReportsHandler) totalExpenses(fromFilter bool, from time.Time, toFilter bool, to time.Time) (float64, error) {
	query := h.DB.Model(&models.Expense{})
	if fromFilter {
		query = query.Where("date >= ?", from)
	}
	if toFilter {
		query = query.Where("date <= ?", to)
	}

	var total float64
	if err := query.Select("COALESCE(SUM(amount), 0)").Scan(&total).Error; err != nil {
		return 0, err
	}
	return total, nil
}
