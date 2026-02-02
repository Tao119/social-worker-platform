package models

import (
	"database/sql"
	"time"
)

// UnreadCounts represents the unread counts for a user
type UnreadCounts struct {
	Messages int `json:"messages"` // Number of rooms with unread messages
	Requests int `json:"requests"` // Number of unread requests
}

// MessageReadStatus represents the read status of a message room for a user
type MessageReadStatus struct {
	ID         int       `json:"id"`
	RoomID     string    `json:"room_id"`
	UserID     int       `json:"user_id"`
	LastReadAt time.Time `json:"last_read_at"`
}

// RequestReadStatus represents the read status of a placement request for a user
type RequestReadStatus struct {
	ID         int       `json:"id"`
	RequestID  int       `json:"request_id"`
	UserID     int       `json:"user_id"`
	LastReadAt time.Time `json:"last_read_at"`
}

// GetUnreadMessageCount returns the number of message rooms with unread messages or files for a user
// For hospital users: counts rooms where hospital_id matches and there are new messages/files after last_read_at
// For facility users: counts rooms where facility_id matches and there are new messages/files after last_read_at
func GetUnreadMessageCount(db *sql.DB, userID int, role string, entityID int) (int, error) {
	var query string

	if role == "hospital" {
		query = `
			SELECT COUNT(DISTINCT mr.id)
			FROM message_rooms mr
			LEFT JOIN message_read_status mrs ON mr.id = mrs.room_id AND mrs.user_id = $1
			WHERE mr.hospital_id = $2
			AND (
				EXISTS (
					SELECT 1 FROM messages m
					WHERE m.room_id = mr.id
					AND m.sender_id != $1
					AND (mrs.last_read_at IS NULL OR m.created_at > mrs.last_read_at)
				)
				OR EXISTS (
					SELECT 1 FROM room_files rf
					WHERE rf.room_id = mr.id
					AND rf.sender_id != $1
					AND (mrs.last_read_at IS NULL OR rf.created_at > mrs.last_read_at)
				)
			)
		`
	} else if role == "facility" {
		query = `
			SELECT COUNT(DISTINCT mr.id)
			FROM message_rooms mr
			LEFT JOIN message_read_status mrs ON mr.id = mrs.room_id AND mrs.user_id = $1
			WHERE mr.facility_id = $2
			AND (
				EXISTS (
					SELECT 1 FROM messages m
					WHERE m.room_id = mr.id
					AND m.sender_id != $1
					AND (mrs.last_read_at IS NULL OR m.created_at > mrs.last_read_at)
				)
				OR EXISTS (
					SELECT 1 FROM room_files rf
					WHERE rf.room_id = mr.id
					AND rf.sender_id != $1
					AND (mrs.last_read_at IS NULL OR rf.created_at > mrs.last_read_at)
				)
			)
		`
	} else {
		return 0, nil
	}

	var count int
	err := db.QueryRow(query, userID, entityID).Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

// GetUnreadRequestCount returns the number of unread placement requests for a user
// For facility users: counts pending requests that haven't been read
// For hospital users: counts requests with status changes (accepted/rejected) that haven't been read
func GetUnreadRequestCount(db *sql.DB, userID int, role string, entityID int) (int, error) {
	var query string

	if role == "facility" {
		// Facility: count new pending requests
		query = `
			SELECT COUNT(DISTINCT pr.id)
			FROM placement_requests pr
			LEFT JOIN request_read_status rrs ON pr.id = rrs.request_id AND rrs.user_id = $1
			WHERE pr.facility_id = $2
			AND pr.status = 'pending'
			AND (rrs.last_read_at IS NULL OR pr.updated_at > rrs.last_read_at)
		`
	} else if role == "hospital" {
		// Hospital: count requests with status changes (accepted/rejected)
		query = `
			SELECT COUNT(DISTINCT pr.id)
			FROM placement_requests pr
			LEFT JOIN request_read_status rrs ON pr.id = rrs.request_id AND rrs.user_id = $1
			WHERE pr.hospital_id = $2
			AND pr.status IN ('accepted', 'rejected')
			AND (rrs.last_read_at IS NULL OR pr.updated_at > rrs.last_read_at)
		`
	} else {
		return 0, nil
	}

	var count int
	err := db.QueryRow(query, userID, entityID).Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

// GetUnreadCounts returns all unread counts for a user
func GetUnreadCounts(db *sql.DB, userID int, role string, entityID int) (*UnreadCounts, error) {
	messages, err := GetUnreadMessageCount(db, userID, role, entityID)
	if err != nil {
		return nil, err
	}

	requests, err := GetUnreadRequestCount(db, userID, role, entityID)
	if err != nil {
		return nil, err
	}

	return &UnreadCounts{
		Messages: messages,
		Requests: requests,
	}, nil
}

// MarkRoomAsRead marks a message room as read for a user
func MarkRoomAsRead(db *sql.DB, roomID string, userID int) error {
	query := `
		INSERT INTO message_read_status (room_id, user_id, last_read_at)
		VALUES ($1, $2, CURRENT_TIMESTAMP)
		ON CONFLICT (room_id, user_id)
		DO UPDATE SET last_read_at = CURRENT_TIMESTAMP
	`
	_, err := db.Exec(query, roomID, userID)
	return err
}

// MarkRequestAsRead marks a placement request as read for a user
func MarkRequestAsRead(db *sql.DB, requestID int, userID int) error {
	query := `
		INSERT INTO request_read_status (request_id, user_id, last_read_at)
		VALUES ($1, $2, CURRENT_TIMESTAMP)
		ON CONFLICT (request_id, user_id)
		DO UPDATE SET last_read_at = CURRENT_TIMESTAMP
	`
	_, err := db.Exec(query, requestID, userID)
	return err
}

// MarkAllRequestsAsRead marks all requests as read for a user
func MarkAllRequestsAsRead(db *sql.DB, userID int, role string, entityID int) error {
	var query string

	if role == "facility" {
		query = `
			INSERT INTO request_read_status (request_id, user_id, last_read_at)
			SELECT pr.id, $1, CURRENT_TIMESTAMP
			FROM placement_requests pr
			WHERE pr.facility_id = $2
			ON CONFLICT (request_id, user_id)
			DO UPDATE SET last_read_at = CURRENT_TIMESTAMP
		`
	} else if role == "hospital" {
		query = `
			INSERT INTO request_read_status (request_id, user_id, last_read_at)
			SELECT pr.id, $1, CURRENT_TIMESTAMP
			FROM placement_requests pr
			WHERE pr.hospital_id = $2
			ON CONFLICT (request_id, user_id)
			DO UPDATE SET last_read_at = CURRENT_TIMESTAMP
		`
	} else {
		return nil
	}

	_, err := db.Exec(query, userID, entityID)
	return err
}
