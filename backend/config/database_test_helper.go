package config

import (
	"database/sql"
	"fmt"
	"testing"

	_ "github.com/lib/pq"
)

func SetupTestDatabase(t *testing.T) *sql.DB {
	if testing.Short() {
		t.Skip("Skipping database test in short mode")
	}

	config := &DatabaseConfig{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     getEnv("DB_PORT", "5432"),
		User:     getEnv("DB_USER", "postgres"),
		Password: getEnv("DB_PASSWORD", "postgres"),
		DBName:   getEnv("DB_TEST_NAME", "social_worker_platform_test"),
		SSLMode:  getEnv("DB_SSLMODE", "disable"),
	}

	db, err := sql.Open("postgres", config.ConnectionString())
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	if err := db.Ping(); err != nil {
		t.Fatalf("Failed to ping test database: %v", err)
	}

	// Truncate all tables before test to ensure clean state
	tables := []string{"documents", "facilities", "hospitals", "users"}
	for _, table := range tables {
		_, err := db.Exec(fmt.Sprintf("TRUNCATE TABLE %s CASCADE", table))
		if err != nil {
			t.Logf("Warning: Failed to truncate table %s: %v", table, err)
		}
	}

	return db
}

func TeardownTestDatabase(t *testing.T, db *sql.DB) {
	tables := []string{"documents", "facilities", "hospitals", "users"}
	for _, table := range tables {
		_, err := db.Exec(fmt.Sprintf("TRUNCATE TABLE %s CASCADE", table))
		if err != nil {
			t.Logf("Warning: Failed to truncate table %s: %v", table, err)
		}
	}
	db.Close()
}
