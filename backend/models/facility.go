package models

import (
	"database/sql"
	"fmt"
	"time"
)

type Facility struct {
	ID                   int       `json:"id"`
	UserID               int       `json:"user_id"`
	Name                 string    `json:"name"`
	Address              string    `json:"address"`
	Phone                string    `json:"phone"`
	BedCapacity          int       `json:"bed_capacity"`
	AvailableBeds        int       `json:"available_beds"`
	AcceptanceConditions string    `json:"acceptance_conditions"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

type FacilityWithEmail struct {
	ID                   int       `json:"id"`
	UserID               int       `json:"user_id"`
	Email                string    `json:"email"`
	Name                 string    `json:"name"`
	Address              string    `json:"address"`
	Phone                string    `json:"phone"`
	BedCapacity          int       `json:"bed_capacity"`
	AvailableBeds        int       `json:"available_beds"`
	AcceptanceConditions string    `json:"acceptance_conditions"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

type FacilityRepository struct {
	db *sql.DB
}

func NewFacilityRepository(db *sql.DB) *FacilityRepository {
	return &FacilityRepository{db: db}
}

func (r *FacilityRepository) Create(userID int, name, address, phone string, bedCapacity int, acceptanceConditions string) (*Facility, error) {
	facility := &Facility{}
	query := `
		INSERT INTO facilities (user_id, name, address, phone, bed_capacity, available_beds, acceptance_conditions)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, user_id, name, address, phone, bed_capacity, available_beds, acceptance_conditions, created_at, updated_at
	`
	err := r.db.QueryRow(query, userID, name, address, phone, bedCapacity, 0, acceptanceConditions).Scan(
		&facility.ID, &facility.UserID, &facility.Name, &facility.Address,
		&facility.Phone, &facility.BedCapacity, &facility.AvailableBeds, &facility.AcceptanceConditions,
		&facility.CreatedAt, &facility.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create facility: %w", err)
	}

	return facility, nil
}

func (r *FacilityRepository) GetByID(id int) (*Facility, error) {
	facility := &Facility{}
	query := `
		SELECT id, user_id, name, address, phone, bed_capacity, available_beds, acceptance_conditions, created_at, updated_at
		FROM facilities
		WHERE id = $1
	`
	err := r.db.QueryRow(query, id).Scan(
		&facility.ID, &facility.UserID, &facility.Name, &facility.Address,
		&facility.Phone, &facility.BedCapacity, &facility.AvailableBeds, &facility.AcceptanceConditions,
		&facility.CreatedAt, &facility.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("facility not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get facility: %w", err)
	}

	return facility, nil
}

func (r *FacilityRepository) GetByUserID(userID int) (*Facility, error) {
	facility := &Facility{}
	query := `
		SELECT id, user_id, name, address, phone, bed_capacity, available_beds, acceptance_conditions, created_at, updated_at
		FROM facilities
		WHERE user_id = $1
	`
	err := r.db.QueryRow(query, userID).Scan(
		&facility.ID, &facility.UserID, &facility.Name, &facility.Address,
		&facility.Phone, &facility.BedCapacity, &facility.AvailableBeds, &facility.AcceptanceConditions,
		&facility.CreatedAt, &facility.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("facility not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get facility: %w", err)
	}

	return facility, nil
}

func (r *FacilityRepository) Search(name, address string, hasAvailableBeds bool) ([]*Facility, error) {
	query := `
		SELECT id, user_id, name, address, phone, bed_capacity, available_beds, acceptance_conditions, created_at, updated_at
		FROM facilities
		WHERE ($1 = '' OR name ILIKE '%' || $1 || '%')
		  AND ($2 = '' OR address ILIKE '%' || $2 || '%')
		  AND ($3 = false OR available_beds > 0)
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(query, name, address, hasAvailableBeds)
	if err != nil {
		return nil, fmt.Errorf("failed to search facilities: %w", err)
	}
	defer rows.Close()

	facilities := []*Facility{}
	for rows.Next() {
		facility := &Facility{}
		err := rows.Scan(
			&facility.ID, &facility.UserID, &facility.Name, &facility.Address,
			&facility.Phone, &facility.BedCapacity, &facility.AvailableBeds, &facility.AcceptanceConditions,
			&facility.CreatedAt, &facility.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan facility: %w", err)
		}
		facilities = append(facilities, facility)
	}

	return facilities, nil
}

func (r *FacilityRepository) GetAll() ([]*Facility, error) {
	query := `
		SELECT id, user_id, name, address, phone, bed_capacity, available_beds, acceptance_conditions, created_at, updated_at
		FROM facilities
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get facilities: %w", err)
	}
	defer rows.Close()

	facilities := []*Facility{}
	for rows.Next() {
		facility := &Facility{}
		err := rows.Scan(
			&facility.ID, &facility.UserID, &facility.Name, &facility.Address,
			&facility.Phone, &facility.BedCapacity, &facility.AvailableBeds, &facility.AcceptanceConditions,
			&facility.CreatedAt, &facility.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan facility: %w", err)
		}
		facilities = append(facilities, facility)
	}

	return facilities, nil
}

func (r *FacilityRepository) GetAllWithEmail() ([]*FacilityWithEmail, error) {
	query := `
		SELECT f.id, f.user_id, u.email, f.name, f.address, f.phone, f.bed_capacity, f.available_beds, f.acceptance_conditions, f.created_at, f.updated_at
		FROM facilities f
		JOIN users u ON f.user_id = u.id
		ORDER BY f.created_at DESC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get facilities: %w", err)
	}
	defer rows.Close()

	facilities := []*FacilityWithEmail{}
	for rows.Next() {
		facility := &FacilityWithEmail{}
		err := rows.Scan(
			&facility.ID, &facility.UserID, &facility.Email, &facility.Name, &facility.Address,
			&facility.Phone, &facility.BedCapacity, &facility.AvailableBeds, &facility.AcceptanceConditions,
			&facility.CreatedAt, &facility.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan facility: %w", err)
		}
		facilities = append(facilities, facility)
	}

	return facilities, nil
}

func (r *FacilityRepository) Update(facility *Facility) error {
	query := `
		UPDATE facilities
		SET name = $1, address = $2, phone = $3, bed_capacity = $4, 
		    available_beds = $5, acceptance_conditions = $6, updated_at = CURRENT_TIMESTAMP
		WHERE id = $7
	`
	result, err := r.db.Exec(query, facility.Name, facility.Address, facility.Phone,
		facility.BedCapacity, facility.AvailableBeds, facility.AcceptanceConditions, facility.ID)
	if err != nil {
		return fmt.Errorf("failed to update facility: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("facility not found")
	}

	return nil
}

func (r *FacilityRepository) Delete(id int) error {
	query := `DELETE FROM facilities WHERE id = $1`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete facility: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("facility not found")
	}

	return nil
}

// GetFacilityByID is a helper function for backward compatibility
func GetFacilityByID(db *sql.DB, id int) (*Facility, error) {
	repo := NewFacilityRepository(db)
	return repo.GetByID(id)
}

// GetFacilityByUserID is a helper function for backward compatibility
func GetFacilityByUserID(db *sql.DB, userID int) (*Facility, error) {
	repo := NewFacilityRepository(db)
	return repo.GetByUserID(userID)
}
