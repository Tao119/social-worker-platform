package models

import (
	"testing"

	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
	"github.com/social-worker-platform/backend/config"
)

// Feature: social-worker-platform, Property 26: Data persistence round trip
// For any document entity, after creating it, retrieving it should return equivalent data
func TestProperty_DocumentPersistenceRoundTrip(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping property test in short mode")
	}

	db := config.SetupTestDatabase(t)
	defer config.TeardownTestDatabase(t, db)

	userRepo := NewUserRepository(db)
	documentRepo := NewDocumentRepository(db)
	properties := gopter.NewProperties(&gopter.TestParameters{
		MinSuccessfulTests: 100,
	})

	properties.Property("Document data persists correctly through create and retrieve", prop.ForAll(
		func(senderEmail string, recipientEmail string, title string, filePath string, docType string) bool {
			// Create sender user
			sender, err := userRepo.Create(senderEmail, "password", "hospital")
			if err != nil {
				return false
			}

			// Create recipient user
			recipient, err := userRepo.Create(recipientEmail, "password", "facility")
			if err != nil {
				userRepo.Delete(sender.ID)
				return false
			}

			// Create document
			document, err := documentRepo.Create(sender.ID, recipient.ID, title, filePath, docType)
			if err != nil {
				userRepo.Delete(sender.ID)
				userRepo.Delete(recipient.ID)
				return false
			}

			// Retrieve document by ID
			retrieved, err := documentRepo.GetByID(document.ID)
			if err != nil {
				userRepo.Delete(sender.ID)
				userRepo.Delete(recipient.ID)
				return false
			}

			// Verify all fields match
			match := document.ID == retrieved.ID &&
				document.SenderID == retrieved.SenderID &&
				document.RecipientID == retrieved.RecipientID &&
				document.Title == retrieved.Title &&
				document.FilePath == retrieved.FilePath &&
				document.DocumentType == retrieved.DocumentType

			// Clean up
			userRepo.Delete(sender.ID)
			userRepo.Delete(recipient.ID)

			return match
		},
		gen.AlphaString().Map(func(s string) string { return s + "sender@test.com" }),
		gen.AlphaString().Map(func(s string) string { return s + "recipient@test.com" }),
		gen.AlphaString(),
		gen.AlphaString().Map(func(s string) string { return "/path/to/" + s }),
		gen.OneConstOf("referral", "medical_record", "consent_form", "other"),
	))

	properties.Property("Document retrieval by user ID returns correct documents", prop.ForAll(
		func(senderEmail string, recipientEmail string, title string, filePath string, docType string) bool {
			// Create sender user
			sender, err := userRepo.Create(senderEmail, "password", "hospital")
			if err != nil {
				return false
			}

			// Create recipient user
			recipient, err := userRepo.Create(recipientEmail, "password", "facility")
			if err != nil {
				userRepo.Delete(sender.ID)
				return false
			}

			// Create document
			document, err := documentRepo.Create(sender.ID, recipient.ID, title, filePath, docType)
			if err != nil {
				userRepo.Delete(sender.ID)
				userRepo.Delete(recipient.ID)
				return false
			}

			// Retrieve documents by sender ID
			senderDocs, err := documentRepo.GetByUserID(sender.ID)
			if err != nil {
				userRepo.Delete(sender.ID)
				userRepo.Delete(recipient.ID)
				return false
			}

			// Retrieve documents by recipient ID
			recipientDocs, err := documentRepo.GetByUserID(recipient.ID)
			if err != nil {
				userRepo.Delete(sender.ID)
				userRepo.Delete(recipient.ID)
				return false
			}

			// Verify document appears in both sender and recipient lists
			foundInSender := false
			foundInRecipient := false

			for _, doc := range senderDocs {
				if doc.ID == document.ID {
					foundInSender = true
					break
				}
			}

			for _, doc := range recipientDocs {
				if doc.ID == document.ID {
					foundInRecipient = true
					break
				}
			}

			// Clean up
			userRepo.Delete(sender.ID)
			userRepo.Delete(recipient.ID)

			return foundInSender && foundInRecipient
		},
		gen.AlphaString().Map(func(s string) string { return s + "sender@test.com" }),
		gen.AlphaString().Map(func(s string) string { return s + "recipient@test.com" }),
		gen.AlphaString(),
		gen.AlphaString().Map(func(s string) string { return "/path/to/" + s }),
		gen.OneConstOf("referral", "medical_record", "consent_form", "other"),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}
