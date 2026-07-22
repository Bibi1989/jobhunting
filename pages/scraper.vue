<script setup lang="ts">
import {
  Globe,
  Loader2,
  AlertCircle,
  Bookmark,
  CheckCircle,
  X,
  Sparkles,
} from 'lucide-vue-next'
import type { Job, UserDocumentSummary } from '~/shared/types/job'
import { extractJobTitleFromResumeText } from '~/shared/utils/resumeJobTitle'

const url = ref('')
const useResumeForScrape = ref(false)
const useCoverLetterForScrape = ref(false)
const scrapeJobTitle = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const jobs = ref<Job[]>([])
const hasScraped = ref(false)
const showFavorites = ref(false)
const toastMessage = ref<string | null>(null)
const resumeDoc = ref<UserDocumentSummary | null>(null)
const coverLetterDoc = ref<UserDocumentSummary | null>(null)

const { favorites, isFavorite, toggleFavorite, removeFavorite } = useFavorites()
const { hasMaterials } = useJobMaterials()
const { history, showDropdown, addToHistory } = useScrapeHistory()
const { visitedJobs, markVisited } = useVisitedJobs()
const mobileMenuOpen = ref(false)
const mobileToolsOpen = ref(false)
const { canAccessScraper, loggedIn, refreshCredits, scraperBlockedMessage, pending } = useSaaS()

const runtimeConfig = useRuntimeConfig()
const apiBackendLabel = computed(() =>
  runtimeConfig.public.apiBackend === 'fastapi' ? 'FastAPI' : 'Nuxt Nitro',
)
const apiHealthBackend = ref<string | null>(null)
const apiStatusLabel = computed(() => {
  if (apiHealthBackend.value === 'fastapi') return 'Healthy · FastAPI'
  if (apiHealthBackend.value === 'nuxt') return 'Healthy · Nitro'
  return 'Healthy'
})

/** Keep the form usable while credits are loading for signed-in users. */
const scrapeInputDisabled = computed(
  () => loading.value || (!pending.value && !canAccessScraper.value),
)

