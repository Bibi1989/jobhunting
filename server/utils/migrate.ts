import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type pg from 'pg'

function migrationsDir(): string {
  if (process.env.MIGRATIONS_DIR && existsSync(process.env.MIGRATIONS_DIR)) {
    return process.env.MIGRATIONS_DIR
  }

  const here = dirname(fileURLToPath(import.meta.url))
  const candidates = [
    join(here, '../../../db/migrations'), // repo root from web/server/utils
    join(here, '../db/migrations'), // web/server/db/migrations
    join(process.cwd(), 'db/migrations'),
    join(process.cwd(), '../db/migrations'),
    join(process.cwd(), 'migrations'),
  ]

  for (const path of candidates) {
    if (existsSync(path)) return path
  }

  throw new Error(
    'No migrations directory found. Set MIGRATIONS_DIR or add db/migrations at the repo root.',
  )
}

function checksum(sql: string): string {
  return createHash('sha256').update(sql, 'utf8').digest('hex')
}

function listMigrationFiles(directory: string): string[] {
  return readdirSync(directory)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => join(directory, name))
}

/**
 * Detect pending / changed SQL migrations and apply new ones.
 * Tracks applied files + checksums in schema_migrations.
 */
export async function migrate(client: pg.PoolClient): Promise<string[]> {
  const directory = migrationsDir()

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  const existing = await client.query<{ id: string; checksum: string }>(
    `SELECT id, checksum FROM schema_migrations`,
  )
  const applied = new Map(existing.rows.map((row) => [row.id, row.checksum]))
  const appliedNow: string[] = []

  for (const filePath of listMigrationFiles(directory)) {
    const migrationId = filePath.split(/[/\\]/).pop()!
    const sql = readFileSync(filePath, 'utf8')
    const digest = checksum(sql)

    if (applied.has(migrationId)) {
      if (applied.get(migrationId) !== digest) {
        console.warn(
          `[migrate] ${migrationId} checksum changed after apply. ` +
            'Add a new numbered migration instead of editing applied files.',
        )
      }
      continue
    }

    console.info(`[migrate] Applying ${migrationId}`)
    await client.query('BEGIN')
    try {
      await client.query(sql)
      await client.query(
        `INSERT INTO schema_migrations (id, checksum)
         VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET checksum = EXCLUDED.checksum, applied_at = NOW()`,
        [migrationId, digest],
      )
      await client.query('COMMIT')
      appliedNow.push(migrationId)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  }

  if (appliedNow.length) {
    console.info(`[migrate] Applied: ${appliedNow.join(', ')}`)
  }

  return appliedNow
}
