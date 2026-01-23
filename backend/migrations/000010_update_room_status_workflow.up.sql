-- Update message_rooms status values to new workflow
-- negotiating: 受け入れ検討中
-- accepted: 受け入れ承認済み（まだアクティブ）
-- completed: 受け入れ完了（インアクティブ）
-- rejected: 受け入れ拒否（インアクティブ）

-- Update existing 'active' status to 'negotiating'
UPDATE message_rooms SET status = 'negotiating' WHERE status = 'active';

-- Add check constraint for valid statuses
ALTER TABLE message_rooms DROP CONSTRAINT IF EXISTS message_rooms_status_check;
ALTER TABLE message_rooms ADD CONSTRAINT message_rooms_status_check 
    CHECK (status IN ('negotiating', 'accepted', 'completed', 'rejected'));
