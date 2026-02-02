-- Rollback: Remove location and cost fields from facilities table
DROP INDEX IF EXISTS idx_facilities_location;
DROP INDEX IF EXISTS idx_facilities_medicine_cost;
DROP INDEX IF EXISTS idx_facilities_monthly_fee;

ALTER TABLE facilities DROP COLUMN IF EXISTS medicine_cost;
ALTER TABLE facilities DROP COLUMN IF EXISTS monthly_fee;
ALTER TABLE facilities DROP COLUMN IF EXISTS longitude;
ALTER TABLE facilities DROP COLUMN IF EXISTS latitude;
