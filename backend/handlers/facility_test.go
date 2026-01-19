package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
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

func setupFacilityTest(t *testing.T) (*gin.Engine, *models.FacilityRepository, *models.UserRepository, func()) {
	os.Setenv("JWT_SECRET", "test-secret-key")

	db := config.SetupTestDatabase(t)
	facilityRepo := models.NewFacilityRepository(db)
	userRepo := models.NewUserRepository(db)
	facilityHandler := NewFacilityHandler(facilityRepo, userRepo)

	gin.SetMode(gin.TestMode)
	router := gin.New()

	router.POST("/api/facilities", middleware.AuthMiddleware(), middleware.RequireRole("facility"), facilityHandler.Create)
	router.GET("/api/facilities", middleware.AuthMiddleware(), middleware.RequireRole("hospital"), facilityHandler.List)
	router.GET("/api/facilities/:id", middleware.AuthMiddleware(), middleware.RequireRole("hospital"), facilityHandler.GetByID)
	router.PUT("/api/facilities/:id", middleware.AuthMiddleware(), middleware.RequireRole("facility", "admin"), facilityHandler.Update)
	router.GET("/api/facilities/me", middleware.AuthMiddleware(), middleware.RequireRole("facility"), facilityHandler.GetMyFacility)

	cleanup := func() {
		config.TeardownTestDatabase(t, db)
		os.Unsetenv("JWT_SECRET")
	}

	return router, facilityRepo, userRepo, cleanup
}

