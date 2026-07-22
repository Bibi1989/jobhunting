import pg from 'pg'
import { migrate } from '~/server/utils/migrate'

const { Pool } = pg

export type PlanTier = 'free' | 'pro'
export type UserRole = 'admin' | 'user'

export interface AppUser {
  id: string
  email: string
  passwordHash: string
  planTier: PlanTier
  role: UserRole
  creditsRemaining: number
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  createdAt: string
  updatedAt: string
}

export const FREE_CREDITS = 0
export const PRO_CREDITS = 150

let pool: pg.Pool | null = null
let schemaReady = false

function resolveDatabaseUrl(): string {
  const config = useRuntimeConfig()
  const envUrl = String(process.env.NUXT_DATABASE_URL || process.env.DATABASE_URL || '').trim()
  const configUrl = String(config.databaseUrl || '').trim()

  // Prefer real host env (Netlify). Ignore baked/local defaults when env is set.
  let value = envUrl || configUrl
  if (!value) return ''

  return value
    .replace(/([?&])channel_binding=require&?/gi, '$1')
    .replace(/[?&]$/, '')
}

export function getPool() {
  if (!pool) {
    const connectionString = resolveDatabaseUrl()

    if (!connectionString) {
      throw createError({
        statusCode: 503,
        statusMessage:
          'DATABASE_URL is not configured. Set DATABASE_URL or NUXT_DATABASE_URL in Netlify env.',
      })
    }

    const needsSsl =
      /sslmode=require/i.test(connectionString) ||
      /neon\.tech/i.test(connectionString) ||
      process.env.NETLIFY === 'true' ||
      process.env.CONTEXT === 'production'

    // When we pass ssl: {}, strip sslmode from the URL to avoid node-pg conflicts.
    const poolUrl = needsSsl
      ? connectionString
          .replace(/[?&]sslmode=[^&]*/gi, '')
          .replace(/\?&/, '?')
          .replace(/[?&]$/, '')
      : connectionString

    pool = new Pool({
      connectionString: poolUrl,
      connectionTimeoutMillis: 20_000,
      max: 2,
      min: 0,
      idleTimeoutMillis: 5_000,
      allowExitOnIdle: true,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    })
  }
  return pool
}

/** Detect pending SQL migrations under web/server/db/migrations and apply them. */
export async function ensureSchema() {
  if (schemaReady) return

  const client = await getPool().connect()
  try {
    await migrate(client)
    schemaReady = true
  } catch (error) {
    console.error('[ensureSchema] migration failed:', error)
    throw createError({
      statusCode: 503,
      statusMessage:
        error instanceof Error
          ? `Database schema unavailable: ${error.message}`
          : 'Database schema unavailable',
    })
  } finally {
    client.release()
  }
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  await ensureSchema()
  return getPool().query<T>(text, params)
}

export function isDatabaseError(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const code = (error as { code?: string }).code
  return (
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    code === '57P01' ||
    code === '3D000' ||
    code === '28P01' || // invalid password
    code === '28000' // invalid authorization
  )
}

type UserRow = {
  id: string
  email: string
  password_hash: string
  plan_tier: PlanTier
  role: UserRole
  credits_remaining: number
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  updated_at: string
}

