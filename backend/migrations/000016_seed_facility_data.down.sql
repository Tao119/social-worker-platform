-- Remove seeded data
DELETE FROM facility_images;

-- Reset facility fields to defaults
UPDATE facilities SET
    facility_type = '介護施設',
    acceptance_conditions_json = '{}',
    description = NULL,
    contact_name = NULL,
    contact_hours = '9:00 - 17:00';
