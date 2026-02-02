-- Add completion flags to message_rooms table
ALTER TABLE message_rooms 
ADD COLUMN hospital_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN facility_completed BOOLEAN DEFAULT FALSE;

-- Add index for completion status
CREATE INDEX idx_message_rooms_completion ON message_rooms(hospital_completed, facility_completed);
