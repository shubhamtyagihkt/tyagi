package db

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
)

type Config struct {
	DatabasePath string `json:"database_path"`
}

const configFile = "config.json"

func LoadConfig() (*Config, error) {
	if _, err := os.Stat(configFile); os.IsNotExist(err) {
		return &Config{DatabasePath: "autoparts.db"}, nil
	}

	data, err := os.ReadFile(configFile)
	if err != nil {
		return nil, err
	}

	var config Config
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, err
	}

	if config.DatabasePath == "" {
		config.DatabasePath = "autoparts.db"
	}

	return &config, nil
}

func SaveConfig(config *Config) error {
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(configFile, data, 0644)
}

func NormalizePath(path string) (string, error) {
	path = strings.TrimSpace(path)
	if path == "" {
		return "", errors.New("database path is required")
	}

	if path == "~" || strings.HasPrefix(path, "~/") {
		home, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		path = filepath.Join(home, strings.TrimPrefix(path, "~/"))
	}

	if !filepath.IsAbs(path) {
		absPath, err := filepath.Abs(path)
		if err != nil {
			return "", err
		}
		path = absPath
	}

	return filepath.Clean(path), nil
}

func GetDatabasePath() (string, error) {
	config, err := LoadConfig()
	if err != nil {
		return "", err
	}
	return NormalizePath(config.DatabasePath)
}

func SetDatabasePath(path string) error {
	normalized, err := NormalizePath(path)
	if err != nil {
		return err
	}

	config, err := LoadConfig()
	if err != nil {
		return err
	}

	config.DatabasePath = normalized
	return SaveConfig(config)
}
