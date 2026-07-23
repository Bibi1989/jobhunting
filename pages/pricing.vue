<script setup lang="ts">
import { loadStripe, type StripeEmbeddedCheckout } from '@stripe/stripe-js'
import type { BillingInterval } from '~/server/utils/stripe'
import { createEmbeddedCheckout } from '~/utils/stripeEmbedded'

const { t } = useI18n()
const route = useRoute()
const {
  loggedIn,
  creditsRemaining,
  planTier,
  refreshCredits,
} = useSaaS()

type IntervalOption = {
  id: BillingInterval
  labelKey: string
  priceKey: string
  billedKey: string
  equivKey: string
  saveKey?: string
  fullPriceKey?: string
}

const intervals: IntervalOption[] = [
  {
    id: 'month',
    labelKey: 'pricing.intervalMonthly',
    priceKey: 'pricing.priceMonthly',
    billedKey: 'pricing.billedMonthly',
    equivKey: 'pricing.equivMonthly',
  },
  {
    id: 'semiannual',
    labelKey: 'pricing.intervalSemiannual',
    priceKey: 'pricing.priceSemiannual',
    billedKey: 'pricing.billedSemiannual',
    equivKey: 'pricing.equivSemiannual',
    saveKey: 'pricing.saveSemiannual',
    fullPriceKey: 'pricing.fullPriceSemiannual',
  },
  {
    id: 'year',
    labelKey: 'pricing.intervalYearly',
    priceKey: 'pricing.priceYearly',
    billedKey: 'pricing.billedYearly',
    equivKey: 'pricing.equivYearly',
    saveKey: 'pricing.saveYearly',
    fullPriceKey: 'pricing.fullPriceYearly',
  },
]

const selectedInterval = ref<BillingInterval>('month')
const loadingCheckout = ref(false)
const checkoutOpen = ref(false)
const message = ref<string | null>(null)
const error = ref<string | null>(null)

const checkoutMountEl = ref<HTMLElement | null>(null)
let embeddedCheckout: StripeEmbeddedCheckout | null = null

const selectedMeta = computed(() => intervals.find((i) => i.id === selectedInterval.value)!)

onMounted(async () => {
  if (route.query.checkout === 'success') {
    message.value = t('pricing.successMessage')
    await refreshCredits()
    await closeCheckout()
  } else if (route.query.checkout === 'cancel') {
    message.value = t('pricing.cancelMessage')
  }
})

onBeforeUnmount(() => {
  void destroyEmbedded()
})

async function destroyEmbedded() {
  if (embeddedCheckout) {
    try {
      await embeddedCheckout.destroy()
    } catch {
      /* ignore */
    }
    embeddedCheckout = null
  }
}

async function closeCheckout() {
  checkoutOpen.value = false
  await destroyEmbedded()
}

async function startCheckout() {
  if (!loggedIn.value) {
    await navigateTo('/login?redirect=/pricing')
    return
  }

  loadingCheckout.value = true
  error.value = null
  message.value = null

  try {
    await destroyEmbedded()

    const res = await $fetch<{
      mode: 'embedded' | 'hosted'
      clientSecret?: string
      publishableKey?: string
      url?: string
    }>('/api/billing/checkout', {
      method: 'POST',
      body: { interval: selectedInterval.value, uiMode: 'embedded' },
    })

    if (res.mode === 'hosted' && res.url) {
      await navigateTo(res.url, { external: true })
      return
    }

    if (!res.clientSecret || !res.publishableKey) {
      throw new Error('Missing checkout credentials')
    }

    const stripe = await loadStripe(res.publishableKey)
    if (!stripe) throw new Error('Stripe.js failed to load')

    checkoutOpen.value = true
    await nextTick()

    embeddedCheckout = await createEmbeddedCheckout(stripe, {
      clientSecret: res.clientSecret,
    })
    if (checkoutMountEl.value && embeddedCheckout) {
      embeddedCheckout.mount(checkoutMountEl.value)
    }
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string; message?: string }
    error.value = e.data?.statusMessage || e.statusMessage || e.message || 'Could not start checkout'
    checkoutOpen.value = false
  } finally {
    loadingCheckout.value = false
  }
}
</script>

