package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/social-worker-platform/backend/config"
	"github.com/social-worker-platform/backend/middleware"
	"github.com/social-worker-platform/backend/models"
	"github.com/stretchr/testify/assert"
)

// TestFacilityValidation_EmptyRequiredFields tests validation for empty required fields
func TestFacilityValidation_EmptyRequiredFields(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping database test in short mode")
	}

	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	db := setupTestDB(t)
	defer db.Close()

	userRepo := models.NewUserRepository(db)
	facilityRepo := models.NewFacilityRepository(db)
	handler := NewFacilityHandler(facilityRepo, userRepo)

	// Create facility user
	user, _ := createTestUser(t, userRepo, "facility@test.com", "facility")
	token, _ := middleware.GenerateToken(user.ID, user.Email, user.Role)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/facilities", middleware.AuthMiddleware(), handler.Create)

	testCases := []struct {
		name        string
		requestBody map[string]interface{}
		description string
	}{
		{
			name: "empty name",
			requestBody: map[string]interface{}{
				"name":                   "",
				"bed_capacity":           10,
				"acceptance_conditions":  "Test conditions",
			},
			description: "Name is required",
		},
		{
			name: "missing name",
			requestBody: map[string]interface{}{
				"bed_capacity":          10,
				"acceptance_conditions": "Test conditions",
			},
			description: "Name field is missing",
		},
		{
			name: "negative bed capacity",
			requestBody: map[string]interface{}{
				"name":                  "Test Facility",
				"bed_capacity":          -5,
				"acceptance_conditions": "Test conditions",
			},
			description: "Bed capacity cannot be negative",
		},
		{
			name: "missing bed capacity",
			requestBody: map[string]interface{}{
				"name":                  "Test Facility",
				"acceptance_conditions": "Test conditions",
			},
			description: "Bed capacity is required",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			body, _ := json.Marshal(tc.requestBody)
			req, _ := http.NewRequest("POST", "/api/facilities", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer "+token)

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code, tc.description)
		})
	}
}

// TestFacilityValidation_InvalidDataFormats tests validation for invalid data formats
func TestFacilityValidation_InvalidDataFormats(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping database test in short mode")
	}

	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	db := setupTestDB(t)
	defer db.Close()

	userRepo := models.NewUserRepository(db)
	facilityRepo := models.NewFacilityRepository(db)
	handler := NewFacilityHandler(facilityRepo, userRepo)

	user, _ := createTestUser(t, userRepo, "facility2@test.com", "facility")
	token, _ := middleware.GenerateToken(user.ID, user.Email, user.Role)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/facilities", middleware.AuthMiddleware(), handler.Create)

	testCases := []struct {
		name        string
		requestBody string
		description string
	}{
		{
			name:        "invalid JSON",
			requestBody: `{"name": "Test", "bed_capacity": }`,
			description: "Malformed JSON should be rejected",
		},
		{
			name:        "bed capacity as string",
			requestBody: `{"name": "Test", "bed_capacity": "ten"}`,
			description: "Bed capacity must be a number",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req, _ := http.NewRequest("POST", "/api/facilities", bytes.NewBufferString(tc.requestBody))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer "+token)

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code, tc.description)
		})
	}
}

// TestFacilityValidation_SQLInjectionAttempts tests protection against SQL injection
func TestFacilityValidation_SQLInjectionAttempts(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping database test in short mode")
	}

	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	db := setupTestDB(t)
	defer db.Close()

	userRepo := models.NewUserRepository(db)
	facilityRepo := models.NewFacilityRepository(db)
	handler := NewFacilityHandler(facilityRepo, userRepo)

	user, _ := createTestUser(t, userRepo, "facility3@test.com", "facility")
	token, _ := middleware.GenerateToken(user.ID, user.Email, user.Role)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/facilities", middleware.AuthMiddleware(), handler.Create)

	sqlInjectionAttempts := []string{
		"'; DROP TABLE facilities; --",
		"1' OR '1'='1",
		"admin'--",
		"' OR 1=1--",
	}

	for _, attempt := range sqlInjectionAttempts {
		t.Run("SQL injection: "+attempt, func(t *testing.T) {
			requestBody := map[string]interface{}{
				"name":         attempt,
				"bed_capacity": 10,
			}
			body, _ := json.Marshal(requestBody)
			req, _ := http.NewRequest("POST", "/api/facilities", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer "+token)

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			// Should not cause SQL error
			assert.NotEqual(t, http.StatusInternalServerError, w.Code, "Should not cause internal server error")
		})
	}
}

// Helper function to setup test database
func setupTestDB(t *testing.T) *sql.DB {
	dbConfig := &config.DatabaseConfig{
		Host:     os.Getenv("DB_HOST"),
		Port:     os.Getenv("DB_PORT"),
		User:     os.Getenv("DB_USER"),
		Password: os.Getenv("DB_PASSWORD"),
		DBName:   os.Getenv("DB_NAME"),
		SSLMode:  "disable",
	}

	if dbConfig.Host == "" {
		dbConfig.Host = "localhost"
	}
	if dbConfig.Port == "" {
		dbConfig.Port = "5432"
	}
	if dbConfig.User == "" {
		dbConfig.User = "postgres"
	}
	if dbConfig.Password == "" {
		dbConfig.Password = "postgres"
	}
	if dbConfig.DBName == "" {
		dbConfig.DBName = "social_worker_platform_test"
	}

	db, err := config.ConnectDatabase(dbConfig)
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	return db
}

// Helper function to create test user
func createTestUser(t *testing.T, userRepo *models.UserRepository, email, role string) (*models.User, error) {
	hashedPassword, _ := middleware.HashPassword("testpassword")
	user, err := userRepo.Create(email, hashedPassword, role)
	return user, err
}
