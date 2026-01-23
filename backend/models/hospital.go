package models

import (
	"database/sql"
	"fmt"
	"time"
)

type Hospital struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Name      string    `json:"name"`
	Address   string    `json:"address"`
	Phone     string    `json:"phone"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type HospitalWithEmail struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	Address   string    `json:"address"`
	Phone     string    `json:"phone"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type HospitalRepository struct {
	db *sql.DB
}

func NewHospitalRepository(db *sql.DB) *HospitalRepository {
	return &HospitalRepository{db: db}
}

func (r *HospitalRepository) Create(userID int, name, address, phone string) (*Hospital, error) {
	hospital := &Hospital{}
	query := `
		INSERT INTO hospitals (user_id, name, address, phone)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, name, address, phone, created_at, updated_at
	`
	err := r.db.QueryRow(query, userID, name, address, phone).Scan(
		&hospital.ID, &hospital.UserID, &hospital.Name, &hospital.Address,
		&hospital.Phone, &hospital.CreatedAt, &hospital.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create hospital: %w", err)
	}

	return hospital, nil
}

func (r *HospitalRepository) GetByID(id int) (*Hospital, error) {
	hospital := &Hospital{}
	query := `
		SELECT id, user_id, name, address, phone, created_at, updated_at
		FROM hospitals
		WHERE id = $1
	`
	err := r.db.QueryRow(query, id).Scan(
		&hospital.ID, &hospital.UserID, &hospital.Name, &hospital.Address,
		&hospital.Phone, &hospital.CreatedAt, &hospital.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("hospital not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get hospital: %w", err)
	}

	return hospital, nil
}

func (r *HospitalRepository) GetByUserID(userID int) (*Hospital, error) {
	hospital := &Hospital{}
	query := `
		SELECT id, user_id, name, address, phone, created_at, updated_at
		FROM hospitals
		WHERE user_id = $1
	`
	err := r.db.QueryRow(query, userID).Scan(
		&hospital.ID, &hospital.UserID, &hospital.Name, &hospital.Address,
		&hospital.Phone, &hospital.CreatedAt, &hospital.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("hospital not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get hospital: %w", err)
	}

	return hospital, nil
}

func (r *HospitalRepository) GetAll() ([]*Hospital, error) {
	query := `
		SELECT id, user_id, name, address, phone, created_at, updated_at
		FROM hospitals
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get hospitals: %w", err)
	}
	defer rows.Close()

	hospitals := []*Hospital{}
	for rows.Next() {
		hospital := &Hospital{}
		err := rows.Scan(
			&hospital.ID, &hospital.UserID, &hospital.Name, &hospital.Address,
			&hospital.Phone, &hospital.CreatedAt, &hospital.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan hospital: %w", err)
		}
		hospitals = append(hospitals, hospital)
	}

	return hospitals, nil
}

func (r *HospitalRepository) GetAllWithEmail() ([]*HospitalWithEmail, error) {
	query := `
		SELECT h.id, h.user_id, u.email, h.name, h.address, h.phone, h.created_at, h.updated_at
		FROM hospitals h
		JOIN users u ON h.user_id = u.id
		ORDER BY h.created_at DESC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get hospitals: %w", err)
	}
	defer rows.Close()

	hospitals := []*HospitalWithEmail{}
	for rows.Next() {
		hospital := &HospitalWithEmail{}
		err := rows.Scan(
			&hospital.ID, &hospital.UserID, &hospital.Email, &hospital.Name, &hospital.Address,
			&hospital.Phone, &hospital.CreatedAt, &hospital.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan hospital: %w", err)
		}
		hospitals = append(hospitals, hospital)
	}

	return hospitals, nil
}

func (r *HospitalRepository) Update(hospital *Hospital) error {
	query := `
		UPDATE hospitals
		SET name = $1, address = $2, phone = $3, updated_at = CURRENT_TIMESTAMP
		WHERE id = $4
	`
	result, err := r.db.Exec(query, hospital.Name, hospital.Address, hospital.Phone, hospital.ID)
	if err != nil {
		return fmt.Errorf("failed to update hospital: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("hospital not found")
	}

	return nil
}

func (r *HospitalRepository) Delete(id int) error {
	query := `DELETE FROM hospitals WHERE id = $1`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete hospital: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("hospital not found")
	}

	return nil
}

// GetHospitalByUserID is a helper function for backward compatibility
func GetHospitalByUserID(db *sql.DB, userID int) (*Hospital, error) {
	repo := NewHospitalRepository(db)
	return repo.GetByUserID(userID)
}
