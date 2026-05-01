package router

import (
	"autoparts-app/backend/handlers"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func Setup(database *gorm.DB) *gin.Engine {
	r := gin.Default()

	api := r.Group("/api")
	{
		skuHandler := handlers.NewSKUHandler(database)
		purchaseHandler := handlers.NewPurchaseHandler(database)
		saleHandler := handlers.NewSaleHandler(database)
		expenseHandler := handlers.NewExpenseHandler(database)
		reportsHandler := handlers.NewReportsHandler(database)

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
	}

	return r
}
