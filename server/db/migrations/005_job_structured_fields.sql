-- 005_job_structured_fields: add responsibilities and requirements columns to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS responsibilities TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requirements TEXT;
