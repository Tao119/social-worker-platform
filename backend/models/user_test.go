package models

import (
	"testing"

	"github.com/social-worker-platform/backend/config"
	"github.com/stretchr/testify/assert"
)

func TestUserRepository_ErrorHandling(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping database tests in short mode")
	}

	db := config.SetupTestDatabase(t)
	defer config.TeardownTestDatabase(t, db)

	repo := NewUserRepository(db)

	t.Run("GetByID returns error for non-existent user", func(t *testing.T) {
		user, err := repo.GetByID(99999)
		assert.Error(t, err)
		assert.Nil(t, user)
		assert.Contains(t, err.Error(), "user not found")
	})

	t.Run("GetByEmail returns error for non-existent email", func(t *testing.T) {
		user, err := repo.GetByEmail("nonexistent@example.com")
		assert.Error(t, err)
		assert.Nil(t, user)
		assert.Contains(t, err.Error(), "user not found")
	})

	t.Run("Create returns error for duplicate email", func(t *testing.T) {
		email := "duplicate@example.com"
		
		// Create first user
		user1, err := repo.Create(email, "password123", "hospital")
		assert.NoError(t, err)
		assert.NotNil(t, user1)

		// Try to create second user with same email
		user2, err := repo.Create(email, "password456", "facility")
		assert.Error(t, err)
		assert.Nil(t, user2)
	})

	t.Run("Update returns error for non-existent user", func(t *testing.T) {
		user := &User{
			ID:       99999,
			Email:    "test@example.com",
			Role:     "hospital",
			IsActive: true,
		}

		err := repo.Update(user)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "user not found")
	})

	t.Run("Delete returns error for non-existent user", func(t *testing.T) {
		err := repo.Delete(99999)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "user not found")
	})

	t.Run("VerifyPassword returns false for incorrect password", func(t *testing.T) {
		user, err := repo.Create("test@example.com", "correctpassword", "admin")
		assert.NoError(t, err)

		result := repo.VerifyPassword(user, "wrongpassword")
		assert.False(t, result)
	})

	t.Run("VerifyPassword returns true for correct password", func(t *testing.T) {
		password := "correctpassword123"
		user, err := repo.Create("verify@example.com", password, "facility")
		assert.NoError(t, err)

		result := repo.VerifyPassword(user, password)
		assert.True(t, result)
	})
}
