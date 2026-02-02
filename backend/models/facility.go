package models

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/lib/pq"
)

type Facility struct {
	ID                      int              `json:"id"`
	UserID                  int              `json:"user_id"`
	Name                    string           `json:"name"`
	Address                 string           `json:"address"`
	Phone                   string           `json:"phone"`
	BedCapacity             int              `json:"bed_capacity"`
	AvailableBeds           int              `json:"available_beds"`
	AcceptanceConditions    string           `json:"acceptance_conditions"`
	Latitude                *float64         `json:"latitude,omitempty"`
	Longitude               *float64         `json:"longitude,omitempty"`
	MonthlyFee              *int             `json:"monthly_fee,omitempty"`
	MedicineCost            *int             `json:"medicine_cost,omitempty"`
	Distance                *float64         `json:"distance,omitempty"`
	FacilityType            string           `json:"facility_type,omitempty"`
	AcceptanceConditionsJSON json.RawMessage `json:"acceptance_conditions_json,omitempty"`
	Description             *string          `json:"description,omitempty"`
	ContactName             *string          `json:"contact_name,omitempty"`
	ContactHours            *string          `json:"contact_hours,omitempty"`
	Images                  []*FacilityImage `json:"images,omitempty"`
	CreatedAt               time.Time        `json:"created_at"`
	UpdatedAt               time.Time        `json:"updated_at"`
}

type FacilityImage struct {
	ID         int       `json:"id"`
	FacilityID int       `json:"facility_id"`
	ImageURL   string    `json:"image_url"`
	ImageType  string    `json:"image_type"`
	SortOrder  int       `json:"sort_order"`
	Caption    *string   `json:"caption,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

type FacilitySearchParams struct {
	Name             string
	Address          string
	HasAvailableBeds bool
	UserLatitude     *float64
	UserLongitude    *float64
	MaxDistanceKm    *float64
	MinMonthlyFee    *int
	MaxMonthlyFee    *int
	MinMedicineCost  *int
	MaxMedicineCost  *int
	SortBy           string // distance, monthly_fee, medicine_cost, available_beds
	SortOrder        string // asc, desc
	// Acceptance conditions filters
	Ventilator    *bool
	IvAntibiotics *bool
	TubeFeeding   *bool
	Tracheostomy  *bool
	Dialysis      *bool
	Oxygen        *bool
	PressureUlcer *bool
	Dementia      *bool
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
	Latitude             *float64  `json:"latitude,omitempty"`
	Longitude            *float64  `json:"longitude,omitempty"`
	MonthlyFee           *int      `json:"monthly_fee,omitempty"`
	MedicineCost         *int      `json:"medicine_cost,omitempty"`
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
		SELECT id, user_id, name, COALESCE(address, '') as address, COALESCE(phone, '') as phone,
		       bed_capacity, available_beds, COALESCE(acceptance_conditions, '') as acceptance_conditions,
		       latitude, longitude, monthly_fee, medicine_cost,
		       COALESCE(facility_type, '介護施設') as facility_type,
		       COALESCE(acceptance_conditions_json, '{}') as acceptance_conditions_json,
		       description, contact_name, contact_hours,
		       created_at, updated_at
		FROM facilities
		WHERE id = $1
	`
	err := r.db.QueryRow(query, id).Scan(
		&facility.ID, &facility.UserID, &facility.Name, &facility.Address,
		&facility.Phone, &facility.BedCapacity, &facility.AvailableBeds, &facility.AcceptanceConditions,
		&facility.Latitude, &facility.Longitude, &facility.MonthlyFee, &facility.MedicineCost,
		&facility.FacilityType, &facility.AcceptanceConditionsJSON,
		&facility.Description, &facility.ContactName, &facility.ContactHours,
		&facility.CreatedAt, &facility.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("facility not found")
	}
	if err != nil {
		fmt.Printf("DEBUG GetByID error for id %d: %v\n", id, err)
		return nil, fmt.Errorf("failed to get facility: %w", err)
	}

	// Load facility images
	images, err := r.GetImagesByFacilityID(id)
	if err == nil {
		facility.Images = images
	}

	return facility, nil
}

