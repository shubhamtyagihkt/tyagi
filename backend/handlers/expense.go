package handlers

import (
	"net/http"
	"strings"
	"time"

	"autoparts-app/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ExpenseHandler struct {
	DB *gorm.DB
}

type createExpenseRequest struct {
	Title  string  `json:"title" binding:"required"`
	Amount float64 `json:"amount" binding:"required,gt=0"`
	Notes  string  `json:"notes"`
	Date   string  `json:"date" binding:"required"`
}

func NewExpenseHandler(db *gorm.DB) *ExpenseHandler {
	return &ExpenseHandler{DB: db}
}

func (h *ExpenseHandler) List(c *gin.Context) {
	query := h.DB.Model(&models.Expense{})

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

	var expenses []models.Expense
	if err := query.Order("date desc, id desc").Find(&expenses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, expenses)
}

func (h *ExpenseHandler) Create(c *gin.Context) {
	var payload createExpenseRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	parsedDate, err := time.Parse("2006-01-02", payload.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
		return
	}

	expense := models.Expense{
		Title:  payload.Title,
		Amount: payload.Amount,
		Notes:  payload.Notes,
		Date:   parsedDate,
	}

	if err := h.DB.Create(&expense).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, expense)
}

func (h *ExpenseHandler) SoftDelete(c *gin.Context) {
	id := c.Param("id")

	res := h.DB.Delete(&models.Expense{}, id)
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": res.Error.Error()})
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "expense not found"})
		return
	}

	c.Status(http.StatusNoContent)
}
