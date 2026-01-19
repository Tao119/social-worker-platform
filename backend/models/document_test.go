package models

import (
	"testing"

	"github.com/social-worker-platform/backend/config"
	"github.com/stretchr/testify/assert"
)

func TestDocumentRepository_ErrorHandling(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping database tests in short mode")
	}

	db := config.SetupTestDatabase(t)
	defer config.TeardownTestDatabase(t, db)

	userRepo := NewUserRepository(db)
	documentRepo := NewDocumentRepository(db)

	t.Run("GetByID returns error for non-existent document", func(t *testing.T) {
		document, err := documentRepo.GetByID(99999)
		assert.Error(t, err)
		assert.Nil(t, document)
		assert.Contains(t, err.Error(), "document not found")
	})

	t.Run("GetByUserID returns empty list for user with no documents", func(t *testing.T) {
		user, err := userRepo.Create("nodocs@example.com", "password", "hospital")
		assert.NoError(t, err)

		documents, err := documentRepo.GetByUserID(user.ID)
		assert.NoError(t, err)
		assert.NotNil(t, documents)
		assert.Empty(t, documents)
	})

	t.Run("Create returns error for non-existent sender", func(t *testing.T) {
		user, err := userRepo.Create("recipient@example.com", "password", "facility")
		assert.NoError(t, err)

		document, err := documentRepo.Create(99999, user.ID, "Test Doc", "/path/file", "referral")
		assert.Error(t, err)
		assert.Nil(t, document)
	})

	t.Run("Create returns error for non-existent recipient", func(t *testing.T) {
		user, err := userRepo.Create("sender@example.com", "password", "hospital")
		assert.NoError(t, err)

		document, err := documentRepo.Create(user.ID, 99999, "Test Doc", "/path/file", "referral")
		assert.Error(t, err)
		assert.Nil(t, document)
	})

	t.Run("Delete returns error for non-existent document", func(t *testing.T) {
		err := documentRepo.Delete(99999)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "document not found")
	})

	t.Run("successful CRUD operations", func(t *testing.T) {
		// Create sender and recipient users
		sender, err := userRepo.Create("sender2@example.com", "password", "hospital")
		assert.NoError(t, err)

		recipient, err := userRepo.Create("recipient2@example.com", "password", "facility")
		assert.NoError(t, err)

		// Create document
		document, err := documentRepo.Create(sender.ID, recipient.ID, "Patient Referral", "/uploads/referral.pdf", "referral")
		assert.NoError(t, err)
		assert.NotNil(t, document)
		assert.Equal(t, "Patient Referral", document.Title)
		assert.Equal(t, sender.ID, document.SenderID)
		assert.Equal(t, recipient.ID, document.RecipientID)

		// Get by ID
		retrieved, err := documentRepo.GetByID(document.ID)
		assert.NoError(t, err)
		assert.Equal(t, document.Title, retrieved.Title)

		// Get by sender ID
		senderDocs, err := documentRepo.GetByUserID(sender.ID)
		assert.NoError(t, err)
		assert.Len(t, senderDocs, 1)
		assert.Equal(t, document.ID, senderDocs[0].ID)

		// Get by recipient ID
		recipientDocs, err := documentRepo.GetByUserID(recipient.ID)
		assert.NoError(t, err)
		assert.Len(t, recipientDocs, 1)
		assert.Equal(t, document.ID, recipientDocs[0].ID)

		// Delete
		err = documentRepo.Delete(document.ID)
		assert.NoError(t, err)

		// Verify deletion
		deleted, err := documentRepo.GetByID(document.ID)
		assert.Error(t, err)
		assert.Nil(t, deleted)
	})
}