func (r *FacilityRepository) GetImagesByFacilityID(facilityID int) ([]*FacilityImage, error) {
	query := `
		SELECT id, facility_id, image_url, COALESCE(image_type, 'exterior') as image_type,
		       sort_order, caption, created_at
		FROM facility_images
		WHERE facility_id = $1
		ORDER BY sort_order ASC
	`
	rows, err := r.db.Query(query, facilityID)
	if err != nil {
		return nil, fmt.Errorf("failed to get facility images: %w", err)
	}
	defer rows.Close()

	images := []*FacilityImage{}
	for rows.Next() {
		img := &FacilityImage{}
		err := rows.Scan(&img.ID, &img.FacilityID, &img.ImageURL, &img.ImageType,
			&img.SortOrder, &img.Caption, &img.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan facility image: %w", err)
		}
		images = append(images, img)
	}

	return images, nil
}

func (r *FacilityRepository) GetByUserID(userID int) (*Facility, error) {
	facility := &Facility{}
	query := `
		SELECT id, user_id, name, COALESCE(address, '') as address, COALESCE(phone, '') as phone,
		       bed_capacity, available_beds, COALESCE(acceptance_conditions, '') as acceptance_conditions,
		       latitude, longitude, monthly_fee, medicine_cost,
		       COALESCE(facility_type, '介護施設') as facility_type,
		       COALESCE(acceptance_conditions_json, '{}') as acceptance_conditions_json,
		       description, contact_name, contact_hours,
		       created_at, updated_at
		FROM facilities
		WHERE user_id = $1
	`
	err := r.db.QueryRow(query, userID).Scan(
		&facility.ID, &facility.UserID, &facility.Name, &facility.Address,
		&facility.Phone, &facility.BedCapacity, &facility.AvailableBeds, &facility.AcceptanceConditions,
		&facility.Latitude, &facility.Longitude, &facility.MonthlyFee, &facility.MedicineCost,
		&facility.FacilityType, &facility.AcceptanceConditionsJSON,
		&facility.Description, &facility.ContactName, &facility.ContactHours,
		&facility.CreatedAt, &facility.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("facility not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get facility: %w", err)
	}

	// Load facility images
	images, err := r.GetImagesByFacilityID(facility.ID)
	if err == nil {
		facility.Images = images
	}

	return facility, nil
}

