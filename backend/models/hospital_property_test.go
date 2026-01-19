package models

import (
	"testing"

	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
	"github.com/social-worker-platform/backend/config"
)

// Feature: social-worker-platform, Property 26: Data persistence round trip
// For any hospital entity, after creating it, retrieving it should return equivalent data
func TestProperty_HospitalPersistenceRoundTrip(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping property test in short mode")
	}

	db := config.SetupTestDatabase(t)
	defer config.TeardownTestDatabase(t, db)

	userRepo := NewUserRepository(db)
	hospitalRepo := NewHospitalRepository(db)
	properties := gopter.NewProperties(&gopter.TestParameters{
		MinSuccessfulTests: 100,
	})

	properties.Property("Hospital data persists correctly through create and retrieve", prop.ForAll(
		func(email string, name string, address string, phone string) bool {
			// Create user first
			user, err := userRepo.Create(email, "password", "hospital")
			if err != nil {
				return false
			}

			// Create hospital
			hospital, err := hospitalRepo.Create(user.ID, name, address, phone)
			if err != nil {
				userRepo.Delete(user.ID)
				return false
			}

			// Retrieve hospital by ID
			retrieved, err := hospitalRepo.GetByID(hospital.ID)
			if err != nil {
				userRepo.Delete(user.ID)
				return false
			}

			// Verify all fields match
			match := hospital.ID == retrieved.ID &&
				hospital.UserID == retrieved.UserID &&
				hospital.Name == retrieved.Name &&
				hospital.Address == retrieved.Address &&
				hospital.Phone == retrieved.Phone

			// Clean up
			userRepo.Delete(user.ID)

			return match
		},
		gen.AlphaString().Map(func(s string) string { return s + "@test.com" }),
		gen.AlphaString(),
		gen.AlphaString(),
		gen.AlphaString(),
	))

	properties.Property("Hospital retrieval by user ID returns same data", prop.ForAll(
		func(email string, name string, address string, phone string) bool {
			// Create user first
			user, err := userRepo.Create(email, "password", "hospital")
			if err != nil {
				return false
			}

			// Create hospital
			hospital, err := hospitalRepo.Create(user.ID, name, address, phone)
			if err != nil {
				userRepo.Delete(user.ID)
				return false
			}

			// Retrieve hospital by user ID
			retrieved, err := hospitalRepo.GetByUserID(user.ID)
			if err != nil {
				userRepo.Delete(user.ID)
				return false
			}

			// Verify all fields match
			match := hospital.ID == retrieved.ID &&
				hospital.UserID == retrieved.UserID &&
				hospital.Name == retrieved.Name &&
				hospital.Address == retrieved.Address &&
				hospital.Phone == retrieved.Phone

			// Clean up
			userRepo.Delete(user.ID)

			return match
		},
		gen.AlphaString().Map(func(s string) string { return s + "@test.com" }),
		gen.AlphaString(),
		gen.AlphaString(),
		gen.AlphaString(),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}
