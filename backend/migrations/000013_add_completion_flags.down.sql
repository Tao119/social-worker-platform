-- Remove completion flags from message_rooms table
DROP INDEX IF EXISTS idx_message_rooms_completion;

ALTER TABLE message_rooms 
DROP COLUMN IF EXISTS hospital_completed,
DROP COLUMN IF EXISTS facility_completed;
