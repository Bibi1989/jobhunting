<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'
const { t } = useI18n()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const { fetchSession, refreshCredits, applySessionUser } = useSaaS()

async function onSubmit() {
  loading.value = true
  error.value = null
  try {
    await $fetch<{
      user: {
        id: string
        email: string
        planTier?: 'free' | 'pro'
        role?: 'admin' | 'user'
        creditsRemaining?: number
      }
    }>('/api/auth/register', {
      method: 'POST',
      body: { email: email.value, password: password.value },
      credentials: 'include',
    }).then((res) => {
      if (res?.user) applySessionUser(res.user)
    })
    await fetchSession()
    await refreshCredits()
    await navigateTo('/')
  } catch (err: unknown) {
    const e = err as {
      data?: { statusMessage?: string; detail?: string; message?: string }
      statusMessage?: string
      message?: string
    }
    error.value =
      e.data?.statusMessage ||
      e.data?.detail ||
      e.data?.message ||
      e.statusMessage ||
      e.message ||
      'Registration failed'
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
      <h1 class="text-2xl font-bold text-[color:var(--app-fg)] mb-1">{{ t('auth.createAccount') }}</h1>
      <p class="text-sm text-[color:var(--app-muted)] mb-6">{{ t('auth.registerSubtitle') }}</p>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="text-xs uppercase tracking-wider text-[color:var(--app-muted)] font-semibold">{{ t('auth.email') }}</label>
          <input
            v-model="email"
            type="email"
            required
            class="mt-1 w-full rounded-xl bg-[color:var(--app-input)] border border-[color:var(--app-border)] px-4 py-2.5 text-[color:var(--app-fg)] outline-none focus:border-indigo-400"
          />
        </div>
        <div>
          <label class="text-xs uppercase tracking-wider text-[color:var(--app-muted)] font-semibold">{{ t('auth.password') }}</label>
          <div class="relative mt-1">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              minlength="8"
              class="w-full rounded-xl bg-[color:var(--app-input)] border border-[color:var(--app-border)] px-4 py-2.5 text-[color:var(--app-fg)] outline-none focus:border-indigo-400 pr-10"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--app-muted)] hover:text-[color:var(--app-fg)] focus:outline-none transition-colors"
              title="Toggle password visibility"
              @click="showPassword = !showPassword"
            >
              <Eye v-if="!showPassword" :size="18" />
              <EyeOff v-else :size="18" />
            </button>
          </div>
        </div>
        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 font-bold text-sm disabled:opacity-50 text-white"
        >
          {{ loading ? t('auth.creating') : t('auth.createAccountBtn') }}
        </button>
      </form>

      <p class="mt-6 text-sm text-[color:var(--app-muted)] text-center">
        {{ t('auth.haveAccount') }}
        <NuxtLink to="/login" class="text-indigo-400 hover:text-indigo-300 font-semibold">{{ t('auth.signIn') }}</NuxtLink>
      </p>
    </div>
  </div>
</template>
