-- Tie uploaded/builder documents to a user; uploaded files replace per type.
ALTER TABLE user_documents
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS user_documents_user_type_idx
  ON user_documents (user_id, doc_type, updated_at DESC);

-- One "uploaded" resume/cover letter per user (builder JSON docs are excluded).
-- Partial unique index so re-uploads can upsert safely.
DROP INDEX IF EXISTS user_documents_upload_unique;
CREATE UNIQUE INDEX IF NOT EXISTS user_documents_upload_unique
  ON user_documents (user_id, doc_type)
  WHERE user_id IS NOT NULL
    AND mime_type IS DISTINCT FROM 'application/json';
