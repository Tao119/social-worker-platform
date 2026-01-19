package models

import (
	"testing"

	"github.com/social-worker-platform/backend/config"
	"github.com/stretchr/testify/assert"
)

func TestHospitalRepository_ErrorHandling(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping database tests in short mode")
	}

	db := config.SetupTestDatabase(t)
	defer config.TeardownTestDatabase(t, db)

	userRepo := NewUserRepository(db)
	hospitalRepo := NewHospitalRepository(db)

	t.Run("GetByID returns error for non-existent hospital", func(t *testing.T) {
		hospital, err := hospitalRepo.GetByID(99999)
		assert.Error(t, err)
		assert.Nil(t, hospital)
		assert.Contains(t, err.Error(), "hospital not found")
	})

	t.Run("GetByUserID returns error for non-existent user", func(t *testing.T) {
		hospital, err := hospitalRepo.GetByUserID(99999)
		assert.Error(t, err)
		assert.Nil(t, hospital)
		assert.Contains(t, err.Error(), "hospital not found")
	})

	t.Run("Create returns error for non-existent user", func(t *testing.T) {
		hospital, err := hospitalRepo.Create(99999, "Test Hospital", "Address", "123-456")
		assert.Error(t, err)
		assert.Nil(t, hospital)
	})

	t.Run("Update returns error for non-existent hospital", func(t *testing.T) {
		hospital := &Hospital{
			ID:      99999,
			UserID:  1,
			Name:    "Test",
			Address: "Address",
			Phone:   "123",
		}

		err := hospitalRepo.Update(hospital)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "hospital not found")
	})

	t.Run("Delete returns error for non-existent hospital", func(t *testing.T) {
		err := hospitalRepo.Delete(99999)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "hospital not found")
	})

	t.Run("GetAll returns empty list when no hospitals exist", func(t *testing.T) {
		hospitals, err := hospitalRepo.GetAll()
		assert.NoError(t, err)
		assert.NotNil(t, hospitals)
		assert.Empty(t, hospitals)
	})

	t.Run("successful CRUD operations", func(t *testing.T) {
		// Create user first
		user, err := userRepo.Create("hospital@example.com", "password", "hospital")
		assert.NoError(t, err)

		// Create hospital
		hospital, err := hospitalRepo.Create(user.ID, "Test Hospital", "123 Main St", "555-1234")
		assert.NoError(t, err)
		assert.NotNil(t, hospital)
		assert.Equal(t, "Test Hospital", hospital.Name)

		// Get by ID
		retrieved, err := hospitalRepo.GetByID(hospital.ID)
		assert.NoError(t, err)
		assert.Equal(t, hospital.Name, retrieved.Name)

		// Update
		hospital.Name = "Updated Hospital"
		err = hospitalRepo.Update(hospital)
		assert.NoError(t, err)

		// Verify update
		updated, err := hospitalRepo.GetByID(hospital.ID)
		assert.NoError(t, err)
		assert.Equal(t, "Updated Hospital", updated.Name)

		// Delete
		err = hospitalRepo.Delete(hospital.ID)
		assert.NoError(t, err)

		// Verify deletion
		deleted, err := hospitalRepo.GetByID(hospital.ID)
		assert.Error(t, err)
		assert.Nil(t, deleted)
	})
}
