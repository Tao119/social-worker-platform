-- Remove folder column from documents table
DROP INDEX IF EXISTS idx_documents_folder;

ALTER TABLE documents 
DROP COLUMN IF EXISTS folder;
