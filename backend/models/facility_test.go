package models

import (
	"testing"

	"github.com/social-worker-platform/backend/config"
	"github.com/stretchr/testify/assert"
)

func TestFacilityRepository_ErrorHandling(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping database tests in short mode")
	}

	db := config.SetupTestDatabase(t)
	defer config.TeardownTestDatabase(t, db)

	userRepo := NewUserRepository(db)
	facilityRepo := NewFacilityRepository(db)

	t.Run("GetByID returns error for non-existent facility", func(t *testing.T) {
		facility, err := facilityRepo.GetByID(99999)
		assert.Error(t, err)
		assert.Nil(t, facility)
		assert.Contains(t, err.Error(), "facility not found")
	})

	t.Run("GetByUserID returns error for non-existent user", func(t *testing.T) {
		facility, err := facilityRepo.GetByUserID(99999)
		assert.Error(t, err)
		assert.Nil(t, facility)
		assert.Contains(t, err.Error(), "facility not found")
	})

	t.Run("Create returns error for non-existent user", func(t *testing.T) {
		facility, err := facilityRepo.Create(99999, "Test Facility", "Address", "123-456", 50, "Conditions")
		assert.Error(t, err)
		assert.Nil(t, facility)
	})

	t.Run("Update returns error for non-existent facility", func(t *testing.T) {
		facility := &Facility{
			ID:                   99999,
			UserID:               1,
			Name:                 "Test",
			Address:              "Address",
			Phone:                "123",
			BedCapacity:          10,
			AcceptanceConditions: "None",
		}

		err := facilityRepo.Update(facility)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "facility not found")
	})

	t.Run("Delete returns error for non-existent facility", func(t *testing.T) {
		err := facilityRepo.Delete(99999)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "facility not found")
	})

	t.Run("Search returns empty list when no facilities match", func(t *testing.T) {
		facilities, err := facilityRepo.Search("NonExistentFacility", "", 0)
		assert.NoError(t, err)
		assert.NotNil(t, facilities)
		assert.Empty(t, facilities)
	})

	t.Run("GetAll returns empty list when no facilities exist", func(t *testing.T) {
		facilities, err := facilityRepo.GetAll()
		assert.NoError(t, err)
		assert.NotNil(t, facilities)
		assert.Empty(t, facilities)
	})

	t.Run("successful CRUD operations", func(t *testing.T) {
		// Create user first
		user, err := userRepo.Create("facility@example.com", "password", "facility")
		assert.NoError(t, err)

		// Create facility
		facility, err := facilityRepo.Create(user.ID, "Test Facility", "456 Oak Ave", "555-5678", 100, "All patients")
		assert.NoError(t, err)
		assert.NotNil(t, facility)
		assert.Equal(t, "Test Facility", facility.Name)
		assert.Equal(t, 100, facility.BedCapacity)

		// Get by ID
		retrieved, err := facilityRepo.GetByID(facility.ID)
		assert.NoError(t, err)
		assert.Equal(t, facility.Name, retrieved.Name)

		// Update
		facility.Name = "Updated Facility"
		facility.BedCapacity = 150
		err = facilityRepo.Update(facility)
		assert.NoError(t, err)

		// Verify update
		updated, err := facilityRepo.GetByID(facility.ID)
		assert.NoError(t, err)
		assert.Equal(t, "Updated Facility", updated.Name)
		assert.Equal(t, 150, updated.BedCapacity)

		// Search
		results, err := facilityRepo.Search("Updated", "", 0)
		assert.NoError(t, err)
		assert.Len(t, results, 1)
		assert.Equal(t, "Updated Facility", results[0].Name)

		// Delete
		err = facilityRepo.Delete(facility.ID)
		assert.NoError(t, err)

		// Verify deletion
		deleted, err := facilityRepo.GetByID(facility.ID)
		assert.Error(t, err)
		assert.Nil(t, deleted)
	})
}
