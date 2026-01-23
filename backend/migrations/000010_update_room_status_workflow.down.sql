-- Revert status changes
UPDATE message_rooms SET status = 'active' WHERE status = 'negotiating';

-- Remove check constraint
ALTER TABLE message_rooms DROP CONSTRAINT IF EXISTS message_rooms_status_check;
