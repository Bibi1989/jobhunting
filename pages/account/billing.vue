<!-- Billing & credits (custom, not Stripe portal) -->
<script setup lang="ts">
import {
  loadStripe,
  type Stripe,
  type StripeElements,
  type StripePaymentElement,
} from '@stripe/stripe-js'
import type { BillingStatus } from '~/server/utils/billing'
import { CREDIT_TOPUP_PACKS, type CreditTopupPackId } from '~/shared/creditTopup'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})

type SavedTopupCard = {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault: boolean
}

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const { refreshCredits } = useSaaS()
const toast = useAppToast()
const { confirm } = useAppConfirm()

const { data, pending, error, refresh } = await useFetch<BillingStatus>('/api/billing/status', {
  credentials: 'include',
})

const canceling = ref(false)
const resuming = ref(false)
const toppingUp = ref(false)
const payingTopup = ref(false)
const selectedPack = ref<CreditTopupPackId>('pack50')
const checkoutOpen = ref(false)
const paymentElementMount = ref<HTMLElement | null>(null)

const topupClientSecret = ref<string | null>(null)
const topupPaymentIntentId = ref<string | null>(null)
const topupPublishableKey = ref<string | null>(null)
const topupSavedCards = ref<SavedTopupCard[]>([])
const topupPackLabel = ref('')
const selectedPaymentMethod = ref<string>('new') // 'new' | pm_xxx
const topupPayError = ref<string | null>(null)

let stripeInstance: Stripe | null = null
let stripeElements: StripeElements | null = null
let paymentElement: StripePaymentElement | null = null

const editingCardId = ref<string | null>(null)
const editExpMonth = ref(1)
const editExpYear = ref(new Date().getFullYear())
const savingCard = ref(false)
const deletingCardId = ref<string | null>(null)
const settingDefaultId = ref<string | null>(null)

const yearOptions = computed(() => {
  const y = new Date().getFullYear()
  return Array.from({ length: 16 }, (_, i) => y + i)
})

const packs = CREDIT_TOPUP_PACKS
const canTopUp = computed(() => data.value?.planTier === 'pro')
const showTopUpUrgent = computed(
  () => canTopUp.value && Number(data.value?.creditsRemaining ?? 0) <= 0,
)
const usingNewCard = computed(() => selectedPaymentMethod.value === 'new')
const selectedPackMeta = computed(() => packs.find((p) => p.id === selectedPack.value))


/** Show cancel/resume whenever Pro has (or may have) a Stripe subscription. */
const canManageSubscription = computed(() => {
  const d = data.value
  if (!d || d.planTier !== 'pro') return false
  if (d.subscription) {
    const status = d.subscription.status
    return (
      status === 'active' ||
      status === 'trialing' ||
      status === 'past_due' ||
      status === 'unpaid' ||
      Boolean(d.subscription.cancelAtPeriodEnd)
    )
  }
  return Boolean(d.hasStripeCustomer || d.hasSubscription)
})

const cancelPending = computed(() => Boolean(data.value?.subscription?.cancelAtPeriodEnd))

const dateLocale = computed(() => (locale.value === 'de' ? 'de-DE' : 'en-US'))

function formatDate(unix: number | null | undefined) {
  if (!unix) return '—'
  return new Intl.DateTimeFormat(dateLocale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(unix * 1000))
}

