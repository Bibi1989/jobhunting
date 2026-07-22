<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const {
  loggedIn,
  creditsRemaining,
  planTier,
  refreshCredits,
} = useSaaS()

const loadingCheckout = ref(false)
const loadingPortal = ref(false)
const message = ref<string | null>(null)
const error = ref<string | null>(null)

onMounted(async () => {
  if (route.query.checkout === 'success') {
    message.value = 'Payment received. Credits will refresh shortly.'
    await refreshCredits()
  } else if (route.query.checkout === 'cancel') {
    message.value = 'Checkout canceled.'
  }
})

async function startCheckout() {
  if (!loggedIn.value) {
    await navigateTo('/login?redirect=/pricing')
    return
  }
  loadingCheckout.value = true
  error.value = null
  try {
    const { url } = await $fetch<{ url: string }>('/api/billing/checkout', { method: 'POST' })
    await navigateTo(url, { external: true })
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    error.value = e.data?.statusMessage || e.statusMessage || 'Could not start checkout'
  } finally {
    loadingCheckout.value = false
  }
}

async function openPortal() {
  loadingPortal.value = true
  error.value = null
  try {
    const { url } = await $fetch<{ url: string }>('/api/billing/portal', { method: 'POST' })
    await navigateTo(url, { external: true })
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    error.value = e.data?.statusMessage || e.statusMessage || 'Could not open billing portal'
  } finally {
    loadingPortal.value = false
  }
}
</script>

<template>
  <div class="app-shell">
    <header class="flex items-center justify-between px-6 h-16 border-b border-[color:var(--app-border)]">
      <AppLogo size="sm" />
      <div class="flex items-center gap-3 text-sm">
        <LocaleSwitcher />
        <ThemeToggle />
        <CreditBadge />
        <NuxtLink
          v-if="!loggedIn"
          to="/login"
          class="text-[color:var(--app-muted)] hover:text-[color:var(--app-fg)] cursor-pointer"
        >
          {{ t('nav.signIn') }}
        </NuxtLink>
        <UserMenu />
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-6 py-16">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-[color:var(--app-fg)] mb-3">{{ t('pricing.title') }}</h1>
        <p class="text-[color:var(--app-muted)]">{{ t('pricing.subtitle') }}</p>
        <p v-if="loggedIn" class="mt-3 text-sm text-indigo-400">
          {{ t('pricing.currentPlan') }}: <span class="font-semibold uppercase">{{ planTier }}</span>
          · {{ creditsRemaining }} credits
        </p>
        <p v-if="message" class="mt-3 text-sm text-emerald-500">{{ message }}</p>
        <p v-if="error" class="mt-3 text-sm text-red-400">{{ error }}</p>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <div class="rounded-2xl border border-[color:var(--app-border)] bg-[color:var(--app-input)] p-8 flex flex-col">
          <h2 class="text-xl font-bold text-[color:var(--app-fg)]">{{ t('pricing.free') }}</h2>
          <p class="text-3xl font-extrabold text-[color:var(--app-fg)] mt-4">€0</p>
          <ul class="mt-6 space-y-2 text-sm text-[color:var(--app-muted)] flex-1">
            <li>1 resume, 1 cover letter, 1 portfolio</li>
            <li>PDF export &amp; local keyword ATS</li>
            <li>No job scrape or Gemini AI</li>
          </ul>
          <NuxtLink
            v-if="!loggedIn"
            to="/register"
            class="mt-8 block text-center rounded-xl border border-[color:var(--app-border)] py-3 font-bold text-sm hover:bg-[color:var(--app-input)]"
          >
            {{ t('nav.getStarted') }}
          </NuxtLink>
          <div
            v-else
            class="mt-8 text-center rounded-xl border border-[color:var(--app-border)] py-3 text-sm text-[color:var(--app-muted)]"
          >
            {{ planTier === 'free' ? t('pricing.currentPlan') : t('pricing.free') }}
          </div>
        </div>

        <div class="rounded-2xl border border-indigo-400/40 bg-indigo-500/10 p-8 flex flex-col shadow-[0_0_40px_rgba(99,102,241,0.15)]">
          <h2 class="text-xl font-bold text-[color:var(--app-fg)]">{{ t('pricing.pro') }}</h2>
          <p class="text-3xl font-extrabold text-[color:var(--app-fg)] mt-4">
            €29<span class="text-base font-semibold text-[color:var(--app-muted)]">{{ t('pricing.perMonth') }}</span>
          </p>
          <ul class="mt-6 space-y-2 text-sm text-[color:var(--app-fg)] flex-1">
            <li>Unlimited resumes, cover letters &amp; portfolios</li>
            <li>Job scrape + Gemini AI</li>
            <li>150 credits each billing cycle</li>
          </ul>
          <button
            type="button"
            :disabled="loadingCheckout"
            class="mt-8 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 font-bold text-sm disabled:opacity-50 text-white"
            @click="startCheckout"
          >
            {{ loadingCheckout ? t('common.loading') : t('pricing.upgrade') }}
          </button>
          <button
            v-if="loggedIn && planTier === 'pro'"
            type="button"
            :disabled="loadingPortal"
            class="mt-3 w-full rounded-xl border border-[color:var(--app-border)] py-2.5 text-sm font-semibold text-[color:var(--app-fg)] hover:bg-[color:var(--app-input)] disabled:opacity-50"
            @click="openPortal"
          >
            {{ loadingPortal ? t('common.loading') : t('pricing.manageBilling') }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
