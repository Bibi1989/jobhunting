<script setup lang="ts">
const { loggedIn } = useSaaS()
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

const topNav = [
  { label: 'My Projects', to: '/builder' },
  { label: 'Templates', to: '/builder/templates' },
  { label: 'Portfolio', to: '/dashboard/portfolio' },
  { label: 'Analytics', to: '/dashboard/analytics' },
]

const sideNav = [
  { label: 'All Projects', to: '/builder', icon: 'folder' },
  { label: 'Templates', to: '/builder/templates', icon: 'grid_view' },
  { label: 'AI Portfolio', to: '/dashboard/portfolio', icon: 'stars' },
  { label: 'Analytics', to: '/dashboard/analytics', icon: 'monitoring' },
]

watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false
  },
)
</script>

<template>
  <div class="bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-100 min-h-screen selection:bg-blue-500/30">
    <!-- TopNavBar -->
    <header class="flex justify-between items-center px-4 sm:px-6 h-16 w-full fixed top-0 z-50 bg-slate-900/40 backdrop-blur-md border-b border-white/10">
      <div class="flex items-center gap-2 sm:gap-8">
        <button
          type="button"
          class="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 text-slate-200 hover:bg-white/5"
          aria-label="Go back"
          @click="goBack"
        >
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <button
          type="button"
          class="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 text-slate-200 hover:bg-white/5"
          aria-label="Open menu"
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
            class="font-semibold text-slate-300 hover:text-white transition-colors duration-200"
            active-class="!text-blue-400 border-b-2 border-blue-400 pb-1"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
      </div>
      <div class="flex items-center gap-3">
        <CreditBadge />
        <NuxtLink
          v-if="!loggedIn"
          to="/login"
          class="text-sm text-slate-300 hover:text-white cursor-pointer"
        >
          Sign in
        </NuxtLink>
        <UserMenu />
      </div>
    </header>

    <!-- Desktop sidebar -->
    <aside class="fixed left-0 top-16 h-[calc(100vh-4rem)] flex flex-col py-6 bg-slate-900/50 backdrop-blur-xl w-64 border-r border-white/10 hidden lg:flex z-40">
      <div class="px-6 mb-8">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-12 bg-white/5 rounded border border-white/10 flex items-center justify-center">
            <span class="material-symbols-outlined text-blue-400">description</span>
          </div>
          <div>
            <p class="font-semibold text-white uppercase tracking-widest text-sm">Dashboard</p>
            <p class="text-xs text-blue-200/60">Manage Workspace</p>
          </div>
        </div>
      </div>
      <nav class="flex-1 flex flex-col gap-1">
        <NuxtLink
          v-for="item in sideNav"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-4 px-6 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-150"
          active-class="!text-blue-400 font-bold border-r-2 border-blue-400 bg-blue-500/10"
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
        class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        aria-label="Close menu"
        @click="mobileOpen = false"
      />
      <aside class="absolute left-0 top-16 bottom-0 w-72 max-w-[85vw] bg-slate-900 border-r border-white/10 py-6 flex flex-col shadow-2xl">
        <p class="px-6 mb-4 text-xs uppercase tracking-widest text-blue-200/60 font-semibold">Navigate</p>
        <nav class="flex flex-col gap-1">
          <NuxtLink
            v-for="item in sideNav"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-4 px-6 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            active-class="!text-blue-400 font-bold bg-blue-500/10"
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
