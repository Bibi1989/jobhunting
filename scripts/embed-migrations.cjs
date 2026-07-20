/**
 * Embed *.sql migrations into registry.ts for Nitro/Netlify serverless.
 * Run after adding/changing SQL files under server/db/migrations/.
 */
const { readFileSync, writeFileSync, readdirSync } = require('node:fs')
const { join } = require('node:path')

const dir = join(__dirname, '../server/db/migrations')
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.sql'))
  .sort()

if (!files.length) {
  console.error('No .sql files in', dir)
  process.exit(1)
}

const entries = files.map((f) => {
  const sql = readFileSync(join(dir, f), 'utf8')
  const escaped = sql.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
  return `  {\n    id: ${JSON.stringify(f)},\n    sql: \`${escaped}\`,\n  }`
})

const out = `/**
 * SQL migrations embedded as strings so Nitro/Netlify serverless
 * does not depend on import.meta.glob or a filesystem path at runtime.
 * Source of truth remains the *.sql files in this folder — regenerate with:
 *   node scripts/embed-migrations.cjs
 */
export type EmbeddedMigration = { id: string; sql: string }

export const NUXT_MIGRATIONS: EmbeddedMigration[] = [
${entries.join(',\n')}
]
`

writeFileSync(join(dir, 'registry.ts'), out)
console.log(`Embedded ${files.length} migration(s) → server/db/migrations/registry.ts`)
