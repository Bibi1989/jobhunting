<script setup lang="ts">
import {
  PORTFOLIO_TEMPLATES,
  SAMPLE_PROFILE,
  DEFAULT_TEMPLATE_SLUG,
  mailtoHref,
  absoluteUrl,
  type Portfolio,
  type PortfolioProfileData,
} from '~/shared/types/portfolio'
import { loadBuilderJobPrefill } from '~/utils/builderJobPrefill'

definePageMeta({ layout: 'dashboard' })

const { isPro, isAdmin, creditsRemaining, aiBlockedMessage, refreshCredits } = useSaaS()
const toast = useAppToast()

const unlocked = computed(() => isPro.value || isAdmin.value)

const selectedFile = ref<File | null>(null)
const dragging = ref(false)
const selectedTemplate = ref<string>(DEFAULT_TEMPLATE_SLUG)
const fileInput = ref<HTMLInputElement | null>(null)
const jobContext = ref<{ jobId: string; title: string; company: string; description: string } | null>(
  null,
)

const generating = ref(false)
const saving = ref(false)
const creatingBlank = ref(false)
const favoritingId = ref<string | null>(null)
const showFavoritesOnly = ref(false)
const result = ref<PortfolioProfileData | null>(null)
const previewSlug = ref<string | null>(null)
const activeTab = ref<'saved' | 'create'>('saved')

const previewData = computed<PortfolioProfileData>(() => result.value ?? SAMPLE_PROFILE)

const { data: saved, refresh: refreshSaved } = await useFetch<{ portfolios: Portfolio[] }>(
  '/api/portfolio',
  { default: () => ({ portfolios: [] }) },
)

const portfolioCount = computed(() => saved.value?.portfolios?.length ?? 0)
const canCreateAnotherPortfolio = computed(() => unlocked.value || portfolioCount.value < 1)

watch(
  unlocked,
  (pro) => {
    if (!pro) selectedTemplate.value = DEFAULT_TEMPLATE_SLUG
  },
  { immediate: true },
)

const visiblePortfolios = computed(() => {
  const list = saved.value?.portfolios || []
  if (!showFavoritesOnly.value) return list
  return list.filter((p) => p.isFavorite)
})

async function togglePortfolioFavorite(p: Portfolio) {
  favoritingId.value = p.id
  const next = !p.isFavorite
  try {
    await $fetch(`/api/portfolio/${p.id}/favorite`, {
      method: 'PATCH',
      body: { isFavorite: next },
    })
    p.isFavorite = next
    toast.success(next ? 'Portfolio favorited.' : 'Removed from favorites.')
    await refreshSaved()
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    toast.error(e.data?.statusMessage || e.statusMessage || 'Could not update favorite.')
  } finally {
    favoritingId.value = null
  }
}

