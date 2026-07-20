# Nuxt (Nitro) SQL migrations

Applied automatically on first DB use via `ensureSchema()` → `migrate()`.

- Edit / add numbered `*.sql` files here
- Run `npm run migrations:embed` (also runs on `prebuild`) so `registry.ts` stays in sync
- Netlify/serverless uses the embedded `registry.ts` (no filesystem reads)

Do not edit already-applied files — add `003_….sql` instead.
