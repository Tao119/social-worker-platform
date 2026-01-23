CREATE TABLE room_files (
    id SERIAL PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES message_rooms(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_room_files_room ON room_files(room_id);
CREATE INDEX idx_room_files_sender ON room_files(sender_id);
CREATE INDEX idx_room_files_created_at ON room_files(created_at);