<template>
  <div class="app-shell min-h-screen">
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

    <main class="max-w-5xl mx-auto px-6 py-14">
      <div class="text-center mb-10">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400 mb-3">
          {{ t('pricing.currencyNote') }}
        </p>
        <h1 class="text-4xl sm:text-5xl font-bold text-[color:var(--app-fg)] mb-3 tracking-tight">
          {{ t('pricing.title') }}
        </h1>
        <p class="text-[color:var(--app-muted)] max-w-xl mx-auto">{{ t('pricing.subtitle') }}</p>
        <p v-if="loggedIn" class="mt-4 text-sm text-indigo-300/90">
          {{ t('pricing.currentPlan') }}:
          <span class="font-semibold uppercase">{{ planTier }}</span>
          · {{ creditsRemaining }} credits
        </p>
        <p v-if="message" class="mt-3 text-sm text-emerald-400">{{ message }}</p>
        <p v-if="error" class="mt-3 text-sm text-red-400">{{ error }}</p>
      </div>

      <!-- Interval segmented control -->
      <div class="flex justify-center mb-10">
        <div
          class="inline-flex p-1 rounded-2xl border border-[color:var(--app-border)] bg-[color:var(--app-input)]/80 backdrop-blur"
          role="tablist"
          :aria-label="t('pricing.chooseInterval')"
        >
          <button
            v-for="opt in intervals"
            :key="opt.id"
            type="button"
            role="tab"
            :aria-selected="selectedInterval === opt.id"
            class="px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer inline-flex items-center gap-2"
            :class="
              selectedInterval === opt.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-[color:var(--app-muted)] hover:text-[color:var(--app-fg)]'
            "
            @click="selectedInterval = opt.id"
          >
            {{ t(opt.labelKey) }}
            <span
              v-if="opt.saveKey"
              class="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md"
              :class="
                selectedInterval === opt.id
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-500/15 text-emerald-400'
              "
            >
              {{ t(opt.saveKey) }}
            </span>
          </button>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-6 items-stretch">
        <!-- Free -->
        <div class="rounded-3xl border border-[color:var(--app-border)] bg-[color:var(--app-input)]/60 p-8 flex flex-col">
          <h2 class="text-xl font-bold text-[color:var(--app-fg)]">{{ t('pricing.free') }}</h2>
          <p class="mt-5 flex items-baseline gap-1">
            <span class="text-4xl font-extrabold text-[color:var(--app-fg)]">€0</span>
          </p>
          <ul class="mt-8 space-y-3 text-sm text-[color:var(--app-muted)] flex-1">
            <li class="flex gap-2"><span class="text-slate-500">✓</span>{{ t('pricing.freeFeature1') }}</li>
            <li class="flex gap-2"><span class="text-slate-500">✓</span>{{ t('pricing.freeFeature2') }}</li>
            <li class="flex gap-2"><span class="text-slate-500">✓</span>{{ t('pricing.freeFeature3') }}</li>
          </ul>
          <NuxtLink
            v-if="!loggedIn"
            to="/register"
            class="mt-8 block text-center rounded-2xl border border-[color:var(--app-border)] py-3.5 font-bold text-sm hover:bg-[color:var(--app-bg-elevated)] transition"
          >
            {{ t('nav.getStarted') }}
          </NuxtLink>
          <div
            v-else
            class="mt-8 text-center rounded-2xl border border-[color:var(--app-border)] py-3.5 text-sm text-[color:var(--app-muted)]"
          >
            {{ planTier === 'free' ? t('pricing.currentPlan') : t('pricing.free') }}
          </div>
        </div>

        <!-- Pro -->
        <div
          class="relative rounded-3xl border border-indigo-400/40 bg-gradient-to-b from-indigo-500/15 to-[color:var(--app-input)]/80 p-8 flex flex-col shadow-[0_0_60px_rgba(99,102,241,0.18)]"
        >
          <div class="absolute -top-3 right-6 rounded-full bg-indigo-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            Pro
          </div>
          <h2 class="text-xl font-bold text-[color:var(--app-fg)]">{{ t('pricing.pro') }}</h2>
          <p class="mt-5 flex items-baseline gap-2 flex-wrap">
            <span class="text-4xl font-extrabold text-[color:var(--app-fg)]">{{ t(selectedMeta.priceKey) }}</span>
            <span
              v-if="selectedMeta.fullPriceKey"
              class="text-sm text-[color:var(--app-muted)] line-through"
            >{{ t(selectedMeta.fullPriceKey) }}</span>
            <span class="text-sm font-semibold text-[color:var(--app-muted)]">{{ t(selectedMeta.billedKey) }}</span>
          </p>
          <p class="mt-1 text-xs text-indigo-300/80">{{ t(selectedMeta.equivKey) }}</p>
          <p
            v-if="selectedMeta.saveKey"
            class="mt-2 text-xs font-semibold text-emerald-400"
          >
            {{ t(selectedMeta.saveKey) }}
          </p>

          <ul class="mt-8 space-y-3 text-sm text-[color:var(--app-fg)] flex-1">
            <li class="flex gap-2"><span class="text-indigo-400">✓</span>{{ t('pricing.featureUnlimited') }}</li>
            <li class="flex gap-2"><span class="text-indigo-400">✓</span>{{ t('pricing.featureAi') }}</li>
            <li class="flex gap-2"><span class="text-indigo-400">✓</span>{{ t('pricing.featureCredits') }}</li>
            <li class="flex gap-2"><span class="text-indigo-400">✓</span>{{ t('pricing.featureCancel') }}</li>
            <li class="flex gap-2"><span class="text-indigo-400">✓</span>{{ t('pricing.featureCard') }}</li>
          </ul>

          <button
            type="button"
            :disabled="loadingCheckout || (loggedIn && planTier === 'pro')"
            class="mt-8 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-500 py-3.5 font-bold text-sm disabled:opacity-50 text-white transition shadow-lg shadow-indigo-500/30 cursor-pointer"
            @click="startCheckout"
          >
            {{
              loadingCheckout
                ? t('common.loading')
                : loggedIn && planTier === 'pro'
                  ? t('pricing.currentPlan')
                  : t('pricing.continueToCheckout')
            }}
          </button>
          <NuxtLink
            v-if="loggedIn && planTier === 'pro'"
            to="/account/billing"
            class="mt-3 block w-full text-center rounded-2xl border border-[color:var(--app-border)] py-3 text-sm font-semibold text-[color:var(--app-fg)] hover:bg-[color:var(--app-bg-elevated)] transition"
          >
            {{ t('pricing.manageBilling') }}
          </NuxtLink>
        </div>
      </div>
    </main>

    <!-- Embedded Checkout panel -->
    <Teleport to="body">
      <div
        v-if="checkoutOpen"
        class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-950/75 backdrop-blur-sm p-0 sm:p-6"
      >
        <div
          class="w-full max-w-lg sm:rounded-3xl border border-white/10 bg-[color:var(--app-bg-elevated)] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        >
          <div class="flex items-start justify-between gap-3 px-5 py-4 border-b border-[color:var(--app-border)] shrink-0">
            <div>
              <h2 class="text-lg font-bold text-[color:var(--app-fg)]">{{ t('pricing.checkoutTitle') }}</h2>
              <p class="text-xs text-[color:var(--app-muted)] mt-0.5">{{ t('pricing.checkoutSubtitle') }}</p>
            </div>
            <button
              type="button"
              class="rounded-lg border border-[color:var(--app-border)] px-3 py-1.5 text-xs font-semibold text-[color:var(--app-muted)] hover:text-[color:var(--app-fg)] cursor-pointer"
              @click="closeCheckout"
            >
              {{ t('pricing.closeCheckout') }}
            </button>
          </div>
          <div class="overflow-y-auto flex-1 min-h-[420px] bg-white">
            <div ref="checkoutMountEl" class="min-h-[420px]" />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
