package models

import (
	"time"

	"gorm.io/gorm"
)

type SKU struct {
	ID                string         `json:"id" gorm:"primaryKey;size:64"`
	Name              string         `json:"name" gorm:"not null"`
	Category          string         `json:"category" gorm:"not null;index"`
	Subcategory       string         `json:"subcategory" gorm:"not null;index"`
	Brand             string         `json:"brand" gorm:"not null;index"`
	Compatibility     string         `json:"compatibility" gorm:"not null;default:''"`
	Unit              string         `json:"unit" gorm:"not null"`
	ExpectedSalePrice float64        `json:"expected_sale_price" gorm:"not null;default:0"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `json:"-" gorm:"index"`
}

type Purchase struct {
	ID                uint           `json:"id" gorm:"primaryKey"`
	SKUID             string         `json:"sku_id" gorm:"not null;index"`
	Qty               int            `json:"qty" gorm:"not null"`
	PurchasePrice     float64        `json:"purchase_price" gorm:"not null"`
	ExpectedSalePrice *float64       `json:"expected_sale_price,omitempty"`
	Vendor            string         `json:"vendor" gorm:"not null;default:''"`
	InvoiceNumber     string         `json:"invoice_number" gorm:"not null;default:''"`
	Date              time.Time      `json:"date" gorm:"not null;index"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `json:"-" gorm:"index"`
}

type Sale struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	SKUID     string         `json:"sku_id" gorm:"not null;index"`
	Qty       int            `json:"qty" gorm:"not null"`
	SalePrice float64        `json:"sale_price" gorm:"not null"`
	Customer  string         `json:"customer" gorm:"not null;default:''"`
	Date      time.Time      `json:"date" gorm:"not null;index"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

type Expense struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Title     string         `json:"title" gorm:"not null"`
	Amount    float64        `json:"amount" gorm:"not null"`
	Notes     string         `json:"notes" gorm:"not null;default:''"`
	Date      time.Time      `json:"date" gorm:"not null;index"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}
