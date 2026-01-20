package middleware

import (
	"html"
	"regexp"
	"strings"
)

// SanitizeString removes potentially dangerous characters from input
func SanitizeString(input string) string {
	// Trim whitespace
	sanitized := strings.TrimSpace(input)
	
	// HTML escape to prevent XSS
	sanitized = html.EscapeString(sanitized)
	
	return sanitized
}

// SanitizeEmail validates and sanitizes email addresses
func SanitizeEmail(email string) string {
	// Trim and lowercase
	sanitized := strings.TrimSpace(strings.ToLower(email))
	
	// Basic email validation pattern
	emailRegex := regexp.MustCompile(`^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$`)
	if !emailRegex.MatchString(sanitized) {
		return ""
	}
	
	return sanitized
}

// SanitizeSQL removes common SQL injection patterns
func SanitizeSQL(input string) string {
	// Remove SQL keywords and special characters
	dangerous := []string{
		"--", ";", "/*", "*/", "xp_", "sp_",
		"DROP", "DELETE", "INSERT", "UPDATE",
		"EXEC", "EXECUTE", "SCRIPT",
	}
	
	sanitized := input
	for _, pattern := range dangerous {
		sanitized = strings.ReplaceAll(sanitized, pattern, "")
		sanitized = strings.ReplaceAll(sanitized, strings.ToLower(pattern), "")
	}
	
	return sanitized
}

// ValidateStringLength checks if string length is within acceptable range
func ValidateStringLength(input string, minLength, maxLength int) bool {
	length := len(input)
	return length >= minLength && length <= maxLength
}

// ValidateInteger checks if integer is within acceptable range
func ValidateInteger(value, min, max int) bool {
	return value >= min && value <= max
}

// RemoveControlCharacters removes control characters from string
func RemoveControlCharacters(input string) string {
	// Remove non-printable characters
	controlChars := regexp.MustCompile(`[\x00-\x1F\x7F]`)
	return controlChars.ReplaceAllString(input, "")
}

// ValidatePhoneNumber validates phone number format
func ValidatePhoneNumber(phone string) bool {
	if phone == "" {
		return true // Optional field
	}
	
	// Allow digits, spaces, hyphens, parentheses, and plus sign
	phoneRegex := regexp.MustCompile(`^[\d\s\-\(\)\+]+$`)
	return phoneRegex.MatchString(phone)
}

// SanitizeFilename removes dangerous characters from filenames
func SanitizeFilename(filename string) string {
	// Remove path traversal attempts
	sanitized := strings.ReplaceAll(filename, "..", "")
	sanitized = strings.ReplaceAll(sanitized, "/", "")
	sanitized = strings.ReplaceAll(sanitized, "\\", "")
	
	// Remove special characters except dot, dash, and underscore
	validChars := regexp.MustCompile(`[^a-zA-Z0-9._\-]`)
	sanitized = validChars.ReplaceAllString(sanitized, "_")
	
	return sanitized
}
