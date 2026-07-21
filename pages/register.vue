<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'
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
  <div class="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-slate-100 flex items-center justify-center p-6">
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-xl p-8 shadow-2xl">
      <div class="mb-6">
        <AppLogo :show-tagline="false" />
      </div>
      <h1 class="text-2xl font-bold text-white mb-1">Create your account</h1>
      <p class="text-sm text-slate-400 mb-6">Free tier includes 10 AI/scrape credits to get started.</p>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="text-xs uppercase tracking-wider text-slate-400 font-semibold">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-white outline-none focus:border-indigo-400"
          />
        </div>
        <div>
          <label class="text-xs uppercase tracking-wider text-slate-400 font-semibold">Password</label>
          <div class="relative mt-1">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              minlength="8"
              class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-white outline-none focus:border-indigo-400 pr-10"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white focus:outline-none transition-colors"
              @click="showPassword = !showPassword"
              title="Toggle password visibility"
            >
              <Eye v-if="!showPassword" :size="18" />
              <EyeOff v-else :size="18" />
            </button>
          </div>
          <p class="mt-1 text-[11px] text-slate-500">At least 8 characters.</p>
        </div>
        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 font-bold text-sm disabled:opacity-50"
        >
          {{ loading ? 'Creating…' : 'Create account' }}
        </button>
      </form>

      <p class="mt-6 text-sm text-slate-400 text-center">
        Already have an account?
        <NuxtLink to="/login" class="text-indigo-300 hover:text-indigo-200 font-semibold">Sign in</NuxtLink>
      </p>
    </div>
  </div>
</template>
