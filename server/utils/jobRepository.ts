import type { Job } from '../../shared/types/job'
import { query } from './db'

export interface StoredJob extends Job {
  id: string
  userId?: string
  descriptionSource?: string
  sourceUrl?: string
  scrapeRunId?: string
}

export async function createScrapeRun(input: {
  userId: string
  sourceUrl: string
  finalUrl: string
  usedSearch: boolean
  sourceStatus: string
  jobCount: number
}) {
  const result = await query<{ id: string }>(
    `INSERT INTO scrape_runs (user_id, source_url, final_url, used_search, source_status, job_count)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      input.userId,
      input.sourceUrl,
      input.finalUrl,
      input.usedSearch,
      input.sourceStatus,
      input.jobCount,
    ],
  )
  return result.rows[0].id
}

export async function upsertJobs(
  jobs: Job[],
  scrapeRunId: string,
  sourceUrl: string,
  userId: string,
) {
  const saved: StoredJob[] = []

  for (const job of jobs) {
    const result = await query<{
      id: string
      user_id: string
      title: string
      company: string | null
      location: string
      salary_min: string | null
      salary_max: string | null
      currency: string | null
      url: string
      description: string | null
      description_source: string | null
      source_url: string | null
      scrape_run_id: string | null
      responsibilities: string | null
      requirements: string | null
    }>(
      `INSERT INTO jobs (
         user_id, scrape_run_id, title, company, location, salary_min, salary_max,
         currency, url, description, description_source, source_url, responsibilities, requirements, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, NOW())
       ON CONFLICT (user_id, url) DO UPDATE SET
         scrape_run_id = EXCLUDED.scrape_run_id,
         title = EXCLUDED.title,
         company = COALESCE(EXCLUDED.company, jobs.company),
         location = EXCLUDED.location,
         salary_min = COALESCE(EXCLUDED.salary_min, jobs.salary_min),
         salary_max = COALESCE(EXCLUDED.salary_max, jobs.salary_max),
         currency = COALESCE(EXCLUDED.currency, jobs.currency),
         description = CASE
           WHEN EXCLUDED.description IS NOT NULL AND LENGTH(EXCLUDED.description) >= COALESCE(LENGTH(jobs.description), 0)
           THEN EXCLUDED.description
           ELSE COALESCE(jobs.description, EXCLUDED.description)
         END,
         description_source = COALESCE(EXCLUDED.description_source, jobs.description_source),
         source_url = EXCLUDED.source_url,
         responsibilities = COALESCE(EXCLUDED.responsibilities, jobs.responsibilities),
         requirements = COALESCE(EXCLUDED.requirements, jobs.requirements),
         updated_at = NOW()
       RETURNING *`,
      [
        userId,
        scrapeRunId,
        job.title,
        job.company || null,
        job.location,
        job.salaryMin ?? null,
        job.salaryMax ?? null,
        job.currency || null,
        job.url,
        job.description || null,
        job.descriptionSource || null,
        sourceUrl,
        job.responsibilities || null,
        job.requirements || null,
      ],
    )

    const row = result.rows[0]
    saved.push(mapJobRow(row))
  }

  return saved
}

export async function listRecentJobs(userId: string, limit = 100) {
  const result = await query<{
    id: string
    user_id: string
    title: string
    company: string | null
    location: string
    salary_min: string | null
    salary_max: string | null
    currency: string | null
    url: string
    description: string | null
    description_source: string | null
    source_url: string | null
    scrape_run_id: string | null
    responsibilities: string | null
    requirements: string | null
  }>(
    `SELECT * FROM jobs
     WHERE user_id = $1
     ORDER BY updated_at DESC
     LIMIT $2`,
    [userId, limit],
  )

  return result.rows.map(mapJobRow)
}

export async function getJobById(id: string, userId: string) {
  const result = await query<{
    id: string
    user_id: string
    title: string
    company: string | null
    location: string
    salary_min: string | null
    salary_max: string | null
    currency: string | null
    url: string
    description: string | null
    description_source: string | null
    source_url: string | null
    scrape_run_id: string | null
    responsibilities: string | null
    requirements: string | null
  }>(`SELECT * FROM jobs WHERE id = $1 AND user_id = $2`, [id, userId])

  return result.rows[0] ? mapJobRow(result.rows[0]) : null
}

export async function deleteJob(input: { userId: string; id?: string; url?: string }) {
  if (input.id) {
    const result = await query(`DELETE FROM jobs WHERE id = $1 AND user_id = $2 RETURNING id`, [
      input.id,
      input.userId,
    ])
    return (result.rowCount || 0) > 0
  }

  if (input.url) {
    const result = await query(`DELETE FROM jobs WHERE url = $1 AND user_id = $2 RETURNING id`, [
      input.url,
      input.userId,
    ])
    return (result.rowCount || 0) > 0
  }

  return false
}

export async function deleteAllJobs(userId: string): Promise<number> {
  const result = await query(`DELETE FROM jobs WHERE user_id = $1 RETURNING id`, [userId])
  return result.rowCount || 0
}

export function mapJobRow(row: {
  id: string
  user_id?: string
  title: string
  company: string | null
  location: string
  salary_min: string | null
  salary_max: string | null
  currency: string | null
  url: string
  description: string | null
  description_source: string | null
  source_url: string | null
  scrape_run_id: string | null
  responsibilities?: string | null
  requirements?: string | null
}): StoredJob {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    title: row.title,
    company: row.company || undefined,
    location: row.location,
    salaryMin: row.salary_min ? Number(row.salary_min) : undefined,
    salaryMax: row.salary_max ? Number(row.salary_max) : undefined,
    currency: row.currency || undefined,
    url: row.url,
    description: row.description ?? undefined,
    descriptionSource: row.description_source || undefined,
    sourceUrl: row.source_url || undefined,
    scrapeRunId: row.scrape_run_id || undefined,
    responsibilities: row.responsibilities ?? undefined,
    requirements: row.requirements ?? undefined,
  }
}
