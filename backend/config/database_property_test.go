package config

import (
	"database/sql"
	"testing"

	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// Feature: social-worker-platform, Property 28: Referential integrity is enforced
// For any user record, deleting it should cascade delete or prevent deletion if related records exist
func TestProperty_ReferentialIntegrity(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping property test in short mode")
	}

	db := SetupTestDatabase(t)
	defer TeardownTestDatabase(t, db)

	properties := gopter.NewProperties(nil)

	// Property: Deleting a user cascades to related hospitals
	properties.Property("Deleting user cascades to hospitals", prop.ForAll(
		func(email string, hospitalName string) bool {
			// Create user
			var userID int
			err := db.QueryRow(
				"INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id",
				email, "hash", "hospital",
			).Scan(&userID)
			if err != nil {
				return false
			}

			// Create hospital
			var hospitalID int
			err = db.QueryRow(
				"INSERT INTO hospitals (user_id, name) VALUES ($1, $2) RETURNING id",
				userID, hospitalName,
			).Scan(&hospitalID)
			if err != nil {
				return false
			}

			// Delete user
			_, err = db.Exec("DELETE FROM users WHERE id = $1", userID)
			if err != nil {
				return false
			}

			// Verify hospital is also deleted (cascade)
			var count int
			err = db.QueryRow("SELECT COUNT(*) FROM hospitals WHERE id = $1", hospitalID).Scan(&count)
			if err != nil {
				return false
			}

			return count == 0
		},
		gen.AlphaString().Map(func(s string) string { return s + "@test.com" }),
		gen.AlphaString(),
	))

	// Property: Deleting a user cascades to related facilities
	properties.Property("Deleting user cascades to facilities", prop.ForAll(
		func(email string, facilityName string) bool {
			// Create user
			var userID int
			err := db.QueryRow(
				"INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id",
				email, "hash", "facility",
			).Scan(&userID)
			if err != nil {
				return false
			}

			// Create facility
			var facilityID int
			err = db.QueryRow(
				"INSERT INTO facilities (user_id, name, bed_capacity) VALUES ($1, $2, $3) RETURNING id",
				userID, facilityName, 10,
			).Scan(&facilityID)
			if err != nil {
				return false
			}

			// Delete user
			_, err = db.Exec("DELETE FROM users WHERE id = $1", userID)
			if err != nil {
				return false
			}

			// Verify facility is also deleted (cascade)
			var count int
			err = db.QueryRow("SELECT COUNT(*) FROM facilities WHERE id = $1", facilityID).Scan(&count)
			if err != nil {
				return false
			}

			return count == 0
		},
		gen.AlphaString().Map(func(s string) string { return s + "@test.com" }),
		gen.AlphaString(),
	))

	// Property: Deleting a user cascades to related documents
	properties.Property("Deleting user cascades to documents", prop.ForAll(
		func(senderEmail string, recipientEmail string, title string) bool {
			// Create sender user
			var senderID int
			err := db.QueryRow(
				"INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id",
				senderEmail, "hash", "hospital",
			).Scan(&senderID)
			if err != nil {
				return false
			}

			// Create recipient user
			var recipientID int
			err = db.QueryRow(
				"INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id",
				recipientEmail, "hash", "facility",
			).Scan(&recipientID)
			if err != nil {
				// Clean up sender if recipient creation fails
				db.Exec("DELETE FROM users WHERE id = $1", senderID)
				return false
			}

			// Create document
			var documentID int
			err = db.QueryRow(
				"INSERT INTO documents (sender_id, recipient_id, title, file_path) VALUES ($1, $2, $3, $4) RETURNING id",
				senderID, recipientID, title, "/path/to/file",
			).Scan(&documentID)
			if err != nil {
				// Clean up both users if document creation fails
				db.Exec("DELETE FROM users WHERE id = $1", senderID)
				db.Exec("DELETE FROM users WHERE id = $1", recipientID)
				return false
			}

			// Delete sender user
			_, err = db.Exec("DELETE FROM users WHERE id = $1", senderID)
			if err != nil {
				return false
			}

			// Verify document is also deleted (cascade)
			var count int
			err = db.QueryRow("SELECT COUNT(*) FROM documents WHERE id = $1", documentID).Scan(&count)
			if err != nil {
				return false
			}

			// Clean up recipient user
			db.Exec("DELETE FROM users WHERE id = $1", recipientID)

			return count == 0
		},
		gen.AlphaString().Map(func(s string) string { return s + "sender@test.com" }),
		gen.AlphaString().Map(func(s string) string { return s + "recipient@test.com" }),
		gen.AlphaString(),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}

// Helper function to clean up test data between property runs
func cleanupTestData(db *sql.DB) error {
	tables := []string{"documents", "facilities", "hospitals", "users"}
	for _, table := range tables {
		_, err := db.Exec("TRUNCATE TABLE " + table + " CASCADE")
		if err != nil {
			return err
		}
	}
	return nil
}
