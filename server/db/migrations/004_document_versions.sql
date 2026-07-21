-- 004_document_versions: create user_document_versions table for resume/cover letter history
CREATE TABLE IF NOT EXISTS user_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES user_documents(id) ON DELETE CASCADE,
  content_text TEXT NOT NULL,
  version_label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_document_versions_doc_idx
  ON user_document_versions (document_id, created_at DESC);
