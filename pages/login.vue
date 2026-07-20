<script setup lang="ts">
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const route = useRoute()
const { fetchSession, refreshCredits, applySessionUser } = useSaaS()

async function onSubmit() {
  loading.value = true
  error.value = null
  try {
    await $fetch<{ user: { id: string; email: string; planTier?: SaasPlanTier; role?: SaasUserRole; creditsRemaining?: number } }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: { email: email.value, password: password.value },
        credentials: 'include',
      },
    ).then((res) => {
      if (res?.user) applySessionUser(res.user)
    })
    await fetchSession()
    await refreshCredits()
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await navigateTo(redirect)
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string; detail?: string }; statusMessage?: string }
    error.value = e.data?.statusMessage || e.data?.detail || e.statusMessage || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-slate-100 flex items-center justify-center p-6">
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-xl p-8 shadow-2xl">
      <h1 class="text-2xl font-bold text-white mb-1">Welcome back</h1>
      <p class="text-sm text-slate-400 mb-6">Sign in to JobFlow AI to use credits and scraping.</p>

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
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-white outline-none focus:border-indigo-400"
          />
        </div>
        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 font-bold text-sm disabled:opacity-50"
        >
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <p class="mt-6 text-sm text-slate-400 text-center">
        No account?
        <NuxtLink to="/register" class="text-indigo-300 hover:text-indigo-200 font-semibold">Register</NuxtLink>
      </p>
    </div>
  </div>
</template>
