import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type pg from 'pg'

type MigrationFile = { id: string; sql: string }

function checksum(sql: string): string {
  return createHash('sha256').update(sql, 'utf8').digest('hex')
}

/**
 * Prefer SQL bundled into the Nitro server build (works in AI Studio / Cloud Run /
 * any deploy where server/db/migrations is not on disk next to the runtime).
 * Falls back to MIGRATIONS_DIR or filesystem for local Docker layouts.
 */
function loadMigrations(): MigrationFile[] {
  // Vite/Nitro: embed *.sql as raw strings at build time.
  const bundled = import.meta.glob('../db/migrations/*.sql', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>

  const fromBundle = Object.entries(bundled)
    .map(([path, sql]) => ({
      id: path.split(/[/\\]/).pop()!,
      sql: String(sql),
    }))
    .filter((m) => m.id.endsWith('.sql'))
    .sort((a, b) => a.id.localeCompare(b.id))

  if (fromBundle.length) return fromBundle

  const dirs: string[] = []
  if (process.env.MIGRATIONS_DIR) dirs.push(process.env.MIGRATIONS_DIR)

  try {
    const here = dirname(fileURLToPath(import.meta.url))
    dirs.push(
      join(here, '../db/migrations'),
      join(process.cwd(), 'server/db/migrations'),
      join(process.cwd(), 'migrations'),
    )
  } catch {
    /* import.meta.url may be unavailable in some bundles */
  }

  for (const directory of dirs) {
    if (!directory || !existsSync(directory)) continue
    const files = readdirSync(directory)
      .filter((name) => name.endsWith('.sql'))
      .sort()
      .map((name) => ({
        id: name,
        sql: readFileSync(join(directory, name), 'utf8'),
      }))
    if (files.length) return files
  }

  throw new Error(
    'No Nuxt migrations found. Add SQL under web/server/db/migrations (bundled at build) or set MIGRATIONS_DIR.',
  )
}

/**
 * Detect pending / changed SQL migrations and apply new ones.
 * Tracks applied files + checksums in schema_migrations.
 */
export async function migrate(client: pg.PoolClient): Promise<string[]> {
  const migrations = loadMigrations()

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

  for (const { id: migrationId, sql } of migrations) {
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
