package models

import (
	"database/sql"
	"time"
)

type Message struct {
	ID          int       `json:"id"`
	RoomID      string    `json:"room_id"`
	SenderID    int       `json:"sender_id"`
	MessageText string    `json:"message_text"`
	CreatedAt   time.Time `json:"created_at"`
}

// CreateMessage creates a new message
func CreateMessage(db *sql.DB, msg *Message) error {
	query := `
		INSERT INTO messages (room_id, sender_id, message_text)
		VALUES ($1, $2, $3)
		RETURNING id, created_at
	`
	err := db.QueryRow(
		query,
		msg.RoomID,
		msg.SenderID,
		msg.MessageText,
	).Scan(&msg.ID, &msg.CreatedAt)
	
	return err
}

// GetMessagesByRoomID retrieves all messages for a room
func GetMessagesByRoomID(db *sql.DB, roomID string) ([]*Message, error) {
	query := `
		SELECT id, room_id, sender_id, message_text, created_at
		FROM messages
		WHERE room_id = $1
		ORDER BY created_at ASC
	`
	rows, err := db.Query(query, roomID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var messages []*Message
	for rows.Next() {
		msg := &Message{}
		err := rows.Scan(
			&msg.ID,
			&msg.RoomID,
			&msg.SenderID,
			&msg.MessageText,
			&msg.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}
	
	return messages, rows.Err()
}
