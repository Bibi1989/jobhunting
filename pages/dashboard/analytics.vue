<script setup lang="ts">
import { PORTFOLIO_TEMPLATES, type Portfolio } from '~/shared/types/portfolio'

definePageMeta({ layout: 'dashboard' })

const { planTier, creditsRemaining, isPro } = useSaaS()

const { data: portfolioData } = await useFetch<{ portfolios: Portfolio[] }>('/api/portfolio', {
  default: () => ({ portfolios: [] }),
})
const { data: documents } = await useFetch<Array<{ type: string }>>('/api/builder/documents', {
  default: () => [],
})

const portfolios = computed(() => portfolioData.value?.portfolios ?? [])

const resumeCount = computed(
  () => (documents.value ?? []).filter((d) => d.type !== 'cover_letter').length,
)
const coverLetterCount = computed(
  () => (documents.value ?? []).filter((d) => d.type === 'cover_letter').length,
)

const stats = computed(() => [
  { label: 'Published Portfolios', value: portfolios.value.length, icon: 'stars', accent: 'text-blue-300' },
  { label: 'Documents', value: (documents.value ?? []).length, icon: 'description', accent: 'text-indigo-300' },
  { label: 'Credits Remaining', value: creditsRemaining.value, icon: 'toll', accent: 'text-emerald-300' },
  { label: 'Plan', value: planTier.value.toUpperCase(), icon: 'workspace_premium', accent: 'text-amber-300' },
])

// Portfolio count per template, for the usage breakdown chart.
const templateUsage = computed(() => {
  const counts = new Map<string, number>()
  for (const p of portfolios.value) {
    counts.set(p.templateSlug, (counts.get(p.templateSlug) ?? 0) + 1)
  }
  const max = Math.max(1, ...counts.values())
  return PORTFOLIO_TEMPLATES.map((t) => ({
    name: t.name,
    slug: t.slug,
    accent: t.accentClass,
    count: counts.get(t.slug) ?? 0,
    pct: Math.round(((counts.get(t.slug) ?? 0) / max) * 100),
  }))
})

const hasUsage = computed(() => portfolios.value.length > 0)
</script>

<template>
  <div class="px-6 py-10 max-w-7xl mx-auto">
    <header class="mb-8">
      <h1 class="font-serif text-4xl text-white mb-2">Analytics</h1>
      <p class="text-blue-200/60">A snapshot of your workspace, documents, and published portfolios.</p>
      <div class="w-full h-px bg-white/10 mt-6"></div>
    </header>

    <!-- Stat tiles -->
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
      <div
        v-for="s in stats"
        :key="s.label"
        class="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
      >
        <span class="material-symbols-outlined" :class="s.accent">{{ s.icon }}</span>
        <p class="font-serif text-3xl text-white mt-2">{{ s.value }}</p>
        <p class="text-xs uppercase tracking-widest text-blue-200/50 mt-1">{{ s.label }}</p>
      </div>
    </section>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Documents breakdown -->
      <section class="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 class="font-semibold text-white mb-4">Documents by type</h2>
        <div class="space-y-4">
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-blue-100">Resumes</span>
              <span class="text-blue-200/60">{{ resumeCount }}</span>
            </div>
            <div class="h-2 rounded-full bg-white/10 overflow-hidden">
              <div class="h-full bg-blue-500 rounded-full transition-all"
                   :style="{ width: `${Math.min(100, resumeCount * 20)}%` }"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-blue-100">Cover Letters</span>
              <span class="text-blue-200/60">{{ coverLetterCount }}</span>
            </div>
            <div class="h-2 rounded-full bg-white/10 overflow-hidden">
              <div class="h-full bg-indigo-500 rounded-full transition-all"
                   :style="{ width: `${Math.min(100, coverLetterCount * 20)}%` }"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Template usage -->
      <section class="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 class="font-semibold text-white mb-4">Portfolio template usage</h2>
        <p v-if="!hasUsage" class="text-blue-200/50 italic text-sm">
          No portfolios published yet.
          <NuxtLink to="/dashboard/portfolio" class="text-blue-300 hover:underline">Build one →</NuxtLink>
        </p>
        <div v-else class="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          <div v-for="t in templateUsage" :key="t.slug" class="flex items-center gap-3">
            <span class="w-2 h-2 rounded-full shrink-0" :class="t.accent"></span>
            <span class="text-sm text-blue-100 w-32 truncate">{{ t.name }}</span>
            <div class="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
              <div class="h-full rounded-full transition-all" :class="t.accent" :style="{ width: `${t.pct}%` }"></div>
            </div>
            <span class="text-xs text-blue-200/60 w-6 text-right">{{ t.count }}</span>
          </div>
        </div>
      </section>
    </div>

    <!-- Recent published portfolios -->
    <section class="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-white">Published portfolios</h2>
        <NuxtLink to="/dashboard/portfolio" class="text-sm text-blue-300 hover:text-white transition">
          Open Portfolio →
        </NuxtLink>
      </div>
      <p v-if="!portfolios.length" class="text-blue-200/50 italic text-sm">
        No live portfolios yet.
        <NuxtLink to="/dashboard/portfolio" class="text-blue-300 hover:underline">Create one</NuxtLink>
      </p>
      <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <a
          v-for="p in portfolios.slice(0, 6)"
          :key="p.id"
          :href="`/p/${p.id}`"
          target="_blank"
          rel="noopener"
          class="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 hover:border-blue-400/40 transition"
        >
          <p class="font-semibold text-white truncate">{{ p.profileData.full_name }}</p>
          <p class="text-xs text-blue-200/60 mt-1 truncate">/p/{{ p.id }}</p>
        </a>
      </div>
    </section>

    <!-- Upsell for free users -->
    <section v-if="!isPro" class="mt-8 rounded-2xl border border-blue-500/30 bg-blue-600/10 p-6 flex items-center justify-between gap-4">
      <div>
        <p class="font-semibold text-white">Unlock AI Portfolios and premium tools</p>
        <p class="text-sm text-blue-200/70">Upgrade to Pro to generate portfolios and publish them to your domain.</p>
      </div>
      <NuxtLink to="/pricing" class="shrink-0 rounded-xl bg-blue-500 hover:bg-blue-400 px-5 py-2.5 font-semibold text-white transition">
        Upgrade
      </NuxtLink>
    </section>
  </div>
</template>
