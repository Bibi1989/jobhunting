<script setup lang="ts">
import {
  PORTFOLIO_TEMPLATES,
  PORTFOLIO_COLORS,
  DEFAULT_TEMPLATE_SLUG,
  orderedBodySections,
  type Portfolio,
  type PortfolioCustomSection,
  type PortfolioExperience,
  type PortfolioProfileData,
  type PortfolioProject,
} from '~/shared/types/portfolio'
import { htmlToBulletText, normalizeBulletListHtml } from '~/utils/richText'
import { useAiUndo } from '~/composables/useAiUndo'

definePageMeta({ layout: 'dashboard' })

const { t } = useI18n()
const route = useRoute()
const toast = useAppToast()
const { confirm } = useAppConfirm()
const { isPro, isAdmin } = useSaaS()
const unlocked = computed(() => isPro.value || isAdmin.value)
const {
  canUndo: canUndoAi,
  lastLabel: lastAiUndoLabel,
  push: pushAiUndo,
  undo: undoAi,
  undoScope: undoAiScope,
  canUndoScope: canUndoAiScope,
} = useAiUndo()

function notifyAiSuccess(message: string) {
  toast.success(message, {
    action: canUndoAi.value
      ? {
          label: t('portfolioEditor.undo'),
          onClick: () => {
            const entry = undoAi()
            if (entry) toast.info(t('portfolioEditor.reverted', { label: entry.label }))
          },
        }
      : undefined,
  })
}
const id = computed(() => String(route.params.id))

const { data, error } = await useFetch<{ portfolio: Portfolio }>(
  () => `/api/portfolio/${id.value}`,
)

// Editable working copy (deep clone so edits don't mutate the fetched cache).
const form = ref<PortfolioProfileData | null>(null)
const templateSlug = ref<string>(PORTFOLIO_TEMPLATES[0]!.slug)
const saving = ref(false)
const deleting = ref(false)
const previewSlug = ref<string | null>(null)

const editingProjectsTitle = ref(false)
const editingExperienceTitle = ref(false)
const editingSkillsTitle = ref(false)
const editingCustomSectionTitle = ref<string | null>(null)

// Per-project / per-role "add tech" draft inputs, keyed by index.
const techDraft = reactive<Record<number, string>>({})
const experienceTechDraft = reactive<Record<number, string>>({})
const skillDraft = ref('')

watchEffect(() => {
  const p = data.value?.portfolio
  if (p && !form.value) {
    form.value = JSON.parse(JSON.stringify(p.profileData)) as PortfolioProfileData
    // Ensure optional arrays exist for the editor.
    form.value.formatted_projects ||= []
    form.value.formatted_experience ||= []
    for (const role of form.value.formatted_experience) {
      role.tech_stack ||= []
    }
    for (const project of form.value.formatted_projects) {
      project.tech_stack ||= []
    }
    form.value.core_skills ||= []
    form.value.custom_sections ||= []
    form.value.section_titles ||= {}
    form.value.button_texts ||= {}
    form.value.theme_color ||= PORTFOLIO_COLORS[0]!.id
    
    // Migrate old string links to the new PortfolioLink object format, and initialize missing ones
    if (typeof form.value.website === 'string') {
      form.value.website = { label: t('portfolioEditor.defaultWebsite'), url: form.value.website }
    } else if (!form.value.website) {
      form.value.website = { label: '', url: '' }
    }

    if (typeof form.value.linkedin === 'string') {
      form.value.linkedin = { label: t('portfolioEditor.defaultLinkedin'), url: form.value.linkedin }
    } else if (!form.value.linkedin) {
      form.value.linkedin = { label: '', url: '' }
    }

    if (typeof form.value.github === 'string') {
      form.value.github = { label: t('portfolioEditor.defaultGithub'), url: form.value.github }
    } else if (!form.value.github) {
      form.value.github = { label: '', url: '' }
    }

    if (typeof form.value.resume === 'string') {
      form.value.resume = { label: t('portfolioEditor.defaultResume'), url: form.value.resume }
    } else if (!form.value.resume) {
      form.value.resume = { label: '', url: '' }
    }

    // Materialize the full explicit section order (source of truth for reordering).
    form.value.section_order = orderedBodySections(form.value).map((s) => s.key)
    templateSlug.value = unlocked.value ? p.templateSlug : DEFAULT_TEMPLATE_SLUG
  }
})

watch(unlocked, (pro) => {
  if (!pro) templateSlug.value = DEFAULT_TEMPLATE_SLUG
})

function selectTemplate(slug: string) {
  if (!unlocked.value && slug !== DEFAULT_TEMPLATE_SLUG) {
    toast.info(t('portfolioEditor.upgradeProTemplates'))
    return
  }
  templateSlug.value = slug
}

const requestUrl = useRequestURL()
const origin = computed(() => requestUrl.origin)
function templateName(slug: string) {
  return PORTFOLIO_TEMPLATES.find((t) => t.slug === slug)?.name ?? slug
}

// ---- Experience ----
function addExperience() {
  if (!form.value) return
  form.value.formatted_experience ||= []
  form.value.formatted_experience.push({
    title: '',
    company: '',
    description: '',
    tech_stack: [],
    highlights: [],
  })
  form.value.section_order = orderedBodySections(form.value).map((s) => s.key)
}
function removeExperience(index: number) {
  form.value?.formatted_experience?.splice(index, 1)
  if (form.value) form.value.section_order = orderedBodySections(form.value).map((s) => s.key)
}
function moveExperience(index: number, dir: -1 | 1) {
  const list = form.value?.formatted_experience
  if (!list) return
  const to = index + dir
  if (to < 0 || to >= list.length) return
  const [item] = list.splice(index, 1)
  list.splice(to, 0, item!)
}
function ensureExperienceTech(role: PortfolioExperience) {
  if (!Array.isArray(role.tech_stack)) role.tech_stack = []
  return role.tech_stack
}
function addExperienceTech(role: PortfolioExperience, index: number) {
  const value = (experienceTechDraft[index] || '').trim()
  if (!value) return
  const stack = ensureExperienceTech(role)
  if (!stack.includes(value)) stack.push(value)
  experienceTechDraft[index] = ''
}
function removeExperienceTech(role: PortfolioExperience, tech: string) {
  role.tech_stack = ensureExperienceTech(role).filter((t) => t !== tech)
}

const experienceAnalyses = ref<Record<number, any>>({})
const analyzingExperienceIdx = ref<number | null>(null)

function descriptionPlainText(htmlOrText: string) {
  const raw = String(htmlOrText || '').trim()
  if (!raw) return ''
  if (/<[a-z][\s\S]*>/i.test(raw)) return htmlToBulletText(raw).trim()
  return raw
}

