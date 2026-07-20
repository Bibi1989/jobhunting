<script setup lang="ts">
import {
  PORTFOLIO_TEMPLATES,
  PORTFOLIO_COLORS,
  orderedBodySections,
  type Portfolio,
  type PortfolioCustomSection,
  type PortfolioProfileData,
  type PortfolioProject,
} from '~/shared/types/portfolio'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const toast = useAppToast()
const { confirm } = useAppConfirm()
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
const editingSkillsTitle = ref(false)
const editingCustomSectionTitle = ref<string | null>(null)

// Per-project "add tech" draft inputs, keyed by project index.
const techDraft = reactive<Record<number, string>>({})
const skillDraft = ref('')

watchEffect(() => {
  const p = data.value?.portfolio
  if (p && !form.value) {
    form.value = JSON.parse(JSON.stringify(p.profileData)) as PortfolioProfileData
    // Ensure optional arrays exist for the editor.
    form.value.formatted_projects ||= []
    form.value.core_skills ||= []
    form.value.custom_sections ||= []
    form.value.section_titles ||= {}
    form.value.button_texts ||= {}
    form.value.theme_color ||= PORTFOLIO_COLORS[0]!.id
    
    // Migrate old string links to the new PortfolioLink object format, and initialize missing ones
    if (typeof form.value.website === 'string') {
      form.value.website = { label: 'Website', url: form.value.website }
    } else if (!form.value.website) {
      form.value.website = { label: '', url: '' }
    }

    if (typeof form.value.linkedin === 'string') {
      form.value.linkedin = { label: 'LinkedIn', url: form.value.linkedin }
    } else if (!form.value.linkedin) {
      form.value.linkedin = { label: '', url: '' }
    }

    if (typeof form.value.github === 'string') {
      form.value.github = { label: 'GitHub', url: form.value.github }
    } else if (!form.value.github) {
      form.value.github = { label: '', url: '' }
    }

    if (typeof form.value.resume === 'string') {
      form.value.resume = { label: 'Resume', url: form.value.resume }
    } else if (!form.value.resume) {
      form.value.resume = { label: '', url: '' }
    }

    // Materialize the full explicit section order (source of truth for reordering).
    form.value.section_order = orderedBodySections(form.value).map((s) => s.key)
    templateSlug.value = p.templateSlug
  }
})

const requestUrl = useRequestURL()
const origin = computed(() => requestUrl.origin)
function templateName(slug: string) {
  return PORTFOLIO_TEMPLATES.find((t) => t.slug === slug)?.name ?? slug
}

