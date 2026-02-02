-- Add facility_type and acceptance_conditions_json to facilities table
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS facility_type VARCHAR(50) DEFAULT '介護施設';
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS acceptance_conditions_json JSONB DEFAULT '{}';
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS contact_name VARCHAR(100);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS contact_hours VARCHAR(100) DEFAULT '9:00 - 17:00';

-- Create facility_images table
CREATE TABLE IF NOT EXISTS facility_images (
    id SERIAL PRIMARY KEY,
    facility_id INTEGER REFERENCES facilities(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type VARCHAR(50) DEFAULT 'exterior',  -- exterior, interior, room, dining, bath, etc.
    sort_order INTEGER DEFAULT 0,
    caption TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_facility_images_facility_id ON facility_images(facility_id);

-- Add comments for documentation
COMMENT ON COLUMN facilities.facility_type IS '施設種別（介護施設、特養、老健、グループホーム等）';
COMMENT ON COLUMN facilities.acceptance_conditions_json IS '受け入れ条件（JSON形式）';
COMMENT ON COLUMN facilities.description IS '施設説明';
COMMENT ON COLUMN facilities.contact_name IS '相談員名';
COMMENT ON COLUMN facilities.contact_hours IS '受付時間';
COMMENT ON TABLE facility_images IS '施設画像';
