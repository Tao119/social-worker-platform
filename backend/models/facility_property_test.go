package models

import (
	"testing"

	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
	"github.com/social-worker-platform/backend/config"
)

// Feature: social-worker-platform, Property 26: Data persistence round trip
// For any facility entity, after creating it, retrieving it should return equivalent data
func TestProperty_FacilityPersistenceRoundTrip(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping property test in short mode")
	}

	db := config.SetupTestDatabase(t)
	defer config.TeardownTestDatabase(t, db)

	userRepo := NewUserRepository(db)
	facilityRepo := NewFacilityRepository(db)
	properties := gopter.NewProperties(&gopter.TestParameters{
		MinSuccessfulTests: 100,
	})

	properties.Property("Facility data persists correctly through create and retrieve", prop.ForAll(
		func(email string, name string, address string, phone string, bedCapacity int, conditions string) bool {
			// Create user first
			user, err := userRepo.Create(email, "password", "facility")
			if err != nil {
				return false
			}

			// Create facility
			facility, err := facilityRepo.Create(user.ID, name, address, phone, bedCapacity, conditions)
			if err != nil {
				userRepo.Delete(user.ID)
				return false
			}

			// Retrieve facility by ID
			retrieved, err := facilityRepo.GetByID(facility.ID)
			if err != nil {
				userRepo.Delete(user.ID)
				return false
			}

			// Verify all fields match
			match := facility.ID == retrieved.ID &&
				facility.UserID == retrieved.UserID &&
				facility.Name == retrieved.Name &&
				facility.Address == retrieved.Address &&
				facility.Phone == retrieved.Phone &&
				facility.BedCapacity == retrieved.BedCapacity &&
				facility.AcceptanceConditions == retrieved.AcceptanceConditions

			// Clean up
			userRepo.Delete(user.ID)

			return match
		},
		gen.AlphaString().Map(func(s string) string { return s + "@test.com" }),
		gen.AlphaString(),
		gen.AlphaString(),
		gen.AlphaString(),
		gen.IntRange(1, 1000),
		gen.AlphaString(),
	))

	properties.Property("Facility retrieval by user ID returns same data", prop.ForAll(
		func(email string, name string, address string, phone string, bedCapacity int, conditions string) bool {
			// Create user first
			user, err := userRepo.Create(email, "password", "facility")
			if err != nil {
				return false
			}

			// Create facility
			facility, err := facilityRepo.Create(user.ID, name, address, phone, bedCapacity, conditions)
			if err != nil {
				userRepo.Delete(user.ID)
				return false
			}

			// Retrieve facility by user ID
			retrieved, err := facilityRepo.GetByUserID(user.ID)
			if err != nil {
				userRepo.Delete(user.ID)
				return false
			}

			// Verify all fields match
			match := facility.ID == retrieved.ID &&
				facility.UserID == retrieved.UserID &&
				facility.Name == retrieved.Name &&
				facility.Address == retrieved.Address &&
				facility.Phone == retrieved.Phone &&
				facility.BedCapacity == retrieved.BedCapacity &&
				facility.AcceptanceConditions == retrieved.AcceptanceConditions

			// Clean up
			userRepo.Delete(user.ID)

			return match
		},
		gen.AlphaString().Map(func(s string) string { return s + "@test.com" }),
		gen.AlphaString(),
		gen.AlphaString(),
		gen.AlphaString(),
		gen.IntRange(1, 1000),
		gen.AlphaString(),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}
