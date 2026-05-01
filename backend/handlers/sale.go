package handlers

import (
	"net/http"
	"strings"
	"time"

	"autoparts-app/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SaleHandler struct {
	DB *gorm.DB
}

type createSaleRequest struct {
	SKUID     string  `json:"sku_id" binding:"required"`
	Qty       int     `json:"qty" binding:"required,gt=0"`
	SalePrice float64 `json:"sale_price" binding:"required,gt=0"`
	Customer  string  `json:"customer"`
	Date      string  `json:"date" binding:"required"`
}

func NewSaleHandler(db *gorm.DB) *SaleHandler {
	return &SaleHandler{DB: db}
}

func (h *SaleHandler) List(c *gin.Context) {
	query := h.DB.Model(&models.Sale{})

	dateFrom := strings.TrimSpace(c.Query("date_from"))
	if dateFrom != "" {
		from, err := parseDateBoundary(dateFrom, false)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date_from format, use YYYY-MM-DD"})
			return
		}
		query = query.Where("date >= ?", from)
	}

	dateTo := strings.TrimSpace(c.Query("date_to"))
	if dateTo != "" {
		to, err := parseDateBoundary(dateTo, true)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date_to format, use YYYY-MM-DD"})
			return
		}
		query = query.Where("date <= ?", to)
	}

	var sales []models.Sale
	if err := query.Order("date desc, id desc").Find(&sales).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, sales)
}

func (h *SaleHandler) Create(c *gin.Context) {
	var payload createSaleRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var sku models.SKU
	if err := h.DB.First(&sku, "id = ?", payload.SKUID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusBadRequest, gin.H{"error": "sku not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	availableStock, err := h.currentStock(payload.SKUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if payload.Qty > availableStock {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":           "insufficient stock",
			"available_stock": availableStock,
		})
		return
	}

	parsedDate, err := time.Parse("2006-01-02", payload.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
		return
	}

	sale := models.Sale{
		SKUID:     payload.SKUID,
		Qty:       payload.Qty,
		SalePrice: payload.SalePrice,
		Customer:  payload.Customer,
		Date:      parsedDate,
	}

	if err := h.DB.Create(&sale).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, sale)
}

func (h *SaleHandler) SoftDelete(c *gin.Context) {
	id := c.Param("id")

	res := h.DB.Delete(&models.Sale{}, id)
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": res.Error.Error()})
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "sale not found"})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *SaleHandler) currentStock(skuID string) (int, error) {
	var purchaseQty int64
	if err := h.DB.Model(&models.Purchase{}).
		Where("sku_id = ?", skuID).
		Select("COALESCE(SUM(qty), 0)").
		Scan(&purchaseQty).Error; err != nil {
		return 0, err
	}

	var saleQty int64
	if err := h.DB.Model(&models.Sale{}).
		Where("sku_id = ?", skuID).
		Select("COALESCE(SUM(qty), 0)").
		Scan(&saleQty).Error; err != nil {
		return 0, err
	}

	return int(purchaseQty - saleQty), nil
}