// ---- Projects ----
function addProject() {
  form.value?.formatted_projects.push({ title: '', description: '', tech_stack: [] })
}
function removeProject(index: number) {
  form.value?.formatted_projects.splice(index, 1)
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

// ---- Sections (reorder + custom) ----
type SectionEntry = { key: string; kind: 'projects' | 'skills' | 'custom'; label: string }

const sectionEntries = computed<SectionEntry[]>(() => {
  if (!form.value) return []
  return orderedBodySections(form.value).map((s) => ({
    key: s.key,
    kind: s.kind,
    label:
      s.kind === 'projects'
        ? 'Projects'
        : s.kind === 'skills'
          ? 'Skills'
          : s.custom?.title?.trim() || 'Custom section',
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
  form.value.custom_sections.push({ id, title: 'New Section', content: '' })
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
    toast.error('Full name is required.')
    return
  }
  saving.value = true
  try {
    await $fetch(`/api/portfolio/${id.value}`, {
      method: 'PUT',
      body: { templateSlug: templateSlug.value, profileData: form.value },
    })
    toast.success('Portfolio updated.')
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    toast.error(e.data?.statusMessage || e.statusMessage || 'Update failed')
  } finally {
    saving.value = false
  }
}

async function remove() {
  const ok = await confirm({
    title: 'Delete portfolio',
    message: 'This permanently deletes the portfolio and its public link. Continue?',
    confirmLabel: 'Delete',
    danger: true,
  })
  if (!ok) return
  deleting.value = true
  try {
    await $fetch(`/api/portfolio/${id.value}`, { method: 'DELETE' })
    toast.success('Portfolio deleted.')
    await navigateTo('/dashboard/portfolio')
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    toast.error(e.data?.statusMessage || e.statusMessage || 'Delete failed')
  } finally {
    deleting.value = false
  }
}

const contactFields = [
  { key: 'email', label: 'Email', placeholder: 'you@example.com', icon: 'mail' },
  { key: 'phone', label: 'Phone', placeholder: '+1 555 123 4567', icon: 'call' },
  { key: 'location', label: 'Location', placeholder: 'City, Country', icon: 'location_on' },
  { key: 'website', label: 'Website', placeholder: 'yoursite.com', icon: 'language' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/you', icon: 'link' },
  { key: 'github', label: 'GitHub', placeholder: 'github.com/you', icon: 'code' },
  { key: 'resume', label: 'Resume', placeholder: 'Link to PDF/Doc', icon: 'description' },
] as const

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
          <h1 class="font-serif text-2xl sm:text-3xl text-white">Edit portfolio</h1>
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
          View live
        </a>
        <button
          type="button"
          class="rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10 px-4 py-2 text-sm font-semibold transition disabled:opacity-50"
          :disabled="deleting"
          @click="remove"
        >
          {{ deleting ? 'Deleting…' : 'Delete' }}
        </button>
        <button
          type="button"
          class="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-5 py-2 text-sm font-semibold text-white transition disabled:opacity-50 shadow-[0_0_18px_rgba(16,185,129,0.35)]"
          :disabled="saving"
          @click="save"
        >
          {{ saving ? 'Saving…' : 'Save changes' }}
        </button>
      </div>
    </div>

    <!-- Not found -->
    <div v-if="error" class="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
      <p class="text-white font-semibold text-lg">Portfolio not found</p>
      <p class="text-blue-200/60 mt-1">{{ (error as any)?.statusMessage || 'You may not have access to this portfolio.' }}</p>
      <NuxtLink to="/dashboard/portfolio" class="inline-block mt-4 rounded-lg bg-blue-500 hover:bg-blue-400 px-5 py-2.5 font-semibold text-white">
        Back to portfolios
      </NuxtLink>
    </div>

    <!-- Editor + live preview -->
    <div v-else-if="form" class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-6 items-start">
      <!-- LEFT: form -->
      <div class="space-y-6 min-w-0">
        <!-- Template -->
        <section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 class="font-semibold text-white mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-blue-300">dashboard_customize</span> Template
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div
              v-for="template in PORTFOLIO_TEMPLATES"
              :key="template.slug"
              class="group rounded-xl border overflow-hidden bg-white/[0.02] cursor-pointer transition"
              :class="templateSlug === template.slug ? 'border-blue-400 ring-2 ring-blue-400/40' : 'border-white/10 hover:border-white/25'"
              role="button"
              tabindex="0"
              @click="templateSlug = template.slug"
              @keydown.enter="templateSlug = template.slug"
            >
              <div class="relative h-24 overflow-hidden border-b border-white/10 bg-slate-900">
                <div class="absolute top-0 left-0 origin-top-left pointer-events-none" style="width: 500%; height: 500%; transform: scale(0.2);">
                  <PortfolioRenderer :slug="template.slug" :data="form" />
                </div>
                <button
                  type="button"
                  class="absolute bottom-1 right-1 text-[10px] font-semibold rounded bg-white/90 text-slate-900 px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition"
                  @click.stop="previewSlug = template.slug"
                >
                  Preview
                </button>
              </div>
              <div class="p-2 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full shrink-0 bg-slate-400"></span>
                <span class="text-xs font-semibold text-white truncate">{{ template.name }}</span>
                <span v-if="templateSlug === template.slug" class="material-symbols-outlined text-blue-400 text-[16px] ml-auto">check_circle</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Color Theme -->
        <section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 class="font-semibold text-white mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-blue-300">palette</span> Color Theme
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
            <span class="material-symbols-outlined text-blue-300">smart_button</span> Navigation & Buttons
          </h2>
          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs uppercase tracking-widest text-blue-200/50 mb-1">Primary Contact CTA</label>
              <input v-model="form.button_texts!.contact_cta" :class="inputClass" placeholder="e.g. Contact, Get in touch" />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-blue-200/50 mb-1">Hero CTA</label>
              <input v-model="form.button_texts!.hero_cta" :class="inputClass" placeholder="e.g. View my work" />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-blue-200/50 mb-1">Projects Nav Link</label>
              <input v-model="form.button_texts!.nav_projects" :class="inputClass" placeholder="e.g. Work, Portfolio" />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-blue-200/50 mb-1">Skills Nav Link</label>
              <input v-model="form.button_texts!.nav_skills" :class="inputClass" placeholder="e.g. Skills, Expertise" />
            </div>
          </div>
        </section>

        <!-- Basics -->
        <section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 class="font-semibold text-white mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-blue-300">badge</span> Basics
          </h2>
          <div class="space-y-3">
            <div>
              <label class="block text-xs uppercase tracking-widest text-blue-200/50 mb-1">Full name</label>
              <input v-model="form.full_name" :class="inputClass" placeholder="Your name" />
            </div>
            <div>
              <div class="flex items-center gap-2 mb-1 group">
                <input
                  class="bg-transparent border-b border-transparent focus:border-blue-400 focus:outline-none text-xs uppercase tracking-widest text-blue-200/50 hover:border-white/20 transition"
                  placeholder="Professional bio"
                  v-model="form.section_titles!.profile"
                />
                <span class="material-symbols-outlined text-[14px] text-blue-200/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">edit</span>
              </div>
              <textarea v-model="form.professional_bio" rows="4" :class="inputClass" placeholder="A short first-person summary"></textarea>
            </div>
          </div>
        </section>

        <!-- Contact -->
        <section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 class="font-semibold text-white mb-1 flex items-center gap-2">
            <span class="material-symbols-outlined text-blue-300">contact_mail</span> Contact
          </h2>
          <p class="text-xs text-blue-200/50 mb-4">
            Hiring managers use the portfolio contact form — messages are emailed to the address below
            (or your account email if this field is empty). Set <code class="text-blue-200/70">RESEND_API_KEY</code>
            and <code class="text-blue-200/70">CONTACT_FROM_EMAIL</code> for delivery.
          </p>
          <div class="grid sm:grid-cols-2 gap-3">
            <div v-for="field in contactFields" :key="field.key">
              <label class="block text-xs uppercase tracking-widest text-blue-200/50 mb-1">{{ field.label }}</label>
              <div v-if="['website', 'linkedin', 'github', 'resume'].includes(field.key)" class="flex gap-2">
                <input v-model="(form[field.key as keyof PortfolioProfileData] as any).label" placeholder="Display text" :class="[inputClass, 'w-1/3']" />
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

        <!-- Projects -->
        <section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-white flex items-center gap-2">
              <span class="material-symbols-outlined text-blue-300">work</span>
              <span v-if="!editingProjectsTitle" class="flex items-center gap-2">
                {{ form.section_titles!.projects || 'Projects' }}
                <button type="button" @click="editingProjectsTitle = true" class="text-blue-200/40 hover:text-white transition">
                  <span class="material-symbols-outlined text-[16px]">edit</span>
                </button>
              </span>
              <input
                v-else
                v-model="form.section_titles!.projects"
                class="bg-slate-900/60 border border-blue-500/50 rounded px-2 py-0.5 text-sm text-white focus:outline-none w-40"
                placeholder="Projects Title"
                @blur="editingProjectsTitle = false; save()"
                @keyup.enter="editingProjectsTitle = false; save()"
                autofocus
              />
              <span class="text-blue-200/50 text-sm font-normal ml-2">({{ form.formatted_projects.length }})</span>
            </h2>
            <button type="button" class="rounded-lg bg-blue-500/90 hover:bg-blue-400 px-3 py-1.5 text-sm font-semibold text-white" @click="addProject">
              + Add project
            </button>
          </div>

          <p v-if="!form.formatted_projects.length" class="text-blue-200/50 italic text-sm">
            No projects yet. Add one to showcase your work.
          </p>

          <div v-else class="space-y-4">
            <div
              v-for="(project, i) in form.formatted_projects"
              :key="i"
              class="rounded-xl border border-white/10 bg-slate-900/40 p-4"
            >
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-semibold text-blue-200/50 uppercase tracking-widest">Project {{ i + 1 }}</span>
                <div class="flex items-center gap-1">
                  <button type="button" class="material-symbols-outlined text-[18px] text-blue-200/50 hover:text-white disabled:opacity-30" :disabled="i === 0" title="Move up" @click="moveProject(i, -1)">arrow_upward</button>
                  <button type="button" class="material-symbols-outlined text-[18px] text-blue-200/50 hover:text-white disabled:opacity-30" :disabled="i === form.formatted_projects.length - 1" title="Move down" @click="moveProject(i, 1)">arrow_downward</button>
                  <button type="button" class="material-symbols-outlined text-[18px] text-red-300/70 hover:text-red-300" title="Remove" @click="removeProject(i)">delete</button>
                </div>
              </div>
              <div class="space-y-3">
                <input v-model="project.title" :class="inputClass" placeholder="Project title" />
                <textarea v-model="project.description" rows="2" :class="inputClass" placeholder="What it was and the impact"></textarea>
                <input v-model="project.url" :class="inputClass" placeholder="Live / case-study URL (optional)" />
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
                    placeholder="Add a technology, press Enter"
                    @keyup.enter="addTech(project, i)"
                  />
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
              {{ form.section_titles!.skills || 'Core skills' }}
              <button type="button" @click="editingSkillsTitle = true" class="text-blue-200/40 hover:text-white transition">
                <span class="material-symbols-outlined text-[16px]">edit</span>
              </button>
            </span>
            <input
              v-else
              v-model="form.section_titles!.skills"
              class="bg-slate-900/60 border border-blue-500/50 rounded px-2 py-0.5 text-sm text-white focus:outline-none w-40"
              placeholder="Skills Title"
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
            placeholder="Add a skill, press Enter"
            @keyup.enter="addSkill"
          />
        </section>

        <!-- Sections: reorder + custom -->
        <section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-white flex items-center gap-2">
              <span class="material-symbols-outlined text-blue-300">reorder</span> Sections
            </h2>
            <button type="button" class="rounded-lg bg-blue-500/90 hover:bg-blue-400 px-3 py-1.5 text-sm font-semibold text-white" @click="addCustomSection">
              + Custom section
            </button>
          </div>
          <p class="text-xs text-blue-200/50 mb-3">
            Drag <span class="material-symbols-outlined text-[13px] align-middle">drag_indicator</span>
            or use the arrows to reorder how sections appear on your portfolio.
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
                <span class="material-symbols-outlined text-slate-500 text-[18px] cursor-grab active:cursor-grabbing" title="Drag to reorder">drag_indicator</span>
                <span class="material-symbols-outlined text-[16px] text-blue-300/70">
                  {{ entry.kind === 'projects' ? 'work' : entry.kind === 'skills' ? 'bolt' : 'article' }}
                </span>
                <span class="flex-1 text-sm font-medium text-white truncate">{{ entry.label }}</span>
                <span v-if="entry.kind !== 'custom'" class="text-[10px] uppercase tracking-wider text-blue-200/40">built-in</span>
                <div class="flex items-center gap-0.5">
                  <button type="button" class="material-symbols-outlined text-[18px] text-blue-200/50 hover:text-white disabled:opacity-30" :disabled="i === 0" title="Move up" @click="moveSection(i, -1)">arrow_upward</button>
                  <button type="button" class="material-symbols-outlined text-[18px] text-blue-200/50 hover:text-white disabled:opacity-30" :disabled="i === sectionEntries.length - 1" title="Move down" @click="moveSection(i, 1)">arrow_downward</button>
                  <button
                    v-if="entry.kind === 'custom'"
                    type="button"
                    class="material-symbols-outlined text-[18px] text-red-300/70 hover:text-red-300"
                    title="Remove section"
                    @click="removeCustomSection(entry.key)"
                  >delete</button>
                </div>
              </div>
              <!-- Editable custom section body -->
              <div v-if="entry.kind === 'custom' && customSectionFor(entry.key)" class="px-3 pb-3 space-y-2 border-t border-white/5 pt-3">
                <input
                  :value="customSectionFor(entry.key)!.title"
                  :class="inputClass"
                  placeholder="Section title (e.g. Awards, Speaking)"
                  @input="customSectionFor(entry.key)!.title = ($event.target as HTMLInputElement).value"
                />
                <textarea
                  :value="customSectionFor(entry.key)!.content"
                  rows="3"
                  :class="inputClass"
                  placeholder="Section content"
                  @input="customSectionFor(entry.key)!.content = ($event.target as HTMLTextAreaElement).value"
                ></textarea>
              </div>
            </li>
          </ul>
        </section>



        <!-- Sticky mobile save bar duplicate for convenience -->
        <div class="lg:hidden flex gap-2">
          <button type="button" class="flex-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 font-semibold text-white transition disabled:opacity-50" :disabled="saving" @click="save">
            {{ saving ? 'Saving…' : 'Save changes' }}
          </button>
        </div>
      </div>

      <!-- RIGHT: live preview -->
      <div class="lg:sticky lg:top-20">
        <div class="flex items-center justify-between mb-2">
          <p class="text-xs uppercase tracking-widest text-blue-200/50">Live preview</p>
          <button type="button" class="text-xs text-blue-300 hover:text-white" @click="previewSlug = templateSlug">Open full screen</button>
        </div>
        <div class="rounded-2xl border border-white/10 overflow-hidden bg-white h-[70vh] overflow-y-auto shadow-2xl">
          <PortfolioRenderer :slug="templateSlug" :data="form" />
        </div>
        <p class="text-[11px] text-blue-200/40 mt-2">
          Edits preview instantly. Click <span class="text-blue-200">Save changes</span> to publish them to
          <code class="text-blue-200/70">{{ origin }}/p/{{ id }}</code>.
        </p>
      </div>
    </div>

    <div v-else class="text-blue-200/60 py-16 text-center">Loading…</div>

    <!-- Full-screen preview modal -->
    <Teleport to="body">
      <div
        v-if="previewSlug && form"
        class="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex flex-col"
        @click.self="previewSlug = null"
      >
        <div class="flex items-center justify-between px-6 h-14 bg-slate-900 border-b border-white/10 shrink-0">
          <p class="font-semibold text-white">{{ templateName(previewSlug) }} — preview</p>
          <div class="flex items-center gap-2">
            <button type="button" class="rounded-lg bg-blue-500 hover:bg-blue-400 px-4 py-1.5 text-sm font-semibold text-white" @click="templateSlug = previewSlug!; previewSlug = null">
              Use this template
            </button>
            <button type="button" class="rounded-lg border border-white/15 hover:bg-white/5 px-3 py-1.5 text-sm text-blue-100" @click="previewSlug = null">Close</button>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto bg-white">
          <PortfolioRenderer :slug="previewSlug" :data="form" />
        </div>
      </div>
    </Teleport>
  </div>
</template>