function formatMoney(amountCents: number, currency: string) {
  try {
    return new Intl.NumberFormat(dateLocale.value, {
      style: 'currency',
      currency: (currency || 'eur').toUpperCase(),
    }).format(amountCents / 100)
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency}`
  }
}

function packPriceLabel(cents: number) {
  return formatMoney(cents, 'eur')
}

async function destroyPaymentElement() {
  try {
    paymentElement?.unmount()
  } catch {
    /* ignore */
  }
  paymentElement = null
  stripeElements = null
}

async function closeCheckout() {
  checkoutOpen.value = false
  topupPayError.value = null
  await destroyPaymentElement()
  stripeInstance = null
  topupClientSecret.value = null
  topupPaymentIntentId.value = null
}

async function applyTopupCredits(paymentIntentId: string) {
  const res = await $fetch<{
    creditsAdded: number
    status: BillingStatus
  }>('/api/billing/topup-confirm', {
    method: 'POST',
    credentials: 'include',
    body: { paymentIntentId },
  })
  data.value = res.status
  await refreshCredits()
  toast.success(t('billing.topupSuccess', { n: res.creditsAdded }))
}

async function confirmTopupFromQuery() {
  const paymentIntentId =
    typeof route.query.payment_intent === 'string' ? route.query.payment_intent : ''
  const sessionId = typeof route.query.session_id === 'string' ? route.query.session_id : ''

  if (route.query.topup === 'cancel') {
    toast.info(t('billing.topupCanceled'))
    await router.replace({ path: '/account/billing', query: {} })
    return
  }

  if (route.query.payment_intent_client_secret && paymentIntentId.startsWith('pi_')) {
    try {
      await applyTopupCredits(paymentIntentId)
    } catch (err: unknown) {
      const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
      toast.error(e.data?.statusMessage || e.statusMessage || t('billing.topupFailed'))
    } finally {
      await closeCheckout()
      await router.replace({ path: '/account/billing', query: {} })
    }
    return
  }

  if (route.query.topup === 'success' && sessionId.startsWith('cs_')) {
    try {
      const res = await $fetch<{
        creditsAdded: number
        status: BillingStatus
      }>('/api/billing/topup-confirm', {
        method: 'POST',
        credentials: 'include',
        body: { sessionId },
      })
      data.value = res.status
      await refreshCredits()
      toast.success(t('billing.topupSuccess', { n: res.creditsAdded }))
    } catch (err: unknown) {
      const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
      toast.error(e.data?.statusMessage || e.statusMessage || t('billing.topupFailed'))
    } finally {
      await closeCheckout()
      await router.replace({ path: '/account/billing', query: {} })
    }
  }
}

async function mountNewCardElement() {
  await destroyPaymentElement()
  if (!stripeInstance || !topupClientSecret.value || !paymentElementMount.value) return

  stripeElements = stripeInstance.elements({
    clientSecret: topupClientSecret.value,
    appearance: {
      theme: 'stripe',
      variables: { borderRadius: '12px' },
    },
  })
  paymentElement = stripeElements.create('payment', {
    layout: 'tabs',
  })
  paymentElement.mount(paymentElementMount.value)
}

watch(selectedPaymentMethod, async (value) => {
  if (!checkoutOpen.value) return
  if (value === 'new') {
    await nextTick()
    await mountNewCardElement()
  } else {
    await destroyPaymentElement()
  }
})

onMounted(() => {
  void confirmTopupFromQuery()
})

onBeforeUnmount(() => {
  void destroyPaymentElement()
})

async function cancelSubscription() {
  const ok = await confirm({
    title: t('billing.cancelTitle'),
    message: t('billing.cancelMessage'),
    confirmLabel: t('billing.cancelConfirm'),
    danger: true,
  })
  if (!ok) return

  canceling.value = true
  try {
    const res = await $fetch<{ status: BillingStatus }>('/api/billing/cancel', {
      method: 'POST',
      credentials: 'include',
    })
    data.value = res.status
    toast.success(t('billing.cancelScheduled'))
    await refreshCredits()
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    toast.error(e.data?.statusMessage || e.statusMessage || t('billing.cancelFailed'))
  } finally {
    canceling.value = false
  }
}

async function resumeSubscription() {
  resuming.value = true
  try {
    const res = await $fetch<{ status: BillingStatus }>('/api/billing/resume', {
      method: 'POST',
      credentials: 'include',
    })
    data.value = res.status
    toast.success(t('billing.resumeSuccess'))
    await refreshCredits()
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    toast.error(e.data?.statusMessage || e.statusMessage || t('billing.resumeFailed'))
  } finally {
    resuming.value = false
  }
}

function startEditCard(pm: { id: string; expMonth: number; expYear: number }) {
  editingCardId.value = pm.id
  editExpMonth.value = pm.expMonth || 1
  editExpYear.value = pm.expYear || new Date().getFullYear()
}

function cancelEditCard() {
  editingCardId.value = null
}

async function saveCardEdit(pmId: string) {
  savingCard.value = true
  try {
    const res = await $fetch<{ status: BillingStatus }>(`/api/billing/payment-methods/${pmId}`, {
      method: 'PATCH',
      credentials: 'include',
      body: { expMonth: editExpMonth.value, expYear: editExpYear.value },
    })
    data.value = res.status
    editingCardId.value = null
    toast.success(t('billing.cardUpdated'))
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    toast.error(e.data?.statusMessage || e.statusMessage || t('billing.cardUpdateFailed'))
  } finally {
    savingCard.value = false
  }
}

async function setDefaultCard(pmId: string) {
  settingDefaultId.value = pmId
  try {
    const res = await $fetch<{ status: BillingStatus }>(`/api/billing/payment-methods/${pmId}`, {
      method: 'PATCH',
      credentials: 'include',
      body: { setDefault: true },
    })
    data.value = res.status
    toast.success(t('billing.cardDefaultSet'))
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    toast.error(e.data?.statusMessage || e.statusMessage || t('billing.cardUpdateFailed'))
  } finally {
    settingDefaultId.value = null
  }
}

async function deleteCard(pm: { id: string; last4: string; isDefault: boolean }) {
  const ok = await confirm({
    title: t('billing.deleteCardTitle'),
    message: t('billing.deleteCardMessage', { last4: pm.last4 }),
    confirmLabel: t('billing.deleteCardConfirm'),
    danger: true,
  })
  if (!ok) return

  deletingCardId.value = pm.id
  try {
    const res = await $fetch<{ status: BillingStatus }>(`/api/billing/payment-methods/${pm.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    data.value = res.status
    if (editingCardId.value === pm.id) editingCardId.value = null
    toast.success(t('billing.cardDeleted'))
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    toast.error(e.data?.statusMessage || e.statusMessage || t('billing.cardDeleteFailed'))
  } finally {
    deletingCardId.value = null
  }
}