func (r *FacilityRepository) Search(name, address string, hasAvailableBeds bool) ([]*Facility, error) {
	query := `
		SELECT id, user_id, name, COALESCE(address, '') as address, COALESCE(phone, '') as phone,
		       bed_capacity, available_beds, COALESCE(acceptance_conditions, '') as acceptance_conditions,
		       latitude, longitude, monthly_fee, medicine_cost, created_at, updated_at
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
			&facility.Latitude, &facility.Longitude, &facility.MonthlyFee, &facility.MedicineCost,
			&facility.CreatedAt, &facility.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan facility: %w", err)
		}
		facilities = append(facilities, facility)
	}

	return facilities, nil
}

func (r *FacilityRepository) SearchAdvanced(params FacilitySearchParams) ([]*Facility, error) {
	// Build the base query with optional distance calculation
	// Use COALESCE to handle NULL values for string fields
	baseSelect := `
		SELECT id, user_id, name, COALESCE(address, '') as address, COALESCE(phone, '') as phone,
		       bed_capacity, available_beds, COALESCE(acceptance_conditions, '') as acceptance_conditions,
		       latitude, longitude, monthly_fee, medicine_cost, created_at, updated_at`

	var distanceSelect string
	if params.UserLatitude != nil && params.UserLongitude != nil {
		// Haversine formula for distance calculation (Earth radius = 6371 km)
		distanceSelect = fmt.Sprintf(`,
			CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN
				(6371 * acos(
					LEAST(1.0, GREATEST(-1.0,
						cos(radians(%f)) * cos(radians(latitude)) *
						cos(radians(longitude) - radians(%f)) +
						sin(radians(%f)) * sin(radians(latitude))
					))
				))
			ELSE NULL END as distance`,
			*params.UserLatitude, *params.UserLongitude, *params.UserLatitude)
	} else {
		distanceSelect = ", NULL as distance"
	}

	whereClause := `
		FROM facilities
		WHERE ($1 = '' OR name ILIKE '%' || $1 || '%')
		  AND ($2 = '' OR address ILIKE '%' || $2 || '%')
		  AND ($3 = false OR available_beds > 0)
		  AND ($4::integer IS NULL OR monthly_fee >= $4)
		  AND ($5::integer IS NULL OR monthly_fee <= $5)
		  AND ($6::integer IS NULL OR medicine_cost >= $6)
		  AND ($7::integer IS NULL OR medicine_cost <= $7)`

	// Add distance filter if location and max distance provided
	if params.UserLatitude != nil && params.UserLongitude != nil && params.MaxDistanceKm != nil {
		whereClause += fmt.Sprintf(`
		  AND latitude IS NOT NULL
		  AND longitude IS NOT NULL
		  AND (6371 * acos(
			  LEAST(1.0, GREATEST(-1.0,
				  cos(radians(%f)) * cos(radians(latitude)) *
				  cos(radians(longitude) - radians(%f)) +
				  sin(radians(%f)) * sin(radians(latitude))
			  ))
		  )) <= %f`,
			*params.UserLatitude, *params.UserLongitude, *params.UserLatitude, *params.MaxDistanceKm)
	}

	// Add acceptance conditions filters (JSONB)
	if params.Ventilator != nil && *params.Ventilator {
		whereClause += ` AND (acceptance_conditions_json->>'ventilator')::boolean = true`
	}
	if params.IvAntibiotics != nil && *params.IvAntibiotics {
		whereClause += ` AND (acceptance_conditions_json->>'iv_antibiotics')::boolean = true`
	}
	if params.TubeFeeding != nil && *params.TubeFeeding {
		whereClause += ` AND (acceptance_conditions_json->>'tube_feeding')::boolean = true`
	}
	if params.Tracheostomy != nil && *params.Tracheostomy {
		whereClause += ` AND (acceptance_conditions_json->>'tracheostomy')::boolean = true`
	}
	if params.Dialysis != nil && *params.Dialysis {
		whereClause += ` AND (acceptance_conditions_json->>'dialysis')::boolean = true`
	}
	if params.Oxygen != nil && *params.Oxygen {
		whereClause += ` AND (acceptance_conditions_json->>'oxygen')::boolean = true`
	}
	if params.PressureUlcer != nil && *params.PressureUlcer {
		whereClause += ` AND (acceptance_conditions_json->>'pressure_ulcer')::boolean = true`
	}
	if params.Dementia != nil && *params.Dementia {
		whereClause += ` AND (acceptance_conditions_json->>'dementia')::boolean = true`
	}

	// Build ORDER BY clause based on sort parameters
	var orderClause string
	sortOrder := "ASC"
	if params.SortOrder == "desc" {
		sortOrder = "DESC"
	}

	switch params.SortBy {
	case "distance":
		if params.UserLatitude != nil && params.UserLongitude != nil {
			orderClause = fmt.Sprintf(" ORDER BY distance %s NULLS LAST, created_at DESC", sortOrder)
		} else {
			orderClause = " ORDER BY created_at DESC"
		}
	case "monthly_fee":
		orderClause = fmt.Sprintf(" ORDER BY monthly_fee %s NULLS LAST, created_at DESC", sortOrder)
	case "medicine_cost":
		orderClause = fmt.Sprintf(" ORDER BY medicine_cost %s NULLS LAST, created_at DESC", sortOrder)
	case "available_beds":
		orderClause = fmt.Sprintf(" ORDER BY available_beds %s, created_at DESC", sortOrder)
	default:
		// Default: if location provided, sort by distance; otherwise by created_at
		if params.UserLatitude != nil && params.UserLongitude != nil {
			orderClause = " ORDER BY distance ASC NULLS LAST, created_at DESC"
		} else {
			orderClause = " ORDER BY created_at DESC"
		}
	}

	query := baseSelect + distanceSelect + whereClause + orderClause

	// Execute query
	rows, err := r.db.Query(query,
		params.Name,
		params.Address,
		params.HasAvailableBeds,
		nilIntToInterface(params.MinMonthlyFee),
		nilIntToInterface(params.MaxMonthlyFee),
		nilIntToInterface(params.MinMedicineCost),
		nilIntToInterface(params.MaxMedicineCost),
	)
	if err != nil {
		fmt.Printf("DEBUG SearchAdvanced query error: %v\n", err)
		return nil, fmt.Errorf("failed to search facilities: %w", err)
	}
	defer rows.Close()

	facilities := []*Facility{}
	for rows.Next() {
		facility := &Facility{}
		err := rows.Scan(
			&facility.ID, &facility.UserID, &facility.Name, &facility.Address,
			&facility.Phone, &facility.BedCapacity, &facility.AvailableBeds, &facility.AcceptanceConditions,
			&facility.Latitude, &facility.Longitude, &facility.MonthlyFee, &facility.MedicineCost,
			&facility.CreatedAt, &facility.UpdatedAt, &facility.Distance,
		)
		if err != nil {
			fmt.Printf("DEBUG SearchAdvanced scan error: %v\n", err)
			return nil, fmt.Errorf("failed to scan facility: %w", err)
		}
		facilities = append(facilities, facility)
	}

	// Load images for all facilities
	r.loadImagesForFacilities(facilities)

	return facilities, nil
}

func nilIntToInterface(v *int) interface{} {
	if v == nil {
		return nil
	}
	return *v
}

func (r *FacilityRepository) GetAll() ([]*Facility, error) {
	query := `
		SELECT id, user_id, name, COALESCE(address, '') as address, COALESCE(phone, '') as phone,
		       bed_capacity, available_beds, COALESCE(acceptance_conditions, '') as acceptance_conditions,
		       latitude, longitude, monthly_fee, medicine_cost, created_at, updated_at
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
			&facility.Latitude, &facility.Longitude, &facility.MonthlyFee, &facility.MedicineCost,
			&facility.CreatedAt, &facility.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan facility: %w", err)
		}
		facilities = append(facilities, facility)
	}

	// Load images for all facilities
	r.loadImagesForFacilities(facilities)

	return facilities, nil
}

