CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE message_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id INTEGER NOT NULL REFERENCES placement_requests(id) ON DELETE CASCADE UNIQUE,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    facility_id INTEGER NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'accepted', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_message_rooms_hospital ON message_rooms(hospital_id);
CREATE INDEX idx_message_rooms_facility ON message_rooms(facility_id);
CREATE INDEX idx_message_rooms_request ON message_rooms(request_id);
