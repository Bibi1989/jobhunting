import type { H3Event } from 'h3'
import type { AppUser } from '~/server/utils/db'
import { getUserById, syncAdminRole, syncProCredits, toPublicUser } from '~/server/utils/db'

export type SessionUser = {
  id: string
  email: string
}

declare module '#auth-utils' {
  interface User {
    id: string
    email: string
  }
}

declare module 'h3' {
  interface H3EventContext {
    user?: AppUser
  }
}

/** Short in-process cache so requireUser does not hit Postgres on every request. */
const USER_CACHE_TTL_MS = 20_000
const userCache = new Map<string, { user: AppUser; expires: number }>()

export function invalidateAuthUserCache(userId?: string) {
  if (!userId) {
    userCache.clear()
    return
  }
  userCache.delete(userId)
}

function cacheUser(user: AppUser): AppUser {
  userCache.set(user.id, { user, expires: Date.now() + USER_CACHE_TTL_MS })
  return user
}

function getCachedUser(userId: string): AppUser | null {
  const hit = userCache.get(userId)
  if (!hit) return null
  if (Date.now() >= hit.expires) {
    userCache.delete(userId)
    return null
  }
  return hit.user
}

export async function getSessionUser(event: H3Event): Promise<SessionUser | null> {
  const session = await getUserSession(event)
  const user = session?.user as SessionUser | undefined
  if (!user?.id || !user?.email) return null
  return user
}

/** Resolve user from FastAPI jobflow_session cookie when Nitro session is absent. */
async function getFastapiSessionUser(event: H3Event): Promise<SessionUser | null> {
  const cookie = getCookie(event, 'jobflow_session')
  if (!cookie) return null

  const config = useRuntimeConfig()
  const target = String(config.apiProxyTarget || process.env.NUXT_API_PROXY_TARGET || 'http://127.0.0.1:8000').replace(
    /\/$/,
    '',
  )
  const cookieHeader = getRequestHeader(event, 'cookie') || `jobflow_session=${cookie}`

  try {
    const me = await $fetch<{ user?: { id?: string; email?: string } }>(`${target}/api/auth/me`, {
      headers: { cookie: cookieHeader },
    })
    if (!me?.user?.id || !me?.user?.email) return null
    return { id: me.user.id, email: me.user.email }
  } catch {
    return null
  }
}

export async function requireUser(event: H3Event): Promise<AppUser> {
  let sessionUser = await getSessionUser(event)
  if (!sessionUser) {
    sessionUser = await getFastapiSessionUser(event)
  }
  if (!sessionUser) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  let user = getCachedUser(sessionUser.id)
  if (!user) {
    user = await getUserById(sessionUser.id)
    if (!user) {
      await clearUserSession(event).catch(() => undefined)
      throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
    }
    // Role/credit heals are occasional; skip on cache hits to reduce DB chatter.
    user = await syncAdminRole(user)
    user = await syncProCredits(user)
    cacheUser(user)
  }

  event.context.user = user
  return user
}

export async function requireAdmin(event: H3Event): Promise<AppUser> {
  const user = await requireUser(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }
  return user
}

export async function setAuthSession(event: H3Event, user: AppUser) {
  cacheUser(user)
  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
    },
  })
  return toPublicUser(user)
}
