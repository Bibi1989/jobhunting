<script setup lang="ts">
import { Sparkles, FileText, Search, UploadCloud, CheckCircle2, ArrowRight } from 'lucide-vue-next'

const { t } = useI18n()
const { loggedIn, logout } = useSaaS()

const features = computed(() => [
  {
    title: t('home.features.resumeTitle'),
    description: t('home.features.resumeDesc'),
    icon: FileText,
    href: '/builder',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
  },
  {
    title: t('home.features.coverTitle'),
    description: t('home.features.coverDesc'),
    icon: Sparkles,
    href: '/apply',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    title: t('home.features.atsTitle'),
    description: t('home.features.atsDesc'),
    icon: CheckCircle2,
    href: '/ats-checker',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    title: t('home.features.scraperTitle'),
    description: t('home.features.scraperDesc'),
    icon: Search,
    href: '/scraper',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
])
</script>

<template>
  <div class="app-shell font-sans selection:bg-indigo-500/30">
    <div class="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 pointer-events-none" />

    <header class="relative z-10 border-b border-[color:var(--app-border)] bg-[color:var(--app-bg)]/50 backdrop-blur-md">
      <div class="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
        <AppLogo />
        <div class="flex items-center gap-3 sm:gap-4">
          <LocaleSwitcher />
          <ThemeToggle />
          <NuxtLink to="/pricing" class="text-sm font-semibold text-[color:var(--app-muted)] hover:text-[color:var(--app-fg)] transition-colors">{{ t('nav.pricing') }}</NuxtLink>
          <template v-if="loggedIn">
            <NuxtLink to="/scraper" class="hidden sm:inline text-sm font-semibold text-[color:var(--app-muted)] hover:text-[color:var(--app-fg)] transition-colors">{{ t('nav.jobScraper') }}</NuxtLink>
            <button type="button" class="text-sm font-semibold text-[color:var(--app-muted)] hover:text-[color:var(--app-fg)] transition-colors" @click="logout">{{ t('nav.signOut') }}</button>
            <NuxtLink to="/builder" class="px-4 py-2 bg-[color:var(--app-fg)] text-[color:var(--app-bg)] hover:opacity-90 text-sm font-bold rounded-xl transition-all shadow-sm">
              {{ t('nav.goToBuilder') }}
            </NuxtLink>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="text-sm font-semibold text-[color:var(--app-muted)] hover:text-[color:var(--app-fg)] transition-colors">{{ t('nav.signIn') }}</NuxtLink>
            <NuxtLink to="/builder" class="px-4 py-2 bg-[color:var(--app-fg)] text-[color:var(--app-bg)] hover:opacity-90 text-sm font-bold rounded-xl transition-all shadow-sm">
              {{ t('nav.getStarted') }}
            </NuxtLink>
          </template>
        </div>
      </div>
    </header>

    <main class="relative z-10 max-w-[1400px] mx-auto px-6 pt-24 pb-32">
      <div class="flex flex-col items-center text-center max-w-4xl mx-auto mb-20">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-8">
          <Sparkles :size="14" />
          {{ t('home.badge') }}
        </div>
        <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight text-[color:var(--app-fg)] mb-6 leading-tight">
          {{ t('home.headline') }} <br class="hidden md:block" />
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">
            {{ t('home.headlineAccent') }}
          </span>
        </h1>
        <p class="text-lg md:text-xl text-[color:var(--app-muted)] mb-10 max-w-2xl leading-relaxed">
          {{ t('home.subtitle') }}
        </p>
        <div class="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <NuxtLink to="/builder" class="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all hover:scale-[1.02]">
            {{ t('home.buildResume') }} <ArrowRight :size="18" />
          </NuxtLink>
          <NuxtLink to="/ats-checker" class="w-full sm:w-auto px-8 py-4 bg-[color:var(--app-bg-elevated)] border border-[color:var(--app-border)] hover:border-indigo-400 text-[color:var(--app-fg)] rounded-2xl font-bold flex items-center justify-center gap-2 transition-all">
            <UploadCloud :size="18" class="text-emerald-400" />
            {{ t('home.checkAts') }}
          </NuxtLink>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <NuxtLink
          v-for="feat in features"
          :key="feat.href"
          :to="feat.href"
          class="group p-6 rounded-3xl bg-[color:var(--app-bg-elevated)]/60 border border-[color:var(--app-border)] hover:opacity-95 transition-all duration-300 hover:shadow-xl flex flex-col items-start gap-4"
        >
          <div :class="['p-3 rounded-2xl border', feat.bg, feat.color, 'group-hover:scale-110 transition-transform duration-300']">
            <component :is="feat.icon" :size="24" />
          </div>
          <h3 class="text-lg font-bold text-[color:var(--app-fg)] group-hover:text-indigo-400 transition-colors">{{ feat.title }}</h3>
          <p class="text-sm text-[color:var(--app-muted)] leading-relaxed">{{ feat.description }}</p>
        </NuxtLink>
      </div>
    </main>

    <footer class="border-t border-[color:var(--app-border)] py-12 relative z-10">
      <div class="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[color:var(--app-muted)] text-sm font-medium">
        <p>© 2026 JobFlow</p>
        <div class="flex items-center gap-6 flex-wrap justify-center">
          <NuxtLink to="/privacy" class="hover:text-[color:var(--app-fg)] transition-colors">
            {{ t('nav.privacy') }}
          </NuxtLink>
          <a
            href="/docs/BUSINESS_PLAN.pdf"
            download="JobFlow-Business-Plan.pdf"
            class="hover:text-[color:var(--app-fg)] transition-colors"
          >
            {{ t('home.businessPlan') }}
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>
