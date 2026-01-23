package models

import (
	"database/sql"
	"time"
)

type RoomFile struct {
	ID        int       `json:"id"`
	RoomID    string    `json:"room_id"`
	SenderID  int       `json:"sender_id"`
	FileName  string    `json:"file_name"`
	FilePath  string    `json:"file_path"`
	FileType  string    `json:"file_type"`
	FileSize  int64     `json:"file_size"`
	CreatedAt time.Time `json:"created_at"`
}

// CreateRoomFile creates a new room file
func CreateRoomFile(db *sql.DB, file *RoomFile) error {
	query := `
		INSERT INTO room_files (room_id, sender_id, file_name, file_path, file_type, file_size)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`
	err := db.QueryRow(
		query,
		file.RoomID,
		file.SenderID,
		file.FileName,
		file.FilePath,
		file.FileType,
		file.FileSize,
	).Scan(&file.ID, &file.CreatedAt)
	
	return err
}

// GetRoomFilesByRoomID retrieves all files for a room
func GetRoomFilesByRoomID(db *sql.DB, roomID string) ([]*RoomFile, error) {
	query := `
		SELECT id, room_id, sender_id, file_name, file_path, file_type, file_size, created_at
		FROM room_files
		WHERE room_id = $1
		ORDER BY created_at ASC
	`
	rows, err := db.Query(query, roomID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var files []*RoomFile
	for rows.Next() {
		file := &RoomFile{}
		err := rows.Scan(
			&file.ID,
			&file.RoomID,
			&file.SenderID,
			&file.FileName,
			&file.FilePath,
			&file.FileType,
			&file.FileSize,
			&file.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		files = append(files, file)
	}
	
	return files, rows.Err()
}

// GetRoomFileByID retrieves a file by ID
func GetRoomFileByID(db *sql.DB, id int) (*RoomFile, error) {
	file := &RoomFile{}
	query := `
		SELECT id, room_id, sender_id, file_name, file_path, file_type, file_size, created_at
		FROM room_files
		WHERE id = $1
	`
	err := db.QueryRow(query, id).Scan(
		&file.ID,
		&file.RoomID,
		&file.SenderID,
		&file.FileName,
		&file.FilePath,
		&file.FileType,
		&file.FileSize,
		&file.CreatedAt,
	)
	
	if err == sql.ErrNoRows {
		return nil, nil
	}
	
	return file, err
}

// DeleteRoomFile deletes a file by ID
func DeleteRoomFile(db *sql.DB, id int) error {
	query := `DELETE FROM room_files WHERE id = $1`
	result, err := db.Exec(query, id)
	if err != nil {
		return err
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	
	return nil
}
