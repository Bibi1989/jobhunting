/**
 * Hydrate FastAPI cookie session early (SSR + client) so auth middleware
 * sees the user on full page reload.
 */
export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig()
  if (config.public.apiBackend !== 'fastapi') return

  const { fetchSession, sessionReady } = useSaaS()
  if (!sessionReady.value) {
    await fetchSession()
  }
})
