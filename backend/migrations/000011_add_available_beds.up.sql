-- Add available_beds column to facilities table
ALTER TABLE facilities ADD COLUMN available_beds INTEGER NOT NULL DEFAULT 0;

-- Add comment
COMMENT ON COLUMN facilities.available_beds IS '現在の空き病床数';
