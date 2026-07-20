# Nuxt (Nitro) SQL migrations

Applied automatically on first DB use via `ensureSchema()` → `migrate()`.

Add numbered files (`003_….sql`). Do not edit already-applied files.

Override path with `MIGRATIONS_DIR` (Docker sets this to `/app/migrations`).
