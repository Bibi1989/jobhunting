<script setup lang="ts">
const { loggedIn, sessionUser, creditsRemaining, planTier, isPro, isAdmin, logout } = useSaaS()
const { t } = useI18n()
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
      :title="sessionUser?.email || t('nav.account')"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="open = !open"
      @blur="closeSoon"
    >
      {{ initials }}
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-bg-elevated)] shadow-2xl z-50 overflow-hidden"
      role="menu"
    >
      <div class="px-3 py-2 border-b border-[color:var(--app-border)]">
        <p class="text-xs text-[color:var(--app-muted)] truncate">{{ sessionUser?.email }}</p>
        <p class="text-[11px] text-indigo-400 mt-0.5">
          {{ planTier }} · {{ creditsRemaining }} cr
          <span v-if="isPro" class="text-emerald-500">· pro</span>
          <span v-if="isAdmin" class="text-amber-500">· admin</span>
        </p>
      </div>
      <NuxtLink
        to="/account"
        class="block px-3 py-2.5 text-sm text-[color:var(--app-fg)] hover:bg-[color:var(--app-input)] cursor-pointer"
        role="menuitem"
        @click="open = false"
      >
        {{ t('nav.account') }}
      </NuxtLink>
      <NuxtLink
        to="/pricing"
        class="block px-3 py-2.5 text-sm text-[color:var(--app-fg)] hover:bg-[color:var(--app-input)] cursor-pointer"
        role="menuitem"
        @click="open = false"
      >
        {{ t('nav.billing') }}
      </NuxtLink>
      <button
        type="button"
        class="w-full text-left px-3 py-2.5 text-sm text-red-400 hover:bg-[color:var(--app-input)] cursor-pointer"
        role="menuitem"
        @click="onLogout"
      >
        {{ t('nav.logOut') }}
      </button>
    </div>
  </div>
</template>