async function analyzeExperience(index: number) {
  const role = form.value?.formatted_experience?.[index]
  if (!role) return
  const title = [role.title, role.company].filter(Boolean).join(' at ')
  const description = descriptionPlainText(role.description)
  if (!title || !description) {
    toast.info(t('portfolioEditor.enterRoleBeforeAnalyze'))
    return
  }
  analyzingExperienceIdx.value = index
  try {
    const result = await $fetch<any>('/api/portfolio/analyze-project', {
      method: 'POST',
      body: {
        title,
        description,
        tech_stack: role.tech_stack || [],
      },
    })
    experienceAnalyses.value[index] = result
    toast.success(t('portfolioEditor.roleAnalyzed'))
  } catch (e) {
    console.error(e)
    toast.error(t('portfolioEditor.failedAnalyzeRole'))
  } finally {
    analyzingExperienceIdx.value = null
  }
}

function applyExperienceRewrite(index: number) {
  const analysis = experienceAnalyses.value[index]
  if (analysis && form.value?.formatted_experience?.[index]) {
    const previous = form.value.formatted_experience[index].description
    const scope = `experience:${index}`
    pushAiUndo(scope, t('portfolioEditor.undoRoleRewrite'), () => {
      if (form.value?.formatted_experience?.[index]) {
        form.value.formatted_experience[index].description = previous
      }
    })
    form.value.formatted_experience[index].description = normalizeBulletListHtml(analysis.suggestedRewrite)
    notifyAiSuccess(t('portfolioEditor.rewriteAppliedRole'))
  }
}

// ---- Projects ----
function addProject() {
  form.value?.formatted_projects.push({ title: '', description: '', tech_stack: [] })
  if (form.value) form.value.section_order = orderedBodySections(form.value).map((s) => s.key)
}
function removeProject(index: number) {
  form.value?.formatted_projects.splice(index, 1)
  if (form.value) form.value.section_order = orderedBodySections(form.value).map((s) => s.key)
}
function moveProject(index: number, dir: -1 | 1) {
  const list = form.value?.formatted_projects
  if (!list) return
  const to = index + dir
  if (to < 0 || to >= list.length) return
  const [item] = list.splice(index, 1)
  list.splice(to, 0, item!)
}
function addTech(project: PortfolioProject, index: number) {
  const value = (techDraft[index] || '').trim()
  if (!value) return
  if (!project.tech_stack.includes(value)) project.tech_stack.push(value)
  techDraft[index] = ''
}
function removeTech(project: PortfolioProject, tech: string) {
  project.tech_stack = project.tech_stack.filter((t) => t !== tech)
}

const projectAnalyses = ref<Record<number, any>>({})
const analyzingProjectIdx = ref<number | null>(null)

async function analyzeProject(index: number) {
  const project = form.value?.formatted_projects[index]
  if (!project || !project.title || !descriptionPlainText(project.description)) {
    toast.info(t('portfolioEditor.enterProjectBeforeAnalyze'))
    return
  }
  analyzingProjectIdx.value = index
  try {
    const result = await $fetch<any>('/api/portfolio/analyze-project', {
      method: 'POST',
      body: {
        title: project.title,
        description: descriptionPlainText(project.description),
        tech_stack: project.tech_stack,
      },
    })
    projectAnalyses.value[index] = result
    toast.success(t('portfolioEditor.projectAnalyzed'))
  } catch (e) {
    console.error(e)
    toast.error(t('portfolioEditor.failedAnalyzeProject'))
  } finally {
    analyzingProjectIdx.value = null
  }
}

function applyProjectRewrite(index: number) {
  const analysis = projectAnalyses.value[index]
  if (analysis && form.value?.formatted_projects[index]) {
    const previous = form.value.formatted_projects[index].description
    const scope = `project:${index}`
    pushAiUndo(scope, t('portfolioEditor.undoProjectRewrite'), () => {
      if (form.value?.formatted_projects[index]) {
        form.value.formatted_projects[index].description = previous
      }
    })
    form.value.formatted_projects[index].description = normalizeBulletListHtml(analysis.suggestedRewrite)
    notifyAiSuccess(t('portfolioEditor.rewriteAppliedProject'))
  }
}

// ---- Sections (reorder + custom) ----
type SectionEntry = { key: string; kind: 'projects' | 'experience' | 'skills' | 'custom'; label: string }

const sectionEntries = computed<SectionEntry[]>(() => {
  if (!form.value) return []
  return orderedBodySections(form.value).map((s) => ({
    key: s.key,
    kind: s.kind,
    label:
      s.kind === 'projects'
        ? t('portfolioEditor.projects')
        : s.kind === 'experience'
          ? t('portfolioEditor.experience')
          : s.kind === 'skills'
            ? t('portfolioEditor.skills')
            : s.custom?.title?.trim() || t('portfolioEditor.customSection'),
  }))
})

function commitOrder(keys: string[]) {
  if (form.value) form.value.section_order = keys
}
function moveSection(index: number, dir: -1 | 1) {
  const keys = sectionEntries.value.map((e) => e.key)
  const to = index + dir
  if (to < 0 || to >= keys.length) return
  const [k] = keys.splice(index, 1)
  if (k === undefined) return
  keys.splice(to, 0, k)
  commitOrder(keys)
}

const sectionDrag = ref<number | null>(null)
const sectionOver = ref<number | null>(null)
function onSectionDrop(index: number) {
  const from = sectionDrag.value
  sectionDrag.value = null
  sectionOver.value = null
  if (from === null || from === index) return
  const keys = sectionEntries.value.map((e) => e.key)
  const [k] = keys.splice(from, 1)
  if (k === undefined) return
  keys.splice(index, 0, k)
  commitOrder(keys)
}

function customSectionFor(key: string): PortfolioCustomSection | undefined {
  return form.value?.custom_sections?.find((c) => c.id === key)
}
function addCustomSection() {
  if (!form.value) return
  form.value.custom_sections ||= []
  const id = `custom-${Math.random().toString(36).slice(2, 8)}`
  form.value.custom_sections.push({ id, title: t('portfolioEditor.newSection'), content: '' })
  form.value.section_order = orderedBodySections(form.value).map((s) => s.key)
}
function removeCustomSection(key: string) {
  if (!form.value) return
  form.value.custom_sections = (form.value.custom_sections || []).filter((c) => c.id !== key)
  form.value.section_order = (form.value.section_order || []).filter((k) => k !== key)
}

