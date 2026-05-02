package handlers

import (
	"net/http"
	"sort"
	"time"

	"autoparts-app/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type FinanceHandler struct {
	DB *gorm.DB
}

type createInvestmentRequest struct {
	Title  string  `json:"title" binding:"required"`
	Amount float64 `json:"amount" binding:"required,gt=0"`
	Notes  string  `json:"notes"`
	Date   string  `json:"date" binding:"required"`
}

type cashFlowSummary struct {
	Input  float64 `json:"input"`
	Output float64 `json:"output"`
	Net    float64 `json:"net"`
}

type financeTransactionResponse struct {
	ID     uint    `json:"id"`
	Type   string  `json:"type"`
	Title  string  `json:"title"`
	Amount float64 `json:"amount"`
	Date   string  `json:"date"`
	Notes  string  `json:"notes"`
}

type financeSummaryResponse struct {
	TotalMoneyAvailable float64                      `json:"total_money_available"`
	Today               cashFlowSummary              `json:"today"`
	Week                cashFlowSummary              `json:"week"`
	Month               cashFlowSummary              `json:"month"`
	RecentTransactions  []financeTransactionResponse `json:"recent_transactions"`
}

func NewFinanceHandler(db *gorm.DB) *FinanceHandler {
	return &FinanceHandler{DB: db}
}

func (h *FinanceHandler) Summary(c *gin.Context) {
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	day := int(now.Weekday())
	if day == 0 {
		day = 7
	}
	weekStart := todayStart.AddDate(0, 0, 1-day)
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	todayEnd := todayStart.Add(24*time.Hour - time.Second)

	allTime, err := h.cashFlow(time.Time{}, todayEnd)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	today, err := h.cashFlow(todayStart, todayEnd)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	week, err := h.cashFlow(weekStart, todayEnd)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	month, err := h.cashFlow(monthStart, todayEnd)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	recent, err := h.recentTransactions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, financeSummaryResponse{
		TotalMoneyAvailable: allTime.Net,
		Today:               today,
		Week:                week,
		Month:               month,
		RecentTransactions:  recent,
	})
}

func (h *FinanceHandler) CreateInvestment(c *gin.Context) {
	var payload createInvestmentRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	parsedDate, err := time.Parse("2006-01-02", payload.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
		return
	}

	transaction := models.FinanceTransaction{
		Title:  payload.Title,
		Amount: payload.Amount,
		Notes:  payload.Notes,
		Date:   parsedDate,
	}

	if err := h.DB.Create(&transaction).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, transaction)
}

func (h *FinanceHandler) cashFlow(from time.Time, to time.Time) (cashFlowSummary, error) {
	input, err := h.totalInvestments(from, to)
	if err != nil {
		return cashFlowSummary{}, err
	}
	sales, err := h.totalSales(from, to)
	if err != nil {
		return cashFlowSummary{}, err
	}
	purchases, err := h.totalPurchases(from, to)
	if err != nil {
		return cashFlowSummary{}, err
	}
	expenses, err := h.totalExpensesAmount(from, to)
	if err != nil {
		return cashFlowSummary{}, err
	}

	summary := cashFlowSummary{
		Input:  input + sales,
		Output: purchases + expenses,
	}
	summary.Net = summary.Input - summary.Output
	return summary, nil
}

func (h *FinanceHandler) applyDateRange(query *gorm.DB, from time.Time, to time.Time) *gorm.DB {
	if !from.IsZero() {
		query = query.Where("date >= ?", from)
	}
	if !to.IsZero() {
		query = query.Where("date <= ?", to)
	}
	return query
}

func (h *FinanceHandler) totalInvestments(from time.Time, to time.Time) (float64, error) {
	query := h.applyDateRange(h.DB.Model(&models.FinanceTransaction{}), from, to)
	var total float64
	return total, query.Select("COALESCE(SUM(amount), 0)").Scan(&total).Error
}

func (h *FinanceHandler) totalSales(from time.Time, to time.Time) (float64, error) {
	query := h.applyDateRange(h.DB.Model(&models.Sale{}), from, to)
	var total float64
	return total, query.Select("COALESCE(SUM(qty * sale_price), 0)").Scan(&total).Error
}

func (h *FinanceHandler) totalPurchases(from time.Time, to time.Time) (float64, error) {
	query := h.applyDateRange(h.DB.Model(&models.Purchase{}), from, to)
	var total float64
	return total, query.Select("COALESCE(SUM(qty * purchase_price), 0)").Scan(&total).Error
}

func (h *FinanceHandler) totalExpensesAmount(from time.Time, to time.Time) (float64, error) {
	query := h.applyDateRange(h.DB.Model(&models.Expense{}), from, to)
	var total float64
	return total, query.Select("COALESCE(SUM(amount), 0)").Scan(&total).Error
}

func (h *FinanceHandler) recentTransactions() ([]financeTransactionResponse, error) {
	transactions := make([]financeTransactionResponse, 0)

	var investments []models.FinanceTransaction
	if err := h.DB.Order("date desc, id desc").Limit(10).Find(&investments).Error; err != nil {
		return nil, err
	}
	for _, row := range investments {
		transactions = append(transactions, financeTransactionResponse{
			ID:     row.ID,
			Type:   "input",
			Title:  row.Title,
			Amount: row.Amount,
			Date:   row.Date.Format("2006-01-02"),
			Notes:  row.Notes,
		})
	}

	var sales []models.Sale
	if err := h.DB.Order("date desc, id desc").Limit(10).Find(&sales).Error; err != nil {
		return nil, err
	}
	for _, row := range sales {
		transactions = append(transactions, financeTransactionResponse{
			ID:     row.ID,
			Type:   "input",
			Title:  "Sale " + row.SKUID,
			Amount: float64(row.Qty) * row.SalePrice,
			Date:   row.Date.Format("2006-01-02"),
			Notes:  row.Customer,
		})
	}

	var purchases []models.Purchase
	if err := h.DB.Order("date desc, id desc").Limit(10).Find(&purchases).Error; err != nil {
		return nil, err
	}
	for _, row := range purchases {
		transactions = append(transactions, financeTransactionResponse{
			ID:     row.ID,
			Type:   "output",
			Title:  "Purchase " + row.SKUID,
			Amount: float64(row.Qty) * row.PurchasePrice,
			Date:   row.Date.Format("2006-01-02"),
			Notes:  row.Vendor,
		})
	}

	var expenses []models.Expense
	if err := h.DB.Order("date desc, id desc").Limit(10).Find(&expenses).Error; err != nil {
		return nil, err
	}
	for _, row := range expenses {
		transactions = append(transactions, financeTransactionResponse{
			ID:     row.ID,
			Type:   "output",
			Title:  row.Title,
			Amount: row.Amount,
			Date:   row.Date.Format("2006-01-02"),
			Notes:  row.Notes,
		})
	}

	sort.Slice(transactions, func(i, j int) bool {
		return transactions[i].Date > transactions[j].Date
	})
	if len(transactions) > 15 {
		transactions = transactions[:15]
	}
	return transactions, nil
}
