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
	MinStock          int            `json:"min_stock" gorm:"not null;default:0"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `json:"-" gorm:"index"`
}

type Purchase struct {
	ID                uint           `json:"id" gorm:"primaryKey"`
	SKUID             string         `json:"sku_id" gorm:"column:sku_id;not null;index"`
	LegacySKUID       string         `json:"-" gorm:"column:sk_uid"`
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
	ID          uint           `json:"id" gorm:"primaryKey"`
	SKUID       string         `json:"sku_id" gorm:"column:sku_id;not null;index"`
	LegacySKUID string         `json:"-" gorm:"column:sk_uid"`
	SaleType    string         `json:"sale_type" gorm:"not null;default:'item';index"`
	ServiceName string         `json:"service_name" gorm:"not null;default:''"`
	Qty         int            `json:"qty" gorm:"not null"`
	SalePrice   float64        `json:"sale_price" gorm:"not null"`
	Customer    string         `json:"customer" gorm:"not null;default:''"`
	Date        time.Time      `json:"date" gorm:"not null;index"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
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

type FinanceTransaction struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Title     string    `json:"title" gorm:"not null"`
	Amount    float64   `json:"amount" gorm:"not null"`
	Notes     string    `json:"notes" gorm:"not null;default:''"`
	Date      time.Time `json:"date" gorm:"not null;index"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (p *Purchase) BeforeCreate(tx *gorm.DB) error {
	p.LegacySKUID = p.SKUID
	return nil
}

func (p *Purchase) BeforeUpdate(tx *gorm.DB) error {
	p.LegacySKUID = p.SKUID
	return nil
}

func (p *Purchase) AfterFind(tx *gorm.DB) error {
	if p.SKUID == "" {
		p.SKUID = p.LegacySKUID
	}
	return nil
}

func (s *Sale) BeforeCreate(tx *gorm.DB) error {
	s.LegacySKUID = s.SKUID
	return nil
}

func (s *Sale) BeforeUpdate(tx *gorm.DB) error {
	s.LegacySKUID = s.SKUID
	return nil
}

func (s *Sale) AfterFind(tx *gorm.DB) error {
	if s.SKUID == "" {
		s.SKUID = s.LegacySKUID
	}
	return nil
}
