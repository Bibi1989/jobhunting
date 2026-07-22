<script setup lang="ts">
const { t } = useI18n()
const email = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const sent = ref(false)
const message = ref('')

async function onSubmit() {
  loading.value = true
  error.value = null
  try {
    const res = await $fetch<{ ok: boolean; message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value },
    })
    sent.value = true
    message.value = res.message
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string; detail?: string }; statusMessage?: string }
    error.value = e.data?.statusMessage || e.data?.detail || e.statusMessage || 'Request failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="app-shell flex items-center justify-center p-6">
    <div class="absolute top-4 right-4 flex items-center gap-2 z-10">
      <LocaleSwitcher />
      <ThemeToggle />
    </div>
    <div class="w-full max-w-md rounded-2xl app-panel backdrop-blur-xl p-8 shadow-2xl">
      <div class="mb-6">
        <AppLogo :show-tagline="false" />
      </div>
      <h1 class="text-2xl font-bold text-[color:var(--app-fg)] mb-1">{{ t('auth.forgotTitle') }}</h1>
      <p class="text-sm text-[color:var(--app-muted)] mb-6">{{ t('auth.forgotSubtitle') }}</p>

      <div v-if="sent" class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-200">
        {{ message }}
      </div>

      <form v-else class="space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="text-xs uppercase tracking-wider text-[color:var(--app-muted)] font-semibold">{{ t('auth.email') }}</label>
          <input
            v-model="email"
            type="email"
            required
            class="mt-1 w-full rounded-xl bg-[color:var(--app-input)] border border-[color:var(--app-border)] px-4 py-2.5 text-[color:var(--app-fg)] outline-none focus:border-indigo-400"
          />
        </div>
        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 font-bold text-sm disabled:opacity-50 text-white"
        >
          {{ loading ? t('auth.sending') : t('auth.sendReset') }}
        </button>
      </form>

      <p class="mt-6 text-sm text-[color:var(--app-muted)] text-center">
        <NuxtLink to="/login" class="text-indigo-400 hover:text-indigo-300 font-semibold">{{ t('auth.backToSignIn') }}</NuxtLink>
      </p>
    </div>
  </div>
</template>
