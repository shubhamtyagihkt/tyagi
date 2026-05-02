package db

import (
	"autoparts-app/backend/models"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func Connect() (*gorm.DB, error) {
	database, err := gorm.Open(sqlite.Open("autoparts.db"), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// Create table if not exist / add column if not in table
	if err := database.AutoMigrate(&models.SKU{}, &models.Purchase{}, &models.Sale{}, &models.Expense{}, &models.FinanceTransaction{}); err != nil {
		return nil, err
	}

	return database, nil
}