function mapUser(row: UserRow): AppUser {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    planTier: row.plan_tier === 'pro' ? 'pro' : 'free',
    role: row.role === 'admin' ? 'admin' : 'user',
    creditsRemaining: Number(row.credits_remaining ?? 0),
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function isAdminEmail(email: string): boolean {
  const config = useRuntimeConfig()
  const raw = String(config.adminEmails || '')
  if (!raw.trim()) return false
  const allowed = raw
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
  return allowed.includes(email.toLowerCase().trim())
}

export async function getUserById(id: string): Promise<AppUser | null> {
  const result = await query<UserRow>(`SELECT * FROM users WHERE id = $1`, [id])
  return result.rows[0] ? mapUser(result.rows[0]) : null
}

export async function getUserByEmail(email: string): Promise<AppUser | null> {
  const result = await query<UserRow>(`SELECT * FROM users WHERE email = $1`, [
    email.toLowerCase().trim(),
  ])
  return result.rows[0] ? mapUser(result.rows[0]) : null
}

export async function getUserByStripeCustomerId(customerId: string): Promise<AppUser | null> {
  const result = await query<UserRow>(`SELECT * FROM users WHERE stripe_customer_id = $1`, [
    customerId,
  ])
  return result.rows[0] ? mapUser(result.rows[0]) : null
}

export async function createUser(input: {
  email: string
  passwordHash: string
  creditsRemaining?: number
  role?: UserRole
}): Promise<AppUser> {
  const email = input.email.toLowerCase().trim()
  const role: UserRole = input.role || (isAdminEmail(email) ? 'admin' : 'user')
  const result = await query<UserRow>(
    `INSERT INTO users (email, password_hash, plan_tier, role, credits_remaining)
     VALUES ($1, $2, 'free', $3, $4)
     RETURNING *`,
    [email, input.passwordHash, role, input.creditsRemaining ?? FREE_CREDITS],
  )
  return mapUser(result.rows[0])
}

export async function setUserRole(userId: string, role: UserRole): Promise<AppUser | null> {
  const result = await query<UserRow>(
    `UPDATE users SET role = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [userId, role],
  )
  return result.rows[0] ? mapUser(result.rows[0]) : null
}

/** Promote configured admin emails if they still have the default user role. */
export async function syncAdminRole(user: AppUser): Promise<AppUser> {
  if (user.role === 'admin') return user
  if (!isAdminEmail(user.email)) return user
  const updated = await setUserRole(user.id, 'admin')
  return updated || user
}

/**
 * Heal Pro accounts that never received a full credit allotment
 * (e.g. plan set to pro without Stripe webhook, or stuck at 0).
 * Does not refill Pro users who still have a paid Stripe customer mid-cycle.
 */
export async function syncProCredits(user: AppUser): Promise<AppUser> {
  if (user.planTier !== 'pro') return user
  if (user.creditsRemaining >= PRO_CREDITS) return user

  const needsHeal =
    user.creditsRemaining <= 0 ||
    (!user.stripeCustomerId && user.creditsRemaining <= FREE_CREDITS)

  if (!needsHeal) return user

  const updated = await setPlanAndCredits(user.id, 'pro', PRO_CREDITS, 'pro_credits_heal')
  return updated || user
}

export async function getCreditsRemaining(userId: string): Promise<number> {
  const result = await query<{ credits_remaining: number }>(
    `SELECT credits_remaining FROM users WHERE id = $1`,
    [userId],
  )
  return result.rows[0]?.credits_remaining ?? 0
}

export async function decrementCreditAtomic(
  userId: string,
  cost = 1,
  reason = 'ai_usage',
): Promise<AppUser | null> {
  const client = await getPool().connect()
  try {
    await ensureSchema()
    await client.query('BEGIN')
    const updated = await client.query<UserRow>(
      `UPDATE users
       SET credits_remaining = credits_remaining - $2,
           updated_at = NOW()
       WHERE id = $1 AND credits_remaining >= $2
       RETURNING *`,
      [userId, cost],
    )
    if (!updated.rows[0]) {
      await client.query('ROLLBACK')
      return null
    }
    await client.query(
      `INSERT INTO credit_ledger (user_id, delta, reason) VALUES ($1, $2, $3)`,
      [userId, -cost, reason],
    )
    await client.query('COMMIT')
    const mapped = mapUser(updated.rows[0])
    try {
      const { invalidateAuthUserCache } = await import('~/server/utils/auth')
      invalidateAuthUserCache(userId)
    } catch {
      /* ignore */
    }
    return mapped
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function setPlanAndCredits(
  userId: string,
  planTier: PlanTier,
  credits: number,
  reason: string,
): Promise<AppUser | null> {
  const client = await getPool().connect()
  try {
    await ensureSchema()
    await client.query('BEGIN')
    const current = await client.query<{ credits_remaining: number }>(
      `SELECT credits_remaining FROM users WHERE id = $1 FOR UPDATE`,
      [userId],
    )
    if (!current.rows[0]) {
      await client.query('ROLLBACK')
      return null
    }
    const prev = current.rows[0].credits_remaining
    const updated = await client.query<UserRow>(
      `UPDATE users
       SET plan_tier = $2,
           credits_remaining = $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [userId, planTier, credits],
    )
    await client.query(
      `INSERT INTO credit_ledger (user_id, delta, reason) VALUES ($1, $2, $3)`,
      [userId, credits - prev, reason],
    )
    await client.query('COMMIT')
    try {
      const { invalidateAuthUserCache } = await import('~/server/utils/auth')
      invalidateAuthUserCache(userId)
    } catch {
      /* ignore */
    }
    return mapUser(updated.rows[0])
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function setStripeCustomerId(userId: string, customerId: string): Promise<void> {
  await query(
    `UPDATE users SET stripe_customer_id = $2, updated_at = NOW() WHERE id = $1`,
    [userId, customerId],
  )
}

export async function setStripeSubscriptionId(
  userId: string,
  subscriptionId: string | null,
): Promise<void> {
  await query(
    `UPDATE users SET stripe_subscription_id = $2, updated_at = NOW() WHERE id = $1`,
    [userId, subscriptionId],
  )
}

export function toPublicUser(user: AppUser) {
  return {
    id: user.id,
    email: user.email,
    planTier: user.planTier,
    role: user.role,
    creditsRemaining: user.creditsRemaining,
  }
}
