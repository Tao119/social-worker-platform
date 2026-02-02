-- Revert addresses to NULL (no specific rollback as original data is unknown)
-- This is a placeholder - in production, you would need to restore from backup
UPDATE facilities SET
    address = NULL,
    latitude = NULL,
    longitude = NULL
WHERE id <= 20;
