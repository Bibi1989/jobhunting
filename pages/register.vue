<script setup lang="ts">
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const { fetchSession, refreshCredits, applySessionUser } = useSaaS()

async function onSubmit() {
  loading.value = true
  error.value = null
  try {
    await $fetch<{ user: { id: string; email: string; planTier?: SaasPlanTier; role?: SaasUserRole; creditsRemaining?: number } }>(
      '/api/auth/register',
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
    await navigateTo('/')
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string; detail?: string }; statusMessage?: string }
    error.value = e.data?.statusMessage || e.data?.detail || e.statusMessage || 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-slate-100 flex items-center justify-center p-6">
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-xl p-8 shadow-2xl">
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
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-white outline-none focus:border-indigo-400"
          />
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