async function startTopup() {
  if (!canTopUp.value) {
    await navigateTo('/pricing')
    return
  }

  toppingUp.value = true
  topupPayError.value = null
  try {
    await destroyPaymentElement()
    const res = await $fetch<{
      mode: 'payment_intent'
      clientSecret: string
      paymentIntentId: string
      publishableKey: string
      pack: { id: string; credits: number; eurCents: number }
      paymentMethods: SavedTopupCard[]
      defaultPaymentMethodId: string | null
    }>('/api/billing/topup', {
      method: 'POST',
      credentials: 'include',
      body: { packId: selectedPack.value },
    })

    topupClientSecret.value = res.clientSecret
    topupPaymentIntentId.value = res.paymentIntentId
    topupPublishableKey.value = res.publishableKey
    topupSavedCards.value = res.paymentMethods || []
    topupPackLabel.value = t('billing.topupCredits', { n: res.pack.credits })

    const defaultId =
      res.defaultPaymentMethodId ||
      res.paymentMethods.find((c) => c.isDefault)?.id ||
      res.paymentMethods[0]?.id ||
      null
    selectedPaymentMethod.value = defaultId || 'new'

    const stripe = await loadStripe(res.publishableKey)
    if (!stripe) throw new Error('Stripe.js failed to load')
    stripeInstance = stripe

    checkoutOpen.value = true
    await nextTick()
    if (selectedPaymentMethod.value === 'new') {
      await mountNewCardElement()
    }
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string; message?: string }
    toast.error(e.data?.statusMessage || e.statusMessage || e.message || t('billing.topupFailed'))
    checkoutOpen.value = false
  } finally {
    toppingUp.value = false
  }
}

async function payTopup() {
  if (!stripeInstance || !topupClientSecret.value || !topupPaymentIntentId.value) return

  payingTopup.value = true
  topupPayError.value = null

  try {
    const returnUrl = `${window.location.origin}/account/billing?topup=success`

    let result: { error?: { message?: string }; paymentIntent?: { id: string; status: string } }

    if (selectedPaymentMethod.value !== 'new') {
      result = await stripeInstance.confirmCardPayment(topupClientSecret.value, {
        payment_method: selectedPaymentMethod.value,
      })
    } else {
      if (!stripeElements) {
        await mountNewCardElement()
      }
      if (!stripeElements) throw new Error('Card form failed to load')

      result = await stripeInstance.confirmPayment({
        elements: stripeElements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'if_required',
      })
    }

    if (result.error) {
      topupPayError.value = result.error.message || t('billing.topupFailed')
      return
    }

    const pi = result.paymentIntent
    if (pi?.status === 'succeeded') {
      await applyTopupCredits(pi.id)
      await closeCheckout()
      return
    }

    if (pi?.status === 'requires_action' || pi?.status === 'processing') {
      topupPayError.value = t('billing.topupProcessing')
      return
    }

    topupPayError.value = t('billing.topupFailed')
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string; message?: string }
    topupPayError.value = e.data?.statusMessage || e.statusMessage || e.message || t('billing.topupFailed')
  } finally {
    payingTopup.value = false
  }
}
</script>