// ---- Skills ----
function addSkill() {
  const value = skillDraft.value.trim()
  if (!value || !form.value) return
  if (!form.value.core_skills.includes(value)) form.value.core_skills.push(value)
  skillDraft.value = ''
}
function removeSkill(skill: string) {
  if (form.value) form.value.core_skills = form.value.core_skills.filter((s) => s !== skill)
}

async function save() {
  if (!form.value) return
  if (!form.value.full_name.trim()) {
    toast.error(t('portfolioEditor.fullNameRequired'))
    return
  }
  saving.value = true
  try {
    await $fetch(`/api/portfolio/${id.value}`, {
      method: 'PUT',
      body: { templateSlug: templateSlug.value, profileData: form.value },
    })
    toast.success(t('portfolioEditor.portfolioUpdated'))
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    toast.error(e.data?.statusMessage || e.statusMessage || t('portfolioEditor.updateFailed'))
  } finally {
    saving.value = false
  }
}

async function remove() {
  const ok = await confirm({
    title: t('portfolioEditor.deleteTitle'),
    message: t('portfolioEditor.deleteMessage'),
    confirmLabel: t('portfolioEditor.deleteConfirm'),
    danger: true,
  })
  if (!ok) return
  deleting.value = true
  try {
    await $fetch(`/api/portfolio/${id.value}`, { method: 'DELETE' })
    toast.success(t('portfolioEditor.portfolioDeleted'))
    await navigateTo('/dashboard/portfolio')
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    toast.error(e.data?.statusMessage || e.statusMessage || t('portfolioEditor.deleteFailed'))
  } finally {
    deleting.value = false
  }
}

const contactFields = computed(() => [
  { key: 'email', label: t('portfolioEditor.email'), placeholder: t('portfolioEditor.emailPlaceholder'), icon: 'mail' },
  { key: 'phone', label: t('portfolioEditor.phone'), placeholder: t('portfolioEditor.phonePlaceholder'), icon: 'call' },
  { key: 'location', label: t('portfolioEditor.location'), placeholder: t('portfolioEditor.locationPlaceholder'), icon: 'location_on' },
  { key: 'website', label: t('portfolioEditor.website'), placeholder: t('portfolioEditor.websitePlaceholder'), icon: 'language' },
  { key: 'linkedin', label: t('portfolioEditor.linkedin'), placeholder: t('portfolioEditor.linkedinPlaceholder'), icon: 'link' },
  { key: 'github', label: t('portfolioEditor.github'), placeholder: t('portfolioEditor.githubPlaceholder'), icon: 'code' },
  { key: 'resume', label: t('portfolioEditor.resume'), placeholder: t('portfolioEditor.resumePlaceholder'), icon: 'description' },
] as const)

const inputClass =
  'w-full rounded-lg bg-slate-900/60 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-blue-200/30 focus:outline-none focus:border-blue-400 transition'
</script>

