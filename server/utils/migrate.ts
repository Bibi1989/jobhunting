import { createHash } from 'node:crypto'
import type pg from 'pg'
import { NUXT_MIGRATIONS } from '~/server/db/migrations/registry'

function checksum(sql: string): string {
  return createHash('sha256').update(sql, 'utf8').digest('hex')
}

/**
 * Detect pending / changed SQL migrations and apply new ones.
 * Uses embedded SQL (registry.ts) so Netlify / Nitro serverless always has them.
 */
export async function migrate(client: pg.PoolClient): Promise<string[]> {
  const migrations = [...NUXT_MIGRATIONS].sort((a, b) => a.id.localeCompare(b.id))
  if (!migrations.length) {
    throw new Error('No Nuxt migrations embedded. Run: node scripts/embed-migrations.cjs')
  }

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
