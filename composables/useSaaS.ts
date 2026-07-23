export type SaasPlanTier = 'free' | 'pro'
export type SaasUserRole = 'admin' | 'user'

export type SaasUser = {
  id: string
  email: string
  planTier: SaasPlanTier
  role: SaasUserRole
  creditsRemaining: number
}

type SaasCreditsPayload = {
  user: SaasUser
  creditsRemaining: number
  planTier: SaasPlanTier
}

function normalizeUser(user: Partial<SaasUser> & { id: string; email: string }): SaasUser {
  return {
    id: user.id,
    email: user.email,
    planTier: user.planTier === 'pro' ? 'pro' : 'free',
    role: user.role === 'admin' ? 'admin' : 'user',
    creditsRemaining: Number(user.creditsRemaining ?? 0),
  }
}

/**
 * Shared SaaS state across components (credits, plan, feature locks).
 * Supports Nuxt Nitro sessions (default) and FastAPI cookie sessions
 * when NUXT_PUBLIC_API_BACKEND=fastapi.
 */
export function useSaaS() {
  const config = useRuntimeConfig()
  const apiBackend = computed(() =>
    config.public.apiBackend === 'fastapi' ? 'fastapi' : 'nuxt',
  )

  const { loggedIn: nuxtLoggedIn, user: nuxtUser, clear, fetch: fetchNuxtSession } =
    useUserSession()

  const fastapiUser = useState<SaasUser | null>('fastapi-session-user', () => null)
  const data = useState<SaasCreditsPayload | null>('saas-credits', () => null)
  const pending = useState<boolean>('saas-credits-pending', () => false)
  const error = useState<string | null>('saas-credits-error', () => null)
  const sessionReady = useState<boolean>('saas-session-ready', () => false)

  const loggedIn = computed(() =>
    apiBackend.value === 'fastapi'
      ? Boolean(fastapiUser.value?.id)
      : Boolean(nuxtLoggedIn.value),
  )

  const sessionUser = computed(() =>
    apiBackend.value === 'fastapi' ? fastapiUser.value : nuxtUser.value,
  )

  function applySessionUser(user: Partial<SaasUser> & { id: string; email: string }) {
    fastapiUser.value = normalizeUser(user)
  }

  async function fetchSession() {
    if (apiBackend.value === 'fastapi') {
      try {
        // SSR must forward the browser cookie; plain $fetch on server does not.
        let requestFetch: any
        if (import.meta.server) {
          requestFetch = useRequestFetch() as any
        } else {
          requestFetch = $fetch as any
        }
        const payload = await (requestFetch as any)('/api/auth/me', {
          credentials: 'include',
        }) as { user: SaasUser }
        applySessionUser(payload.user)
      } catch {
        fastapiUser.value = null
      } finally {
        sessionReady.value = true
      }
      return
    }
    await fetchNuxtSession()
    sessionReady.value = true
  }

  async function refreshCredits() {
    if (!loggedIn.value) {
      data.value = null
      error.value = null
      return
    }

    pending.value = true
    error.value = null
    try {
      let requestFetch: any
      if (import.meta.server) {
        requestFetch = useRequestFetch() as any
      } else {
        requestFetch = $fetch as any
      }
      const payload = await (requestFetch as any)('/api/saas/credits', {
        credentials: 'include',
      }) as SaasCreditsPayload
      data.value = {
        ...payload,
        creditsRemaining: Number(payload.creditsRemaining ?? payload.user?.creditsRemaining ?? 0),
        planTier: payload.planTier || payload.user?.planTier || 'free',
        user: normalizeUser({
          ...payload.user,
          creditsRemaining: Number(payload.user?.creditsRemaining ?? payload.creditsRemaining ?? 0),
        }),
      }
      if (apiBackend.value === 'fastapi') {
        fastapiUser.value = data.value.user
      }
    } catch (err: unknown) {
      const e = err as {
        data?: { statusMessage?: string; detail?: string }
        statusMessage?: string
        message?: string
      }
      error.value =
        e.data?.statusMessage ||
        e.data?.detail ||
        e.statusMessage ||
        e.message ||
        'Failed to load credits'
    } finally {
      pending.value = false
    }
  }

  watch(
    loggedIn,
    async (isLoggedIn) => {
      if (isLoggedIn) await refreshCredits()
      else {
        data.value = null
        error.value = null
      }
    },
    { immediate: true },
  )

  onMounted(() => {
    if (apiBackend.value === 'fastapi') void fetchSession()
  })

  const creditsRemaining = computed(() => Number(data.value?.creditsRemaining ?? 0))
  const planTier = computed<SaasPlanTier>(() => data.value?.planTier ?? 'free')
  const role = computed<SaasUserRole>(() => data.value?.user?.role ?? 'user')
  const isAuthenticated = computed(() => Boolean(loggedIn.value))
  const isPro = computed(() => planTier.value === 'pro')
  const isAdmin = computed(() => role.value === 'admin')
  const canAccessScraper = computed(
    () =>
      isAdmin.value ||
      (isAuthenticated.value && isPro.value && creditsRemaining.value > 0),
  )
  const canAccessAI = computed(
    () =>
      isAdmin.value ||
      (isAuthenticated.value && isPro.value && creditsRemaining.value > 0),
  )

  function scraperBlockedMessage() {
    if (isAdmin.value) return ''
    if (!isAuthenticated.value) return 'Sign in and upgrade to Pro to run the scraper.'
    if (!isPro.value) return 'A Pro subscription is required to scrape jobs.'
    if (creditsRemaining.value <= 0) {
      return 'Out of credits. Top up on Billing & credits, or wait for your next billing cycle.'
    }
    return ''
  }

  function aiBlockedMessage() {
    if (isAdmin.value) return ''
    if (!isAuthenticated.value) return 'Sign in and upgrade to Pro to use AI features.'
    if (!isPro.value) return 'A Pro subscription is required to use AI features.'
    if (creditsRemaining.value <= 0) {
      return 'Out of credits. Top up on Billing & credits, or wait for your next billing cycle.'
    }
    return ''
  }

  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } finally {
      fastapiUser.value = null
      await clear()
      data.value = null
      error.value = null
      await navigateTo('/')
    }
  }

  return {
    apiBackend,
    loggedIn: isAuthenticated,
    sessionUser,
    creditsRemaining,
    planTier,
    role,
    isPro,
    isAdmin,
    canAccessScraper,
    canAccessAI,
    scraperBlockedMessage,
    aiBlockedMessage,
    pending,
    error,
    sessionReady,
    refreshCredits,
    fetchSession,
    applySessionUser,
    logout,
  }
}
