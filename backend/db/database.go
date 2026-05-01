package db

import (
	"autoparts-app/backend/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func Connect() (*gorm.DB, error) {
	database, err := gorm.Open(sqlite.Open("autoparts.db"), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	if err := database.AutoMigrate(&models.SKU{}, &models.Purchase{}, &models.Sale{}, &models.Expense{}); err != nil {
		return nil, err
	}

	return database, nil
}
