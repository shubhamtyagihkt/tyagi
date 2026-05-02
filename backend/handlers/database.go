package handlers

import (
	"net/http"
	"os"
	"path/filepath"

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

type SelectDatabaseRequest struct {
	Path string `json:"path" binding:"required"`
}

func (h *DatabaseHandler) Select(c *gin.Context) {
	var req SelectDatabaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "path is required"})
		return
	}

	normalizedPath, err := appdb.NormalizePath(req.Path)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate file extension
	ext := filepath.Ext(normalizedPath)
	if ext != ".db" && ext != ".sqlite" && ext != ".sqlite3" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "path must end with .db, .sqlite, or .sqlite3"})
		return
	}

	if info, err := os.Stat(normalizedPath); err != nil {
		if os.IsNotExist(err) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "database file does not exist"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": "could not access database file: " + err.Error()})
		return
	} else if info.IsDir() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "database path cannot be a directory"})
		return
	}

	// Try to connect to the database at the given path
	nextDB, err := appdb.ConnectPath(normalizedPath)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "could not open database at path: " + err.Error()})
		return
	}

	// Save the normalized path to config
	if err := appdb.SetDatabasePath(normalizedPath); err != nil {
		if oldSQL, cerr := nextDB.DB(); cerr == nil && oldSQL != nil {
			_ = oldSQL.Close()
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not save database path: " + err.Error()})
		return
	}

	oldSQL, _ := h.DB.DB()
	*h.DB = *nextDB
	if oldSQL != nil {
		_ = oldSQL.Close()
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "database selected",
		"path":    normalizedPath,
	})
}
