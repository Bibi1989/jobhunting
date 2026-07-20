<script setup lang="ts">
const { loggedIn, sessionUser, creditsRemaining, planTier, isPro, isAdmin, logout } = useSaaS()
const open = ref(false)

const initials = computed(() => {
  const email = sessionUser.value?.email || ''
  const local = email.split('@')[0] || '?'
  const parts = local.replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] || ''}${parts[1]![0] || ''}`.toUpperCase()
  }
  return local.slice(0, 2).toUpperCase() || '?'
})

function closeSoon() {
  window.setTimeout(() => {
    open.value = false
  }, 150)
}

async function onLogout() {
  open.value = false
  await logout()
}
</script>

<template>
  <div v-if="loggedIn" class="relative shrink-0">
    <button
      type="button"
      class="w-10 h-10 rounded-full border border-indigo-400/40 bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-xs font-bold flex items-center justify-center cursor-pointer shadow-md shadow-indigo-500/20 hover:scale-105 transition-transform"
      :title="sessionUser?.email || 'Account'"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="open = !open"
      @blur="closeSoon"
    >
      {{ initials }}
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-700 bg-slate-950 shadow-2xl z-50 overflow-hidden"
      role="menu"
    >
      <div class="px-3 py-2 border-b border-slate-800">
        <p class="text-xs text-slate-400 truncate">{{ sessionUser?.email }}</p>
        <p class="text-[11px] text-indigo-300 mt-0.5">
          {{ planTier }} · {{ creditsRemaining }} cr
          <span v-if="isPro" class="text-emerald-400">· pro</span>
          <span v-if="isAdmin" class="text-amber-300">· admin</span>
        </p>
      </div>
      <NuxtLink
        to="/pricing"
        class="block px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-900 cursor-pointer"
        role="menuitem"
        @click="open = false"
      >
        Billing & credits
      </NuxtLink>
      <button
        type="button"
        class="w-full text-left px-3 py-2.5 text-sm text-red-300 hover:bg-slate-900 cursor-pointer"
        role="menuitem"
        @click="onLogout"
      >
        Log out
      </button>
    </div>
  </div>
</template>
