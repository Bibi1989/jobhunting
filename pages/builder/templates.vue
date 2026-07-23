<script setup lang="ts">
import { resumeTemplates, coverLetterTemplates } from '~/utils/templates'
import { PORTFOLIO_TEMPLATES, SAMPLE_PROFILE } from '~/shared/types/portfolio'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { t } = useI18n()
const { coverLetterLabel, resumeDesc } = useTemplateLabels()

const activeFilter = ref('All')
const portfolioPreviewSlug = ref<string | null>(null)

const filters = computed(() => [
  { id: 'All', label: t('templates.filterAll') },
  { id: 'Professional', label: t('templates.filterProfessional') },
  { id: 'Modern', label: t('templates.filterModern') },
  { id: 'Minimalist', label: t('templates.filterMinimalist') },
  { id: 'Technical', label: t('templates.filterTechnical') },
  { id: 'Creative', label: t('templates.filterCreative') },
])

const categoryLabel = (category: string) => {
  const map: Record<string, string> = {
    Professional: t('templates.filterProfessional'),
    Modern: t('templates.filterModern'),
    Minimalist: t('templates.filterMinimalist'),
    Technical: t('templates.filterTechnical'),
    Creative: t('templates.filterCreative'),
  }
  return map[category] || category
}

const filteredTemplates = computed(() => {
  if (activeFilter.value === 'All') return resumeTemplates
  return resumeTemplates.filter(t => t.category === activeFilter.value)
})
</script>

