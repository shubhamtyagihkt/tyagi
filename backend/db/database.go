package db

import (
	"autoparts-app/backend/models"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func Connect() (*gorm.DB, error) {
	return ConnectPath("autoparts.db")
}

func ConnectPath(path string) (*gorm.DB, error) {
	database, err := gorm.Open(sqlite.Open(path), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	if err := Migrate(database); err != nil {
		return nil, err
	}

	return database, nil
}

func Migrate(database *gorm.DB) error {
	// Create table if not exist / add column if not in table
	return database.AutoMigrate(&models.SKU{}, &models.Purchase{}, &models.Sale{}, &models.Expense{}, &models.FinanceTransaction{})
}
