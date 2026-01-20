package config

import (
	"database/sql"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

// setupTestDB creates a test database connection
func setupTestDB(t *testing.T) *sql.DB {
	config := &DatabaseConfig{
		Host:     getTestEnv("DB_HOST", "localhost"),
		Port:     getTestEnv("DB_PORT", "5432"),
		User:     getTestEnv("DB_USER", "postgres"),
		Password: getTestEnv("DB_PASSWORD", "postgres"),
		DBName:   getTestEnv("DB_NAME", "social_worker_platform_test"),
		SSLMode:  "disable",
	}

	db, err := ConnectDatabase(config)
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	return db
}

func getTestEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// TestDatabaseConnectionError tests database connection error handling
func TestDatabaseConnectionError(t *testing.T) {
	// Test with invalid connection parameters
	config := &DatabaseConfig{
		Host:     "invalid-host",
		Port:     "9999",
		User:     "invalid",
		Password: "invalid",
		DBName:   "invalid",
	}

	db, err := ConnectDatabase(config)
	
	// Should return an error
	assert.Error(t, err, "Expected error when connecting to invalid database")
	assert.Nil(t, db, "Database connection should be nil on error")
}

// TestDatabaseQueryError tests query error handling
func TestDatabaseQueryError(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping database test in short mode")
	}

	db := setupTestDB(t)
	defer db.Close()

	// Test invalid SQL query
	var result string
	err := db.QueryRow("SELECT * FROM non_existent_table").Scan(&result)
	
	assert.Error(t, err, "Expected error when querying non-existent table")
}

// TestDatabaseTransactionRollback tests transaction rollback on error
func TestDatabaseTransactionRollback(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping database test in short mode")
	}

	db := setupTestDB(t)
	defer db.Close()

	// Start transaction
	tx, err := db.Begin()
	assert.NoError(t, err, "Failed to begin transaction")

	// Execute invalid query
	_, err = tx.Exec("INSERT INTO non_existent_table VALUES (1)")
	assert.Error(t, err, "Expected error on invalid insert")

	// Rollback should succeed
	err = tx.Rollback()
	assert.NoError(t, err, "Failed to rollback transaction")
}

// TestDatabaseClosedConnection tests operations on closed connection
func TestDatabaseClosedConnection(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping database test in short mode")
	}

	db := setupTestDB(t)
	
	// Close the connection
	err := db.Close()
	assert.NoError(t, err, "Failed to close database")

	// Try to query after closing
	var result string
	err = db.QueryRow("SELECT 1").Scan(&result)
	assert.Error(t, err, "Expected error when querying closed connection")
	assert.Equal(t, sql.ErrConnDone, err, "Should return ErrConnDone for closed connection")
}

// TestDatabasePingError tests ping error handling
func TestDatabasePingError(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping database test in short mode")
	}

	db := setupTestDB(t)
	
	// Ping should succeed initially
	err := db.Ping()
	assert.NoError(t, err, "Initial ping should succeed")

	// Close connection
	db.Close()

	// Ping should fail after closing
	err = db.Ping()
	assert.Error(t, err, "Ping should fail on closed connection")
}

// TestDatabaseNullHandling tests NULL value handling
func TestDatabaseNullHandling(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping database test in short mode")
	}

	db := setupTestDB(t)
	defer db.Close()

	// Create a test table with nullable column
	_, err := db.Exec(`
		CREATE TEMPORARY TABLE test_nulls (
			id SERIAL PRIMARY KEY,
			nullable_field TEXT
		)
	`)
	assert.NoError(t, err, "Failed to create test table")

	// Insert NULL value
	_, err = db.Exec("INSERT INTO test_nulls (nullable_field) VALUES (NULL)")
	assert.NoError(t, err, "Failed to insert NULL value")

	// Query NULL value
	var nullableField sql.NullString
	err = db.QueryRow("SELECT nullable_field FROM test_nulls WHERE id = 1").Scan(&nullableField)
	assert.NoError(t, err, "Failed to query NULL value")
	assert.False(t, nullableField.Valid, "NULL value should not be valid")
}

// TestDatabaseConstraintViolation tests constraint violation error handling
func TestDatabaseConstraintViolation(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping database test in short mode")
	}

	db := setupTestDB(t)
	defer db.Close()

	// Create a test table with unique constraint
	_, err := db.Exec(`
		CREATE TEMPORARY TABLE test_constraints (
			id SERIAL PRIMARY KEY,
			unique_field TEXT UNIQUE NOT NULL
		)
	`)
	assert.NoError(t, err, "Failed to create test table")

	// Insert first value
	_, err = db.Exec("INSERT INTO test_constraints (unique_field) VALUES ('test')")
	assert.NoError(t, err, "Failed to insert first value")

	// Try to insert duplicate value
	_, err = db.Exec("INSERT INTO test_constraints (unique_field) VALUES ('test')")
	assert.Error(t, err, "Expected error on unique constraint violation")
}

// TestDatabaseConcurrentAccess tests concurrent database access
func TestDatabaseConcurrentAccess(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping database test in short mode")
	}

	db := setupTestDB(t)
	defer db.Close()

	// Create a test table
	_, err := db.Exec(`
		CREATE TEMPORARY TABLE test_concurrent (
			id SERIAL PRIMARY KEY,
			value INTEGER
		)
	`)
	assert.NoError(t, err, "Failed to create test table")

	// Test concurrent reads
	done := make(chan bool, 10)
	for i := 0; i < 10; i++ {
		go func() {
			var count int
			err := db.QueryRow("SELECT COUNT(*) FROM test_concurrent").Scan(&count)
			assert.NoError(t, err, "Concurrent read failed")
			done <- true
		}()
	}

	// Wait for all goroutines
	for i := 0; i < 10; i++ {
		<-done
	}
}
