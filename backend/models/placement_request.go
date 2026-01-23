package models

import (
	"database/sql"
	"log"
	"time"
)

type PlacementRequest struct {
	ID               int        `json:"id"`
	HospitalID       int        `json:"hospital_id"`
	FacilityID       int        `json:"facility_id"`
	PatientAge       int        `json:"patient_age"`
	PatientGender    string     `json:"patient_gender"`
	MedicalCondition string     `json:"medical_condition"`
	Status           string     `json:"status"`
	RoomID           *string    `json:"room_id,omitempty"`
	HospitalName     string     `json:"hospital_name,omitempty"`
	FacilityName     string     `json:"facility_name,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

// CreatePlacementRequest creates a new placement request
func CreatePlacementRequest(db *sql.DB, req *PlacementRequest) error {
	query := `
		INSERT INTO placement_requests (hospital_id, facility_id, patient_age, patient_gender, medical_condition, status)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`
	err := db.QueryRow(
		query,
		req.HospitalID,
		req.FacilityID,
		req.PatientAge,
		req.PatientGender,
		req.MedicalCondition,
		req.Status,
	).Scan(&req.ID, &req.CreatedAt, &req.UpdatedAt)
	
	return err
}

// GetPlacementRequestByID retrieves a placement request by ID
func GetPlacementRequestByID(db *sql.DB, id int) (*PlacementRequest, error) {
	req := &PlacementRequest{}
	query := `
		SELECT pr.id, pr.hospital_id, pr.facility_id, pr.patient_age, pr.patient_gender, pr.medical_condition, pr.status, pr.created_at, pr.updated_at, mr.id as room_id, h.name as hospital_name, f.name as facility_name
		FROM placement_requests pr LEFT JOIN message_rooms mr ON pr.id = mr.request_id LEFT JOIN hospitals h ON pr.hospital_id = h.id LEFT JOIN facilities f ON pr.facility_id = f.id
		WHERE pr.id = $1
	`
	err := db.QueryRow(query, id).Scan(
		&req.ID,
		&req.HospitalID,
		&req.FacilityID,
		&req.PatientAge,
		&req.PatientGender,
		&req.MedicalCondition,
		&req.Status,
		&req.CreatedAt,
		&req.UpdatedAt,
		&req.RoomID,
		&req.HospitalName,
		&req.FacilityName,
	)
	
	if err == sql.ErrNoRows {
		return nil, nil
	}
	
	return req, err
}

// GetPlacementRequestsByHospitalID retrieves all placement requests for a hospital
func GetPlacementRequestsByHospitalID(db *sql.DB, hospitalID int) ([]*PlacementRequest, error) {
	query := `
		SELECT 
			pr.id, pr.hospital_id, pr.facility_id, pr.patient_age, pr.patient_gender, 
			pr.medical_condition, pr.status, pr.created_at, pr.updated_at,
			h.name as hospital_name,
			f.name as facility_name,
			mr.id as room_id
		FROM placement_requests pr
		JOIN hospitals h ON pr.hospital_id = h.id
		JOIN facilities f ON pr.facility_id = f.id
		LEFT JOIN message_rooms mr ON pr.id = mr.request_id
		WHERE pr.hospital_id = $1
		ORDER BY pr.created_at DESC
	`
	rows, err := db.Query(query, hospitalID)
	if err != nil {
		log.Printf("Error querying placement requests: %v", err)
		return nil, err
	}
	defer rows.Close()
	
	var requests []*PlacementRequest
	for rows.Next() {
		req := &PlacementRequest{}
		err := rows.Scan(
			&req.ID,
			&req.HospitalID,
			&req.FacilityID,
			&req.PatientAge,
			&req.PatientGender,
			&req.MedicalCondition,
			&req.Status,
			&req.CreatedAt,
			&req.UpdatedAt,
			&req.HospitalName,
			&req.FacilityName,
			&req.RoomID,
		)
		if err != nil {
			log.Printf("Error scanning placement request row: %v", err)
			return nil, err
		}
		requests = append(requests, req)
	}
	
	if err := rows.Err(); err != nil {
		log.Printf("Error iterating placement request rows: %v", err)
		return nil, err
	}
	
	log.Printf("Successfully fetched %d requests for hospital %d", len(requests), hospitalID)
	return requests, nil
}

// GetPlacementRequestsByFacilityID retrieves all placement requests for a facility
func GetPlacementRequestsByFacilityID(db *sql.DB, facilityID int) ([]*PlacementRequest, error) {
	query := `
		SELECT 
			pr.id, pr.hospital_id, pr.facility_id, pr.patient_age, pr.patient_gender, 
			pr.medical_condition, pr.status, pr.created_at, pr.updated_at,
			h.name as hospital_name,
			f.name as facility_name,
			mr.id as room_id
		FROM placement_requests pr
		JOIN hospitals h ON pr.hospital_id = h.id
		JOIN facilities f ON pr.facility_id = f.id
		LEFT JOIN message_rooms mr ON pr.id = mr.request_id
		WHERE pr.facility_id = $1
		ORDER BY pr.created_at DESC
	`
	rows, err := db.Query(query, facilityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var requests []*PlacementRequest
	for rows.Next() {
		req := &PlacementRequest{}
		err := rows.Scan(
			&req.ID,
			&req.HospitalID,
			&req.FacilityID,
			&req.PatientAge,
			&req.PatientGender,
			&req.MedicalCondition,
			&req.Status,
			&req.CreatedAt,
			&req.UpdatedAt,
			&req.HospitalName,
			&req.FacilityName,
			&req.RoomID,
		)
		if err != nil {
			return nil, err
		}
		requests = append(requests, req)
	}
	
	return requests, rows.Err()
}

// UpdatePlacementRequestStatus updates the status of a placement request
func UpdatePlacementRequestStatus(db *sql.DB, id int, status string) error {
	query := `
		UPDATE placement_requests
		SET status = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2
	`
	result, err := db.Exec(query, status, id)
	if err != nil {
		return err
	}
	
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	
	if rows == 0 {
		return sql.ErrNoRows
	}
	
	return nil
}

// UpdatePlacementRequest updates a placement request
func UpdatePlacementRequest(db *sql.DB, id int, patientAge int, patientGender string, medicalCondition string) error {
	query := `
		UPDATE placement_requests
		SET patient_age = $1, patient_gender = $2, medical_condition = $3, updated_at = CURRENT_TIMESTAMP
		WHERE id = $4
	`
	result, err := db.Exec(query, patientAge, patientGender, medicalCondition, id)
	if err != nil {
		return err
	}
	
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	
	if rows == 0 {
		return sql.ErrNoRows
	}
	
	return nil
}

// DeletePlacementRequest deletes a placement request
func DeletePlacementRequest(db *sql.DB, id int) error {
	query := `DELETE FROM placement_requests WHERE id = $1`
	result, err := db.Exec(query, id)
	if err != nil {
		return err
	}
	
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	
	if rows == 0 {
		return sql.ErrNoRows
	}
	
	return nil
}
