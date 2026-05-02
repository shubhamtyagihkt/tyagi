package router

import (
	"autoparts-app/backend/handlers"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func Setup(database *gorm.DB) *gin.Engine {
	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://127.0.0.1:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api := r.Group("/api")
	{
		skuHandler := handlers.NewSKUHandler(database)
		purchaseHandler := handlers.NewPurchaseHandler(database)
		saleHandler := handlers.NewSaleHandler(database)
		expenseHandler := handlers.NewExpenseHandler(database)
		reportsHandler := handlers.NewReportsHandler(database)
		financeHandler := handlers.NewFinanceHandler(database)

		api.GET("/sku", skuHandler.List)
		api.POST("/sku", skuHandler.Create)
		api.GET("/sku/:id", skuHandler.GetByID)
		api.PUT("/sku/:id", skuHandler.Update)

		api.GET("/purchase", purchaseHandler.List)
		api.POST("/purchase", purchaseHandler.Create)
		api.DELETE("/purchase/:id", purchaseHandler.SoftDelete)

		api.GET("/sale", saleHandler.List)
		api.POST("/sale", saleHandler.Create)
		api.DELETE("/sale/:id", saleHandler.SoftDelete)

		api.GET("/expense", expenseHandler.List)
		api.POST("/expense", expenseHandler.Create)
		api.DELETE("/expense/:id", expenseHandler.SoftDelete)

		api.GET("/reports", reportsHandler.Summary)

		api.GET("/finance", financeHandler.Summary)
		api.POST("/finance/investment", financeHandler.CreateInvestment)
	}

	return r
}
