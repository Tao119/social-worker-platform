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
	// For room list view
	LatestMessage       string    `json:"latest_message,omitempty"`
	LatestMessageAt     *time.Time `json:"latest_message_at,omitempty"`
	HasUnread           bool      `json:"has_unread"`
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

// GetMessageRoomByID retrieves a message room by ID with patient info
func GetMessageRoomByID(db *sql.DB, id string) (*MessageRoom, error) {
	room := &MessageRoom{}
	query := `
		SELECT
			mr.id, mr.request_id, mr.hospital_id, mr.facility_id, mr.status,
			mr.hospital_completed, mr.facility_completed, mr.created_at, mr.updated_at,
			h.name as hospital_name,
			f.name as facility_name,
			COALESCE(pr.patient_age, 0) as patient_age,
			COALESCE(pr.patient_gender, '') as patient_gender,
			COALESCE(pr.medical_condition, '') as medical_condition
		FROM message_rooms mr
		JOIN hospitals h ON mr.hospital_id = h.id
		JOIN facilities f ON mr.facility_id = f.id
		LEFT JOIN placement_requests pr ON mr.request_id = pr.id
		WHERE mr.id = $1
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
		&room.HospitalName,
		&room.FacilityName,
		&room.PatientAge,
		&room.PatientGender,
		&room.MedicalCondition,
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

// GetMessageRoomsByHospitalID retrieves all message rooms for a hospital with latest message and unread status
func GetMessageRoomsByHospitalID(db *sql.DB, hospitalID int, userID int) ([]*MessageRoom, error) {
	query := `
		SELECT
			mr.id, mr.request_id, mr.hospital_id, mr.facility_id, mr.status,
			mr.hospital_completed, mr.facility_completed, mr.created_at, mr.updated_at,
			h.name as hospital_name,
			f.name as facility_name,
			COALESCE(pr.patient_age, 0) as patient_age,
			COALESCE(pr.patient_gender, '') as patient_gender,
			COALESCE(pr.medical_condition, '') as medical_condition,
			COALESCE((
				SELECT message_text FROM messages
				WHERE room_id = mr.id
				ORDER BY created_at DESC
				LIMIT 1
			), '') as latest_message,
			(
				SELECT created_at FROM messages
				WHERE room_id = mr.id
				ORDER BY created_at DESC
				LIMIT 1
			) as latest_message_at,
			EXISTS (
				SELECT 1 FROM messages m
				LEFT JOIN message_read_status mrs ON mr.id = mrs.room_id AND mrs.user_id = $2
				WHERE m.room_id = mr.id
				AND m.sender_id != $2
				AND (mrs.last_read_at IS NULL OR m.created_at > mrs.last_read_at)
			) as has_unread
		FROM message_rooms mr
		JOIN hospitals h ON mr.hospital_id = h.id
		JOIN facilities f ON mr.facility_id = f.id
		LEFT JOIN placement_requests pr ON mr.request_id = pr.id
		WHERE mr.hospital_id = $1
		ORDER BY COALESCE((SELECT created_at FROM messages WHERE room_id = mr.id ORDER BY created_at DESC LIMIT 1), mr.created_at) DESC
	`
	rows, err := db.Query(query, hospitalID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rooms []*MessageRoom
	for rows.Next() {
		room := &MessageRoom{}
		var latestMessageAt sql.NullTime
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
			&room.LatestMessage,
			&latestMessageAt,
			&room.HasUnread,
		)
		if err != nil {
			return nil, err
		}
		if latestMessageAt.Valid {
			room.LatestMessageAt = &latestMessageAt.Time
		}
		rooms = append(rooms, room)
	}

	return rooms, rows.Err()
}

// GetMessageRoomsByFacilityID retrieves all message rooms for a facility with latest message and unread status
func GetMessageRoomsByFacilityID(db *sql.DB, facilityID int, userID int) ([]*MessageRoom, error) {
	query := `
		SELECT
			mr.id, mr.request_id, mr.hospital_id, mr.facility_id, mr.status,
			mr.hospital_completed, mr.facility_completed, mr.created_at, mr.updated_at,
			h.name as hospital_name,
			f.name as facility_name,
			COALESCE(pr.patient_age, 0) as patient_age,
			COALESCE(pr.patient_gender, '') as patient_gender,
			COALESCE(pr.medical_condition, '') as medical_condition,
			COALESCE((
				SELECT message_text FROM messages
				WHERE room_id = mr.id
				ORDER BY created_at DESC
				LIMIT 1
			), '') as latest_message,
			(
				SELECT created_at FROM messages
				WHERE room_id = mr.id
				ORDER BY created_at DESC
				LIMIT 1
			) as latest_message_at,
			EXISTS (
				SELECT 1 FROM messages m
				LEFT JOIN message_read_status mrs ON mr.id = mrs.room_id AND mrs.user_id = $2
				WHERE m.room_id = mr.id
				AND m.sender_id != $2
				AND (mrs.last_read_at IS NULL OR m.created_at > mrs.last_read_at)
			) as has_unread
		FROM message_rooms mr
		JOIN hospitals h ON mr.hospital_id = h.id
		JOIN facilities f ON mr.facility_id = f.id
		LEFT JOIN placement_requests pr ON mr.request_id = pr.id
		WHERE mr.facility_id = $1
		ORDER BY COALESCE((SELECT created_at FROM messages WHERE room_id = mr.id ORDER BY created_at DESC LIMIT 1), mr.created_at) DESC
	`
	rows, err := db.Query(query, facilityID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rooms []*MessageRoom
	for rows.Next() {
		room := &MessageRoom{}
		var latestMessageAt sql.NullTime
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
			&room.LatestMessage,
			&latestMessageAt,
			&room.HasUnread,
		)
		if err != nil {
			return nil, err
		}
		if latestMessageAt.Valid {
			room.LatestMessageAt = &latestMessageAt.Time
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
