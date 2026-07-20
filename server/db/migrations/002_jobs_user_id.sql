-- Tie scraped jobs (and scrape runs) to the logged-in user.
-- Unique URL is per-user so two accounts can scrape the same listing.

ALTER TABLE scrape_runs
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS scrape_runs_user_idx
  ON scrape_runs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS jobs_user_idx
  ON jobs (user_id, updated_at DESC);

-- Replace global URL uniqueness with per-user uniqueness.
DROP INDEX IF EXISTS jobs_url_unique;

-- Orphan rows (pre-migration) cannot satisfy a NOT NULL + unique constraint;
-- remove them so every remaining job belongs to a user going forward.
DELETE FROM jobs WHERE user_id IS NULL;
DELETE FROM scrape_runs WHERE user_id IS NULL;

ALTER TABLE jobs
  ALTER COLUMN user_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS jobs_user_url_unique
  ON jobs (user_id, url);
