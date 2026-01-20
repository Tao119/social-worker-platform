package handlers

import (
	"bytes"
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
	router.POST("/api/facilities", middleware.AuthMiddleware(), handler.CreateFacility)

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
			name: "zero bed capacity",
			requestBody: map[string]interface{}{
				"name":                  "Test Facility",
				"bed_capacity":          0,
				"acceptance_conditions": "Test conditions",
			},
			description: "Bed capacity must be greater than 0",
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
	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	db := setupTestDB(t)
	defer db.Close()

	userRepo := models.NewUserRepository(db)
	facilityRepo := models.NewFacilityRepository(db)
	handler := NewFacilityHandler(facilityRepo, userRepo)

	user, _ := createTestUser(t, userRepo, "facility@test.com", "facility")
	token, _ := middleware.GenerateToken(user.ID, user.Email, user.Role)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/facilities", middleware.AuthMiddleware(), handler.CreateFacility)

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
		{
			name:        "bed capacity as float",
			requestBody: `{"name": "Test", "bed_capacity": 10.5}`,
			description: "Bed capacity should be an integer",
		},
		{
			name:        "extremely large bed capacity",
			requestBody: `{"name": "Test", "bed_capacity": 999999999}`,
			description: "Unrealistic bed capacity",
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

// TestFacilityValidation_NameConstraints tests name field constraints
func TestFacilityValidation_NameConstraints(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	db := setupTestDB(t)
	defer db.Close()

	userRepo := models.NewUserRepository(db)
	facilityRepo := models.NewFacilityRepository(db)
	handler := NewFacilityHandler(facilityRepo, userRepo)

	user, _ := createTestUser(t, userRepo, "facility@test.com", "facility")
	token, _ := middleware.GenerateToken(user.ID, user.Email, user.Role)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/facilities", middleware.AuthMiddleware(), handler.CreateFacility)

	testCases := []struct {
		name        string
		facilityName string
		shouldPass  bool
	}{
		{"whitespace only", "   ", false},
		{"tabs only", "\t\t\t", false},
		{"newlines only", "\n\n\n", false},
		{"single character", "A", true},
		{"very long name", string(make([]byte, 1000)), true}, // Should handle long names
		{"special characters", "Facility #1 (Main)", true},
		{"unicode characters", "施設名", true},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			requestBody := map[string]interface{}{
				"name":         tc.facilityName,
				"bed_capacity": 10,
			}
			body, _ := json.Marshal(requestBody)
			req, _ := http.NewRequest("POST", "/api/facilities", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer "+token)

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			if tc.shouldPass {
				assert.NotEqual(t, http.StatusBadRequest, w.Code, "Should accept: "+tc.name)
			} else {
				assert.Equal(t, http.StatusBadRequest, w.Code, "Should reject: "+tc.name)
			}
		})
	}
}

// TestFacilityValidation_UpdateValidation tests validation during updates
func TestFacilityValidation_UpdateValidation(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	db := setupTestDB(t)
	defer db.Close()

	userRepo := models.NewUserRepository(db)
	facilityRepo := models.NewFacilityRepository(db)
	handler := NewFacilityHandler(facilityRepo, userRepo)

	user, _ := createTestUser(t, userRepo, "facility@test.com", "facility")
	token, _ := middleware.GenerateToken(user.ID, user.Email, user.Role)

	// Create initial facility
	facility := &models.Facility{
		UserID:      user.ID,
		Name:        "Original Name",
		BedCapacity: 20,
	}
	err := facilityRepo.Create(facility)
	assert.NoError(t, err)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.PUT("/api/facilities/:id", middleware.AuthMiddleware(), handler.UpdateFacility)

	t.Run("update with empty name", func(t *testing.T) {
		requestBody := map[string]interface{}{
			"name":         "",
			"bed_capacity": 25,
		}
		body, _ := json.Marshal(requestBody)
		req, _ := http.NewRequest("PUT", "/api/facilities/"+string(rune(facility.ID)), bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("update with zero bed capacity", func(t *testing.T) {
		requestBody := map[string]interface{}{
			"name":         "Updated Name",
			"bed_capacity": 0,
		}
		body, _ := json.Marshal(requestBody)
		req, _ := http.NewRequest("PUT", "/api/facilities/"+string(rune(facility.ID)), bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// TestFacilityValidation_SQLInjectionAttempts tests protection against SQL injection
func TestFacilityValidation_SQLInjectionAttempts(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	db := setupTestDB(t)
	defer db.Close()

	userRepo := models.NewUserRepository(db)
	facilityRepo := models.NewFacilityRepository(db)
	handler := NewFacilityHandler(facilityRepo, userRepo)

	user, _ := createTestUser(t, userRepo, "facility@test.com", "facility")
	token, _ := middleware.GenerateToken(user.ID, user.Email, user.Role)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/facilities", middleware.AuthMiddleware(), handler.CreateFacility)

	sqlInjectionAttempts := []string{
		"'; DROP TABLE facilities; --",
		"1' OR '1'='1",
		"admin'--",
		"' OR 1=1--",
		"<script>alert('xss')</script>",
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

			// Should either accept (and sanitize) or reject, but not cause SQL error
			assert.NotEqual(t, http.StatusInternalServerError, w.Code, "Should not cause internal server error")
		})
	}
}

// Helper function to setup test database
func setupTestDB(t *testing.T) *config.Database {
	dbConfig := &config.DatabaseConfig{
		Host:     os.Getenv("DB_HOST"),
		Port:     os.Getenv("DB_PORT"),
		User:     os.Getenv("DB_USER"),
		Password: os.Getenv("DB_PASSWORD"),
		Database: os.Getenv("DB_NAME"),
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
	if dbConfig.Database == "" {
		dbConfig.Database = "social_worker_platform_test"
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
	user := &models.User{
		Email:        email,
		PasswordHash: hashedPassword,
		Role:         role,
		IsActive:     true,
	}
	err := userRepo.Create(user)
	return user, err
}