<template>
    <div class="pt-8 min-h-screen pb-20">
      <div class="max-w-[1200px] mx-auto px-6">
        <!-- Header Section -->
        <div class="mb-12">
          <h1 class="font-serif text-4xl text-app-fg mb-3">{{ t('templates.title') }}</h1>
          <p class="text-app-muted max-w-xl text-lg">{{ t('templates.subtitle') }}</p>
        </div>

        <!-- Filters & Categories -->
        <div class="sticky top-16 z-30 bg-app-bg-elevated/80 backdrop-blur-md py-4 mb-10 border-b border-app-border">
          <div class="flex flex-wrap items-center gap-6">
            <button 
              v-for="filter in filters" :key="filter.id"
              @click="activeFilter = filter.id"
              :class="['font-semibold text-sm pb-1 border-b-2 transition-colors', activeFilter === filter.id ? 'text-blue-500 border-blue-500' : 'text-app-muted border-transparent hover:text-app-fg']"
            >
              {{ filter.label }}
            </button>
          </div>
        </div>

        <!-- Resume Templates Grid -->
        <div class="mb-8 flex items-center justify-between">
          <h2 class="font-serif text-2xl text-white">{{ t('templates.resumeTemplates') }}</h2>
          <span class="text-blue-300/60 text-sm font-semibold uppercase tracking-wider">{{ t('templates.results', { n: filteredTemplates.length }) }}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16">
          <div v-for="tpl in filteredTemplates" :key="tpl.id" class="group relative flex flex-col cursor-pointer" @click="navigateTo('/builder/resume/new?template=' + tpl.id)">
            <div class="relative aspect-[3/4] bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 mb-4 hover:border-blue-400/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300">
              <BuilderTemplateThumbnail :template-id="tpl.id" :name="tpl.name" />
              
              <!-- Hover Overlay -->
              <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4">
                <button type="button" class="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:bg-blue-400 transition-colors">{{ t('templates.useTemplate') }}</button>
              </div>
            </div>
            <div>
              <h4 class="font-semibold text-lg text-white group-hover:text-blue-400 transition-colors">{{ tpl.name }}</h4>
              <p class="text-xs font-semibold text-blue-200/60 uppercase tracking-widest mt-1">{{ categoryLabel(tpl.category) }} • {{ resumeDesc(tpl.id, tpl.desc) }}</p>
            </div>
          </div>
        </div>

        <!-- Cover Letter Templates Grid -->
        <div class="mb-8 flex items-center justify-between border-t border-white/10 pt-16">
          <h2 class="font-serif text-2xl text-white">{{ t('templates.coverLetterTemplates') }}</h2>
          <span class="text-blue-300/60 text-sm font-semibold uppercase tracking-wider">{{ t('templates.results', { n: coverLetterTemplates.length }) }}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div
            v-for="tpl in coverLetterTemplates"
            :key="tpl.id"
            class="group relative flex flex-col cursor-pointer"
            @click="navigateTo('/builder/cover-letter/new?template=' + tpl.id)"
          >
            <div class="relative aspect-[3/4] bg-white rounded-xl overflow-hidden border border-white/10 mb-4 hover:border-blue-400/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300">
              <!-- Mini layout previews -->
              <div v-if="tpl.id === 'cl-standard'" class="h-full p-5 flex flex-col text-slate-800 font-serif">
                <div class="text-center border-b-2 border-slate-900 pb-3 mb-4">
                  <div class="h-3 w-2/3 mx-auto bg-slate-900 rounded mb-2" />
                  <div class="h-1.5 w-1/2 mx-auto bg-slate-400 rounded" />
                </div>
                <div class="space-y-2 flex-1">
                  <div class="h-1.5 w-full bg-slate-300 rounded" />
                  <div class="h-1.5 w-11/12 bg-slate-300 rounded" />
                  <div class="h-1.5 w-full bg-slate-300 rounded" />
                  <div class="h-1.5 w-4/5 bg-slate-300 rounded" />
                </div>
              </div>
              <div v-else-if="tpl.id === 'cl-creative'" class="h-full flex text-slate-800">
                <div class="w-2 bg-teal-700 shrink-0" />
                <div class="flex-1 p-5">
                  <div class="h-2 w-16 bg-teal-600/40 rounded mb-2" />
                  <div class="h-5 w-3/4 bg-slate-900 rounded mb-4" />
                  <div class="space-y-2">
                    <div class="h-1.5 w-full bg-slate-300 rounded" />
                    <div class="h-1.5 w-11/12 bg-slate-300 rounded" />
                    <div class="h-1.5 w-full bg-slate-300 rounded" />
                  </div>
                </div>
              </div>
              <div v-else-if="tpl.id === 'cl-executive'" class="h-full p-5 bg-[#fafaf8] text-slate-800">
                <div class="h-1.5 bg-slate-900 mb-4" />
                <div class="flex justify-between mb-4">
                  <div class="h-3 w-1/2 bg-slate-900 rounded" />
                  <div class="space-y-1 w-1/4">
                    <div class="h-1 bg-slate-300 rounded" />
                    <div class="h-1 bg-slate-300 rounded" />
                  </div>
                </div>
                <div class="space-y-2 border-t border-slate-300 pt-3">
                  <div class="h-1.5 w-full bg-slate-300 rounded" />
                  <div class="h-1.5 w-11/12 bg-slate-300 rounded" />
                  <div class="h-1.5 w-4/5 bg-slate-300 rounded" />
                </div>
              </div>
              <div v-else class="h-full flex text-slate-800">
                <div class="w-[28%] bg-slate-900 p-3 space-y-2">
                  <div class="h-2 w-full bg-white/30 rounded" />
                  <div class="h-1 w-2/3 bg-cyan-400/50 rounded" />
                  <div class="h-1 w-full bg-white/20 rounded mt-4" />
                  <div class="h-1 w-full bg-white/20 rounded" />
                </div>
                <div class="flex-1 p-4 space-y-2">
                  <div class="h-1.5 w-full bg-slate-300 rounded" />
                  <div class="h-1.5 w-11/12 bg-slate-300 rounded" />
                  <div class="h-1.5 w-full bg-slate-300 rounded" />
                  <div class="h-1.5 w-3/4 bg-slate-300 rounded" />
                </div>
              </div>

              <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4">
                <button type="button" class="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:bg-blue-400 transition-colors">{{ t('templates.useTemplate') }}</button>
              </div>
            </div>
            <div>
              <h4 class="font-semibold text-lg text-white group-hover:text-blue-400 transition-colors">{{ coverLetterLabel(tpl.id, 'name', tpl.name) }}</h4>
              <p class="text-xs font-semibold text-blue-200/60 uppercase tracking-widest mt-1">{{ categoryLabel(tpl.category) }} • {{ coverLetterLabel(tpl.id, 'desc', tpl.desc) }}</p>
            </div>
          </div>
        </div>

        <!-- Portfolio Templates -->
        <div class="mb-8 flex items-center justify-between border-t border-white/10 pt-16">
          <div>
            <h2 class="font-serif text-2xl text-white">{{ t('templates.portfolioTemplates') }}</h2>
            <p class="text-blue-200/60 text-sm mt-1">{{ t('templates.portfolioSubtitle') }}</p>
          </div>
          <span class="text-blue-300/60 text-sm font-semibold uppercase tracking-wider">{{ t('templates.designs', { n: PORTFOLIO_TEMPLATES.length }) }}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-16">
          <div
            v-for="tpl in PORTFOLIO_TEMPLATES"
            :key="tpl.slug"
            class="group relative flex flex-col cursor-pointer"
            @click="portfolioPreviewSlug = tpl.slug"
          >
            <div class="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 mb-3 bg-slate-900 hover:border-blue-400/50 transition-all">
              <div class="absolute inset-0 origin-top-left pointer-events-none" style="width: 400%; height: 400%; transform: scale(0.25);">
                <PortfolioRenderer :slug="tpl.slug" :data="SAMPLE_PROFILE" />
              </div>
              <div class="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span class="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg">{{ t('templates.preview') }}</span>
              </div>
            </div>
            <h4 class="font-semibold text-white group-hover:text-blue-400 transition-colors">{{ tpl.name }}</h4>
            <p class="text-xs text-blue-200/60 mt-0.5">{{ tpl.persona }}</p>
          </div>
        </div>
      </div>

      <Teleport to="body">
        <div
          v-if="portfolioPreviewSlug"
          class="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex flex-col"
          @click.self="portfolioPreviewSlug = null"
        >
          <div class="flex items-center justify-between px-6 h-14 bg-slate-900 border-b border-white/10 shrink-0">
            <p class="font-semibold text-white">{{ PORTFOLIO_TEMPLATES.find(t => t.slug === portfolioPreviewSlug)?.name }}</p>
            <button type="button" class="text-slate-400 hover:text-white cursor-pointer" @click="portfolioPreviewSlug = null">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="flex-1 overflow-auto">
            <PortfolioRenderer :slug="portfolioPreviewSlug" :data="SAMPLE_PROFILE" />
          </div>
        </div>
      </Teleport>
    </div>
</template>
