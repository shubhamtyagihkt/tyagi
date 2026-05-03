package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"autoparts-app/backend/models"
	"autoparts-app/backend/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SKUHandler struct {
	DB *gorm.DB
}

type createSKURequest struct {
	Name              string  `json:"name" binding:"required"`
	Category          string  `json:"category" binding:"required"`
	Subcategory       string  `json:"subcategory" binding:"required"`
	Brand             string  `json:"brand" binding:"required"`
	Compatibility     string  `json:"compatibility"`
	Unit              string  `json:"unit" binding:"required"`
	ExpectedSalePrice float64 `json:"expected_sale_price"`
	MinStock          int     `json:"min_stock"`
}

type updateSKURequest struct {
	Name              string  `json:"name" binding:"required"`
	Category          string  `json:"category" binding:"required"`
	Subcategory       string  `json:"subcategory" binding:"required"`
	Brand             string  `json:"brand" binding:"required"`
	Compatibility     string  `json:"compatibility"`
	Unit              string  `json:"unit" binding:"required"`
	ExpectedSalePrice float64 `json:"expected_sale_price"`
	MinStock          int     `json:"min_stock"`
}

type skuResponse struct {
	models.SKU
	CurrentStock int `json:"current_stock"`
}

func NewSKUHandler(db *gorm.DB) *SKUHandler {
	return &SKUHandler{DB: db}
}

func (h *SKUHandler) List(c *gin.Context) {
	var skus []models.SKU

	query := h.DB.Model(&models.SKU{}).Where("id <> ?", serviceSaleSKUID)
	search := strings.TrimSpace(c.Query("q"))
	category := strings.TrimSpace(c.Query("category"))
	subcategory := strings.TrimSpace(c.Query("subcategory"))
	brand := strings.TrimSpace(c.Query("brand"))
	limit := c.Query("limit")
	sortBy := c.Query("sort")

	if search != "" {
		like := "%" + strings.ToLower(search) + "%"
		query = query.Where(
			`LOWER(id) LIKE ? OR LOWER(name) LIKE ? OR LOWER(category) LIKE ? OR LOWER(subcategory) LIKE ? OR LOWER(brand) LIKE ? OR LOWER(compatibility) LIKE ?`,
			like, like, like, like, like, like,
		)
	}

	if category != "" {
		query = query.Where("LOWER(category) = LOWER(?)", category)
	}

	if subcategory != "" {
		query = query.Where("LOWER(subcategory) = LOWER(?)", subcategory)
	}

	if brand != "" {
		query = query.Where("LOWER(brand) = LOWER(?)", brand)
	}

	// Default sorting: recent first, then by category/subcategory/name
	if sortBy == "recent" {
		query = query.Order("created_at DESC")
	} else {
		query = query.Order("category asc, subcategory asc, name asc")
	}

	// Limit results if specified
	if limit != "" {
		if limitNum, err := strconv.Atoi(limit); err == nil && limitNum > 0 {
			query = query.Limit(limitNum)
		}
	}

	if err := query.Find(&skus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := make([]skuResponse, 0, len(skus))
	for _, sku := range skus {
		currentStock, err := h.currentStock(sku.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		response = append(response, skuResponse{
			SKU:          sku,
			CurrentStock: currentStock,
		})
	}

	c.JSON(http.StatusOK, response)
}

func (h *SKUHandler) Create(c *gin.Context) {
	var payload createSKURequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := utils.GenerateSKUID(h.DB, payload.Category, payload.Brand)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	sku := models.SKU{
		ID:                id,
		Name:              payload.Name,
		Category:          payload.Category,
		Subcategory:       payload.Subcategory,
		Brand:             payload.Brand,
		Compatibility:     payload.Compatibility,
		Unit:              payload.Unit,
		ExpectedSalePrice: payload.ExpectedSalePrice,
		MinStock:          payload.MinStock,
	}

	if err := h.DB.Create(&sku).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, skuResponse{
		SKU:          sku,
		CurrentStock: 0,
	})
}

func (h *SKUHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	var sku models.SKU
	if err := h.DB.First(&sku, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "sku not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	currentStock, err := h.currentStock(sku.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, skuResponse{
		SKU:          sku,
		CurrentStock: currentStock,
	})
}

func (h *SKUHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var sku models.SKU
	if err := h.DB.First(&sku, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "sku not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var payload updateSKURequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sku.Name = payload.Name
	sku.Category = payload.Category
	sku.Subcategory = payload.Subcategory
	sku.Brand = payload.Brand
	sku.Compatibility = payload.Compatibility
	sku.Unit = payload.Unit
	sku.ExpectedSalePrice = payload.ExpectedSalePrice
	sku.MinStock = payload.MinStock

	if err := h.DB.Save(&sku).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	currentStock, err := h.currentStock(sku.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, skuResponse{
		SKU:          sku,
		CurrentStock: currentStock,
	})
}

func (h *SKUHandler) currentStock(skuID string) (int, error) {
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
