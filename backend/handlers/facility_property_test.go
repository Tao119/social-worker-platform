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
	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
	"github.com/social-worker-platform/backend/config"
	"github.com/social-worker-platform/backend/middleware"
	"github.com/social-worker-platform/backend/models"
)

// Feature: social-worker-platform, Property 7: Facility creation stores all fields
// For any valid facility data, all fields should be persisted and retrievable
func TestProperty_FacilityCreationStoresAllFields(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping property test in short mode")
	}

	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	db := config.SetupTestDatabase(t)
	defer config.TeardownTestDatabase(t, db)

	facilityRepo := models.NewFacilityRepository(db)
	userRepo := models.NewUserRepository(db)
	facilityHandler := NewFacilityHandler(facilityRepo, userRepo)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/facilities", middleware.AuthMiddleware(), facilityHandler.Create)

	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100
	properties := gopter.NewProperties(parameters)

	properties.Property("All facility fields are persisted", prop.ForAll(
		func(nameSeed int64, bedCapacity int, phoneSeed int64) bool {
			name := fmt.Sprintf("Facility %d", nameSeed)
			address := fmt.Sprintf("Address %d", nameSeed)
			phone := fmt.Sprintf("555-%04d", phoneSeed%10000)
			conditions := fmt.Sprintf("Conditions %d", nameSeed)

			// Create user
			email := fmt.Sprintf("facility%d@example.com", nameSeed)
			user, err := userRepo.Create(email, "password123", "facility")
			if err != nil {
				return false
			}
			defer userRepo.Delete(user.ID)

			token, _ := middleware.GenerateToken(user.ID, user.Email, user.Role)

			// Create facility
			reqBody := CreateFacilityRequest{
				Name:                 name,
				Address:              address,
				Phone:                phone,
				BedCapacity:          bedCapacity,
				AcceptanceConditions: conditions,
			}
			body, _ := json.Marshal(reqBody)

			req, _ := http.NewRequest("POST", "/api/facilities", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer "+token)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			if w.Code != http.StatusCreated {
				return false
			}

			var facility models.Facility
			if err := json.Unmarshal(w.Body.Bytes(), &facility); err != nil {
				return false
			}
			defer facilityRepo.Delete(facility.ID)

			// Verify all fields
			return facility.Name == name &&
				facility.Address == address &&
				facility.Phone == phone &&
				facility.BedCapacity == bedCapacity &&
				facility.AcceptanceConditions == conditions &&
				facility.UserID == user.ID
		},
		gen.Int64Range(1, 100000),
		gen.IntRange(1, 200),
		gen.Int64Range(1, 9999),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}

// Feature: social-worker-platform, Property 8: Facility updates are persisted
// For any facility and valid update data, retrieving it should return the updated values
func TestProperty_FacilityUpdatesArePersisted(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping property test in short mode")
	}

	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	db := config.SetupTestDatabase(t)
	defer config.TeardownTestDatabase(t, db)

	facilityRepo := models.NewFacilityRepository(db)
	userRepo := models.NewUserRepository(db)
	facilityHandler := NewFacilityHandler(facilityRepo, userRepo)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.PUT("/api/facilities/:id", middleware.AuthMiddleware(), facilityHandler.Update)

	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100
	properties := gopter.NewProperties(parameters)

	properties.Property("Updated facility fields are persisted", prop.ForAll(
		func(originalSeed int64, updatedSeed int64, newBedCapacity int) bool {
			if originalSeed == updatedSeed {
				return true // Skip if seeds are the same
			}

			// Create user and facility
			email := fmt.Sprintf("facility%d@example.com", originalSeed)
			user, err := userRepo.Create(email, "password123", "facility")
			if err != nil {
				return false
			}
			defer userRepo.Delete(user.ID)

			originalName := fmt.Sprintf("Original %d", originalSeed)
			facility, err := facilityRepo.Create(user.ID, originalName, "Address", "555-0000", 50, "Conditions")
			if err != nil {
				return false
			}
			defer facilityRepo.Delete(facility.ID)

			token, _ := middleware.GenerateToken(user.ID, user.Email, user.Role)

			// Update facility
			updatedName := fmt.Sprintf("Updated %d", updatedSeed)
			reqBody := UpdateFacilityRequest{
				Name:        updatedName,
				BedCapacity: newBedCapacity,
			}
			body, _ := json.Marshal(reqBody)

			req, _ := http.NewRequest("PUT", fmt.Sprintf("/api/facilities/%d", facility.ID), bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer "+token)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			if w.Code != http.StatusOK {
				return false
			}

			// Retrieve and verify
			updated, err := facilityRepo.GetByID(facility.ID)
			if err != nil {
				return false
			}

			return updated.Name == updatedName && updated.BedCapacity == newBedCapacity
		},
		gen.Int64Range(1, 100000),
		gen.Int64Range(1, 100000),
		gen.IntRange(1, 200),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}

// Feature: social-worker-platform, Property 11: Facility owners can view their data
// For any facility user, they should be able to retrieve their own facility information
func TestProperty_FacilityOwnersCanViewTheirData(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping property test in short mode")
	}

	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	db := config.SetupTestDatabase(t)
	defer config.TeardownTestDatabase(t, db)

	facilityRepo := models.NewFacilityRepository(db)
	userRepo := models.NewUserRepository(db)
	facilityHandler := NewFacilityHandler(facilityRepo, userRepo)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/api/facilities/me", middleware.AuthMiddleware(), facilityHandler.GetMyFacility)

	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100
	properties := gopter.NewProperties(parameters)

	properties.Property("Facility owner can retrieve their facility", prop.ForAll(
		func(nameSeed int64, bedCapacity int) bool {
			// Create user and facility
			email := fmt.Sprintf("facility%d@example.com", nameSeed)
			user, err := userRepo.Create(email, "password123", "facility")
			if err != nil {
				return false
			}
			defer userRepo.Delete(user.ID)

			name := fmt.Sprintf("Facility %d", nameSeed)
			facility, err := facilityRepo.Create(user.ID, name, "Address", "555-0000", bedCapacity, "Conditions")
			if err != nil {
				return false
			}
			defer facilityRepo.Delete(facility.ID)

			token, _ := middleware.GenerateToken(user.ID, user.Email, user.Role)

			// Retrieve own facility
			req, _ := http.NewRequest("GET", "/api/facilities/me", nil)
			req.Header.Set("Authorization", "Bearer "+token)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			if w.Code != http.StatusOK {
				return false
			}

			var retrieved models.Facility
			if err := json.Unmarshal(w.Body.Bytes(), &retrieved); err != nil {
				return false
			}

			return retrieved.ID == facility.ID &&
				retrieved.Name == name &&
				retrieved.UserID == user.ID &&
				retrieved.BedCapacity == bedCapacity
		},
		gen.Int64Range(1, 100000),
		gen.IntRange(1, 200),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}
