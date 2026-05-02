package handlers

import (
	"net/http"
	"strings"
	"time"

	"autoparts-app/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type PurchaseHandler struct {
	DB *gorm.DB
}

type createPurchaseRequest struct {
	SKUID             string   `json:"sku_id" binding:"required"`
	Qty               int      `json:"qty" binding:"required,gt=0"`
	PurchasePrice     float64  `json:"purchase_price" binding:"required,gt=0"`
	ExpectedSalePrice *float64 `json:"expected_sale_price"`
	Vendor            string   `json:"vendor"`
	InvoiceNumber     string   `json:"invoice_number"`
	Date              string   `json:"date" binding:"required"`
}

func NewPurchaseHandler(db *gorm.DB) *PurchaseHandler {
	return &PurchaseHandler{DB: db}
}

func (h *PurchaseHandler) List(c *gin.Context) {
	query := h.DB.Model(&models.Purchase{})

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

	var purchases []models.Purchase
	if err := query.Order("date desc, id desc").Find(&purchases).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, purchases)
}

func (h *PurchaseHandler) Create(c *gin.Context) {
	var payload createPurchaseRequest
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

	parsedDate, err := time.Parse("2006-01-02", payload.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
		return
	}

	purchase := models.Purchase{
		SKUID:             payload.SKUID,
		Qty:               payload.Qty,
		PurchasePrice:     payload.PurchasePrice,
		ExpectedSalePrice: payload.ExpectedSalePrice,
		Vendor:            payload.Vendor,
		InvoiceNumber:     payload.InvoiceNumber,
		Date:              parsedDate,
	}

	err = h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&purchase).Error; err != nil {
			return err
		}

		if payload.ExpectedSalePrice != nil {
			return tx.Model(&sku).Update("expected_sale_price", *payload.ExpectedSalePrice).Error
		}

		return nil
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, purchase)
}

func (h *PurchaseHandler) SoftDelete(c *gin.Context) {
	id := c.Param("id")

	res := h.DB.Delete(&models.Purchase{}, id)
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": res.Error.Error()})
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "purchase not found"})
		return
	}

	c.Status(http.StatusNoContent)
}

func parseDateBoundary(value string, isEndOfDay bool) (time.Time, error) {
	parsed, err := time.Parse("2006-01-02", value)
	if err != nil {
		return time.Time{}, err
	}
	if isEndOfDay {
		return parsed.Add(23*time.Hour + 59*time.Minute + 59*time.Second), nil
	}
	return parsed, nil
}