watch(mobileMenuOpen, (open) => {
  if (import.meta.client) {
    document.body.style.overflow = open ? 'hidden' : ''
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = ''
})
const {
  searchQuery,
  locationFilter,
  minSalaryFilter,
  sortOption,
  sourceJobs,
  filteredJobs,
  clearFilters,
} = useJobFilters(jobs, favorites, showFavorites)

async function loadSavedJobs() {
  try {
    const data = await $fetch<{ jobs: Job[] }>('/api/jobs')
    if (!jobs.value.length && data.jobs?.length) {
      jobs.value = data.jobs
      hasScraped.value = true
    }
  } catch {
    // DB may not be up yet; ignore on boot
  }
}

async function loadDocuments() {
  try {
    const data = await $fetch<{
      resume: UserDocumentSummary | null
      coverLetter: UserDocumentSummary | null
    }>('/api/documents')
    resumeDoc.value = data.resume
    coverLetterDoc.value = data.coverLetter

    if (data.resume?.contentText?.trim()) {
      useResumeForScrape.value = true
      if (!scrapeJobTitle.value.trim()) {
        const fromResume = extractJobTitleFromResumeText(data.resume.contentText)
        if (fromResume) scrapeJobTitle.value = fromResume
      }
    }
  } catch {
    // ignore
  }
}

onMounted(async () => {
  loadSavedJobs()
  loadDocuments()
  try {
    const health = await $fetch<{ backend?: string; ok?: boolean }>('/api/health')
    apiHealthBackend.value = health?.backend === 'fastapi' ? 'fastapi' : 'nuxt'
  } catch {
    apiHealthBackend.value = runtimeConfig.public.apiBackend === 'fastapi' ? 'fastapi' : 'nuxt'
  }
})

async function handleScrape() {
  if (!url.value.trim()) return
  if (!canAccessScraper.value) {
    error.value = scraperBlockedMessage() || 'Scraping is currently unavailable.'
    return
  }
  if (useResumeForScrape.value && !resumeDoc.value) {
    error.value = 'Upload a resume first, or uncheck “Use resume”.'
    return
  }
  if (useCoverLetterForScrape.value && !coverLetterDoc.value) {
    error.value = 'Upload a cover letter first, or uncheck “Use cover letter”.'
    return
  }

  loading.value = true
  error.value = null
  jobs.value = []
  hasScraped.value = false
  showFavorites.value = false

  try {
    const data = await $fetch<{
      jobs: Job[]
      meta?: { targeted?: boolean; count?: number; enriched?: number; targetJobTitle?: string | null }
    }>('/api/scrape', {
      method: 'POST',
      body: {
        url: url.value.trim(),
        useResume: useResumeForScrape.value,
        useCoverLetter: useCoverLetterForScrape.value,
        jobTitle: scrapeJobTitle.value.trim() || undefined,
      },
    })

    jobs.value = data.jobs || []
    hasScraped.value = true
    addToHistory(url.value.trim())
    showDropdown.value = false
    await refreshCredits()

    if (jobs.value.length === 0) {
      error.value =
        'Scrape completed but no related jobs were found. Try another careers URL, adjust the job title, or scrape without targeting.'
    } else {
      const enriched =
        data.meta?.enriched ??
        jobs.value.filter((j) => j.descriptionSource === 'detail_page').length
      const targetTitle = data.meta?.targetJobTitle || scrapeJobTitle.value.trim()
      const targeted =
        useResumeForScrape.value ||
        useCoverLetterForScrape.value ||
        Boolean(targetTitle)
      toastMessage.value = targeted
        ? `Found ${jobs.value.length} jobs related to ${targetTitle ? `“${targetTitle}”` : 'your profile'} (${enriched} with full detail pages). 1 credit used.`
        : `Saved ${jobs.value.length} jobs (${enriched} with full detail pages). 1 credit used.`
      setTimeout(() => {
        toastMessage.value = null
      }, 4500)
    }
  } catch (err: unknown) {
    hasScraped.value = true
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

function getErrorMessage(err: unknown): string {
  const fetchError = err as {
    data?: { statusMessage?: string; message?: string }
    statusMessage?: string
    message?: string
  }

  return (
    fetchError.data?.statusMessage ||
    fetchError.statusMessage ||
    fetchError.data?.message ||
    fetchError.message ||
    'Failed to scrape jobs'
  )
}

function onVisit(job: Job) {
  markVisited(job.url)
}

async function removeJob(job: Job) {
  const { confirm } = useAppConfirm()
  const confirmed = await confirm({
    title: 'Remove job',
    message: `Remove “${job.title}” from your list?`,
    confirmLabel: 'Remove',
    danger: true,
  })
  if (!confirmed) return

  try {
    const id = job.id || 'by-url'
    await $fetch(`/api/jobs/${id}`, {
      method: 'DELETE',
      query: job.id ? undefined : { url: job.url },
    })
  } catch {
    // Still remove locally if API/DB fails
  }

  jobs.value = jobs.value.filter((j) => j.url !== job.url && j.id !== job.id)
  removeFavorite(job)
  toastMessage.value = 'Job removed.'
  setTimeout(() => {
    toastMessage.value = null
  }, 2500)
}

function applyToJob(job: Job) {
  markVisited(job.url)
  window.open(job.url, '_blank', 'noopener,noreferrer')
}

async function handleSelectJob(job: Job) {
  if (job.id) {
    await navigateTo(`/jobs/${job.id}`)
  }
}

function hideHistoryDropdown() {
  window.setTimeout(() => {
    showDropdown.value = false
  }, 200)
}
</script>

<template>
  <div class="min-h-dvh lg:h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 flex flex-col p-4 md:p-6 overflow-x-hidden lg:overflow-hidden">
    <div class="max-w-[1400px] mx-auto w-full grow flex flex-col min-h-0 lg:h-full lg:overflow-hidden">
      <header class="shrink-0 border-b border-slate-900 pb-4 mb-4 md:mb-6">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <AppLogo />
          </div>

          <div class="hidden lg:flex flex-wrap gap-2 items-center justify-end">
            <NuxtLink
              to="/pricing"
              class="flex items-center gap-2 px-3 py-2 border border-violet-500/20 bg-violet-500/10 text-violet-300 hover:bg-violet-500 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Pricing
            </NuxtLink>
            <NuxtLink
              to="/apply"
              class="flex items-center gap-2 px-3 py-2 border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Sparkles :size="14" />
              Docs Gen
            </NuxtLink>
            <NuxtLink
              to="/builder"
              class="flex items-center gap-2 px-3 py-2 border border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Sparkles :size="14" />
              Builder
            </NuxtLink>
            <button
              type="button"
              class="flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer"
              :class="
                showFavorites
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-500 text-white'
                  : 'bg-slate-900/80 border-slate-800/80 text-slate-400 hover:text-slate-200'
              "
              @click="showFavorites = !showFavorites"
            >
              <Bookmark :size="14" :class="showFavorites ? 'fill-current' : ''" />
              Favorites
            </button>
            <div class="flex items-center gap-2 px-3 py-2 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs">
              <span
                class="w-2.5 h-2.5 rounded-full"
                :class="loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'"
              />
              <span class="text-slate-400 font-semibold">{{ loading ? 'Scraping listings + details…' : 'Ready' }}</span>
            </div>
            <CreditBadge />
            <NuxtLink
              v-if="!loggedIn"
              to="/login"
              class="flex items-center gap-2 px-3 py-2 border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Sign in
            </NuxtLink>
            <UserMenu />
          </div>

          <div class="flex lg:hidden items-center gap-2">
            <CreditBadge />
            <UserMenu />
            <button
              type="button"
              class="p-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-slate-200 cursor-pointer"
              aria-label="Open menu"
              @click="mobileMenuOpen = true"
            >
              <span class="material-symbols-outlined text-[22px]">menu</span>
            </button>
          </div>
        </div>

        <!-- Mobile drawer -->
        <Teleport to="body">
          <div v-if="mobileMenuOpen" class="fixed inset-0 z-[100] lg:hidden">
            <button
              type="button"
              class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
              aria-label="Close menu"
              @click="mobileMenuOpen = false"
            />
            <nav
              class="absolute right-0 top-0 h-full w-[min(20rem,88vw)] bg-slate-950 border-l border-slate-800 p-5 flex flex-col gap-2 shadow-2xl"
            >
              <div class="flex items-center justify-between mb-4">
                <p class="text-sm font-bold text-white">Menu</p>
                <button
                  type="button"
                  class="p-2 rounded-lg text-slate-400 hover:text-white"
                  aria-label="Close"
                  @click="mobileMenuOpen = false"
                >
                  <X :size="18" />
                </button>
              </div>
              <NuxtLink to="/pricing" class="mobile-nav-link" @click="mobileMenuOpen = false">Pricing</NuxtLink>
              <NuxtLink to="/apply" class="mobile-nav-link" @click="mobileMenuOpen = false">Docs Gen</NuxtLink>
              <NuxtLink to="/builder" class="mobile-nav-link" @click="mobileMenuOpen = false">Resume Builder</NuxtLink>
              <NuxtLink to="/builder/apply-email" class="mobile-nav-link" @click="mobileMenuOpen = false">Apply via Email</NuxtLink>
              <button type="button" class="mobile-nav-link text-left cursor-pointer" @click="showFavorites = !showFavorites; mobileMenuOpen = false">
                {{ showFavorites ? 'Show all jobs' : 'View favorites' }}
              </button>
              <NuxtLink
                v-if="!loggedIn"
                to="/login"
                class="mobile-nav-link"
                @click="mobileMenuOpen = false"
              >
                Sign in
              </NuxtLink>
              <div class="mt-auto pt-4 text-xs text-slate-500">
                Status: {{ loading ? 'Scraping listings + details…' : 'Ready' }}
              </div>
            </nav>
          </div>
        </Teleport>
      </header>

      <!-- Main Layout Flexbox -->
      <div class="flex flex-col gap-4 flex-grow min-h-0 pb-4 md:pb-0">
        
        <!-- Top Row (Scraper Form & Total Stats) -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
          
          <!-- Scraper Box -->
          <div class="md:col-span-3 glass-panel rounded-3xl p-5 flex flex-col justify-center relative overflow-hidden group min-h-[7.5rem] gap-3">
            <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-500" />
            <ScraperPaywall />
            <form
              class="w-full flex flex-col gap-3 relative z-10"
              @submit.prevent="handleScrape"
            >
              <div class="flex flex-col sm:flex-row items-end gap-4">
                <div class="flex-grow w-full relative">
                  <label class="block text-[10px] uppercase tracking-wider text-indigo-400 mb-2 font-bold select-none">
                    Source URL / Careers Page
                  </label>
                  <div class="relative flex items-center">
                    <input
                      v-model="url"
                      type="url"
                      placeholder="https://boards.greenhouse.io/openai"
                      class="w-full bg-slate-950/30 border border-slate-800/80 focus:border-indigo-500/80 rounded-2xl px-4 py-3 pr-10 text-slate-100 text-sm font-medium outline-none transition-all duration-300 focus:ring-4 focus:ring-indigo-500/10 focus:bg-slate-950/60 disabled:opacity-50 disabled:cursor-not-allowed"
                      :required="canAccessScraper && !showFavorites"
                      :disabled="scrapeInputDisabled"
                      @focus="showDropdown = true"
                      @blur="hideHistoryDropdown"
                    />
                    <Globe class="absolute right-4 text-slate-500 pointer-events-none" :size="16" />
                  </div>
                  <div
                    v-if="canAccessScraper && showDropdown && history.length > 0"
                    class="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-20 overflow-hidden"
                  >
                    <div
                      v-for="(item, index) in history"
                      :key="index"
                      class="px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer border-b border-slate-800/50 last:border-0 truncate transition-colors"
                      @mousedown.prevent="url = item"
                    >
                      {{ item }}
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  :disabled="scrapeInputDisabled || (!url.trim() && !showFavorites)"
                  :title="!canAccessScraper && !pending ? scraperBlockedMessage() : undefined"
                  class="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-8 rounded-2xl flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-300 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] shrink-0 cursor-pointer"
                >
                  <Loader2 v-if="loading" class="animate-spin" :size="18" />
                  <Sparkles v-else :size="18" />
                  Execute Scrape (1 Cr)
                </button>
              </div>
              <p
                v-if="loggedIn && !canAccessScraper && !pending"
                class="text-xs text-amber-200/90"
              >
                {{ scraperBlockedMessage() }}
                <NuxtLink to="/pricing" class="font-semibold text-indigo-300 hover:text-indigo-200 underline underline-offset-2 ml-1">
                  Upgrade to Pro
                </NuxtLink>
              </p>

              <div
                class="flex flex-col gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/25 px-3 py-2.5"
                :class="scrapeInputDisabled ? 'opacity-50 pointer-events-none' : ''"
              >
                <p class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Find related roles — uses resume job title when “Use resume” is on
                </p>
                <div class="flex flex-col lg:flex-row lg:items-center gap-3">
                  <label class="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      v-model="useResumeForScrape"
                      type="checkbox"
                      class="rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500/40 cursor-pointer"
                      :disabled="scrapeInputDisabled || !resumeDoc"
                    />
                    <span>
                      Use resume job title
                      <span v-if="!resumeDoc" class="text-slate-500">(upload first)</span>
                    </span>
                  </label>
                  <label class="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      v-model="useCoverLetterForScrape"
                      type="checkbox"
                      class="rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500/40 cursor-pointer"
                      :disabled="scrapeInputDisabled || !coverLetterDoc"
                    />
                    <span>
                      Use cover letter
                      <span v-if="!coverLetterDoc" class="text-slate-500">(upload first)</span>
                    </span>
                  </label>
                  <div class="flex-1 min-w-0">
                    <input
                      v-model="scrapeJobTitle"
                      type="text"
                      placeholder="Target job title (auto-filled from resume)"
                      class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/60 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none transition-all disabled:cursor-not-allowed"
                      :disabled="scrapeInputDisabled"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          <!-- Total Stats Box -->
          <div class="md:col-span-1 bg-gradient-to-br from-emerald-950/20 to-teal-950/15 border border-emerald-500/15 rounded-3xl p-5 flex flex-col justify-center relative overflow-hidden group">
            <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500" />
            <span class="text-emerald-400/80 text-[10px] uppercase font-bold tracking-widest select-none">
              {{ showFavorites ? 'Saved Favorites' : 'Total Jobs Found' }}
            </span>
            <span class="text-4xl font-extrabold text-gradient-emerald mt-1 tracking-tight">{{ sourceJobs.length }}</span>
          </div>
        </div>

        <!-- Mobile: collapse filters/docs so jobs stay reachable -->
        <div class="md:hidden shrink-0">
          <button
            type="button"
            class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-slate-800 bg-slate-900/70 text-sm font-semibold text-slate-200 cursor-pointer"
            @click="mobileToolsOpen = !mobileToolsOpen"
          >
            <span>Filters &amp; documents</span>
            <span class="material-symbols-outlined text-[20px] text-slate-400">
              {{ mobileToolsOpen ? 'expand_less' : 'expand_more' }}
            </span>
          </button>
        </div>

        <!-- Bottom Row (Sidebar & Live Stream List) -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 flex-grow min-h-0">
          
          <!-- Left Column (Sidebar + API Status) -->
          <div
            class="md:col-span-1 flex-col gap-4 md:min-h-0 min-w-0"
            :class="mobileToolsOpen ? 'flex' : 'hidden md:flex'"
          >
            <!-- Sidebar Panel (Filters & Docs) -->
            <div class="md:flex-grow glass-panel rounded-3xl p-5 md:p-6 flex flex-col gap-6 overflow-y-auto overflow-x-hidden relative md:min-h-0 max-h-[70vh] md:max-h-none">
              <FilterBar
                v-model:search-query="searchQuery"
                v-model:location-filter="locationFilter"
                v-model:min-salary-filter="minSalaryFilter"
                @clear="clearFilters"
              />
              <div class="border-t border-slate-850 pt-6 min-w-0 shrink-0">
                <DocumentsPanel
                  :resume="resumeDoc"
                  :cover-letter="coverLetterDoc"
                  @uploaded="loadDocuments"
                  @removed="loadDocuments"
                />
              </div>
            </div>

            <!-- API Status Box -->
            <div class="shrink-0 bg-slate-900/40 backdrop-blur-sm border border-slate-800/85 rounded-3xl flex items-center px-6 py-4 gap-4 relative overflow-hidden group">
              <div class="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Globe :size="18" />
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-[10px] text-slate-500 uppercase font-bold tracking-widest select-none">API Status</span>
                <span class="text-xs font-semibold" :class="loading ? 'text-amber-400' : 'text-emerald-400'">
                  {{ loading ? 'Processing...' : apiStatusLabel }}
                </span>
                <span class="text-[10px] text-slate-500 mt-0.5 truncate">Backend: {{ apiBackendLabel }}</span>
              </div>
            </div>
          </div>

          <!-- Right Column (Live Stream Job Cards List) -->
          <div class="md:col-span-3 flex flex-col md:min-h-0 min-h-[24rem]">
            <div class="glass-panel rounded-3xl flex flex-col md:h-full overflow-hidden relative">
              <div class="p-4 md:p-6 border-b border-slate-800/60 flex justify-between items-center shrink-0 bg-slate-900/40 backdrop-blur-md z-10 flex-wrap gap-3">
                <h3 class="font-bold text-sm tracking-tight text-slate-200 flex items-center gap-2">
                  <span class="relative flex h-2 w-2" v-if="!showFavorites && !loading">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  {{ showFavorites ? 'Saved Roles' : 'Live Stream' }}
                </h3>
                <div class="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <span class="text-xs text-slate-400 font-medium">
                    Showing <span class="text-indigo-400 font-bold">{{ filteredJobs.length }}</span> matches
                  </span>
                  <select
                    v-model="sortOption"
                    class="bg-slate-950 border border-slate-800/80 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all duration-300 cursor-pointer"
                  >
                    <option value="default">Sort: Newest</option>
                    <option value="salary-high">Highest Salary</option>
                    <option value="salary-low">Lowest Salary</option>
                  </select>
                </div>
              </div>

              <!-- Job Cards Stream container -->
              <div class="md:flex-grow p-4 md:p-6 md:overflow-y-auto">
                <!-- Idle State -->
                <div
                  v-if="!loading && sourceJobs.length === 0 && !hasScraped && !showFavorites"
                  class="h-full flex flex-col items-center justify-center text-center opacity-50"
                >
                  <div class="w-16 h-16 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center mb-4">
                    <Globe class="text-slate-500" :size="24" />
                  </div>
                  <p class="text-slate-400 font-bold text-sm">System Idle</p>
                  <p class="text-slate-500 text-xs mt-1">
                    Awaiting target URL input to commence scraping.
                  </p>
                </div>

                <!-- Empty state (no scrapings found) -->
                <div
                  v-else-if="!loading && hasScraped && sourceJobs.length === 0 && !showFavorites"
                  class="h-full flex flex-col items-center justify-center text-center opacity-50"
                >
                  <p class="text-slate-400 font-bold text-sm">No Jobs Found</p>
                  <p class="text-slate-500 text-xs mt-1 max-w-sm">
                    The page may be JavaScript-rendered, blocked, or Gemini may be temporarily overloaded. Try again or use another careers URL.
                  </p>
                </div>

                <!-- Empty Favorites -->
                <div
                  v-else-if="!loading && showFavorites && sourceJobs.length === 0"
                  class="h-full flex flex-col items-center justify-center text-center opacity-50"
                >
                  <p class="text-slate-400 font-bold text-sm">No Favorites Yet</p>
                  <p class="text-slate-500 text-xs mt-1">Save some jobs to view them here.</p>
                </div>

                <!-- No matches -->
                <div
                  v-else-if="filteredJobs.length === 0 && sourceJobs.length > 0"
                  class="h-full flex flex-col items-center justify-center text-center opacity-50"
                >
                  <p class="text-slate-400 font-bold text-sm">No matches found</p>
                  <p class="text-slate-550 text-xs mt-1">Try relaxing your filter parameters.</p>
                </div>

                <!-- Job list stream -->
                <div v-else>
                  <TransitionGroup
                    name="job-list"
                    tag="div"
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4"
                  >
                    <JobCard
                      v-for="(job, idx) in filteredJobs"
                      :key="`${job.url}-${idx}`"
                      :job="job"
                      :is-favorite="isFavorite(job)"
                      :has-tailored="hasMaterials(job)"
                      :visited-at="visitedJobs[job.url]"
                      @toggle-favorite="toggleFavorite"
                      @visit="onVisit"
                      @select="handleSelectJob"
                      @remove="removeJob"
                      @apply="applyToJob"
                    />
                  </TransitionGroup>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      <div
        v-if="error"
        class="bg-red-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-medium text-sm max-w-sm"
      >
        <AlertCircle :size="18" class="shrink-0" />
        <div class="flex-grow max-h-32 overflow-y-auto pr-2">{{ error }}</div>
        <button type="button" class="p-1 hover:bg-white/20 rounded-full shrink-0" @click="error = null">
          <X :size="14" />
        </button>
      </div>

      <div
        v-if="toastMessage"
        class="bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-medium text-sm"
      >
        <CheckCircle :size="18" class="shrink-0" />
        {{ toastMessage }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.mobile-nav-link {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid rgb(30 41 59);
  background: rgb(15 23 42 / 0.8);
  color: rgb(226 232 240);
  font-size: 0.875rem;
  font-weight: 600;
}
.mobile-nav-link:hover {
  background: rgb(30 41 59);
}
.job-list-enter-active,
.job-list-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}
.job-list-enter-from,
.job-list-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
.job-list-move {
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}
</style>
