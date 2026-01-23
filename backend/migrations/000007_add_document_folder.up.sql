-- Add folder column to documents table
ALTER TABLE documents 
ADD COLUMN folder VARCHAR(255) DEFAULT '';

-- Add index for folder
CREATE INDEX idx_documents_folder ON documents(folder);
