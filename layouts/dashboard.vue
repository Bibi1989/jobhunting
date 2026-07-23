<script setup lang="ts">
const { loggedIn } = useSaaS()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const mobileOpen = ref(false)

function goBack() {
  if (import.meta.client && window.history.length > 1) {
    router.back()
    return
  }
  void router.push('/')
}

const topNav = computed(() => [
  { label: t('nav.myProjects'), to: '/builder' },
  { label: t('nav.templates'), to: '/builder/templates' },
  { label: t('nav.applyViaEmail'), to: '/builder/apply-email' },
  { label: t('nav.portfolio'), to: '/dashboard/portfolio' },
  { label: t('nav.analytics'), to: '/dashboard/analytics' },
])

const sideNav = computed(() => [
  { label: t('nav.allProjects'), to: '/builder', icon: 'folder' },
  { label: t('nav.templates'), to: '/builder/templates', icon: 'grid_view' },
  { label: t('nav.applyViaEmail'), to: '/builder/apply-email', icon: 'mail' },
  { label: t('nav.aiPortfolio'), to: '/dashboard/portfolio', icon: 'stars' },
  { label: t('nav.analytics'), to: '/dashboard/analytics', icon: 'monitoring' },
  { label: t('nav.account'), to: '/account', icon: 'manage_accounts' },
  { label: t('nav.billing'), to: '/account/billing', icon: 'credit_card' },
])

watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false
  },
)
</script>

<template>
  <div class="app-shell selection:bg-blue-500/30">
    <!-- TopNavBar -->
    <header class="flex justify-between items-center px-4 sm:px-6 h-16 w-full fixed top-0 z-50 bg-[color:var(--app-bg-elevated)]/70 backdrop-blur-md border-b border-[color:var(--app-border)]">
      <div class="flex items-center gap-2 sm:gap-8">
        <button
          type="button"
          class="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[color:var(--app-border)] text-[color:var(--app-fg)] hover:bg-[color:var(--app-input)]"
          :aria-label="t('nav.back')"
          @click="goBack"
        >
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <button
          type="button"
          class="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[color:var(--app-border)] text-[color:var(--app-fg)] hover:bg-[color:var(--app-input)]"
          :aria-label="mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')"
          @click="mobileOpen = !mobileOpen"
        >
          <span class="material-symbols-outlined">{{ mobileOpen ? 'close' : 'menu' }}</span>
        </button>
        <AppLogo size="sm" :show-tagline="false" />
        <nav class="hidden lg:flex gap-6 items-center h-full">
          <NuxtLink
            v-for="item in topNav"
            :key="item.to"
            :to="item.to"
            class="font-semibold text-[color:var(--app-muted)] hover:text-[color:var(--app-fg)] transition-colors duration-200"
            active-class="!text-blue-500 border-b-2 border-blue-500 pb-1"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
      </div>
      <div class="flex items-center gap-2 sm:gap-3">
        <LocaleSwitcher />
        <ThemeToggle />
        <CreditBadge />
        <NuxtLink
          v-if="!loggedIn"
          to="/login"
          class="text-sm text-[color:var(--app-muted)] hover:text-[color:var(--app-fg)] cursor-pointer"
        >
          {{ t('nav.signIn') }}
        </NuxtLink>
        <UserMenu />
      </div>
    </header>

    <!-- Desktop sidebar -->
    <aside class="fixed left-0 top-16 h-[calc(100vh-4rem)] flex flex-col py-6 bg-[color:var(--app-bg-elevated)]/60 backdrop-blur-xl w-64 border-r border-[color:var(--app-border)] hidden lg:flex z-40">
      <div class="px-6 mb-8">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-12 bg-[color:var(--app-input)] rounded border border-[color:var(--app-border)] flex items-center justify-center">
            <span class="material-symbols-outlined text-blue-500">description</span>
          </div>
          <div>
            <p class="font-semibold text-[color:var(--app-fg)] uppercase tracking-widest text-sm">{{ t('nav.dashboard') }}</p>
            <p class="text-xs text-[color:var(--app-muted)]">{{ t('nav.manageWorkspace') }}</p>
          </div>
        </div>
      </div>
      <nav class="flex-1 flex flex-col gap-1">
        <NuxtLink
          v-for="item in sideNav"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-4 px-6 py-3 text-[color:var(--app-muted)] hover:text-[color:var(--app-fg)] hover:bg-[color:var(--app-input)] transition-all duration-150"
          :class="route.path === item.to ? '!text-blue-500 font-bold border-r-2 border-blue-500 bg-blue-500/10' : ''"
        >
          <span class="material-symbols-outlined">{{ item.icon }}</span>
          <span class="font-semibold text-sm">{{ item.label }}</span>
        </NuxtLink>
      </nav>
    </aside>

    <!-- Mobile drawer -->
    <div
      v-if="mobileOpen"
      class="fixed inset-0 z-40 lg:hidden"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Close menu"
        @click="mobileOpen = false"
      />
      <aside class="absolute left-0 top-16 bottom-0 w-72 max-w-[85vw] bg-[color:var(--app-bg-elevated)] border-r border-[color:var(--app-border)] py-6 flex flex-col shadow-2xl">
        <p class="px-6 mb-4 text-xs uppercase tracking-widest text-[color:var(--app-muted)] font-semibold">{{ t('nav.navigate') }}</p>
        <nav class="flex flex-col gap-1">
          <NuxtLink
            v-for="item in sideNav"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-4 px-6 py-3 text-[color:var(--app-muted)] hover:text-[color:var(--app-fg)] hover:bg-[color:var(--app-input)] transition-all"
            :class="route.path === item.to ? '!text-blue-500 font-bold bg-blue-500/10' : ''"
          >
            <span class="material-symbols-outlined">{{ item.icon }}</span>
            <span class="font-semibold text-sm">{{ item.label }}</span>
          </NuxtLink>
        </nav>
      </aside>
    </div>

    <main class="pt-16 lg:ml-64 min-h-screen">
      <slot />
    </main>
  </div>
</template>
