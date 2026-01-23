package models

import (
	"database/sql"
	"time"
)

type MessageRoom struct {
	ID                  string    `json:"id"`
	RequestID           int       `json:"request_id"`
	HospitalID          int       `json:"hospital_id"`
	FacilityID          int       `json:"facility_id"`
	Status              string    `json:"status"`
	HospitalCompleted   bool      `json:"hospital_completed"`
	FacilityCompleted   bool      `json:"facility_completed"`
	HospitalName        string    `json:"hospital_name,omitempty"`
	FacilityName        string    `json:"facility_name,omitempty"`
	PatientAge          int       `json:"patient_age,omitempty"`
	PatientGender       string    `json:"patient_gender,omitempty"`
	MedicalCondition    string    `json:"medical_condition,omitempty"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

// CreateMessageRoom creates a new message room
func CreateMessageRoom(db *sql.DB, room *MessageRoom) error {
	query := `
		INSERT INTO message_rooms (request_id, hospital_id, facility_id, status)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at
	`
	err := db.QueryRow(
		query,
		room.RequestID,
		room.HospitalID,
		room.FacilityID,
		room.Status,
	).Scan(&room.ID, &room.CreatedAt, &room.UpdatedAt)
	
	return err
}

// GetMessageRoomByID retrieves a message room by ID
func GetMessageRoomByID(db *sql.DB, id string) (*MessageRoom, error) {
	room := &MessageRoom{}
	query := `
		SELECT id, request_id, hospital_id, facility_id, status, hospital_completed, facility_completed, created_at, updated_at
		FROM message_rooms
		WHERE id = $1
	`
	err := db.QueryRow(query, id).Scan(
		&room.ID,
		&room.RequestID,
		&room.HospitalID,
		&room.FacilityID,
		&room.Status,
		&room.HospitalCompleted,
		&room.FacilityCompleted,
		&room.CreatedAt,
		&room.UpdatedAt,
	)
	
	if err == sql.ErrNoRows {
		return nil, nil
	}
	
	return room, err
}

// GetMessageRoomByRequestID retrieves a message room by request ID
func GetMessageRoomByRequestID(db *sql.DB, requestID int) (*MessageRoom, error) {
	room := &MessageRoom{}
	query := `
		SELECT id, request_id, hospital_id, facility_id, status, created_at, updated_at
		FROM message_rooms
		WHERE request_id = $1
	`
	err := db.QueryRow(query, requestID).Scan(
		&room.ID,
		&room.RequestID,
		&room.HospitalID,
		&room.FacilityID,
		&room.Status,
		&room.CreatedAt,
		&room.UpdatedAt,
	)
	
	if err == sql.ErrNoRows {
		return nil, nil
	}
	
	return room, err
}

// GetMessageRoomsByHospitalID retrieves all message rooms for a hospital
func GetMessageRoomsByHospitalID(db *sql.DB, hospitalID int) ([]*MessageRoom, error) {
	query := `
		SELECT 
			mr.id, mr.request_id, mr.hospital_id, mr.facility_id, mr.status, 
			mr.hospital_completed, mr.facility_completed, mr.created_at, mr.updated_at,
			h.name as hospital_name,
			f.name as facility_name,
			pr.patient_age,
			pr.patient_gender,
			pr.medical_condition
		FROM message_rooms mr
		JOIN hospitals h ON mr.hospital_id = h.id
		JOIN facilities f ON mr.facility_id = f.id
		JOIN placement_requests pr ON mr.request_id = pr.id
		WHERE mr.hospital_id = $1
		ORDER BY mr.created_at DESC
	`
	rows, err := db.Query(query, hospitalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var rooms []*MessageRoom
	for rows.Next() {
		room := &MessageRoom{}
		err := rows.Scan(
			&room.ID,
			&room.RequestID,
			&room.HospitalID,
			&room.FacilityID,
			&room.Status,
			&room.HospitalCompleted,
			&room.FacilityCompleted,
			&room.CreatedAt,
			&room.UpdatedAt,
			&room.HospitalName,
			&room.FacilityName,
			&room.PatientAge,
			&room.PatientGender,
			&room.MedicalCondition,
		)
		if err != nil {
			return nil, err
		}
		rooms = append(rooms, room)
	}
	
	return rooms, rows.Err()
}

// GetMessageRoomsByFacilityID retrieves all message rooms for a facility
func GetMessageRoomsByFacilityID(db *sql.DB, facilityID int) ([]*MessageRoom, error) {
	query := `
		SELECT 
			mr.id, mr.request_id, mr.hospital_id, mr.facility_id, mr.status, 
			mr.hospital_completed, mr.facility_completed, mr.created_at, mr.updated_at,
			h.name as hospital_name,
			f.name as facility_name,
			pr.patient_age,
			pr.patient_gender,
			pr.medical_condition
		FROM message_rooms mr
		JOIN hospitals h ON mr.hospital_id = h.id
		JOIN facilities f ON mr.facility_id = f.id
		JOIN placement_requests pr ON mr.request_id = pr.id
		WHERE mr.facility_id = $1
		ORDER BY mr.created_at DESC
	`
	rows, err := db.Query(query, facilityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var rooms []*MessageRoom
	for rows.Next() {
		room := &MessageRoom{}
		err := rows.Scan(
			&room.ID,
			&room.RequestID,
			&room.HospitalID,
			&room.FacilityID,
			&room.Status,
			&room.HospitalCompleted,
			&room.FacilityCompleted,
			&room.CreatedAt,
			&room.UpdatedAt,
			&room.HospitalName,
			&room.FacilityName,
			&room.PatientAge,
			&room.PatientGender,
			&room.MedicalCondition,
		)
		if err != nil {
			return nil, err
		}
		rooms = append(rooms, room)
	}
	
	return rooms, rows.Err()
}

// UpdateMessageRoomStatus updates the status of a message room
func UpdateMessageRoomStatus(db *sql.DB, id string, status string) error {
	query := `
		UPDATE message_rooms
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

// UpdateHospitalCompletion updates the hospital completion flag
func UpdateHospitalCompletion(db *sql.DB, id string, completed bool) error {
	query := `
		UPDATE message_rooms
		SET hospital_completed = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2
	`
	result, err := db.Exec(query, completed, id)
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

// UpdateFacilityCompletion updates the facility completion flag
func UpdateFacilityCompletion(db *sql.DB, id string, completed bool) error {
	query := `
		UPDATE message_rooms
		SET facility_completed = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2
	`
	result, err := db.Exec(query, completed, id)
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
