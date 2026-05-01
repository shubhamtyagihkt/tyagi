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

	if err := database.AutoMigrate(&models.SKU{}, &models.Purchase{}, &models.Sale{}, &models.Expense{}); err != nil {
		return nil, err
	}
	if err := ensureSKUColumnCompatibility(database, "purchases"); err != nil {
		return nil, err
	}
	if err := ensureSKUColumnCompatibility(database, "sales"); err != nil {
		return nil, err
	}

	return database, nil
}

func ensureSKUColumnCompatibility(database *gorm.DB, table string) error {
	// Canonical column is "sku_id", but older runs may use "sk_uid" or "skuid".
	if !database.Migrator().HasColumn(table, "sku_id") {
		if err := database.Exec("ALTER TABLE " + table + " ADD COLUMN sku_id TEXT").Error; err != nil {
			return err
		}
	}

	if !database.Migrator().HasColumn(table, "sk_uid") {
		if err := database.Exec("ALTER TABLE " + table + " ADD COLUMN sk_uid TEXT").Error; err != nil {
			return err
		}
	}

	if database.Migrator().HasColumn(table, "sk_uid") {
		if err := database.Exec(
			"UPDATE " + table + " SET sku_id = sk_uid WHERE (sku_id IS NULL OR sku_id = '') AND sk_uid IS NOT NULL",
		).Error; err != nil {
			return err
		}
	}

	if database.Migrator().HasColumn(table, "skuid") {
		if err := database.Exec(
			"UPDATE " + table + " SET sku_id = skuid WHERE (sku_id IS NULL OR sku_id = '') AND skuid IS NOT NULL",
		).Error; err != nil {
			return err
		}
	}

	// Mirror sku_id into sk_uid too, for legacy NOT NULL schemas that still enforce sk_uid.
	if database.Migrator().HasColumn(table, "sk_uid") {
		if err := database.Exec(
			"UPDATE " + table + " SET sk_uid = sku_id WHERE (sk_uid IS NULL OR sk_uid = '') AND sku_id IS NOT NULL",
		).Error; err != nil {
			return err
		}
	}

	return nil
}
