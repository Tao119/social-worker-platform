-- メッセージルームの既読管理テーブル
CREATE TABLE message_read_status (
    id SERIAL PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES message_rooms(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, user_id)
);

-- リクエストの既読管理テーブル
CREATE TABLE request_read_status (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES placement_requests(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(request_id, user_id)
);

-- インデックス
CREATE INDEX idx_message_read_status_room_user ON message_read_status(room_id, user_id);
CREATE INDEX idx_message_read_status_last_read ON message_read_status(last_read_at);
CREATE INDEX idx_request_read_status_request_user ON request_read_status(request_id, user_id);
CREATE INDEX idx_request_read_status_last_read ON request_read_status(last_read_at);