func (r *FacilityRepository) loadImagesForFacilities(facilities []*Facility) {
	if len(facilities) == 0 {
		return
	}

	// Get all facility IDs
	ids := make([]int, len(facilities))
	facilityMap := make(map[int]*Facility)
	for i, f := range facilities {
		ids[i] = f.ID
		facilityMap[f.ID] = f
	}

	// Query all images for these facilities (only first image per facility for list view)
	query := `
		SELECT DISTINCT ON (facility_id) id, facility_id, image_url, COALESCE(image_type, 'exterior') as image_type,
		       sort_order, caption, created_at
		FROM facility_images
		WHERE facility_id = ANY($1)
		ORDER BY facility_id, sort_order ASC
	`
	rows, err := r.db.Query(query, pq.Array(ids))
	if err != nil {
		return // Silently fail - images are optional
	}
	defer rows.Close()

	for rows.Next() {
		img := &FacilityImage{}
		err := rows.Scan(&img.ID, &img.FacilityID, &img.ImageURL, &img.ImageType,
			&img.SortOrder, &img.Caption, &img.CreatedAt)
		if err != nil {
			continue
		}
		if f, ok := facilityMap[img.FacilityID]; ok {
			f.Images = append(f.Images, img)
		}
	}
}

func (r *FacilityRepository) GetAllWithEmail() ([]*FacilityWithEmail, error) {
	query := `
		SELECT f.id, f.user_id, u.email, f.name, COALESCE(f.address, '') as address, COALESCE(f.phone, '') as phone,
		       f.bed_capacity, f.available_beds, COALESCE(f.acceptance_conditions, '') as acceptance_conditions,
		       f.latitude, f.longitude, f.monthly_fee, f.medicine_cost, f.created_at, f.updated_at
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
			&facility.Latitude, &facility.Longitude, &facility.MonthlyFee, &facility.MedicineCost,
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
		    available_beds = $5, acceptance_conditions = $6,
		    latitude = $7, longitude = $8, monthly_fee = $9, medicine_cost = $10,
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $11
	`
	result, err := r.db.Exec(query, facility.Name, facility.Address, facility.Phone,
		facility.BedCapacity, facility.AvailableBeds, facility.AcceptanceConditions,
		facility.Latitude, facility.Longitude, facility.MonthlyFee, facility.MedicineCost,
		facility.ID)
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

// UpdateFacilityImages replaces all images for a facility with the provided list
func (r *FacilityRepository) UpdateFacilityImages(facilityID int, images []FacilityImageInput) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Delete existing images for this facility
	_, err = tx.Exec("DELETE FROM facility_images WHERE facility_id = $1", facilityID)
	if err != nil {
		return fmt.Errorf("failed to delete existing images: %w", err)
	}

	// Insert new images
	for i, img := range images {
		_, err = tx.Exec(`
			INSERT INTO facility_images (facility_id, image_url, image_type, sort_order, caption)
			VALUES ($1, $2, $3, $4, $5)
		`, facilityID, img.ImageURL, img.ImageType, i, img.Caption)
		if err != nil {
			return fmt.Errorf("failed to insert image: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// FacilityImageInput represents input for creating/updating facility images
type FacilityImageInput struct {
	ImageURL  string  `json:"image_url"`
	ImageType string  `json:"image_type"`
	Caption   *string `json:"caption,omitempty"`
}

// FacilityRoomType represents a room type with its capacity and availability
type FacilityRoomType struct {
	ID          int       `json:"id"`
	FacilityID  int       `json:"facility_id"`
	RoomType    string    `json:"room_type"`
	Capacity    int       `json:"capacity"`
	Available   int       `json:"available"`
	MonthlyFee  *int      `json:"monthly_fee,omitempty"`
	Description *string   `json:"description,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// FacilityRoomTypeInput represents input for creating/updating room types
type FacilityRoomTypeInput struct {
	RoomType    string  `json:"room_type" binding:"required"`
	Capacity    int     `json:"capacity" binding:"required,min=1"`
	Available   int     `json:"available" binding:"min=0"`
	MonthlyFee  *int    `json:"monthly_fee,omitempty"`
	Description *string `json:"description,omitempty"`
}

// GetRoomTypesByFacilityID returns all room types for a facility
func (r *FacilityRepository) GetRoomTypesByFacilityID(facilityID int) ([]*FacilityRoomType, error) {
	query := `
		SELECT id, facility_id, room_type, capacity, available,
		       monthly_fee, description, created_at, updated_at
		FROM facility_room_types
		WHERE facility_id = $1
		ORDER BY room_type ASC
	`
	rows, err := r.db.Query(query, facilityID)
	if err != nil {
		return nil, fmt.Errorf("failed to get room types: %w", err)
	}
	defer rows.Close()

	roomTypes := []*FacilityRoomType{}
	for rows.Next() {
		rt := &FacilityRoomType{}
		err := rows.Scan(&rt.ID, &rt.FacilityID, &rt.RoomType, &rt.Capacity,
			&rt.Available, &rt.MonthlyFee, &rt.Description, &rt.CreatedAt, &rt.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan room type: %w", err)
		}
		roomTypes = append(roomTypes, rt)
	}

	return roomTypes, nil
}

// UpdateRoomTypes replaces all room types for a facility
func (r *FacilityRepository) UpdateRoomTypes(facilityID int, roomTypes []FacilityRoomTypeInput) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Delete existing room types for this facility
	_, err = tx.Exec("DELETE FROM facility_room_types WHERE facility_id = $1", facilityID)
	if err != nil {
		return fmt.Errorf("failed to delete existing room types: %w", err)
	}

	// Insert new room types
	for _, rt := range roomTypes {
		// Validate: available cannot exceed capacity
		if rt.Available > rt.Capacity {
			return fmt.Errorf("available (%d) cannot exceed capacity (%d) for room type '%s'",
				rt.Available, rt.Capacity, rt.RoomType)
		}

		_, err = tx.Exec(`
			INSERT INTO facility_room_types (facility_id, room_type, capacity, available, monthly_fee, description)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, facilityID, rt.RoomType, rt.Capacity, rt.Available, rt.MonthlyFee, rt.Description)
		if err != nil {
			return fmt.Errorf("failed to insert room type: %w", err)
		}
	}

	// The trigger will automatically update facilities.available_beds
	// But we also need to update bed_capacity
	_, err = tx.Exec(`
		UPDATE facilities SET
			bed_capacity = (SELECT COALESCE(SUM(capacity), 0) FROM facility_room_types WHERE facility_id = $1),
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`, facilityID)
	if err != nil {
		return fmt.Errorf("failed to update facility bed_capacity: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}
