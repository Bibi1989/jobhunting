<script setup lang="ts">
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
  <div class="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-slate-100">
    <header class="flex items-center justify-between px-6 h-16 border-b border-white/10">
      <NuxtLink to="/" class="font-bold text-lg text-white">JobFlow AI</NuxtLink>
      <div class="flex items-center gap-3 text-sm">
        <CreditBadge />
        <NuxtLink
          v-if="!loggedIn"
          to="/login"
          class="text-slate-300 hover:text-white cursor-pointer"
        >
          Sign in
        </NuxtLink>
        <UserMenu />
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-6 py-16">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-white mb-3">Simple pricing</h1>
        <p class="text-slate-400">Credit-based AI scraping and document tools. Upgrade anytime.</p>
        <p v-if="loggedIn" class="mt-3 text-sm text-indigo-300">
          Current plan: <span class="font-semibold uppercase">{{ planTier }}</span>
          · {{ creditsRemaining }} credits remaining
        </p>
        <p v-if="message" class="mt-3 text-sm text-emerald-300">{{ message }}</p>
        <p v-if="error" class="mt-3 text-sm text-red-400">{{ error }}</p>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <div class="rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col">
          <h2 class="text-xl font-bold text-white">Free</h2>
          <p class="text-3xl font-extrabold text-white mt-4">€0</p>
          <p class="text-sm text-slate-400 mt-1">10 starter credits</p>
          <ul class="mt-6 space-y-2 text-sm text-slate-300 flex-1">
            <li>Job scraping with starter credits</li>
            <li>Resume & cover letter builder (manual edit)</li>
            <li>No AI features (Pro required)</li>
          </ul>
          <NuxtLink
            v-if="!loggedIn"
            to="/register"
            class="mt-8 block text-center rounded-xl border border-white/20 py-3 font-bold text-sm hover:bg-white/5"
          >
            Get started
          </NuxtLink>
          <div
            v-else
            class="mt-8 text-center rounded-xl border border-white/10 py-3 text-sm text-slate-400"
          >
            {{ planTier === 'free' ? 'Your current plan' : 'Included free tier' }}
          </div>
        </div>

        <div class="rounded-2xl border border-indigo-400/40 bg-indigo-500/10 p-8 flex flex-col shadow-[0_0_40px_rgba(99,102,241,0.15)]">
          <h2 class="text-xl font-bold text-white">Pro</h2>
          <p class="text-3xl font-extrabold text-white mt-4">
            €29<span class="text-base font-semibold text-slate-400">/mo</span>
          </p>
          <p class="text-sm text-indigo-200 mt-1">150 credits replenished each billing cycle</p>
          <ul class="mt-6 space-y-2 text-sm text-slate-200 flex-1">
            <li>Everything in Free</li>
            <li>AI tailor, translate, enhance, cover letters</li>
            <li>Application form AI assistant</li>
            <li>150 credits each billing cycle</li>
          </ul>
          <button
            type="button"
            :disabled="loadingCheckout"
            class="mt-8 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 font-bold text-sm disabled:opacity-50"
            @click="startCheckout"
          >
            {{ loadingCheckout ? 'Redirecting…' : planTier === 'pro' ? 'Renew / manage via Checkout' : 'Upgrade to Pro' }}
          </button>
          <button
            v-if="loggedIn && planTier === 'pro'"
            type="button"
            :disabled="loadingPortal"
            class="mt-3 w-full rounded-xl border border-white/15 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5 disabled:opacity-50"
            @click="openPortal"
          >
            {{ loadingPortal ? 'Opening…' : 'Open billing portal' }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