const route = useRoute()
const lastLoadedJobId = ref('')
watch(
  () => [route.query.template, route.query.jobId, saved.value?.portfolios?.length ?? 0, unlocked.value] as const,
  async ([slug, jobId, count]) => {
    if (typeof slug === 'string' && PORTFOLIO_TEMPLATES.some((t) => t.slug === slug)) {
      selectedTemplate.value = unlocked.value ? slug : DEFAULT_TEMPLATE_SLUG
      activeTab.value = 'create'
    } else if (typeof jobId === 'string' && jobId.trim()) {
      activeTab.value = 'create'
    } else if (count === 0 && canCreateAnotherPortfolio.value) {
      activeTab.value = 'create'
    }

    const id = typeof jobId === 'string' ? jobId.trim() : ''
    if (!id || id === lastLoadedJobId.value) return
    lastLoadedJobId.value = id

    try {
      const prefill = await loadBuilderJobPrefill(id)
      if (!prefill) return
      jobContext.value = {
        jobId: prefill.jobId,
        title: prefill.title,
        company: prefill.company,
        description: prefill.description,
      }
      if (prefill.resumeText.length > 40) {
        selectedFile.value = new File(
          [prefill.resumeText],
          prefill.resumeName.endsWith('.txt') ? prefill.resumeName : `${prefill.resumeName}.txt`,
          { type: 'text/plain' },
        )
        result.value = null
        toast.success('Job description and uploaded CV ready for portfolio generation.')
      } else if (prefill.description) {
        toast.info('Job description loaded. Upload a CV to generate the portfolio.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Could not load job context for portfolio.')
    }
  },
  { immediate: true },
)

const requestUrl = useRequestURL()
const origin = computed(() => requestUrl.origin)

function pickFile() {
  fileInput.value?.click()
}
function onFileChange(event: Event) {
  setFile((event.target as HTMLInputElement).files?.[0] ?? null)
}
function onDrop(event: DragEvent) {
  dragging.value = false
  setFile(event.dataTransfer?.files?.[0] ?? null)
}
function setFile(file: File | null) {
  if (!file) return
  if (!/\.(pdf|docx|txt|md)$/i.test(file.name)) {
    toast.error('Unsupported file. Upload a PDF, DOCX, or TXT.')
    return
  }
  selectedFile.value = file
  result.value = null
}

async function generate() {
  if (!selectedFile.value) {
    toast.error('Upload a CV or cover letter first.')
    return
  }
  generating.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    if (jobContext.value?.description) {
      formData.append('jobDescription', jobContext.value.description)
    }
    const { profileData } = await $fetch<{ profileData: PortfolioProfileData }>(
      '/api/portfolio/generate',
      { method: 'POST', body: formData },
    )
    result.value = profileData
    await refreshCredits()
    toast.success('Portfolio generated. 20 credits used.')
    document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    toast.error(e.data?.statusMessage || e.statusMessage || 'Generation failed')
  } finally {
    generating.value = false
  }
}

async function save() {
  if (!result.value) return
  if (!canCreateAnotherPortfolio.value) {
    toast.error('Free plan allows 1 portfolio. Upgrade to Pro for unlimited portfolios.')
    return
  }
  saving.value = true
  try {
    await $fetch<{ portfolio: Portfolio }>('/api/portfolio/save', {
      method: 'POST',
      body: {
        templateSlug: unlocked.value ? selectedTemplate.value : DEFAULT_TEMPLATE_SLUG,
        profileData: result.value,
      },
    })
    toast.success('Portfolio saved and published.')
    await refreshSaved()
    activeTab.value = 'saved'
    document.getElementById('my-portfolios')?.scrollIntoView({ behavior: 'smooth' })
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    toast.error(e.data?.statusMessage || e.statusMessage || 'Save failed')
  } finally {
    saving.value = false
  }
}

async function createBlankPortfolio() {
  if (!canCreateAnotherPortfolio.value) {
    toast.error('Free plan allows 1 portfolio. Upgrade to Pro for unlimited portfolios.')
    return
  }
  creatingBlank.value = true
  try {
    const blank: PortfolioProfileData = {
      full_name: 'Your Name',
      professional_bio: '',
      formatted_projects: [],
      formatted_experience: [],
      core_skills: [],
    }
    const { portfolio } = await $fetch<{ portfolio: Portfolio }>('/api/portfolio/save', {
      method: 'POST',
      body: {
        templateSlug: unlocked.value ? selectedTemplate.value : DEFAULT_TEMPLATE_SLUG,
        profileData: blank,
      },
    })
    toast.success('Portfolio created. Edit your content next.')
    await refreshSaved()
    await navigateTo(`/dashboard/portfolio/${portfolio.id}`)
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    toast.error(e.data?.statusMessage || e.statusMessage || 'Could not create portfolio')
  } finally {
    creatingBlank.value = false
  }
}

function selectTemplate(slug: string) {
  if (!unlocked.value && slug !== DEFAULT_TEMPLATE_SLUG) {
    toast.info('Upgrade to Pro to unlock all portfolio templates.')
    return
  }
  selectedTemplate.value = slug
}

async function copyLink(id: string) {
  const url = `${origin.value}/p/${id}`
  try {
    await navigator.clipboard.writeText(url)
    toast.success('Public link copied to clipboard.')
  } catch {
    toast.info(url)
  }
}

