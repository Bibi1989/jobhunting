<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})

const { t } = useI18n()
const { sessionUser, applySessionUser, fetchSession } = useSaaS()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showCurrent = ref(false)
const showNew = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

async function onSubmit() {
  error.value = null
  success.value = null

  if (newPassword.value !== confirmPassword.value) {
    error.value = 'New passwords do not match.'
    return
  }

  loading.value = true
  try {
    const res = await $fetch<{ ok: boolean; user: { id: string; email: string; planTier?: SaasPlanTier; role?: SaasUserRole; creditsRemaining?: number } }>(
      '/api/auth/change-password',
      {
        method: 'POST',
        body: {
          currentPassword: currentPassword.value,
          newPassword: newPassword.value,
        },
        credentials: 'include',
      },
    )
    if (res?.user) applySessionUser(res.user)
    await fetchSession()
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    success.value = t('account.passwordUpdated')
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string; detail?: string }; statusMessage?: string }
    error.value = e.data?.statusMessage || e.data?.detail || e.statusMessage || 'Could not change password'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="p-6 lg:p-10 max-w-xl">
    <h1 class="text-2xl font-bold text-[color:var(--app-fg)] mb-1">{{ t('account.title') }}</h1>
    <p class="text-sm text-[color:var(--app-muted)] mb-8">
      {{ t('account.signedInAs') }} <span class="text-[color:var(--app-fg)]">{{ sessionUser?.email }}</span>
      ·
      <NuxtLink to="/account/billing" class="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
        {{ t('account.billingLink') }}
      </NuxtLink>
    </p>

    <section>
      <h2 class="text-lg font-semibold text-[color:var(--app-fg)] mb-1">{{ t('account.changePassword') }}</h2>
      <p class="text-sm text-[color:var(--app-muted)] mb-6">{{ t('account.changePasswordHint') }}</p>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="text-xs uppercase tracking-wider text-[color:var(--app-muted)] font-semibold">{{ t('account.currentPassword') }}</label>
          <div class="relative mt-1">
            <input
              v-model="currentPassword"
              :type="showCurrent ? 'text' : 'password'"
              required
              class="w-full rounded-xl bg-[color:var(--app-input)] border border-[color:var(--app-border)] px-4 py-2.5 text-[color:var(--app-fg)] outline-none focus:border-indigo-400 pr-10"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--app-muted)] hover:text-[color:var(--app-fg)]"
              title="Toggle visibility"
              @click="showCurrent = !showCurrent"
            >
              <Eye v-if="!showCurrent" :size="18" />
              <EyeOff v-else :size="18" />
            </button>
          </div>
        </div>
        <div>
          <label class="text-xs uppercase tracking-wider text-[color:var(--app-muted)] font-semibold">{{ t('auth.newPassword') }}</label>
          <div class="relative mt-1">
            <input
              v-model="newPassword"
              :type="showNew ? 'text' : 'password'"
              required
              minlength="8"
              class="w-full rounded-xl bg-[color:var(--app-input)] border border-[color:var(--app-border)] px-4 py-2.5 text-[color:var(--app-fg)] outline-none focus:border-indigo-400 pr-10"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--app-muted)] hover:text-[color:var(--app-fg)]"
              title="Toggle visibility"
              @click="showNew = !showNew"
            >
              <Eye v-if="!showNew" :size="18" />
              <EyeOff v-else :size="18" />
            </button>
          </div>
        </div>
        <div>
          <label class="text-xs uppercase tracking-wider text-[color:var(--app-muted)] font-semibold">{{ t('account.confirmNewPassword') }}</label>
          <input
            v-model="confirmPassword"
            type="password"
            required
            minlength="8"
            class="mt-1 w-full rounded-xl bg-[color:var(--app-input)] border border-[color:var(--app-border)] px-4 py-2.5 text-[color:var(--app-fg)] outline-none focus:border-indigo-400"
          />
        </div>
        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
        <p v-if="success" class="text-sm text-emerald-500">{{ success }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 font-bold text-sm disabled:opacity-50 text-white"
        >
          {{ loading ? t('account.saving') : t('account.updatePassword') }}
        </button>
      </form>
    </section>
  </div>
</template>
