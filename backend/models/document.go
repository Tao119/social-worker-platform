package models

import (
	"database/sql"
	"fmt"
	"time"
)

type Document struct {
	ID           int       `json:"id"`
	SenderID     int       `json:"sender_id"`
	RecipientID  int       `json:"recipient_id"`
	Title        string    `json:"title"`
	FilePath     string    `json:"file_path"`
	DocumentType string    `json:"document_type"`
	CreatedAt    time.Time `json:"created_at"`
}

type DocumentRepository struct {
	db *sql.DB
}

func NewDocumentRepository(db *sql.DB) *DocumentRepository {
	return &DocumentRepository{db: db}
}

func (r *DocumentRepository) Create(senderID, recipientID int, title, filePath, documentType string) (*Document, error) {
	document := &Document{}
	query := `
		INSERT INTO documents (sender_id, recipient_id, title, file_path, document_type)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, sender_id, recipient_id, title, file_path, document_type, created_at
	`
	err := r.db.QueryRow(query, senderID, recipientID, title, filePath, documentType).Scan(
		&document.ID, &document.SenderID, &document.RecipientID, &document.Title,
		&document.FilePath, &document.DocumentType, &document.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create document: %w", err)
	}

	return document, nil
}

func (r *DocumentRepository) GetByID(id int) (*Document, error) {
	document := &Document{}
	query := `
		SELECT id, sender_id, recipient_id, title, file_path, document_type, created_at
		FROM documents
		WHERE id = $1
	`
	err := r.db.QueryRow(query, id).Scan(
		&document.ID, &document.SenderID, &document.RecipientID, &document.Title,
		&document.FilePath, &document.DocumentType, &document.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("document not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get document: %w", err)
	}

	return document, nil
}

func (r *DocumentRepository) GetByUserID(userID int) ([]*Document, error) {
	query := `
		SELECT id, sender_id, recipient_id, title, file_path, document_type, created_at
		FROM documents
		WHERE sender_id = $1 OR recipient_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get documents: %w", err)
	}
	defer rows.Close()

	documents := []*Document{}
	for rows.Next() {
		document := &Document{}
		err := rows.Scan(
			&document.ID, &document.SenderID, &document.RecipientID, &document.Title,
			&document.FilePath, &document.DocumentType, &document.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan document: %w", err)
		}
		documents = append(documents, document)
	}

	return documents, nil
}

func (r *DocumentRepository) Delete(id int) error {
	query := `DELETE FROM documents WHERE id = $1`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete document: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("document not found")
	}

	return nil
}