<template>
  <div class="p-6 lg:p-10 max-w-3xl">
    <div class="mb-8">
      <p class="text-xs uppercase tracking-widest text-[color:var(--app-muted)] font-semibold mb-2">
        {{ t('nav.account') }}
      </p>
      <h1 class="text-2xl font-bold text-[color:var(--app-fg)] mb-1">{{ t('billing.title') }}</h1>
      <p class="text-sm text-[color:var(--app-muted)]">{{ t('billing.subtitle') }}</p>
    </div>

    <div v-if="pending && !data" class="text-sm text-[color:var(--app-muted)]">
      {{ t('common.loading') }}
    </div>

    <div v-else-if="error" class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      {{ t('billing.loadFailed') }}
      <button type="button" class="ml-2 underline cursor-pointer" @click="refresh()">
        {{ t('billing.retry') }}
      </button>
    </div>

    <template v-else-if="data">
      <!-- Plan summary -->
      <section class="rounded-2xl border border-[color:var(--app-border)] bg-[color:var(--app-input)] p-6 mb-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-xs uppercase tracking-wider text-[color:var(--app-muted)] font-semibold">
              {{ t('billing.currentPlan') }}
            </p>
            <p class="mt-1 text-2xl font-bold text-[color:var(--app-fg)] uppercase">
              {{ data.planTier }}
            </p>
            <p class="mt-2 text-sm text-[color:var(--app-muted)]">
              {{ t('billing.creditsRemaining', { n: data.creditsRemaining }) }}
            </p>
            <p class="mt-1 text-xs text-[color:var(--app-muted)] truncate">{{ data.email }}</p>
          </div>

          <div class="flex flex-wrap gap-2">
            <NuxtLink
              v-if="data.planTier !== 'pro'"
              to="/pricing"
              class="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition"
            >
              {{ t('pricing.upgrade') }}
            </NuxtLink>
            <template v-else>
              <NuxtLink
                to="/pricing"
                class="rounded-xl border border-[color:var(--app-border)] px-4 py-2.5 text-sm font-semibold text-[color:var(--app-fg)] hover:bg-[color:var(--app-bg-elevated)] transition"
              >
                {{ t('billing.viewPlans') }}
              </NuxtLink>
              <button
                v-if="canManageSubscription && !cancelPending"
                type="button"
                :disabled="canceling"
                class="rounded-xl border border-red-500/40 text-red-300 hover:bg-red-500/10 px-4 py-2.5 text-sm font-semibold disabled:opacity-50 cursor-pointer"
                @click="cancelSubscription"
              >
                {{ canceling ? t('common.loading') : t('billing.cancelPro') }}
              </button>
              <button
                v-else-if="canManageSubscription && cancelPending"
                type="button"
                :disabled="resuming"
                class="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50 cursor-pointer"
                @click="resumeSubscription"
              >
                {{ resuming ? t('common.loading') : t('billing.resumePro') }}
              </button>
            </template>
          </div>
        </div>

        <div
          v-if="data.subscription"
          class="mt-5 pt-5 border-t border-[color:var(--app-border)] space-y-2 text-sm"
        >
          <p class="text-[color:var(--app-fg)]">
            <span class="text-[color:var(--app-muted)]">{{ t('billing.subscriptionStatus') }}:</span>
            <span class="ml-1 font-semibold capitalize">{{ data.subscription.status }}</span>
          </p>
          <p v-if="data.subscription.currentPeriodEnd" class="text-[color:var(--app-muted)]">
            <template v-if="data.subscription.cancelAtPeriodEnd">
              {{ t('billing.accessUntil', { date: formatDate(data.subscription.currentPeriodEnd) }) }}
            </template>
            <template v-else>
              {{ t('billing.renewsOn', { date: formatDate(data.subscription.currentPeriodEnd) }) }}
            </template>
          </p>
          <p
            v-if="data.subscription.cancelAtPeriodEnd"
            class="text-amber-300/90 text-xs"
          >
            {{ t('billing.cancelPendingHint') }}
          </p>
        </div>

        <div
          v-else-if="data.planTier === 'pro' && !canManageSubscription"
          class="mt-5 pt-5 border-t border-[color:var(--app-border)] text-sm text-[color:var(--app-muted)]"
        >
          {{ t('billing.proNoStripe') }}
        </div>
      </section>

      <!-- Cancel / resume subscription (before top-up so it's easy to find) -->
      <section
        v-if="canManageSubscription"
        id="manage-subscription"
        class="rounded-2xl border border-[color:var(--app-border)] bg-[color:var(--app-input)] p-6 mb-6"
      >
        <h2 class="text-lg font-semibold text-[color:var(--app-fg)] mb-1">{{ t('billing.manageTitle') }}</h2>
        <p class="text-sm text-[color:var(--app-muted)] mb-4">
          {{ cancelPending ? t('billing.cancelPendingHint') : t('billing.manageHelp') }}
        </p>

        <div class="flex flex-wrap gap-2">
          <button
            v-if="!cancelPending"
            type="button"
            :disabled="canceling"
            class="rounded-xl border border-red-500/40 text-red-300 hover:bg-red-500/10 px-4 py-2.5 text-sm font-semibold disabled:opacity-50 cursor-pointer"
            @click="cancelSubscription"
          >
            {{ canceling ? t('common.loading') : t('billing.cancelPro') }}
          </button>
          <button
            v-else
            type="button"
            :disabled="resuming"
            class="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50 cursor-pointer"
            @click="resumeSubscription"
          >
            {{ resuming ? t('common.loading') : t('billing.resumePro') }}
          </button>
        </div>
      </section>

      <!-- Credit top-up (Pro, mid-cycle) -->
      <section
        v-if="canTopUp"
        class="rounded-2xl border p-6 mb-6"
        :class="
          showTopUpUrgent
            ? 'border-amber-400/40 bg-amber-500/10'
            : 'border-[color:var(--app-border)] bg-[color:var(--app-input)]'
        "
      >
        <h2 class="text-lg font-semibold text-[color:var(--app-fg)] mb-1">{{ t('billing.topupTitle') }}</h2>
        <p class="text-sm text-[color:var(--app-muted)] mb-4">
          {{ showTopUpUrgent ? t('billing.topupHelpEmpty') : t('billing.topupHelp') }}
        </p>

        <div class="grid sm:grid-cols-3 gap-3 mb-4">
          <button
            v-for="pack in packs"
            :key="pack.id"
            type="button"
            class="rounded-xl border px-4 py-3 text-left transition cursor-pointer"
            :class="
              selectedPack === pack.id
                ? 'border-indigo-400 bg-indigo-500/15 shadow-sm'
                : 'border-[color:var(--app-border)] hover:bg-[color:var(--app-bg-elevated)]'
            "
            @click="selectedPack = pack.id"
          >
            <p class="text-sm font-bold text-[color:var(--app-fg)]">
              {{ t('billing.topupCredits', { n: pack.credits }) }}
            </p>
            <p class="text-xs text-[color:var(--app-muted)] mt-1">{{ packPriceLabel(pack.eurCents) }}</p>
          </button>
        </div>

        <button
          type="button"
          :disabled="toppingUp"
          class="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50 cursor-pointer"
          @click="startTopup"
        >
          {{ toppingUp ? t('common.loading') : t('billing.topupBuy') }}
        </button>
      </section>

      <!-- Payment methods -->
      <section class="rounded-2xl border border-[color:var(--app-border)] bg-[color:var(--app-input)] p-6 mb-6">
        <h2 class="text-lg font-semibold text-[color:var(--app-fg)] mb-1">{{ t('billing.paymentMethods') }}</h2>
        <p class="text-sm text-[color:var(--app-muted)] mb-4">{{ t('billing.paymentMethodsHelp') }}</p>

        <p v-if="!data.paymentMethods?.length" class="text-sm text-[color:var(--app-muted)] italic">
          {{ t('billing.noPaymentMethods') }}
        </p>
        <ul v-else class="space-y-3">
          <li
            v-for="pm in data.paymentMethods"
            :key="pm.id"
            class="rounded-xl border border-[color:var(--app-border)] px-4 py-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-sm font-semibold text-[color:var(--app-fg)] capitalize">
                  {{ pm.brand }}
                  {{ t('billing.cardEnding', { last4: pm.last4 }) }}
                  <span
                    v-if="pm.isDefault"
                    class="ml-2 text-[10px] uppercase tracking-wider font-bold text-emerald-400"
                  >{{ t('billing.defaultCard') }}</span>
                </p>
                <p class="text-xs text-[color:var(--app-muted)] mt-0.5">
                  {{ t('billing.expires', { month: String(pm.expMonth).padStart(2, '0'), year: pm.expYear }) }}
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  v-if="!pm.isDefault"
                  type="button"
                  class="text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer disabled:opacity-50"
                  :disabled="settingDefaultId === pm.id"
                  @click="setDefaultCard(pm.id)"
                >
                  {{ settingDefaultId === pm.id ? t('common.loading') : t('billing.setDefaultCard') }}
                </button>
                <button
                  type="button"
                  class="text-xs font-semibold text-[color:var(--app-muted)] hover:text-[color:var(--app-fg)] cursor-pointer"
                  @click="editingCardId === pm.id ? cancelEditCard() : startEditCard(pm)"
                >
                  {{ editingCardId === pm.id ? t('common.cancel') : t('billing.editCard') }}
                </button>
                <button
                  type="button"
                  class="text-xs font-semibold text-red-400 hover:text-red-300 cursor-pointer disabled:opacity-50"
                  :disabled="deletingCardId === pm.id"
                  @click="deleteCard(pm)"
                >
                  {{ deletingCardId === pm.id ? t('common.loading') : t('billing.deleteCard') }}
                </button>
              </div>
            </div>

            <div
              v-if="editingCardId === pm.id"
              class="mt-3 pt-3 border-t border-[color:var(--app-border)] flex flex-wrap items-end gap-3"
            >
              <div>
                <label class="text-[10px] uppercase tracking-wider text-[color:var(--app-muted)] font-semibold">
                  {{ t('billing.expMonth') }}
                </label>
                <select
                  v-model.number="editExpMonth"
                  class="mt-1 block rounded-lg bg-[color:var(--app-bg-elevated)] border border-[color:var(--app-border)] px-3 py-2 text-sm text-[color:var(--app-fg)]"
                >
                  <option v-for="m in 12" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-[color:var(--app-muted)] font-semibold">
                  {{ t('billing.expYear') }}
                </label>
                <select
                  v-model.number="editExpYear"
                  class="mt-1 block rounded-lg bg-[color:var(--app-bg-elevated)] border border-[color:var(--app-border)] px-3 py-2 text-sm text-[color:var(--app-fg)]"
                >
                  <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
                </select>
              </div>
              <button
                type="button"
                :disabled="savingCard"
                class="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 text-sm font-semibold disabled:opacity-50 cursor-pointer"
                @click="saveCardEdit(pm.id)"
              >
                {{ savingCard ? t('common.loading') : t('billing.saveCard') }}
              </button>
            </div>
          </li>
        </ul>
      </section>

      <!-- Invoices / payments -->
      <section class="rounded-2xl border border-[color:var(--app-border)] bg-[color:var(--app-input)] p-6">
        <h2 class="text-lg font-semibold text-[color:var(--app-fg)] mb-1">{{ t('billing.invoicesTitle') }}</h2>
        <p class="text-sm text-[color:var(--app-muted)] mb-4">{{ t('billing.invoicesHelp') }}</p>

        <p v-if="!data.invoices.length" class="text-sm text-[color:var(--app-muted)] italic">
          {{ t('billing.noInvoices') }}
        </p>

        <ul v-else class="divide-y divide-[color:var(--app-border)]">
          <li
            v-for="inv in data.invoices"
            :key="inv.id"
            class="py-3 flex flex-wrap items-center justify-between gap-3 text-sm"
          >
            <div class="min-w-0">
              <p class="font-semibold text-[color:var(--app-fg)]">
                {{ inv.description || inv.number || inv.id.slice(0, 12) }}
              </p>
              <p class="text-xs text-[color:var(--app-muted)] mt-0.5">
                {{ formatDate(inv.created) }}
                ·
                <span class="capitalize">{{ inv.status || '—' }}</span>
                <span v-if="inv.number && inv.description" class="ml-1">· {{ inv.number }}</span>
              </p>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <span class="font-semibold text-[color:var(--app-fg)] tabular-nums">
                {{ formatMoney(inv.amountPaid, inv.currency) }}
              </span>
              <a
                v-if="inv.hostedInvoiceUrl"
                :href="inv.hostedInvoiceUrl"
                target="_blank"
                rel="noopener"
                class="text-indigo-400 hover:text-indigo-300 text-xs font-semibold"
              >
                {{ inv.kind === 'charge' ? t('billing.viewReceipt') : t('billing.viewInvoice') }}
              </a>
            </div>
          </li>
        </ul>
      </section>
    </template>

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
              <h2 class="text-lg font-bold text-[color:var(--app-fg)]">{{ t('billing.topupCheckoutTitle') }}</h2>
              <p class="text-xs text-[color:var(--app-muted)] mt-0.5">
                {{ topupPackLabel }}
                <span v-if="selectedPackMeta"> · {{ packPriceLabel(selectedPackMeta.eurCents) }}</span>
              </p>
            </div>
            <button
              type="button"
              class="rounded-lg border border-[color:var(--app-border)] px-3 py-1.5 text-xs font-semibold text-[color:var(--app-muted)] hover:text-[color:var(--app-fg)] cursor-pointer"
              @click="closeCheckout"
            >
              {{ t('pricing.closeCheckout') }}
            </button>
          </div>

          <div class="overflow-y-auto flex-1 px-5 py-4 space-y-4">
            <p class="text-sm text-[color:var(--app-muted)]">{{ t('billing.topupPayHelp') }}</p>

            <div v-if="topupSavedCards.length" class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-wider text-[color:var(--app-muted)]">
                {{ t('billing.payWithSavedCard') }}
              </p>
              <label
                v-for="card in topupSavedCards"
                :key="card.id"
                class="flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition"
                :class="
                  selectedPaymentMethod === card.id
                    ? 'border-indigo-400 bg-indigo-500/10'
                    : 'border-[color:var(--app-border)] hover:bg-[color:var(--app-input)]'
                "
              >
                <input
                  v-model="selectedPaymentMethod"
                  type="radio"
                  class="accent-indigo-500"
                  :value="card.id"
                >
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold text-[color:var(--app-fg)] capitalize">
                    {{ card.brand }}
                    {{ t('billing.cardEnding', { last4: card.last4 }) }}
                    <span
                      v-if="card.isDefault"
                      class="ml-2 text-[10px] uppercase tracking-wider font-bold text-emerald-400"
                    >{{ t('billing.defaultCard') }}</span>
                  </p>
                  <p class="text-xs text-[color:var(--app-muted)]">
                    {{ t('billing.expires', { month: String(card.expMonth).padStart(2, '0'), year: card.expYear }) }}
                  </p>
                </div>
              </label>
            </div>

            <label
              class="flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition"
              :class="
                usingNewCard
                  ? 'border-indigo-400 bg-indigo-500/10'
                  : 'border-[color:var(--app-border)] hover:bg-[color:var(--app-input)]'
              "
            >
              <input
                v-model="selectedPaymentMethod"
                type="radio"
                class="accent-indigo-500"
                value="new"
              >
              <span class="text-sm font-semibold text-[color:var(--app-fg)]">
                {{ t('billing.payWithNewCard') }}
              </span>
            </label>

            <div
              v-show="usingNewCard"
              class="rounded-xl border border-[color:var(--app-border)] bg-white p-3 min-h-[120px]"
            >
              <div ref="paymentElementMount" />
            </div>

            <p v-if="topupPayError" class="text-sm text-red-400">{{ topupPayError }}</p>

            <button
              type="button"
              :disabled="payingTopup"
              class="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-3 text-sm font-bold disabled:opacity-50 cursor-pointer"
              @click="payTopup"
            >
              {{
                payingTopup
                  ? t('common.loading')
                  : t('billing.payNow', {
                      amount: selectedPackMeta ? packPriceLabel(selectedPackMeta.eurCents) : '',
                    })
              }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
