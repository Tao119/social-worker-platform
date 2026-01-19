package main

import (
	"fmt"
	"log"
	"os"

	"github.com/social-worker-platform/backend/config"
	"github.com/social-worker-platform/backend/models"
)

func main() {
	// Load configuration
	dbConfig := &config.DatabaseConfig{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     getEnv("DB_PORT", "5432"),
		User:     getEnv("DB_USER", "postgres"),
		Password: getEnv("DB_PASSWORD", "postgres"),
		DBName:   getEnv("DB_NAME", "social_worker_platform"),
		SSLMode:  getEnv("DB_SSLMODE", "disable"),
	}

	// Connect to database
	db, err := config.ConnectDatabase(dbConfig)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Create admin user
	userRepo := models.NewUserRepository(db)

	email := "admin@example.com"
	password := "admin123"
	role := "admin"

	user, err := userRepo.Create(email, password, role)
	if err != nil {
		log.Fatalf("Failed to create admin user: %v", err)
	}

	fmt.Printf("Admin user created successfully!\n")
	fmt.Printf("Email: %s\n", user.Email)
	fmt.Printf("Password: %s\n", password)
	fmt.Printf("Role: %s\n", user.Role)
	fmt.Printf("\nYou can now login with these credentials.\n")
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