<template>
  <div class="px-6 py-8 max-w-[1500px] mx-auto">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink to="/dashboard/portfolio" class="material-symbols-outlined text-blue-200/70 hover:text-white">arrow_back</NuxtLink>
        <div>
          <h1 class="font-serif text-2xl sm:text-3xl text-white">{{ t('portfolioEditor.editPortfolio') }}</h1>
          <p class="text-xs text-blue-200/50" v-if="form">{{ templateName(templateSlug) }} · /p/{{ id }}</p>
        </div>
      </div>
      <div v-if="form" class="flex flex-wrap items-center gap-2">
        <a
          :href="`/p/${id}`"
          target="_blank"
          rel="noopener"
          class="rounded-lg border border-white/15 hover:bg-white/5 px-4 py-2 text-sm font-semibold text-blue-100 transition"
        >
          {{ t('portfolioEditor.viewLive') }}
        </a>
        <button
          v-if="canUndoAi"
          type="button"
          class="rounded-lg border border-amber-500/40 text-amber-200 hover:bg-amber-500/15 px-4 py-2 text-sm font-semibold transition inline-flex items-center gap-1"
          :title="lastAiUndoLabel"
          @click="() => { const entry = undoAi(); if (entry) toast.info(t('portfolioEditor.reverted', { label: entry.label })) }"
        >
          <span class="material-symbols-outlined text-[16px]">undo</span>
          {{ t('portfolioEditor.undoAi') }}
        </button>
        <button
          type="button"
          class="rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10 px-4 py-2 text-sm font-semibold transition disabled:opacity-50"
          :disabled="deleting"
          @click="remove"
        >
          {{ deleting ? t('portfolioEditor.deleting') : t('portfolioEditor.delete') }}
        </button>
        <button
          type="button"
          class="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-5 py-2 text-sm font-semibold text-white transition disabled:opacity-50 shadow-[0_0_18px_rgba(16,185,129,0.35)]"
          :disabled="saving"
          @click="save"
        >
          {{ saving ? t('portfolioEditor.saving') : t('portfolioEditor.saveChanges') }}
        </button>
      </div>
    </div>

    <!-- Not found -->
    <div v-if="error" class="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
      <p class="text-white font-semibold text-lg">{{ t('portfolioEditor.notFound') }}</p>
      <p class="text-blue-200/60 mt-1">{{ (error as any)?.statusMessage || t('portfolioEditor.notFoundMessage') }}</p>
      <NuxtLink to="/dashboard/portfolio" class="inline-block mt-4 rounded-lg bg-blue-500 hover:bg-blue-400 px-5 py-2.5 font-semibold text-white">
        {{ t('portfolioEditor.backToPortfolios') }}
      </NuxtLink>
    </div>

    <!-- Editor + live preview -->
    <div v-else-if="form" class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-6 items-start">
      <!-- LEFT: form -->
      <div class="space-y-6 min-w-0">
        <!-- Template -->
        <section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 class="font-semibold text-white mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-blue-300">dashboard_customize</span> {{ t('portfolioEditor.template') }}
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div
              v-for="template in PORTFOLIO_TEMPLATES"
              :key="template.slug"
              class="group rounded-xl border overflow-hidden bg-white/[0.02] transition"
              :class="[
                templateSlug === template.slug ? 'border-blue-400 ring-2 ring-blue-400/40' : 'border-white/10 hover:border-white/25',
                !unlocked && template.slug !== DEFAULT_TEMPLATE_SLUG ? 'opacity-60' : 'cursor-pointer',
              ]"
              role="button"
              tabindex="0"
              @click="selectTemplate(template.slug)"
              @keydown.enter="selectTemplate(template.slug)"
            >
              <div class="relative h-24 overflow-hidden border-b border-white/10 bg-slate-900">
                <div class="absolute top-0 left-0 origin-top-left pointer-events-none" style="width: 500%; height: 500%; transform: scale(0.2);">
                  <PortfolioRenderer :slug="template.slug" :data="form" />
                </div>
                <span
                  v-if="!unlocked && template.slug !== DEFAULT_TEMPLATE_SLUG"
                  class="absolute top-1 right-1 text-[9px] font-bold uppercase tracking-wider rounded px-1 py-0.5 bg-amber-500/90 text-slate-950"
                >{{ t('portfolioEditor.pro') }}</span>
                <button
                  type="button"
                  class="absolute bottom-1 right-1 text-[10px] font-semibold rounded bg-white/90 text-slate-900 px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition"
                  @click.stop="previewSlug = template.slug"
                >
                  {{ t('portfolioEditor.preview') }}
                </button>
              </div>
              <div class="p-2 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full shrink-0 bg-slate-400"></span>
                <span class="text-xs font-semibold text-white truncate">{{ template.name }}</span>
                <span v-if="templateSlug === template.slug" class="material-symbols-outlined text-blue-400 text-[16px] ml-auto">check_circle</span>
              </div>
            </div>
          </div>
          <p v-if="!unlocked" class="mt-3 text-xs text-blue-200/50">
            {{ t('portfolioEditor.freePlanTemplate') }}
            <NuxtLink to="/pricing" class="text-indigo-300 hover:text-indigo-200 underline underline-offset-2">{{ t('portfolioEditor.upgradePro') }}</NuxtLink>
            {{ t('portfolioEditor.forAllDesigns') }}
          </p>
        </section>

        <!-- Color Theme -->
        <section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 class="font-semibold text-white mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-blue-300">palette</span> {{ t('portfolioEditor.colorTheme') }}
          </h2>
          <div class="flex flex-wrap gap-3">
            <button
              v-for="color in PORTFOLIO_COLORS"
              :key="color.id"
              type="button"
              class="w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center"
              :class="form.theme_color === color.id ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent hover:scale-105'"
              :style="{ backgroundColor: color.hex }"
              :title="color.name"
              @click="form.theme_color = color.id"
            >
              <span v-if="form.theme_color === color.id" class="material-symbols-outlined text-white text-[16px] font-bold">check</span>
            </button>
          </div>
        </section>

        <!-- Navigation & Buttons -->
        <section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 class="font-semibold text-white mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-blue-300">smart_button</span> {{ t('portfolioEditor.navButtons') }}
          </h2>
          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs uppercase tracking-widest text-blue-200/50 mb-1">{{ t('portfolioEditor.primaryCta') }}</label>
              <input v-model="form.button_texts!.contact_cta" :class="inputClass" :placeholder="t('portfolioEditor.primaryCtaPlaceholder')" />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-blue-200/50 mb-1">{{ t('portfolioEditor.heroCta') }}</label>
              <input v-model="form.button_texts!.hero_cta" :class="inputClass" :placeholder="t('portfolioEditor.heroCtaPlaceholder')" />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-blue-200/50 mb-1">{{ t('portfolioEditor.navProjects') }}</label>
              <input v-model="form.button_texts!.nav_projects" :class="inputClass" :placeholder="t('portfolioEditor.navProjectsPlaceholder')" />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-blue-200/50 mb-1">{{ t('portfolioEditor.navExperience') }}</label>
              <input v-model="form.button_texts!.nav_experience" :class="inputClass" :placeholder="t('portfolioEditor.navExperiencePlaceholder')" />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-blue-200/50 mb-1">{{ t('portfolioEditor.navSkills') }}</label>
              <input v-model="form.button_texts!.nav_skills" :class="inputClass" :placeholder="t('portfolioEditor.navSkillsPlaceholder')" />
            </div>
          </div>
        </section>

        <!-- Basics -->
        <section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 class="font-semibold text-white mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-blue-300">badge</span> {{ t('portfolioEditor.basics') }}
          </h2>
          <div class="space-y-3">
            <div>
              <label class="block text-xs uppercase tracking-widest text-blue-200/50 mb-1">{{ t('portfolioEditor.fullName') }}</label>
              <input v-model="form.full_name" :class="inputClass" :placeholder="t('portfolioEditor.yourName')" />
            </div>
            <div>
              <div class="flex items-center gap-2 mb-1 group">
                <input
                  class="bg-transparent border-b border-transparent focus:border-blue-400 focus:outline-none text-xs uppercase tracking-widest text-blue-200/50 hover:border-white/20 transition"
                  :placeholder="t('portfolioEditor.professionalBio')"
                  v-model="form.section_titles!.profile"
                />
                <span class="material-symbols-outlined text-[14px] text-blue-200/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">edit</span>
              </div>
              <textarea v-model="form.professional_bio" rows="4" :class="inputClass" :placeholder="t('portfolioEditor.bioPlaceholder')"></textarea>
            </div>
          </div>
        </section>

        <!-- Contact -->
        <section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 class="font-semibold text-white mb-1 flex items-center gap-2">
            <span class="material-symbols-outlined text-blue-300">contact_mail</span> {{ t('portfolioEditor.contact') }}
          </h2>
          <p class="text-xs text-blue-200/50 mb-4">
            {{ t('portfolioEditor.contactHelp') }}
          </p>
          <div class="grid sm:grid-cols-2 gap-3">
            <div v-for="field in contactFields" :key="field.key">
              <label class="block text-xs uppercase tracking-widest text-blue-200/50 mb-1">{{ field.label }}</label>
              <div v-if="['website', 'linkedin', 'github', 'resume'].includes(field.key)" class="flex gap-2">
                <input v-model="(form[field.key as keyof PortfolioProfileData] as any).label" :placeholder="t('portfolioEditor.displayText')" :class="[inputClass, 'w-1/3']" />
                <div class="relative w-2/3">
                  <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-200/40 text-[18px]">{{ field.icon }}</span>
                  <input v-model="(form[field.key as keyof PortfolioProfileData] as any).url" :placeholder="field.placeholder" :class="[inputClass, 'pl-9']" />
                </div>
              </div>
              <div v-else class="relative">
                <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-200/40 text-[18px]">{{ field.icon }}</span>
                <input v-model="(form as any)[field.key]" :placeholder="field.placeholder" :class="[inputClass, 'pl-9']" />
              </div>
            </div>
          </div>
        </section>

        <!-- Experience -->
        <section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-white flex items-center gap-2">
              <span class="material-symbols-outlined text-blue-300">work_history</span>
              <span v-if="!editingExperienceTitle" class="flex items-center gap-2">
                {{ form.section_titles!.experience || t('portfolioEditor.experience') }}
                <button type="button" @click="editingExperienceTitle = true" class="text-blue-200/40 hover:text-white transition">
                  <span class="material-symbols-outlined text-[16px]">edit</span>
                </button>
              </span>
              <input
                v-else
                v-model="form.section_titles!.experience"
                class="bg-slate-900/60 border border-blue-500/50 rounded px-2 py-0.5 text-sm text-white focus:outline-none w-40"
                :placeholder="t('portfolioEditor.experienceTitle')"
                @blur="editingExperienceTitle = false; save()"
                @keyup.enter="editingExperienceTitle = false; save()"
                autofocus
              />
              <span class="text-blue-200/50 text-sm font-normal ml-2">({{ form.formatted_experience?.length || 0 }})</span>
            </h2>
            <button type="button" class="rounded-lg bg-blue-500/90 hover:bg-blue-400 px-3 py-1.5 text-sm font-semibold text-white" @click="addExperience">
              {{ t('portfolioEditor.addRole') }}
            </button>
          </div>

          <p v-if="!(form.formatted_experience?.length)" class="text-blue-200/50 italic text-sm">
            {{ t('portfolioEditor.noExperience') }}
          </p>

          <div v-else class="space-y-4">
            <div
              v-for="(role, i) in form.formatted_experience"
              :key="i"
              class="rounded-xl border border-white/10 bg-slate-900/40 p-4"
            >
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-semibold text-blue-200/50 uppercase tracking-widest">{{ t('portfolioEditor.roleN', { n: i + 1 }) }}</span>
                <div class="flex items-center gap-1">
                  <button type="button" class="material-symbols-outlined text-[18px] text-blue-200/50 hover:text-white disabled:opacity-30" :disabled="i === 0" :title="t('portfolioEditor.moveUp')" @click="moveExperience(i, -1)">arrow_upward</button>
                  <button type="button" class="material-symbols-outlined text-[18px] text-blue-200/50 hover:text-white disabled:opacity-30" :disabled="i === (form.formatted_experience?.length || 0) - 1" :title="t('portfolioEditor.moveDown')" @click="moveExperience(i, 1)">arrow_downward</button>
                  <button type="button" class="material-symbols-outlined text-[18px] text-red-300/70 hover:text-red-300" :title="t('portfolioEditor.remove')" @click="removeExperience(i)">delete</button>
                </div>
              </div>
              <div class="space-y-3">
                <div class="grid sm:grid-cols-2 gap-3">
                  <input v-model="role.title" :class="inputClass" :placeholder="t('portfolioEditor.jobTitle')" />
                  <input v-model="role.company" :class="inputClass" :placeholder="t('portfolioEditor.company')" />
                </div>
                <div class="grid sm:grid-cols-3 gap-3">
                  <input v-model="role.location" :class="inputClass" :placeholder="t('portfolioEditor.location')" />
                  <input v-model="role.start_date" :class="inputClass" :placeholder="t('portfolioEditor.startDate')" />
                  <input v-model="role.end_date" :class="inputClass" :disabled="role.is_current" :placeholder="t('portfolioEditor.endDate')" />
                </div>
                <label class="inline-flex items-center gap-2 text-sm text-blue-100/80">
                  <input v-model="role.is_current" type="checkbox" class="rounded border-white/20 bg-slate-900" />
                  {{ t('portfolioEditor.currentRole') }}
                </label>

                <div>
                  <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1 block">
                    {{ t('portfolioEditor.description') }}
                    <span class="text-blue-400 normal-case ml-2">{{ t('portfolioEditor.descriptionHint') }}</span>
                  </label>
                  <div class="rounded border border-white/10 bg-white/5 overflow-hidden">
                    <BuilderBulletDescriptionEditor
                      :key="`exp-desc-${i}`"
                      v-model="role.description"
                      :placeholder="t('portfolioEditor.experienceDescPlaceholder')"
                      :rows="4"
                    />
                  </div>
                </div>

                <div>
                  <div class="flex flex-wrap gap-1.5 mb-2">
                    <span
                      v-for="tech in (role.tech_stack || [])"
                      :key="tech"
                      class="inline-flex items-center gap-1 rounded-md bg-blue-500/15 text-blue-200 text-xs px-2 py-1"
                    >
                      {{ tech }}
                      <button type="button" class="material-symbols-outlined text-[14px] hover:text-white" @click="removeExperienceTech(role, tech)">close</button>
                    </span>
                  </div>
                  <input
                    v-model="experienceTechDraft[i]"
                    :class="inputClass"
                    :placeholder="t('portfolioEditor.addTech')"
                    @keyup.enter="addExperienceTech(role, i)"
                  />
                </div>

                <!-- Case Study Quality Scoring & Feedback -->
                <div class="mt-4 border-t border-white/5 pt-4">
                  <div class="flex justify-between items-center mb-3">
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-blue-300 text-lg">analytics</span>
                      <span class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{{ t('portfolioEditor.caseStudyCheck') }}</span>
                    </div>
                    <button
                      type="button"
                      class="px-3 py-1 bg-blue-500/20 text-blue-300 hover:bg-blue-500 hover:text-white border border-blue-500/30 rounded text-xs transition duration-200 cursor-pointer flex items-center gap-1"
                      :disabled="analyzingExperienceIdx === i"
                      @click="analyzeExperience(i)"
                    >
                      <span class="material-symbols-outlined text-[14px]" :class="{'animate-spin': analyzingExperienceIdx === i}">
                        {{ analyzingExperienceIdx === i ? 'sync' : 'auto_awesome' }}
                      </span>
                      {{ analyzingExperienceIdx === i ? t('portfolioEditor.analyzing') : t('portfolioEditor.analyzeCaseStudy') }}
                    </button>
                  </div>

                  <div v-if="experienceAnalyses[i]" class="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4">
                    <div class="flex flex-wrap items-center gap-4 justify-between">
                      <div class="flex items-center gap-3">
                        <div class="flex flex-col items-center justify-center w-14 h-14 rounded-full border-2 border-indigo-400/60 bg-indigo-500/10">
                          <span class="text-sm font-black text-white">{{ experienceAnalyses[i].score }}</span>
                          <span class="text-[8px] uppercase tracking-widest text-indigo-300">/ 100</span>
                        </div>
                        <div>
                          <p class="text-xs font-semibold text-white">{{ t('portfolioEditor.completenessScore') }}</p>
                          <p class="text-[10px] text-slate-400 leading-none">{{ t('portfolioEditor.measuresDepth') }}</p>
                        </div>
                      </div>

                      <div class="flex-1 max-w-[280px] grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] text-slate-400">
                        <div class="flex items-center justify-between">
                          <span>{{ t('portfolioEditor.problem') }}</span>
                          <span class="font-mono text-white">{{ experienceAnalyses[i].breakdown.problem }}%</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span>{{ t('portfolioEditor.action') }}</span>
                          <span class="font-mono text-white">{{ experienceAnalyses[i].breakdown.action }}%</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span>{{ t('portfolioEditor.results') }}</span>
                          <span class="font-mono text-white">{{ experienceAnalyses[i].breakdown.results }}%</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span>{{ t('portfolioEditor.techSpec') }}</span>
                          <span class="font-mono text-white">{{ experienceAnalyses[i].breakdown.tech }}%</span>
                        </div>
                      </div>
                    </div>

                    <div v-if="experienceAnalyses[i].improvements?.length" class="space-y-1.5 border-t border-white/5 pt-3">
                      <h4 class="text-[10px] uppercase tracking-widest text-amber-300 font-bold">{{ t('portfolioEditor.targetedImprovements') }}</h4>
                      <ul class="space-y-1 text-xs text-slate-300">
                        <li v-for="(imp, impIdx) in experienceAnalyses[i].improvements" :key="impIdx" class="flex gap-2 items-start text-left">
                          <span class="material-symbols-outlined text-[14px] text-amber-400 mt-0.5 shrink-0">warning</span>
                          <span>{{ imp }}</span>
                        </li>
                      </ul>
                    </div>

                    <div v-if="experienceAnalyses[i].suggestedRewrite" class="border-t border-white/5 pt-3 space-y-2">
                      <div class="flex justify-between items-center">
                        <h4 class="text-[10px] uppercase tracking-widest text-emerald-300 font-bold">{{ t('portfolioEditor.suggestedRewrite') }}</h4>
                        <div class="flex items-center gap-1.5">
                          <button
                            v-if="canUndoAiScope(`experience:${i}`)"
                            type="button"
                            class="px-2 py-0.5 bg-amber-500/15 text-amber-200 hover:bg-amber-500/30 border border-amber-500/30 rounded text-[10px] transition duration-200 cursor-pointer"
                            @click="() => { const entry = undoAiScope(`experience:${i}`); if (entry) toast.info(t('portfolioEditor.roleRewriteUndone')) }"
                          >
                            {{ t('portfolioEditor.undo') }}
                          </button>
                          <button
                            type="button"
                            class="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 rounded text-[10px] transition duration-200 cursor-pointer"
                            @click="applyExperienceRewrite(i)"
                          >
                            {{ t('portfolioEditor.applyRewrite') }}
                          </button>
                        </div>
                      </div>
                      <p class="text-xs text-slate-300 bg-black/30 p-2.5 rounded border border-white/5 italic text-left whitespace-pre-wrap">
                        {{ experienceAnalyses[i].suggestedRewrite }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Projects -->
        <section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-white flex items-center gap-2">
              <span class="material-symbols-outlined text-blue-300">work</span>
              <span v-if="!editingProjectsTitle" class="flex items-center gap-2">
                {{ form.section_titles!.projects || t('portfolioEditor.projects') }}
                <button type="button" @click="editingProjectsTitle = true" class="text-blue-200/40 hover:text-white transition">
                  <span class="material-symbols-outlined text-[16px]">edit</span>
                </button>
              </span>
              <input
                v-else
                v-model="form.section_titles!.projects"
                class="bg-slate-900/60 border border-blue-500/50 rounded px-2 py-0.5 text-sm text-white focus:outline-none w-40"
                :placeholder="t('portfolioEditor.projectsTitle')"
                @blur="editingProjectsTitle = false; save()"
                @keyup.enter="editingProjectsTitle = false; save()"
                autofocus
              />
              <span class="text-blue-200/50 text-sm font-normal ml-2">({{ form.formatted_projects.length }})</span>
            </h2>
            <button type="button" class="rounded-lg bg-blue-500/90 hover:bg-blue-400 px-3 py-1.5 text-sm font-semibold text-white" @click="addProject">
              {{ t('portfolioEditor.addProject') }}
            </button>
          </div>

          <p v-if="!form.formatted_projects.length" class="text-blue-200/50 italic text-sm">
            {{ t('portfolioEditor.noProjects') }}
          </p>

          <div v-else class="space-y-4">
            <div
              v-for="(project, i) in form.formatted_projects"
              :key="i"
              class="rounded-xl border border-white/10 bg-slate-900/40 p-4"
            >
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-semibold text-blue-200/50 uppercase tracking-widest">{{ t('portfolioEditor.projectN', { n: i + 1 }) }}</span>
                <div class="flex items-center gap-1">
                  <button type="button" class="material-symbols-outlined text-[18px] text-blue-200/50 hover:text-white disabled:opacity-30" :disabled="i === 0" :title="t('portfolioEditor.moveUp')" @click="moveProject(i, -1)">arrow_upward</button>
                  <button type="button" class="material-symbols-outlined text-[18px] text-blue-200/50 hover:text-white disabled:opacity-30" :disabled="i === form.formatted_projects.length - 1" :title="t('portfolioEditor.moveDown')" @click="moveProject(i, 1)">arrow_downward</button>
                  <button type="button" class="material-symbols-outlined text-[18px] text-red-300/70 hover:text-red-300" :title="t('portfolioEditor.remove')" @click="removeProject(i)">delete</button>
                </div>
              </div>
              <div class="space-y-3">
                <input v-model="project.title" :class="inputClass" :placeholder="t('portfolioEditor.projectTitle')" />
                <div>
                  <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1 block">
                    {{ t('portfolioEditor.description') }}
                    <span class="text-blue-400 normal-case ml-2">{{ t('portfolioEditor.descriptionHint') }}</span>
                  </label>
                  <div class="rounded border border-white/10 bg-white/5 overflow-hidden">
                    <BuilderBulletDescriptionEditor
                      :key="`proj-desc-${i}`"
                      v-model="project.description"
                      :placeholder="t('portfolioEditor.projectDescPlaceholder')"
                      :rows="4"
                    />
                  </div>
                </div>
                <input v-model="project.url" :class="inputClass" :placeholder="t('portfolioEditor.projectUrlPlaceholder')" />
                <div>
                  <div class="flex flex-wrap gap-1.5 mb-2">
                    <span
                      v-for="tech in project.tech_stack"
                      :key="tech"
                      class="inline-flex items-center gap-1 rounded-md bg-blue-500/15 text-blue-200 text-xs px-2 py-1"
                    >
                      {{ tech }}
                      <button type="button" class="material-symbols-outlined text-[14px] hover:text-white" @click="removeTech(project, tech)">close</button>
                    </span>
                  </div>
                  <input
                    v-model="techDraft[i]"
                    :class="inputClass"
                    :placeholder="t('portfolioEditor.addTech')"
                    @keyup.enter="addTech(project, i)"
                  />
                </div>

                <!-- Case Study Quality Scoring & Feedback -->
                <div class="mt-4 border-t border-white/5 pt-4">
                  <div class="flex justify-between items-center mb-3">
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-blue-300 text-lg">analytics</span>
                      <span class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{{ t('portfolioEditor.caseStudyCheck') }}</span>
                    </div>
                    <button
                      type="button"
                      class="px-3 py-1 bg-blue-500/20 text-blue-300 hover:bg-blue-500 hover:text-white border border-blue-500/30 rounded text-xs transition duration-200 cursor-pointer flex items-center gap-1"
                      :disabled="analyzingProjectIdx === i"
                      @click="analyzeProject(i)"
                    >
                      <span class="material-symbols-outlined text-[14px]" :class="{'animate-spin': analyzingProjectIdx === i}">
                        {{ analyzingProjectIdx === i ? 'sync' : 'auto_awesome' }}
                      </span>
                      {{ analyzingProjectIdx === i ? t('portfolioEditor.analyzing') : t('portfolioEditor.analyzeCaseStudy') }}
                    </button>
                  </div>

                  <div v-if="projectAnalyses[i]" class="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4">
                    <!-- Overall Score & Breakdown -->
                    <div class="flex flex-wrap items-center gap-4 justify-between">
                      <div class="flex items-center gap-3">
                        <div class="flex flex-col items-center justify-center w-14 h-14 rounded-full border-2 border-indigo-400/60 bg-indigo-500/10">
                          <span class="text-sm font-black text-white">{{ projectAnalyses[i].score }}</span>
                          <span class="text-[8px] uppercase tracking-widest text-indigo-300">/ 100</span>
                        </div>
                        <div>
                          <p class="text-xs font-semibold text-white">{{ t('portfolioEditor.completenessScore') }}</p>
                          <p class="text-[10px] text-slate-400 leading-none">{{ t('portfolioEditor.measuresDepth') }}</p>
                        </div>
                      </div>

                      <!-- Breakdown bars -->
                      <div class="flex-1 max-w-[280px] grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] text-slate-400">
                        <div class="flex items-center justify-between">
                          <span>{{ t('portfolioEditor.problem') }}</span>
                          <span class="font-mono text-white">{{ projectAnalyses[i].breakdown.problem }}%</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span>{{ t('portfolioEditor.action') }}</span>
                          <span class="font-mono text-white">{{ projectAnalyses[i].breakdown.action }}%</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span>{{ t('portfolioEditor.results') }}</span>
                          <span class="font-mono text-white">{{ projectAnalyses[i].breakdown.results }}%</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span>{{ t('portfolioEditor.techSpec') }}</span>
                          <span class="font-mono text-white">{{ projectAnalyses[i].breakdown.tech }}%</span>
                        </div>
                      </div>
                    </div>

                    <!-- Targeted Improvements -->
                    <div v-if="projectAnalyses[i].improvements?.length" class="space-y-1.5 border-t border-white/5 pt-3">
                      <h4 class="text-[10px] uppercase tracking-widest text-amber-300 font-bold">{{ t('portfolioEditor.targetedImprovements') }}</h4>
                      <ul class="space-y-1 text-xs text-slate-300">
                        <li v-for="(imp, impIdx) in projectAnalyses[i].improvements" :key="impIdx" class="flex gap-2 items-start text-left">
                          <span class="material-symbols-outlined text-[14px] text-amber-400 mt-0.5 shrink-0">warning</span>
                          <span>{{ imp }}</span>
                        </li>
                      </ul>
                    </div>

                    <!-- Suggested Rewrite -->
                    <div v-if="projectAnalyses[i].suggestedRewrite" class="border-t border-white/5 pt-3 space-y-2">
                      <div class="flex justify-between items-center">
                        <h4 class="text-[10px] uppercase tracking-widest text-emerald-300 font-bold">{{ t('portfolioEditor.suggestedRewrite') }}</h4>
                        <div class="flex items-center gap-1.5">
                          <button
                            v-if="canUndoAiScope(`project:${i}`)"
                            type="button"
                            class="px-2 py-0.5 bg-amber-500/15 text-amber-200 hover:bg-amber-500/30 border border-amber-500/30 rounded text-[10px] transition duration-200 cursor-pointer"
                            @click="() => { const entry = undoAiScope(`project:${i}`); if (entry) toast.info(t('portfolioEditor.projectRewriteUndone')) }"
                          >
                            {{ t('portfolioEditor.undo') }}
                          </button>
                          <button
                            type="button"
                            class="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 rounded text-[10px] transition duration-200 cursor-pointer"
                            @click="applyProjectRewrite(i)"
                          >
                            {{ t('portfolioEditor.applyRewrite') }}
                          </button>
                        </div>
                      </div>
                      <p class="text-xs text-slate-300 bg-black/30 p-2.5 rounded border border-white/5 italic text-left">
                        {{ projectAnalyses[i].suggestedRewrite }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Skills -->
        <section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 class="font-semibold text-white mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-blue-300">bolt</span>
            <span v-if="!editingSkillsTitle" class="flex items-center gap-2">
              {{ form.section_titles!.skills || t('portfolioEditor.coreSkills') }}
              <button type="button" @click="editingSkillsTitle = true" class="text-blue-200/40 hover:text-white transition">
                <span class="material-symbols-outlined text-[16px]">edit</span>
              </button>
            </span>
            <input
              v-else
              v-model="form.section_titles!.skills"
              class="bg-slate-900/60 border border-blue-500/50 rounded px-2 py-0.5 text-sm text-white focus:outline-none w-40"
              :placeholder="t('portfolioEditor.skillsTitle')"
              @blur="editingSkillsTitle = false; save()"
              @keyup.enter="editingSkillsTitle = false; save()"
              autofocus
            />
            <span class="text-blue-200/50 text-sm font-normal ml-2">({{ form.core_skills.length }})</span>
          </h2>
          <div class="flex flex-wrap gap-2 mb-3">
            <span
              v-for="skill in form.core_skills"
              :key="skill"
              class="inline-flex items-center gap-1 rounded-full bg-white/10 text-blue-100 text-sm px-3 py-1"
            >
              {{ skill }}
              <button type="button" class="material-symbols-outlined text-[15px] hover:text-white" @click="removeSkill(skill)">close</button>
            </span>
          </div>
          <input
            v-model="skillDraft"
            :class="inputClass"
            :placeholder="t('portfolioEditor.addSkill')"
            @keyup.enter="addSkill"
          />
        </section>

        <!-- Sections: reorder + custom -->
        <section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-white flex items-center gap-2">
              <span class="material-symbols-outlined text-blue-300">reorder</span> {{ t('portfolioEditor.sections') }}
            </h2>
            <button type="button" class="rounded-lg bg-blue-500/90 hover:bg-blue-400 px-3 py-1.5 text-sm font-semibold text-white" @click="addCustomSection">
              {{ t('portfolioEditor.addCustomSection') }}
            </button>
          </div>
          <p class="text-xs text-blue-200/50 mb-3">
            {{ t('portfolioEditor.sectionsReorderHelp') }}
          </p>

          <ul class="space-y-2">
            <li
              v-for="(entry, i) in sectionEntries"
              :key="entry.key"
              draggable="true"
              class="rounded-xl border bg-slate-900/40 transition-colors"
              :class="[
                sectionDrag === i ? 'opacity-40' : '',
                sectionOver === i && sectionDrag !== i ? 'border-blue-400/60 ring-1 ring-inset ring-blue-400/40' : 'border-white/10',
              ]"
              @dragstart="sectionDrag = i"
              @dragover.prevent="sectionOver = i"
              @drop.prevent="onSectionDrop(i)"
              @dragend="sectionDrag = null; sectionOver = null"
            >
              <div class="flex items-center gap-2 px-3 py-2.5">
                <span class="material-symbols-outlined text-slate-500 text-[18px] cursor-grab active:cursor-grabbing" :title="t('portfolioEditor.sectionsReorderHelp')">drag_indicator</span>
                <span class="material-symbols-outlined text-[16px] text-blue-300/70">
                  {{ entry.kind === 'projects' ? 'work' : entry.kind === 'experience' ? 'work_history' : entry.kind === 'skills' ? 'bolt' : 'article' }}
                </span>
                <span class="flex-1 text-sm font-medium text-white truncate">{{ entry.label }}</span>
                <span v-if="entry.kind !== 'custom'" class="text-[10px] uppercase tracking-wider text-blue-200/40">{{ t('portfolioEditor.builtIn') }}</span>
                <div class="flex items-center gap-0.5">
                  <button type="button" class="material-symbols-outlined text-[18px] text-blue-200/50 hover:text-white disabled:opacity-30" :disabled="i === 0" :title="t('portfolioEditor.moveUp')" @click="moveSection(i, -1)">arrow_upward</button>
                  <button type="button" class="material-symbols-outlined text-[18px] text-blue-200/50 hover:text-white disabled:opacity-30" :disabled="i === sectionEntries.length - 1" :title="t('portfolioEditor.moveDown')" @click="moveSection(i, 1)">arrow_downward</button>
                  <button
                    v-if="entry.kind === 'custom'"
                    type="button"
                    class="material-symbols-outlined text-[18px] text-red-300/70 hover:text-red-300"
                    :title="t('portfolioEditor.removeSection')"
                    @click="removeCustomSection(entry.key)"
                  >delete</button>
                </div>
              </div>
              <!-- Editable custom section body -->
              <div v-if="entry.kind === 'custom' && customSectionFor(entry.key)" class="px-3 pb-3 space-y-2 border-t border-white/5 pt-3">
                <input
                  :value="customSectionFor(entry.key)!.title"
                  :class="inputClass"
                  :placeholder="t('portfolioEditor.sectionTitlePlaceholder')"
                  @input="customSectionFor(entry.key)!.title = ($event.target as HTMLInputElement).value"
                />
                <textarea
                  :value="customSectionFor(entry.key)!.content"
                  rows="3"
                  :class="inputClass"
                  :placeholder="t('portfolioEditor.sectionContentPlaceholder')"
                  @input="customSectionFor(entry.key)!.content = ($event.target as HTMLTextAreaElement).value"
                ></textarea>
              </div>
            </li>
          </ul>
        </section>



        <!-- Sticky mobile save bar duplicate for convenience -->
        <div class="lg:hidden flex gap-2">
          <button type="button" class="flex-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 font-semibold text-white transition disabled:opacity-50" :disabled="saving" @click="save">
            {{ saving ? t('portfolioEditor.saving') : t('portfolioEditor.saveChanges') }}
          </button>
        </div>
      </div>

      <!-- RIGHT: live preview -->
      <div class="lg:sticky lg:top-20">
        <div class="flex items-center justify-between mb-2">
          <p class="text-xs uppercase tracking-widest text-blue-200/50">{{ t('portfolioEditor.livePreview') }}</p>
          <button type="button" class="text-xs text-blue-300 hover:text-white" @click="previewSlug = templateSlug">{{ t('portfolioEditor.openFullScreen') }}</button>
        </div>
        <div class="rounded-2xl border border-white/10 overflow-hidden bg-white h-[70vh] overflow-y-auto shadow-2xl">
          <PortfolioRenderer :slug="templateSlug" :data="form" />
        </div>
        <p class="text-[11px] text-blue-200/40 mt-2">
          {{ t('portfolioEditor.previewPublishHelp') }}
          <code class="text-blue-200/70">{{ origin }}/p/{{ id }}</code>.
        </p>
      </div>
    </div>

    <div v-else class="text-blue-200/60 py-16 text-center">{{ t('portfolioEditor.loading') }}</div>

    <!-- Full-screen preview modal -->
    <Teleport to="body">
      <div
        v-if="previewSlug && form"
        class="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex flex-col"
        @click.self="previewSlug = null"
      >
        <div class="flex items-center justify-between px-6 h-14 bg-slate-900 border-b border-white/10 shrink-0">
          <p class="font-semibold text-white">{{ templateName(previewSlug) }} {{ t('portfolioEditor.previewSuffix') }}</p>
          <div class="flex items-center gap-2">
            <button type="button" class="rounded-lg bg-blue-500 hover:bg-blue-400 px-4 py-1.5 text-sm font-semibold text-white" @click="templateSlug = previewSlug!; previewSlug = null">
              {{ t('portfolioEditor.useThisTemplate') }}
            </button>
            <button type="button" class="rounded-lg border border-white/15 hover:bg-white/5 px-3 py-1.5 text-sm text-blue-100" @click="previewSlug = null">{{ t('portfolioEditor.close') }}</button>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto bg-white">
          <PortfolioRenderer :slug="previewSlug" :data="form" />
        </div>
      </div>
    </Teleport>
  </div>
</template>
