package utils

import (
	"fmt"
	"regexp"
	"strings"

	"gorm.io/gorm"
)

var nonAlnumRegex = regexp.MustCompile(`[^A-Za-z0-9]+`)

var categoryPrefixes = map[string]string{
	"engine":     "ENG",
	"electrical": "ELE",
	"tyres":      "TYR",
	"tires":      "TYR",
	"brakes":     "BRK",
	"body":       "BOD",
}

func CategoryCode(category string) string {
	normalized := strings.ToLower(strings.TrimSpace(category))
	if prefix, ok := categoryPrefixes[normalized]; ok {
		return prefix
	}

	parts := tokenize(category)
	if len(parts) == 0 {
		return "GEN"
	}

	code := strings.ToUpper(parts[0])
	if len(code) >= 3 {
		return code[:3]
	}
	return fmt.Sprintf("%-3s", code)
}

func BrandCode(brand string) string {
	parts := tokenize(brand)
	if len(parts) == 0 {
		return "GEN"
	}

	if len(parts) == 1 {
		word := strings.ToUpper(parts[0])
		if len(word) >= 3 {
			return word[:3]
		}
		return fmt.Sprintf("%-3s", word)
	}

	var b strings.Builder
	for _, p := range parts {
		b.WriteByte(byte(strings.ToUpper(p)[0]))
		if b.Len() == 3 {
			break
		}
	}

	code := b.String()
	if len(code) < 3 {
		return fmt.Sprintf("%-3s", code)
	}
	return code
}

func GenerateSKUID(database *gorm.DB, category, brand string) (string, error) {
	catCode := strings.ReplaceAll(CategoryCode(category), " ", "X")
	brandCode := strings.ReplaceAll(BrandCode(brand), " ", "X")
	prefix := fmt.Sprintf("%s-%s-", catCode, brandCode)

	var lastID string
	err := database.Table("skus").
		Select("id").
		Where("id LIKE ?", prefix+"%").
		Order("id DESC").
		Limit(1).
		Scan(&lastID).Error
	if err != nil {
		return "", err
	}

	seq := 1
	if lastID != "" && len(lastID) >= len(prefix)+4 {
		var parsed int
		_, parseErr := fmt.Sscanf(lastID[len(lastID)-4:], "%d", &parsed)
		if parseErr == nil {
			seq = parsed + 1
		}
	}

	return fmt.Sprintf("%s%04d", prefix, seq), nil
}

func tokenize(input string) []string {
	clean := nonAlnumRegex.ReplaceAllString(strings.TrimSpace(input), " ")
	return strings.Fields(clean)
}