func TestFacilityCreate(t *testing.T) {
	router, facilityRepo, userRepo, cleanup := setupFacilityTest(t)
	defer cleanup()

	t.Run("successfully creates facility", func(t *testing.T) {
		user, _ := userRepo.Create("facility@example.com", "password123", "facility")
		token, _ := middleware.GenerateToken(user.ID, user.Email, user.Role)

		reqBody := CreateFacilityRequest{
			Name:                 "Test Facility",
			Address:              "123 Test St",
			Phone:                "123-456-7890",
			BedCapacity:          50,
			AcceptanceConditions: "Test conditions",
		}
		body, _ := json.Marshal(reqBody)

		req, _ := http.NewRequest("POST", "/api/facilities", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)

		var facility models.Facility
		json.Unmarshal(w.Body.Bytes(), &facility)
		assert.Equal(t, "Test Facility", facility.Name)
		assert.Equal(t, 50, facility.BedCapacity)

		facilityRepo.Delete(facility.ID)
	})

	t.Run("fails with missing required fields", func(t *testing.T) {
		user, _ := userRepo.Create("facility2@example.com", "password123", "facility")
		token, _ := middleware.GenerateToken(user.ID, user.Email, user.Role)

		reqBody := map[string]interface{}{
			"address": "123 Test St",
		}
		body, _ := json.Marshal(reqBody)

		req, _ := http.NewRequest("POST", "/api/facilities", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("fails without authentication", func(t *testing.T) {
		reqBody := CreateFacilityRequest{
			Name:        "Test Facility",
			BedCapacity: 50,
		}
		body, _ := json.Marshal(reqBody)

		req, _ := http.NewRequest("POST", "/api/facilities", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}

func TestFacilityList(t *testing.T) {
	router, facilityRepo, userRepo, cleanup := setupFacilityTest(t)
	defer cleanup()

	t.Run("returns list of facilities", func(t *testing.T) {
		hospitalUser, _ := userRepo.Create("hospital@example.com", "password123", "hospital")
		facilityUser, _ := userRepo.Create("facility3@example.com", "password123", "facility")

		facility1, _ := facilityRepo.Create(facilityUser.ID, "Facility 1", "Address 1", "111-1111", 30, "Conditions 1")
		facility2, _ := facilityRepo.Create(facilityUser.ID, "Facility 2", "Address 2", "222-2222", 40, "Conditions 2")

		token, _ := middleware.GenerateToken(hospitalUser.ID, hospitalUser.Email, hospitalUser.Role)

		req, _ := http.NewRequest("GET", "/api/facilities", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var facilities []models.Facility
		json.Unmarshal(w.Body.Bytes(), &facilities)
		assert.GreaterOrEqual(t, len(facilities), 2)

		facilityRepo.Delete(facility1.ID)
		facilityRepo.Delete(facility2.ID)
	})

	t.Run("filters by name", func(t *testing.T) {
		hospitalUser, _ := userRepo.Create("hospital2@example.com", "password123", "hospital")
		facilityUser, _ := userRepo.Create("facility4@example.com", "password123", "facility")

		facility, _ := facilityRepo.Create(facilityUser.ID, "Unique Name", "Address", "333-3333", 25, "Conditions")

		token, _ := middleware.GenerateToken(hospitalUser.ID, hospitalUser.Email, hospitalUser.Role)

		req, _ := http.NewRequest("GET", "/api/facilities?name=Unique", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var facilities []models.Facility
		json.Unmarshal(w.Body.Bytes(), &facilities)
		assert.Greater(t, len(facilities), 0)

		facilityRepo.Delete(facility.ID)
	})
}

func TestFacilityGetByID(t *testing.T) {
	router, facilityRepo, userRepo, cleanup := setupFacilityTest(t)
	defer cleanup()

	t.Run("returns facility by ID", func(t *testing.T) {
		hospitalUser, _ := userRepo.Create("hospital3@example.com", "password123", "hospital")
		facilityUser, _ := userRepo.Create("facility5@example.com", "password123", "facility")

		facility, _ := facilityRepo.Create(facilityUser.ID, "Test Facility", "Address", "444-4444", 35, "Conditions")

		token, _ := middleware.GenerateToken(hospitalUser.ID, hospitalUser.Email, hospitalUser.Role)

		req, _ := http.NewRequest("GET", fmt.Sprintf("/api/facilities/%d", facility.ID), nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var result models.Facility
		json.Unmarshal(w.Body.Bytes(), &result)
		assert.Equal(t, facility.ID, result.ID)
		assert.Equal(t, "Test Facility", result.Name)

		facilityRepo.Delete(facility.ID)
	})

	t.Run("returns 404 for non-existent facility", func(t *testing.T) {
		hospitalUser, _ := userRepo.Create("hospital4@example.com", "password123", "hospital")
		token, _ := middleware.GenerateToken(hospitalUser.ID, hospitalUser.Email, hospitalUser.Role)

		req, _ := http.NewRequest("GET", "/api/facilities/99999", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}

func TestFacilityUpdate(t *testing.T) {
	router, facilityRepo, userRepo, cleanup := setupFacilityTest(t)
	defer cleanup()

	t.Run("facility owner can update their facility", func(t *testing.T) {
		facilityUser, _ := userRepo.Create("facility6@example.com", "password123", "facility")
		facility, _ := facilityRepo.Create(facilityUser.ID, "Original Name", "Address", "555-5555", 40, "Conditions")

		token, _ := middleware.GenerateToken(facilityUser.ID, facilityUser.Email, facilityUser.Role)

		reqBody := UpdateFacilityRequest{
			Name:        "Updated Name",
			BedCapacity: 50,
		}
		body, _ := json.Marshal(reqBody)

		req, _ := http.NewRequest("PUT", fmt.Sprintf("/api/facilities/%d", facility.ID), bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var updated models.Facility
		json.Unmarshal(w.Body.Bytes(), &updated)
		assert.Equal(t, "Updated Name", updated.Name)
		assert.Equal(t, 50, updated.BedCapacity)

		facilityRepo.Delete(facility.ID)
	})

	t.Run("non-owner cannot update facility", func(t *testing.T) {
		facilityUser1, _ := userRepo.Create("facility7@example.com", "password123", "facility")
		facilityUser2, _ := userRepo.Create("facility8@example.com", "password123", "facility")
		facility, _ := facilityRepo.Create(facilityUser1.ID, "Facility", "Address", "666-6666", 30, "Conditions")

		token, _ := middleware.GenerateToken(facilityUser2.ID, facilityUser2.Email, facilityUser2.Role)

		reqBody := UpdateFacilityRequest{
			Name: "Hacked Name",
		}
		body, _ := json.Marshal(reqBody)

		req, _ := http.NewRequest("PUT", fmt.Sprintf("/api/facilities/%d", facility.ID), bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusForbidden, w.Code)

		facilityRepo.Delete(facility.ID)
	})
}

func TestGetMyFacility(t *testing.T) {
	router, facilityRepo, userRepo, cleanup := setupFacilityTest(t)
	defer cleanup()

	t.Run("returns current user's facility", func(t *testing.T) {
		facilityUser, _ := userRepo.Create("facility9@example.com", "password123", "facility")
		facility, _ := facilityRepo.Create(facilityUser.ID, "My Facility", "Address", "777-7777", 45, "Conditions")

		token, _ := middleware.GenerateToken(facilityUser.ID, facilityUser.Email, facilityUser.Role)

		req, _ := http.NewRequest("GET", "/api/facilities/me", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var result models.Facility
		json.Unmarshal(w.Body.Bytes(), &result)
		assert.Equal(t, facility.ID, result.ID)
		assert.Equal(t, "My Facility", result.Name)

		facilityRepo.Delete(facility.ID)
	})
}
