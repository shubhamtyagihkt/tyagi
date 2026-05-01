package handlers

import (
	"net/http"
	"strings"

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

func NewReportsHandler(db *gorm.DB) *ReportsHandler {
	return &ReportsHandler{DB: db}
}

func (h *ReportsHandler) Summary(c *gin.Context) {
	var (
		fromFilter bool
		toFilter   bool
		from       interface{}
		to         interface{}
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

	totalSalesRevenue, salesBySKU, err := h.salesData(fromFilter, from, toFilter, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	purchaseAvgBySKU, err := h.purchaseAverages(toFilter, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var totalPurchaseCost float64
	for _, sale := range salesBySKU {
		if avgCost, ok := purchaseAvgBySKU[sale.SKUID]; ok {
			totalPurchaseCost += avgCost * float64(sale.TotalQty)
		}
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

func (h *ReportsHandler) salesData(fromFilter bool, from interface{}, toFilter bool, to interface{}) (float64, []skuSalesAgg, error) {
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

func (h *ReportsHandler) purchaseAverages(toFilter bool, to interface{}) (map[string]float64, error) {
	query := h.DB.Model(&models.Purchase{}).Select("sku_id, COALESCE(SUM(qty), 0) AS total_qty, COALESCE(SUM(qty * purchase_price), 0) AS total_amount")
	if toFilter {
		query = query.Where("date <= ?", to)
	}
	query = query.Group("sku_id")

	var purchaseAgg []skuPurchaseAgg
	if err := query.Scan(&purchaseAgg).Error; err != nil {
		return nil, err
	}

	avg := make(map[string]float64, len(purchaseAgg))
	for _, row := range purchaseAgg {
		if row.TotalQty <= 0 {
			continue
		}
		avg[row.SKUID] = row.TotalAmount / float64(row.TotalQty)
	}
	return avg, nil
}

func (h *ReportsHandler) totalExpenses(fromFilter bool, from interface{}, toFilter bool, to interface{}) (float64, error) {
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
