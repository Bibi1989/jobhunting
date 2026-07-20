import {
  createError,
  getHeader,
  getRequestURL,
  getRequestHeaders,
  readRawBody,
  setResponseHeader,
  setResponseStatus,
  send,
} from 'h3'

/**
 * When NUXT_PUBLIC_API_BACKEND=fastapi, forward selected /api routes to FastAPI.
 * PDF + nuxt-auth-utils session routes stay on Nitro.
 * Documents are proxied when listed in FASTAPI_PREFIXES (parity with Nuxt uploads).
 *
 * Uses a manual proxy (not proxyRequest) so Set-Cookie from FastAPI login/register
 * reliably reaches the browser — required for session persistence across reloads.
 */
const FASTAPI_PREFIXES = [
  '/api/health',
  '/api/auth',
  '/api/jobs',
  '/api/saas',
  '/api/documents',
] as const

function shouldProxyToFastapi(pathname: string): boolean {
  if (!pathname.startsWith('/api/')) return false
  if (pathname.startsWith('/api/_auth')) return false
  if (pathname.startsWith('/api/pdf')) return false
  return FASTAPI_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

function resolveBackend(config: ReturnType<typeof useRuntimeConfig>): string {
  const fromConfig = String(config.public.apiBackend || '').trim().toLowerCase()
  const fromEnv = String(process.env.NUXT_PUBLIC_API_BACKEND || '').trim().toLowerCase()
  return fromConfig || fromEnv || 'nuxt'
}

function hopByHopHeaders(): Set<string> {
  return new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailers',
    'transfer-encoding',
    'upgrade',
    'host',
    'content-length',
  ])
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (resolveBackend(config) !== 'fastapi') return

  const url = getRequestURL(event)
  const pathname = url.pathname
  if (!shouldProxyToFastapi(pathname)) return

  const targetBase = String(
    config.apiProxyTarget || process.env.NUXT_API_PROXY_TARGET || 'http://127.0.0.1:8000',
  ).replace(/\/$/, '')
  const target = `${targetBase}${pathname}${url.search}`

  try {
    const skip = hopByHopHeaders()
    const incoming = getRequestHeaders(event)
    const headers: Record<string, string> = {}
    for (const [key, value] of Object.entries(incoming)) {
      if (!value || skip.has(key.toLowerCase())) continue
      headers[key] = Array.isArray(value) ? value.join(', ') : String(value)
    }
    // Always forward Cookie so /api/auth/me works after reload (SSR + client).
    const cookie = getHeader(event, 'cookie')
    if (cookie) headers.cookie = cookie

    const method = event.method || 'GET'
    const body =
      method === 'GET' || method === 'HEAD' ? undefined : await readRawBody(event, false)

    const upstream = await fetch(target, {
      method,
      headers,
      body: body as BodyInit | undefined,
      redirect: 'manual',
    })

    setResponseStatus(event, upstream.status, upstream.statusText)

    // Forward all Set-Cookie values (Node fetch may expose getSetCookie).
    const anyHeaders = upstream.headers as Headers & { getSetCookie?: () => string[] }
    const setCookies =
      typeof anyHeaders.getSetCookie === 'function'
        ? anyHeaders.getSetCookie()
        : []
    if (setCookies.length) {
      for (const c of setCookies) {
        appendResponseHeader(event, 'set-cookie', c)
      }
    } else {
      const single = upstream.headers.get('set-cookie')
      if (single) appendResponseHeader(event, 'set-cookie', single)
    }

    for (const [key, value] of upstream.headers.entries()) {
      const lower = key.toLowerCase()
      if (lower === 'set-cookie' || skip.has(lower)) continue
      setResponseHeader(event, key, value)
    }

    if (pathname.startsWith('/api/auth')) {
      setResponseHeader(event, 'cache-control', 'no-store')
    }

    const buf = Buffer.from(await upstream.arrayBuffer())
    return send(event, buf)
  } catch (error) {
    console.error('[api-backend] FastAPI proxy failed:', targetBase, pathname, error)
    throw createError({
      statusCode: 502,
      statusMessage: `FastAPI proxy failed (${targetBase}). Is uvicorn running on port 8000?`,
    })
  }
})

function appendResponseHeader(event: Parameters<typeof setResponseHeader>[0], name: string, value: string) {
  const existing = event.node.res.getHeader(name)
  if (!existing) {
    setResponseHeader(event, name, value)
    return
  }
  const list = Array.isArray(existing) ? existing.map(String) : [String(existing)]
  list.push(value)
  setResponseHeader(event, name, list)
}
