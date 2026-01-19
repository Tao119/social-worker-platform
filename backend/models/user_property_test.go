package models

import (
	"testing"

	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
	"github.com/social-worker-platform/backend/config"
)

// Feature: social-worker-platform, Property 26: Data persistence round trip
// For any user entity, after creating it, retrieving it should return equivalent data
func TestProperty_UserPersistenceRoundTrip(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping property test in short mode")
	}

	db := config.SetupTestDatabase(t)
	defer config.TeardownTestDatabase(t, db)

	repo := NewUserRepository(db)
	properties := gopter.NewProperties(&gopter.TestParameters{
		MinSuccessfulTests: 100,
	})

	properties.Property("User data persists correctly through create and retrieve", prop.ForAll(
		func(email string, password string, role string) bool {
			// Create user
			user, err := repo.Create(email, password, role)
			if err != nil {
				return false
			}

			// Retrieve user by ID
			retrieved, err := repo.GetByID(user.ID)
			if err != nil {
				return false
			}

			// Verify all fields match
			match := user.ID == retrieved.ID &&
				user.Email == retrieved.Email &&
				user.Role == retrieved.Role &&
				user.IsActive == retrieved.IsActive &&
				repo.VerifyPassword(retrieved, password)

			// Clean up
			repo.Delete(user.ID)

			return match
		},
		gen.AlphaString().Map(func(s string) string { return s + "@test.com" }),
		gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 }),
		gen.OneConstOf("hospital", "facility", "admin"),
	))

	properties.Property("User retrieval by email returns same data", prop.ForAll(
		func(email string, password string, role string) bool {
			// Create user
			user, err := repo.Create(email, password, role)
			if err != nil {
				return false
			}

			// Retrieve user by email
			retrieved, err := repo.GetByEmail(email)
			if err != nil {
				return false
			}

			// Verify all fields match
			match := user.ID == retrieved.ID &&
				user.Email == retrieved.Email &&
				user.Role == retrieved.Role &&
				user.IsActive == retrieved.IsActive

			// Clean up
			repo.Delete(user.ID)

			return match
		},
		gen.AlphaString().Map(func(s string) string { return s + "@test.com" }),
		gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 }),
		gen.OneConstOf("hospital", "facility", "admin"),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}
