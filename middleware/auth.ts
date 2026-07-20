/**
 * Require a signed-in user for builder (and other protected) pages.
 * Works with Nuxt Nitro sessions and FastAPI cookie sessions.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, fetchSession, sessionReady, apiBackend } = useSaaS()

  // Always re-validate on SSR/reload so FastAPI cookie sessions survive.
  if (apiBackend.value === 'fastapi' || !sessionReady.value || !loggedIn.value) {
    await fetchSession()
  }

  if (!loggedIn.value) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }
})
