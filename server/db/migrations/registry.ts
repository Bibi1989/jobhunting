/**
 * SQL migrations embedded as strings so Nitro/Netlify serverless
 * does not depend on import.meta.glob or a filesystem path at runtime.
 * Source of truth remains the *.sql files in this folder — regenerate with:
 *   node scripts/embed-migrations.cjs
 */
export type EmbeddedMigration = { id: string; sql: string }

export const NUXT_MIGRATIONS: EmbeddedMigration[] = [
  {
    id: "001_initial.sql",
    sql: `-- 001_initial: baseline JobFlow schema (idempotent)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS scrape_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT NOT NULL,
  final_url TEXT,
  used_search BOOLEAN NOT NULL DEFAULT FALSE,
  source_status TEXT,
  job_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scrape_run_id UUID REFERENCES scrape_runs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  company TEXT,
  location TEXT NOT NULL DEFAULT 'Unknown',
  salary_min NUMERIC,
  salary_max NUMERIC,
  currency TEXT,
  url TEXT NOT NULL,
  description TEXT,
  description_source TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS jobs_url_unique ON jobs (url);

CREATE TABLE IF NOT EXISTS user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type TEXT NOT NULL CHECK (doc_type IN ('resume', 'cover_letter')),
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  content_text TEXT NOT NULL,
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_documents_type_idx
  ON user_documents (doc_type, updated_at DESC);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  plan_tier TEXT NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro')),
  credits_remaining INTEGER NOT NULL DEFAULT 10,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Heal older DBs that created users before role existed (must run before role index/constraint)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS users_stripe_customer_idx ON users (stripe_customer_id);
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS credit_ledger_user_idx
  ON credit_ledger (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_slug TEXT NOT NULL,
  profile_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS portfolios_user_idx
  ON portfolios (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS portfolio_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  body TEXT NOT NULL,
  delivered BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS portfolio_messages_portfolio_idx
  ON portfolio_messages (portfolio_id, created_at DESC);
`,
  },
  {
    id: "002_jobs_user_id.sql",
    sql: `-- Tie scraped jobs (and scrape runs) to the logged-in user.
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
`,
  }
]
