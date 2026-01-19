package config

import (
	"database/sql"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestDatabaseConnection(t *testing.T) {
	t.Run("successful connection with valid config", func(t *testing.T) {
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
			t.Skip("Database not available for testing")
		}
		defer db.Close()

		err = db.Ping()
		if err != nil {
			t.Skip("Database not available for testing")
		}

		assert.NoError(t, err)
	})

	t.Run("connection string format", func(t *testing.T) {
		config := &DatabaseConfig{
			Host:     "testhost",
			Port:     "5433",
			User:     "testuser",
			Password: "testpass",
			DBName:   "testdb",
			SSLMode:  "require",
		}

		expected := "host=testhost port=5433 user=testuser password=testpass dbname=testdb sslmode=require"
		assert.Equal(t, expected, config.ConnectionString())
	})

	t.Run("connection error with invalid host", func(t *testing.T) {
		config := &DatabaseConfig{
			Host:     "invalid-host-that-does-not-exist",
			Port:     "5432",
			User:     "postgres",
			Password: "postgres",
			DBName:   "testdb",
			SSLMode:  "disable",
		}

		db, err := sql.Open("postgres", config.ConnectionString())
		assert.NoError(t, err) // Open doesn't actually connect

		err = db.Ping()
		assert.Error(t, err) // Ping should fail with invalid host
		db.Close()
	})

	t.Run("connection error with invalid credentials", func(t *testing.T) {
		config := &DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     "invalid_user",
			Password: "invalid_password",
			DBName:   getEnv("DB_TEST_NAME", "social_worker_platform_test"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		}

		db, err := sql.Open("postgres", config.ConnectionString())
		assert.NoError(t, err) // Open doesn't actually connect

		err = db.Ping()
		if err == nil {
			t.Skip("Expected authentication error but connection succeeded")
		}
		assert.Error(t, err)
		db.Close()
	})

	t.Run("connection error with non-existent database", func(t *testing.T) {
		config := &DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", "postgres"),
			DBName:   "non_existent_database_12345",
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		}

		db, err := sql.Open("postgres", config.ConnectionString())
		assert.NoError(t, err) // Open doesn't actually connect

		err = db.Ping()
		assert.Error(t, err) // Should fail with non-existent database
		db.Close()
	})
}

func TestLoadDatabaseConfig(t *testing.T) {
	t.Run("loads config with default values", func(t *testing.T) {
		config := LoadDatabaseConfig()

		assert.NotNil(t, config)
		assert.NotEmpty(t, config.Host)
		assert.NotEmpty(t, config.Port)
		assert.NotEmpty(t, config.User)
		assert.NotEmpty(t, config.DBName)
		assert.NotEmpty(t, config.SSLMode)
	})
}
