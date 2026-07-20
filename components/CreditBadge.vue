<script setup lang="ts">
const { creditsRemaining, planTier, loggedIn, pending } = useSaaS()
</script>

<template>
  <NuxtLink
    v-if="loggedIn"
    to="/pricing"
    class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer"
    :class="
      creditsRemaining > 0
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
        : 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
    "
    title="Credits & billing"
  >
    <span v-if="pending" class="opacity-70">…</span>
    <span v-else>{{ creditsRemaining }} cr · {{ planTier }}</span>
  </NuxtLink>
</template>
