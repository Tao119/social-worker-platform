-- Remove facility_images table
DROP TABLE IF EXISTS facility_images;

-- Remove columns from facilities
ALTER TABLE facilities DROP COLUMN IF EXISTS facility_type;
ALTER TABLE facilities DROP COLUMN IF EXISTS acceptance_conditions_json;
ALTER TABLE facilities DROP COLUMN IF EXISTS description;
ALTER TABLE facilities DROP COLUMN IF EXISTS contact_name;
ALTER TABLE facilities DROP COLUMN IF EXISTS contact_hours;
