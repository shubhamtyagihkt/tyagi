package handlers

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	appdb "autoparts-app/backend/db"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type DatabaseHandler struct {
	DB *gorm.DB
}

func NewDatabaseHandler(database *gorm.DB) *DatabaseHandler {
	return &DatabaseHandler{DB: database}
}

func (h *DatabaseHandler) Select(c *gin.Context) {
	file, err := c.FormFile("database")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "database file is required"})
		return
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".db" && ext != ".sqlite" && ext != ".sqlite3" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "select a .db, .sqlite, or .sqlite3 file"})
		return
	}

	if err := os.MkdirAll("databases", 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	name := strings.TrimSuffix(filepath.Base(file.Filename), filepath.Ext(file.Filename))
	name = strings.NewReplacer(" ", "_", "/", "_", "\\", "_").Replace(name)
	target := filepath.Join("databases", name+"-"+time.Now().Format("20060102150405")+ext)

	if err := c.SaveUploadedFile(file, target); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	nextDB, err := appdb.ConnectPath(target)
	if err != nil {
		_ = os.Remove(target)
		c.JSON(http.StatusBadRequest, gin.H{"error": "could not open selected SQLite database: " + err.Error()})
		return
	}

	oldSQL, _ := h.DB.DB()
	*h.DB = *nextDB
	if oldSQL != nil {
		_ = oldSQL.Close()
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "database selected",
		"path":    target,
	})
}