async function copyDomainHelp(id: string) {
  const text = [
    `Public portfolio URL: ${origin.value}/p/${id}`,
    '',
    'To host on your domain:',
    '1. Point a CNAME (or reverse proxy) at this app.',
    `2. Share https://yourdomain.com/p/${id}`,
    '3. The page renders without dashboard chrome.',
  ].join('\n')
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Hosting instructions copied.')
  } catch {
    toast.info(text)
  }
}

const formatDate = (s: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(s),
  )

function templateName(slug: string) {
  return PORTFOLIO_TEMPLATES.find((t) => t.slug === slug)?.name ?? slug
}

function primaryContactHref(data: PortfolioProfileData) {
  const getUrl = (val: string | { url: string } | undefined | null) => typeof val === 'string' ? val : val?.url
  return (
    mailtoHref(data.email) ||
    absoluteUrl(getUrl(data.linkedin)) ||
    absoluteUrl(getUrl(data.website)) ||
    absoluteUrl(getUrl(data.github)) ||
    '#contact'
  )
}
</script>
<template>
  <div class="px-6 py-10 max-w-7xl mx-auto">
    <header class="mb-8">
      <h1 class="font-serif text-4xl text-white mb-2">AI Portfolio Builder</h1>
      <p class="text-blue-200/60 max-w-3xl">
        Generate a live portfolio from your CV, publish it, and host it on your own domain.
        Saved portfolios stay here so you can open or share them anytime.
      </p>
      <div class="flex flex-wrap items-center gap-2 mt-6">
        <button
          type="button"
          class="rounded-lg px-3 py-2 text-sm font-semibold transition"
          :class="activeTab === 'saved' ? 'bg-blue-500 text-white' : 'border border-white/15 text-blue-100 hover:bg-white/5'"
          @click="activeTab = 'saved'"
        >
          Saved
        </button>
        <button
          type="button"
          class="rounded-lg px-3 py-2 text-sm font-semibold transition"
          :class="activeTab === 'create' ? 'bg-blue-500 text-white' : 'border border-white/15 text-blue-100 hover:bg-white/5'"
          :disabled="!canCreateAnotherPortfolio"
          :title="!canCreateAnotherPortfolio ? 'Free plan allows 1 portfolio. Upgrade to Pro.' : undefined"
          @click="activeTab = 'create'"
        >
          Create new
        </button>
        <NuxtLink
          v-if="!canCreateAnotherPortfolio"
          to="/pricing"
          class="text-xs font-semibold text-indigo-300 hover:text-indigo-200 underline underline-offset-2"
        >
          Upgrade for unlimited
        </NuxtLink>
      </div>
      <div class="w-full h-px bg-white/10 mt-6"></div>
    </header>

    <!-- Create flow first when on Create new -->
    <div v-show="activeTab === 'create'" class="relative mb-12">
      <div v-if="!canCreateAnotherPortfolio" class="rounded-2xl border border-amber-500/30 bg-amber-950/40 px-6 py-8 text-center mb-6">
        <h3 class="text-lg font-bold text-white">Portfolio limit reached</h3>
        <p class="mt-2 text-sm text-blue-200/70">
          Free plan allows 1 portfolio. Edit your existing one, or upgrade to Pro for unlimited portfolios and all templates.
        </p>
        <NuxtLink
          to="/pricing"
          class="mt-4 inline-block rounded-xl bg-blue-500 hover:bg-blue-400 px-6 py-3 font-semibold text-white transition"
        >
          Upgrade to Pro
        </NuxtLink>
      </div>
      <div v-else class="space-y-12">
        <section>
          <div
            v-if="jobContext"
            class="mb-6 rounded-2xl border border-blue-500/25 bg-blue-950/30 p-4 text-sm text-slate-200"
          >
            <p class="font-semibold text-blue-200 mb-1">
              From job{{ jobContext.title ? `: ${jobContext.title}` : '' }}
              <span v-if="jobContext.company" class="text-slate-400 font-normal"> · {{ jobContext.company }}</span>
            </p>
            <p class="text-xs text-slate-400 mb-2">
              Scraped job description will be used to emphasize matching skills and projects. Your uploaded CV is prefilled when available.
            </p>
            <p v-if="jobContext.description" class="text-xs text-slate-500 line-clamp-3 whitespace-pre-wrap">
              {{ jobContext.description }}
            </p>
          </div>
          <h2 class="text-sm font-semibold uppercase tracking-widest text-blue-200/60 mb-3">
            1 · Choose a template
          </h2>
          <p v-if="!unlocked" class="text-xs text-blue-200/50 mb-3">
            Free includes the Visionary template. Upgrade to Pro for all designs and AI generation.
          </p>
          <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div
              v-for="template in PORTFOLIO_TEMPLATES"
              :key="template.slug"
              class="group rounded-2xl border overflow-hidden bg-white/[0.02] transition text-left"
              :class="[
                selectedTemplate === template.slug
                  ? 'border-blue-400 ring-2 ring-blue-400/40'
                  : 'border-white/10 hover:border-white/25',
                !unlocked && template.slug !== DEFAULT_TEMPLATE_SLUG ? 'opacity-60' : 'cursor-pointer',
              ]"
              role="button"
              tabindex="0"
              @click="selectTemplate(template.slug)"
              @keydown.enter="selectTemplate(template.slug)"
            >
              <div class="relative h-40 overflow-hidden border-b border-white/10 bg-slate-900">
                <div
                  class="absolute top-0 left-0 origin-top-left pointer-events-none"
                  style="width: 400%; height: 400%; transform: scale(0.25);"
                >
                  <PortfolioRenderer :slug="template.slug" :data="previewData" />
                </div>
                <div class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-2 bg-gradient-to-t from-slate-950/90 to-transparent">
                  <button
                    type="button"
                    class="text-[11px] font-semibold rounded-md px-2 py-1 bg-white/90 text-slate-900 hover:bg-white"
                    @click.stop="previewSlug = template.slug"
                  >
                    Full preview
                  </button>
                  <span
                    v-if="!unlocked && template.slug !== DEFAULT_TEMPLATE_SLUG"
                    class="text-[10px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5 bg-amber-500/90 text-slate-950"
                  >Pro</span>
                  <span
                    v-else-if="selectedTemplate === template.slug"
                    class="material-symbols-outlined text-blue-400 text-xl"
                  >check_circle</span>
                </div>
              </div>
              <div class="p-3">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full" :class="template.accentClass"></span>
                  <h3 class="font-semibold text-white text-sm">{{ template.name }}</h3>
                </div>
                <p class="text-[11px] uppercase tracking-wider text-blue-200/50 mt-1">{{ template.persona }}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="flex flex-wrap items-center gap-4">
          <button
            type="button"
            class="rounded-xl border border-white/20 hover:bg-white/5 px-6 py-3 font-semibold text-white transition disabled:opacity-50"
            :disabled="creatingBlank"
            @click="createBlankPortfolio"
          >
            {{ creatingBlank ? 'Creating…' : 'Start blank portfolio' }}
          </button>
          <p class="text-sm text-blue-200/60">Edit content yourself — no AI credits required.</p>
        </section>

        <section class="relative rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div :class="unlocked ? '' : 'pointer-events-none select-none blur-sm opacity-50'" :aria-hidden="!unlocked">
            <h2 class="text-sm font-semibold uppercase tracking-widest text-blue-200/60 mb-3">
              Or generate with AI (Pro)
            </h2>
            <div
              class="rounded-2xl border-2 border-dashed p-10 text-center transition mb-4"
              :class="dragging ? 'border-blue-400 bg-blue-500/10' : 'border-white/15 hover:border-white/30'"
              role="button"
              tabindex="0"
              @click="pickFile"
              @keydown.enter="pickFile"
              @dragover.prevent="dragging = true"
              @dragleave.prevent="dragging = false"
              @drop.prevent="onDrop"
            >
              <input ref="fileInput" type="file" accept=".pdf,.docx,.txt,.md" class="hidden" @change="onFileChange" />
              <span class="material-symbols-outlined text-4xl text-blue-300">upload_file</span>
              <p v-if="selectedFile" class="text-white font-medium mt-2">{{ selectedFile.name }}</p>
              <template v-else>
                <p class="text-white font-medium mt-2">Drop your CV or cover letter here</p>
                <p class="text-blue-200/50 text-sm mt-1">or click to browse — PDF, DOCX, or TXT (max 3 pages)</p>
              </template>
            </div>
            <div class="flex flex-wrap items-center gap-4">
              <button
                type="button"
                class="rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 font-semibold text-white transition shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                :disabled="generating || !selectedFile"
                @click="generate"
              >
                {{ generating ? 'Generating…' : 'Generate Portfolio (Costs 20 Credits)' }}
              </button>
              <p class="text-sm text-blue-200/60">You have {{ creditsRemaining }} credits.</p>
            </div>
            <section v-if="result" id="preview" class="scroll-mt-24 mt-8">
              <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h2 class="text-sm font-semibold uppercase tracking-widest text-blue-200/60">
                  Preview &amp; publish — {{ templateName(selectedTemplate) }}
                </h2>
                <div class="flex flex-wrap items-center gap-2">
                  <a
                    :href="primaryContactHref(result)"
                    class="rounded-xl border border-white/15 hover:bg-white/5 px-4 py-2.5 text-sm font-semibold text-blue-100 transition"
                    :target="primaryContactHref(result).startsWith('http') ? '_blank' : undefined"
                    rel="noopener"
                  >
                    Test contact CTA
                  </a>
                  <button
                    type="button"
                    class="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 font-semibold text-white transition disabled:opacity-50"
                    :disabled="saving"
                    @click="save"
                  >
                    {{ saving ? 'Publishing…' : 'Save & Publish' }}
                  </button>
                </div>
              </div>
              <div class="rounded-2xl border border-white/10 overflow-hidden bg-white h-[640px] overflow-y-auto">
                <PortfolioRenderer :slug="selectedTemplate" :data="result" />
              </div>
            </section>
          </div>
          <div v-if="!unlocked" class="absolute inset-0 flex items-center justify-center p-6">
            <div class="text-center rounded-2xl border border-white/10 bg-slate-950/90 backdrop-blur px-6 py-8 max-w-md">
              <span class="material-symbols-outlined text-4xl text-blue-300 mb-3">stars</span>
              <h3 class="text-lg font-bold text-white">AI portfolio generation is Pro</h3>
              <p class="mt-2 text-sm text-blue-200/60">
                {{ aiBlockedMessage() || 'Start a blank portfolio above, or upgrade for AI fill from your CV.' }}
              </p>
              <NuxtLink
                to="/pricing"
                class="mt-4 inline-block rounded-xl bg-blue-500 hover:bg-blue-400 px-6 py-3 font-semibold text-white transition"
              >
                Upgrade to Pro
              </NuxtLink>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Saved portfolios last when creating -->
    <section
      id="my-portfolios"
      class="scroll-mt-24"
      :class="activeTab === 'create' ? 'pt-4 border-t border-white/10' : ''"
    >
      <div class="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div>
          <h2 class="text-sm font-semibold uppercase tracking-widest text-blue-200/60 mb-1">
            My published portfolios
          </h2>
          <p class="text-sm text-blue-200/50">
            {{ saved?.portfolios?.length || 0 }} published ·
            {{ saved?.portfolios?.filter((p) => p.isFavorite).length || 0 }} favorites
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition"
          :class="showFavoritesOnly
            ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
            : 'border-white/15 text-blue-200/70 hover:bg-white/5'"
          @click="showFavoritesOnly = !showFavoritesOnly"
        >
          <span class="material-symbols-outlined text-[16px]">star</span>
          {{ showFavoritesOnly ? 'Favorites only' : 'Show favorites' }}
        </button>
      </div>

      <p
        v-if="!visiblePortfolios.length"
        class="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-8 text-blue-200/60"
      >
        {{ showFavoritesOnly ? 'No favorite portfolios yet.' : 'Nothing published yet.' }}
        <button
          v-if="!showFavoritesOnly && activeTab !== 'create'"
          type="button"
          class="text-blue-300 hover:text-white underline underline-offset-4 ml-1"
          @click="activeTab = 'create'"
        >
          Create your first portfolio
        </button>
      </p>

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="p in visiblePortfolios"
          :key="p.id"
          class="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-3 hover:border-blue-400/40 transition relative"
        >
          <button
            type="button"
            class="absolute top-3 right-3 z-10 rounded-full bg-slate-950/70 p-1.5 text-amber-300 hover:bg-slate-950/90 disabled:opacity-40"
            :title="p.isFavorite ? 'Remove favorite' : 'Add favorite'"
            :disabled="favoritingId === p.id"
            @click="togglePortfolioFavorite(p)"
          >
            <span
              class="material-symbols-outlined text-[18px]"
              :style="p.isFavorite ? 'font-variation-settings: \'FILL\' 1' : ''"
            >star</span>
          </button>
          <div class="rounded-xl overflow-hidden border border-white/10 bg-slate-900 h-36 relative">
            <div
              class="absolute top-0 left-0 origin-top-left pointer-events-none"
              style="width: 400%; height: 400%; transform: scale(0.25);"
            >
              <PortfolioRenderer :slug="p.templateSlug" :data="p.profileData" />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            <h3 class="font-semibold text-white truncate">{{ p.profileData.full_name }}</h3>
          </div>
          <p class="text-xs text-blue-200/60">
            {{ templateName(p.templateSlug) }} · {{ formatDate(p.createdAt) }}
          </p>
          <code class="text-xs text-blue-200/70 bg-slate-900/60 rounded px-2 py-1 truncate">
            {{ origin }}/p/{{ p.id }}
          </code>
          <div class="flex flex-wrap items-center gap-2 mt-auto">
            <NuxtLink
              :to="`/dashboard/portfolio/${p.id}`"
              class="flex-1 min-w-[6rem] inline-flex items-center justify-center gap-1 rounded-lg bg-blue-500 hover:bg-blue-400 px-3 py-2 text-sm font-semibold text-white transition"
            >
              <span class="material-symbols-outlined text-[16px]">edit</span> Edit
            </NuxtLink>
            <a
              :href="`/p/${p.id}`"
              target="_blank"
              rel="noopener"
              class="rounded-lg border border-white/15 hover:bg-white/5 px-3 py-2 text-sm font-semibold text-blue-100 transition"
            >
              View live
            </a>
            <button
              type="button"
              class="rounded-lg border border-white/15 hover:bg-white/5 px-3 py-2 text-sm font-semibold text-blue-100 transition"
              @click="copyLink(p.id)"
            >
              Copy link
            </button>
            <button
              type="button"
              class="rounded-lg border border-white/15 hover:bg-white/5 px-3 py-2 text-sm font-semibold text-blue-100 transition"
              title="Copy domain hosting instructions"
              @click="copyDomainHelp(p.id)"
            >
              Domain
            </button>
          </div>
        </article>
      </div>

      <div class="mt-6 rounded-2xl border border-white/10 bg-blue-500/5 p-5 text-sm text-blue-100/80">
        <p class="font-semibold text-white mb-1 flex items-center gap-2">
          <span class="material-symbols-outlined text-blue-300">public</span>
          Host on your own domain
        </p>
        <p>
          Every published portfolio is live at
          <code class="text-blue-200">{{ origin || 'https://your-app' }}/p/&lt;id&gt;</code>
          with no dashboard chrome. Point your domain at this app (CNAME or reverse proxy) and share
          <code class="text-blue-200">yourdomain.com/p/&lt;id&gt;</code>.
          Use the Domain button on any card to copy step-by-step instructions.
        </p>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="previewSlug"
        class="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex flex-col"
        @click.self="previewSlug = null"
      >
        <div class="flex items-center justify-between px-6 h-14 bg-slate-900 border-b border-white/10 shrink-0">
          <p class="font-semibold text-white">{{ templateName(previewSlug) }} — interactive preview</p>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-lg bg-blue-500 hover:bg-blue-400 px-4 py-1.5 text-sm font-semibold text-white"
              @click="selectedTemplate = previewSlug!; previewSlug = null; activeTab = 'create'"
            >
              Use this template
            </button>
            <button
              type="button"
              class="rounded-lg border border-white/15 hover:bg-white/5 px-3 py-1.5 text-sm text-blue-100"
              @click="previewSlug = null"
            >
              Close
            </button>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto bg-white">
          <PortfolioRenderer :slug="previewSlug" :data="previewData" />
        </div>
      </div>
    </Teleport>
  </div>
</template>
