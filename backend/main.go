package main

import (
	"log"
	"os"

	"autoparts-app/backend/db"
	"autoparts-app/backend/router"
)

func main() {
	dbPath, err := db.GetDatabasePath()
	if err != nil {
		log.Fatalf("failed to get database path: %v", err)
	}

	database, err := db.ConnectPath(dbPath)
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	r := router.Setup(database)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	if err := r.Run(":" + port); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
