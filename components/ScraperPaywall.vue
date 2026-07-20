<script setup lang="ts">
const { canAccessScraper, loggedIn, creditsRemaining, scraperBlockedMessage, pending } = useSaaS()

const message = computed(() => scraperBlockedMessage())
</script>

<template>
  <div
    v-if="!canAccessScraper && !pending"
    class="w-full rounded-2xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
  >
    <div class="flex items-start gap-3 flex-1 min-w-0">
      <span class="material-symbols-outlined text-amber-400 shrink-0 text-[22px]">info</span>
      <div class="min-w-0">
        <p class="text-sm font-semibold text-amber-100">
          {{ loggedIn ? 'Scraping disabled' : 'Sign in required' }}
        </p>
        <p class="text-xs text-slate-400 mt-0.5">
          {{ message }}
          <span v-if="loggedIn" class="text-slate-500"> ({{ creditsRemaining }} credits left)</span>
        </p>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-2 shrink-0">
      <NuxtLink
        v-if="!loggedIn"
        to="/login"
        class="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 cursor-pointer"
      >
        Sign in
      </NuxtLink>
      <NuxtLink
        v-if="!loggedIn"
        to="/register"
        class="px-3 py-1.5 rounded-xl border border-white/15 text-slate-200 text-xs font-bold hover:bg-white/5 cursor-pointer"
      >
        Register
      </NuxtLink>
      <NuxtLink
        to="/pricing"
        class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold cursor-pointer"
      >
        {{ loggedIn ? 'Get credits' : 'View pricing' }}
      </NuxtLink>
    </div>
  </div>
</template>
