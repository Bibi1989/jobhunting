-- 006_favorites: star/favorite for builder documents and portfolios
ALTER TABLE user_documents
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE portfolios
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS user_documents_user_favorite_idx
  ON user_documents (user_id, is_favorite)
  WHERE is_favorite = TRUE;

CREATE INDEX IF NOT EXISTS portfolios_user_favorite_idx
  ON portfolios (user_id, is_favorite)
  WHERE is_favorite = TRUE;
