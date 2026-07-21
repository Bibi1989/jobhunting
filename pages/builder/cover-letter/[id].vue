<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { BuilderResumeData, BuilderCoverLetter } from '~/shared/types/builder'
import { downloadServerPdf } from '~/utils/downloadServerPdf'
import { slugifyFilename } from '~/utils/download'
import { coverLetterTemplates } from '~/utils/templates'
import { loadBuilderJobPrefill, parseResumeTextToBuilder } from '~/utils/builderJobPrefill'
import { useAiUndo } from '~/composables/useAiUndo'

const toast = useAppToast()
const { canAccessAI, aiBlockedMessage, refreshCredits } = useSaaS()
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
          label: 'Undo',
          onClick: () => {
            const entry = undoAi()
            if (entry) toast.info(`Reverted: ${entry.label}`)
          },
        }
      : undefined,
  })
}

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const resumeId = route.params.id as string
const exporting = ref(false)
const importing = ref(false)
const importFileInput = ref<HTMLInputElement | null>(null)
const uploadedResumeName = ref('')
const rawResumeText = ref('')
const activeTab = ref('details')
const translating = ref(false)
const mobileNavOpen = ref(false)
const mobilePane = ref<'edit' | 'preview'>('edit')

const coverLetterTabs = [
  { id: 'details', label: 'Target Role', icon: 'work' },
  { id: 'template', label: 'Template', icon: 'view_quilt' },
  { id: 'contact', label: 'Contact Info', icon: 'person' },
  { id: 'content', label: 'Letter Content', icon: 'edit_note' },
] as const

function selectCoverLetterTab(id: string) {
  activeTab.value = id
  mobileNavOpen.value = false
  mobilePane.value = 'edit'
}

function goBack() {
  if (import.meta.client && window.history.length > 1) {
    router.back()
    return
  }
  void router.push('/builder')
}

function hasResumeSignal() {
  const info = resumeData.value.personalInfo
  if (info?.fullName?.trim()) return true
  if ((info?.summary || '').replace(/<[^>]+>/g, '').trim().length > 20) return true
  if ((resumeData.value.experience || []).length > 0) return true
  if (rawResumeText.value.trim().length > 40) return true
  return false
}

function triggerResumeUpload() {
  if (!canAccessAI.value) {
    toast.info(aiBlockedMessage() || 'Pro subscription required to import a resume.')
    return
  }
  importFileInput.value?.click()
}

async function handleResumeUpload(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  target.value = ''
  if (importing.value) return

  importing.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'resume')

    toast.info('Uploading resume…')
    const docRes = await $fetch<{ document: { contentText: string; originalName?: string } }>(
      '/api/documents',
      { method: 'POST', body: formData },
    )

    if (!docRes.document?.contentText) {
      throw new Error('Could not extract text from document')
    }

    rawResumeText.value = docRes.document.contentText
    uploadedResumeName.value = docRes.document.originalName || file.name

    toast.info('Parsing resume…')
    const parseRes = await $fetch<{ resumeData: BuilderResumeData }>('/api/ai/parse-resume', {
      method: 'POST',
      body: { text: docRes.document.contentText },
    })

    if (parseRes.resumeData) {
      const keepTemplate = resumeData.value.templateId
      const keepName = resumeData.value.name
      const keepLanguage = resumeData.value.language
      resumeData.value = {
        ...resumeData.value,
        ...parseRes.resumeData,
        templateId: keepTemplate,
        name: keepName,
        language: keepLanguage || 'en',
        personalInfo: {
          ...resumeData.value.personalInfo,
          ...parseRes.resumeData.personalInfo,
        },
        coverLetter: coverLetter.value,
      }
      toast.success('Resume loaded — you can draft with it alone or add a job description.')
      await refreshCredits()
    }
  } catch (err: unknown) {
    console.error(err)
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    toast.error(e.data?.statusMessage || e.statusMessage || 'Failed to import resume.')
  } finally {
    importing.value = false
  }
}

const LANG_LABELS = { en: 'English', de: 'German', fr: 'French', es: 'Spanish' } as const

const resumeData = ref<BuilderResumeData>({
  name: 'My Cover Letter',
  templateId: 'cl-standard',
  themeColor: '#3b82f6',
  language: 'en',
  personalInfo: {
    fullName: '',
    jobTitle: '',
    location: '',
    email: '',
    phone: '',
    linkedin: '',
    portfolio: '',
    github: '',
    summary: '',
  },
  experience: [],
  education: [],
  projects: [],
  skills: [],
  achievements: [],
  customSections: [],
})
const loading = ref(false)
const saving = ref(false)
const enhancing = ref(false)

const coverLetter = ref<BuilderCoverLetter>({
  jobDescription: '',
  companyName: '',
  hiringManager: '',
  tone: 'professional',
  additionalInstructions: '',
  content: '<p>Start typing your cover letter here...</p>',
})

function applyCoverLetterTemplate(templateId: string, options: { seedContent?: boolean } = {}) {
  const tpl = coverLetterTemplates.find((t) => t.id === templateId)
  if (!tpl) return

  resumeData.value.templateId = templateId
  resumeData.value.name = `${tpl.name}`

  if (options.seedContent === false) return

  const starters: Record<string, string> = {
    'cl-standard':
      '<p>Dear Hiring Manager,</p><p>I am writing to express my interest in the open role at your organization. With a proven track record of delivering results, I am confident I can contribute meaningfully to your team.</p><p>I would welcome the opportunity to discuss how my experience aligns with your needs.</p><p>Sincerely,</p>',
    'cl-creative':
      '<p>Hello,</p><p>Great products start with people who care about craft. I build work that is clear, bold, and useful, and I would love to bring that energy to your team.</p><p>Here is a quick look at what I can offer and why I am excited about this opportunity.</p><p>Looking forward to connecting,</p>',
    'cl-executive':
      '<p>Dear Hiring Committee,</p><p>I am applying for the leadership role at your organization. I bring a record of scaling teams, sharpening strategy, and delivering measurable outcomes.</p><p>I am ready to discuss priorities, timeline, and how I can add immediate value.</p><p>Respectfully,</p>',
    'cl-tech':
      '<p>Dear Hiring Manager,</p><p>I am a hands-on engineer with deep experience across modern stacks, systems design, and shipping reliable services. I am excited about the opportunity to contribute to your platform.</p><p>I would be glad to walk through relevant projects and technical approach in more detail.</p><p>Best regards,</p>',
  }

  coverLetter.value.content = starters[templateId] || coverLetter.value.content
}

onMounted(async () => {
  if (resumeId && resumeId !== 'new') {
    loading.value = true
    try {
      const data = await $fetch<BuilderResumeData>(`/api/builder/resume/${resumeId}`)
      resumeData.value = data
      if (!resumeData.value.language) resumeData.value.language = 'en'

      if (data.coverLetter) {
        coverLetter.value = {
          additionalInstructions: '',
          jobDescription: '',
          companyName: '',
          hiringManager: '',
          tone: 'professional',
          content: '',
          ...data.coverLetter,
        }
      } else {
        resumeData.value.coverLetter = coverLetter.value
      }
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  } else {
    const templateQuery = String(route.query.template || '')
    if (templateQuery) applyCoverLetterTemplate(templateQuery)
  }

  await applyJobPrefillFromRoute()
})

async function applyJobPrefillFromRoute() {
  const jobId = route.query.jobId
  if (!jobId) return

  loading.value = true
  try {
    const prefill = await loadBuilderJobPrefill(jobId)
    if (!prefill) return

    if (prefill.description) {
      coverLetter.value.jobDescription = prefill.description
    }
    if (prefill.company) {
      coverLetter.value.companyName = prefill.company
    }
    if (prefill.title && !resumeData.value.personalInfo.jobTitle?.trim()) {
      resumeData.value.personalInfo.jobTitle = prefill.title
    }

    if (prefill.resumeText.length > 40) {
      rawResumeText.value = prefill.resumeText
      uploadedResumeName.value = prefill.resumeName
      try {
        const parsed = await parseResumeTextToBuilder(prefill.resumeText)
        if (parsed) {
          const keepTemplate = resumeData.value.templateId
          const keepName = resumeData.value.name
          const keepLanguage = resumeData.value.language
          resumeData.value = {
            ...resumeData.value,
            ...parsed,
            templateId: keepTemplate,
            name: keepName,
            language: keepLanguage || 'en',
            personalInfo: {
              ...resumeData.value.personalInfo,
              ...parsed.personalInfo,
              jobTitle: parsed.personalInfo?.jobTitle || prefill.title || resumeData.value.personalInfo.jobTitle,
            },
            coverLetter: coverLetter.value,
          }
          await refreshCredits()
        }
      } catch (err) {
        console.error(err)
        toast.info('Job description loaded. Upload a resume if parse failed.')
      }
    }

    activeTab.value = 'details'
    toast.success(
      prefill.resumeText
        ? 'Job description and uploaded CV loaded for cover letter drafting.'
        : 'Job description loaded. Upload a resume or draft from the description.',
    )
  } catch (err) {
    console.error(err)
    toast.error('Could not load job details for the builder.')
  } finally {
    loading.value = false
  }
}

async function saveDraft() {
  if (!resumeData.value) return
  saving.value = true
  try {
    resumeData.value.coverLetter = coverLetter.value
    const payload = {
      ...resumeData.value,
      documentKind: 'cover_letter' as const,
    }
    if (resumeId === 'new') {
      const { id } = await $fetch<{ id: string }>('/api/builder/resume', {
        method: 'POST',
        body: payload,
      })
      router.replace(`/builder/cover-letter/${id}`)
    } else {
      await $fetch(`/api/builder/resume/${resumeId}`, {
        method: 'PUT',
        body: payload,
      })
    }
    toast.success('Cover letter saved.')
  } catch (e) {
    console.error(e)
    toast.error('Failed to save cover letter.')
  } finally {
    saving.value = false
  }
}

async function exportPdf() {
  if (exporting.value) return
  exporting.value = true
  try {
    // Keep nested coverLetter in sync so PDF uses the live editor draft + template.
    resumeData.value.coverLetter = coverLetter.value
    const base = slugifyFilename(
      `${resumeData.value.personalInfo.fullName || resumeData.value.name || 'cover'}-cover-letter`,
    )
    await downloadServerPdf({
      kind: 'cover_letter',
      filename: base,
      resume: resumeData.value,
      coverLetter: coverLetter.value,
      templateSlug: resumeData.value.templateId,
    })
    toast.success('PDF downloaded.')
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'PDF export failed. Please try again.'
    toast.error(message)
  } finally {
    exporting.value = false
  }
}

async function handleLanguageChange(e: Event) {
  const newLang = (e.target as HTMLSelectElement).value as keyof typeof LANG_LABELS
  await translateCoverLetter(newLang)
}

async function translateCoverLetter(targetLang: keyof typeof LANG_LABELS) {
  if (!canAccessAI.value) {
    toast.info(aiBlockedMessage() || 'Pro subscription required for AI.')
    return
  }
  const previous = resumeData.value.language || 'en'
  translating.value = true
  try {
    const response = await $fetch<{
      translatedData: BuilderCoverLetter & { personalInfo?: BuilderResumeData['personalInfo'] }
    }>('/api/ai/translate', {
      method: 'POST',
      body: {
        mode: 'cover_letter',
        targetLanguage: targetLang,
        coverLetter: {
          ...coverLetter.value,
          personalInfo: resumeData.value.personalInfo,
          jobTitle: resumeData.value.personalInfo.jobTitle,
        },
      },
    })

    if (response?.translatedData) {
      const translated = response.translatedData
      const previousLetter = { ...coverLetter.value }
      const previousInfo = { ...resumeData.value.personalInfo }
      const previousLang = resumeData.value.language
      pushAiUndo('coverLetter:translate', 'Undo cover letter translation', () => {
        coverLetter.value = previousLetter
        resumeData.value.personalInfo = previousInfo
        resumeData.value.language = previousLang
      })
      coverLetter.value = {
        jobDescription: translated.jobDescription ?? coverLetter.value.jobDescription,
        companyName: translated.companyName ?? coverLetter.value.companyName,
        hiringManager: translated.hiringManager ?? coverLetter.value.hiringManager,
        tone: translated.tone ?? coverLetter.value.tone,
        additionalInstructions:
          translated.additionalInstructions ?? coverLetter.value.additionalInstructions,
        content: translated.content ?? coverLetter.value.content,
      }
      if (translated.personalInfo) {
        resumeData.value.personalInfo = {
          ...resumeData.value.personalInfo,
          ...translated.personalInfo,
        }
      }
      resumeData.value.language = targetLang
      notifyAiSuccess(`Translated to ${LANG_LABELS[targetLang]}.`)
      await refreshCredits()
    }
  } catch (e) {
    console.error(e)
    toast.error('Failed to translate cover letter.')
    resumeData.value.language = previous
  } finally {
    translating.value = false
  }
}

async function enhanceCoverLetter() {
  if (!canAccessAI.value) {
    toast.info(aiBlockedMessage() || 'Pro subscription required for AI.')
    return
  }

  const hasJd = Boolean(coverLetter.value.jobDescription?.trim())
  const hasResume = hasResumeSignal()
  if (!hasJd && !hasResume) {
    toast.info('Upload a resume and/or paste a job description to draft a cover letter.')
    return
  }

  enhancing.value = true
  try {
    const response = await $fetch<{ content?: string }>('/api/ai/generate-cover-letter', {
      method: 'POST',
      body: {
        resumeData: resumeData.value,
        jobDescription: coverLetter.value.jobDescription || '',
        companyName: coverLetter.value.companyName || '',
        hiringManager: coverLetter.value.hiringManager,
        tone: coverLetter.value.tone,
        currentContent: coverLetter.value.content,
        additionalInstructions: coverLetter.value.additionalInstructions || '',
        rawResumeText: rawResumeText.value || undefined,
      },
    })

    if (response?.content?.trim()) {
      const previous = coverLetter.value.content
      pushAiUndo('coverLetter:content', 'Undo cover letter draft', () => {
        coverLetter.value.content = previous
      })
      coverLetter.value.content = response.content
      notifyAiSuccess(hasJd && hasResume ? 'Cover letter drafted.' : 'Cover letter drafted from available details.')
      activeTab.value = 'content'
      mobilePane.value = 'edit'
      await refreshCredits()
      return
    }
    toast.error('AI returned an empty cover letter. Please try again.')
  } catch (e: unknown) {
    console.error(e)
    const err = e as {
      data?: { statusMessage?: string; message?: string }
      statusMessage?: string
      message?: string
    }
    toast.error(
      err?.data?.statusMessage ||
        err?.data?.message ||
        err?.statusMessage ||
        err?.message ||
        'AI enhancement failed. Please try again.',
    )
  } finally {
    enhancing.value = false
  }
}

function selectTone(t: 'professional' | 'enthusiastic' | 'confident') {
  coverLetter.value.tone = t
}
</script>

<template>
  <div class="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-100 font-sans selection:bg-blue-500/30 h-dvh flex flex-col overflow-hidden">
    <header class="flex justify-between items-center px-3 sm:px-6 h-14 sm:h-16 shrink-0 bg-slate-900/40 backdrop-blur-md border-b border-white/10 gap-2">
      <div class="flex items-center gap-2 sm:gap-6 min-w-0">
        <button
          type="button"
          class="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 text-slate-200 hover:bg-white/5 cursor-pointer"
          aria-label="Go back"
          @click="goBack"
        >
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <button
          type="button"
          class="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 text-slate-200 hover:bg-white/5 cursor-pointer"
          aria-label="Open sections"
          @click="mobileNavOpen = !mobileNavOpen"
        >
          <span class="material-symbols-outlined">{{ mobileNavOpen ? 'close' : 'menu' }}</span>
        </button>
        <AppLogo size="sm" :show-tagline="false" class="truncate" />
        <nav class="hidden lg:flex gap-6 items-center">
          <NuxtLink to="/builder" class="font-semibold text-slate-300 hover:text-white transition-colors duration-200">My Projects</NuxtLink>
        </nav>
      </div>
      <div class="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <div class="hidden sm:flex items-center gap-2">
          <span class="text-white text-sm font-semibold opacity-80 mr-2 border-r border-white/20 pr-3 hidden md:inline">Cover Letter</span>
          <select
            v-model="resumeData.language"
            class="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm focus:border-blue-400 focus:bg-white/10 outline-none text-white transition-all cursor-pointer"
            @change="handleLanguageChange"
          >
            <option value="en" class="bg-slate-800 text-white">EN</option>
            <option value="de" class="bg-slate-800 text-white">DE</option>
            <option value="fr" class="bg-slate-800 text-white">FR</option>
            <option value="es" class="bg-slate-800 text-white">ES</option>
          </select>
          <span v-if="translating" class="material-symbols-outlined text-blue-400 animate-spin text-sm">refresh</span>
          <input
            v-if="resumeData"
            v-model="resumeData.name"
            type="text"
            class="bg-white/5 border border-white/10 rounded px-3 py-1 text-sm focus:border-blue-400 focus:bg-white/10 outline-none text-white transition-all w-28 lg:w-40"
            placeholder="Document Name"
          />
        </div>
        <button
          v-if="canUndoAi"
          type="button"
          class="px-2.5 sm:px-3 py-1.5 bg-amber-500/15 text-amber-200 border border-amber-500/40 rounded hover:bg-amber-500/25 transition-colors font-semibold text-sm cursor-pointer inline-flex items-center gap-1"
          :title="lastAiUndoLabel"
          @click="() => { const entry = undoAi(); if (entry) toast.info(`Reverted: ${entry.label}`) }"
        >
          <span class="material-symbols-outlined text-[16px]">undo</span>
          <span class="hidden sm:inline">Undo AI</span>
        </button>
        <button
          :disabled="saving"
          class="px-2.5 sm:px-4 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/50 rounded hover:bg-blue-500 hover:text-white transition-colors font-semibold text-sm disabled:opacity-50 cursor-pointer"
          @click="saveDraft"
        >
          <span class="sm:hidden">{{ saving ? '…' : 'Save' }}</span>
          <span class="hidden sm:inline">{{ saving ? 'Saving...' : 'Save Draft' }}</span>
        </button>
        <button
          :disabled="exporting"
          class="px-2.5 sm:px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors font-semibold text-sm shadow-[0_0_15px_rgba(59,130,246,0.5)] cursor-pointer disabled:opacity-50"
          @click="exportPdf"
        >
          <span class="sm:hidden">{{ exporting ? '…' : 'PDF' }}</span>
          <span class="hidden sm:inline">{{ exporting ? 'Exporting...' : 'Export PDF' }}</span>
        </button>
      </div>
    </header>

    <div class="lg:hidden flex shrink-0 border-b border-white/10 bg-slate-900/70">
      <button
        type="button"
        class="flex-1 py-2.5 text-sm font-semibold cursor-pointer transition-colors"
        :class="mobilePane === 'edit' ? 'text-blue-300 border-b-2 border-blue-400 bg-blue-500/10' : 'text-slate-400'"
        @click="mobilePane = 'edit'"
      >
        Edit
      </button>
      <button
        type="button"
        class="flex-1 py-2.5 text-sm font-semibold cursor-pointer transition-colors"
        :class="mobilePane === 'preview' ? 'text-blue-300 border-b-2 border-blue-400 bg-blue-500/10' : 'text-slate-400'"
        @click="mobilePane = 'preview'"
      >
        Preview
      </button>
    </div>

    <div class="flex flex-1 overflow-hidden relative">
      <aside class="hidden lg:flex w-64 shrink-0 flex-col py-6 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 overflow-y-auto">
        <nav class="flex-1">
          <ul class="space-y-1">
            <li
              v-for="tab in coverLetterTabs"
              :key="tab.id"
            >
              <button
                type="button"
                :class="[
                  'w-full flex items-center gap-4 px-6 py-3 text-sm transition-all cursor-pointer',
                  activeTab === tab.id
                    ? 'text-blue-400 font-bold border-r-2 border-blue-400 bg-blue-500/10'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
                ]"
                @click="selectCoverLetterTab(tab.id)"
              >
                <span class="material-symbols-outlined">{{ tab.icon }}</span> {{ tab.label }}
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <div v-if="mobileNavOpen" class="fixed inset-0 z-40 lg:hidden">
        <button type="button" class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" aria-label="Close sections" @click="mobileNavOpen = false" />
        <aside class="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-slate-900 border-r border-white/10 py-4 overflow-y-auto shadow-2xl">
          <p class="px-5 mb-3 text-xs uppercase tracking-widest text-blue-200/60 font-semibold">Sections</p>
          <nav>
            <ul class="space-y-0.5">
              <li v-for="tab in coverLetterTabs" :key="`m-${tab.id}`">
                <button
                  type="button"
                  class="w-full flex items-center gap-3 px-5 py-3 text-sm cursor-pointer"
                  :class="activeTab === tab.id ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-slate-300'"
                  @click="selectCoverLetterTab(tab.id)"
                >
                  <span class="material-symbols-outlined">{{ tab.icon }}</span>
                  <span>{{ tab.label }}</span>
                </button>
              </li>
            </ul>
          </nav>
          <div class="px-5 pt-4 mt-2 border-t border-white/10 space-y-2 sm:hidden">
            <label class="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">Language</label>
            <select
              v-model="resumeData.language"
              class="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none cursor-pointer"
              @change="handleLanguageChange"
            >
              <option value="en" class="bg-slate-800">EN</option>
              <option value="de" class="bg-slate-800">DE</option>
              <option value="fr" class="bg-slate-800">FR</option>
              <option value="es" class="bg-slate-800">ES</option>
            </select>
            <label class="block text-[10px] uppercase tracking-wider text-slate-500 font-bold pt-1">Name</label>
            <input
              v-if="resumeData"
              v-model="resumeData.name"
              type="text"
              class="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none"
              placeholder="Document Name"
            />
          </div>
        </aside>
      </div>

      <main class="flex-1 flex overflow-hidden min-w-0">
        <section
          class="h-full flex-col bg-slate-900/40 backdrop-blur-md border-r border-white/10 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar relative w-full lg:w-[40%]"
          :class="mobilePane === 'edit' ? 'flex' : 'hidden lg:flex'"
        >
          <div v-if="activeTab === 'template'">
            <div class="mb-8">
              <h1 class="font-bold text-2xl text-white mb-1">Choose Template</h1>
              <p class="text-blue-200/60 text-sm">Switch cover letter layouts without losing your draft.</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                v-for="tpl in coverLetterTemplates"
                :key="tpl.id"
                type="button"
                class="cursor-pointer border-2 rounded-xl overflow-hidden text-left transition-all"
                :class="resumeData.templateId === tpl.id ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.35)]' : 'border-white/10 hover:border-blue-400/50'"
                @click="applyCoverLetterTemplate(tpl.id, { seedContent: false })"
              >
                <div class="aspect-[3/4] bg-white relative overflow-hidden border-b border-white/5">
                  <!-- Mini layout silhouettes -->
                  <div v-if="tpl.id === 'cl-standard'" class="h-full p-3 flex flex-col text-slate-800">
                    <div class="text-center border-b-2 border-slate-900 pb-2 mb-2">
                      <div class="h-2 w-2/3 mx-auto bg-slate-900 rounded mb-1" />
                      <div class="h-1 w-1/2 mx-auto bg-slate-400 rounded" />
                    </div>
                    <div class="space-y-1 flex-1">
                      <div class="h-1 w-full bg-slate-300 rounded" />
                      <div class="h-1 w-11/12 bg-slate-300 rounded" />
                      <div class="h-1 w-full bg-slate-300 rounded" />
                    </div>
                  </div>
                  <div v-else-if="tpl.id === 'cl-creative'" class="h-full flex text-slate-800">
                    <div class="w-1.5 bg-teal-700 shrink-0" />
                    <div class="flex-1 p-3 space-y-1">
                      <div class="h-1.5 w-12 bg-teal-600/40 rounded" />
                      <div class="h-2 w-3/4 bg-slate-900 rounded mb-2" />
                      <div class="h-1 w-full bg-slate-300 rounded" />
                      <div class="h-1 w-11/12 bg-slate-300 rounded" />
                    </div>
                  </div>
                  <div v-else-if="tpl.id === 'cl-executive'" class="h-full p-3 bg-[#fafaf8] text-slate-800">
                    <div class="h-1 bg-slate-900 mb-2" />
                    <div class="h-2 w-1/2 bg-slate-900 rounded mb-2" />
                    <div class="space-y-1 border-t border-slate-300 pt-2">
                      <div class="h-1 w-full bg-slate-300 rounded" />
                      <div class="h-1 w-11/12 bg-slate-300 rounded" />
                    </div>
                  </div>
                  <div v-else class="h-full flex text-slate-800">
                    <div class="w-[28%] bg-slate-900 p-2 space-y-1">
                      <div class="h-1.5 w-full bg-white/30 rounded" />
                      <div class="h-1 w-2/3 bg-cyan-400/50 rounded" />
                    </div>
                    <div class="flex-1 p-2 space-y-1">
                      <div class="h-1 w-full bg-slate-300 rounded" />
                      <div class="h-1 w-11/12 bg-slate-300 rounded" />
                    </div>
                  </div>
                  <div
                    v-if="resumeData.templateId === tpl.id"
                    class="absolute top-2 right-2 bg-blue-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  >
                    Selected
                  </div>
                </div>
                <div class="p-3 bg-white/5">
                  <h3 class="font-bold text-white text-sm mb-0.5">{{ tpl.name }}</h3>
                  <p class="text-[11px] text-slate-400">{{ tpl.desc }}</p>
                </div>
              </button>
            </div>
          </div>

          <div v-else-if="activeTab === 'contact'">
            <div class="mb-8">
              <h1 class="font-bold text-2xl text-white mb-1">Contact Info</h1>
              <p class="text-blue-200/60 text-sm">Shown in the letter header, matching your resume.</p>
            </div>
            <div class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Full Name</label>
                  <input v-model="resumeData.personalInfo.fullName" type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" />
                </div>
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Job Title</label>
                  <input v-model="resumeData.personalInfo.jobTitle" type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" />
                </div>
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Email</label>
                  <input v-model="resumeData.personalInfo.email" type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" />
                </div>
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Phone</label>
                  <input v-model="resumeData.personalInfo.phone" type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" />
                </div>
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Location</label>
                  <input v-model="resumeData.personalInfo.location" type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" />
                </div>
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Portfolio</label>
                  <input
                    v-model="resumeData.personalInfo.portfolio"
                    type="text"
                    placeholder="yourname.dev"
                    class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all"
                  />
                </div>
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">LinkedIn</label>
                  <input
                    v-model="resumeData.personalInfo.linkedin"
                    type="text"
                    placeholder="linkedin.com/in/you"
                    class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all"
                  />
                </div>
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">GitHub</label>
                  <input
                    v-model="resumeData.personalInfo.github"
                    type="text"
                    placeholder="github.com/you"
                    class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'details'">
            <div class="mb-8">
              <h1 class="font-bold text-2xl text-white mb-1">Target Role</h1>
              <p class="text-blue-200/60 text-sm">
                Upload a resume and/or paste a job description — either is enough to draft; both is best.
              </p>
            </div>
            <div class="space-y-5">
              <div class="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div class="flex items-start justify-between gap-3 flex-wrap">
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-white">Resume for drafting</p>
                    <p class="text-[11px] text-slate-400 mt-0.5">
                      {{ uploadedResumeName || (hasResumeSignal() ? 'Using contact & experience from this project' : 'Optional — upload PDF, DOCX, or TXT') }}
                    </p>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <input
                      ref="importFileInput"
                      type="file"
                      class="hidden"
                      accept=".pdf,.docx,.doc,.txt,.md"
                      @change="handleResumeUpload"
                    />
                    <button
                      type="button"
                      :disabled="importing || enhancing"
                      class="text-[11px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white px-3 py-1.5 rounded border border-indigo-500/30 transition-colors disabled:opacity-50 cursor-pointer"
                      @click="triggerResumeUpload"
                    >
                      <span class="material-symbols-outlined text-[14px]" :class="{ 'animate-spin': importing }">
                        {{ importing ? 'refresh' : 'upload_file' }}
                      </span>
                      {{ importing ? 'Importing…' : 'Upload resume' }}
                    </button>
                  </div>
                </div>
              </div>

              <div class="flex flex-col">
                <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">
                  Target Company
                </label>
                <input
                  v-model="coverLetter.companyName"
                  type="text"
                  class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all"
                  placeholder="e.g. Google, Stripe (optional)"
                />
              </div>
              <div class="flex flex-col">
                <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Hiring Manager</label>
                <input
                  v-model="coverLetter.hiringManager"
                  type="text"
                  class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all"
                  placeholder="e.g. John Doe, Hiring Manager"
                />
              </div>
              <div class="flex flex-col">
                <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">
                  Job Description
                </label>
                <textarea
                  v-model="coverLetter.jobDescription"
                  class="w-full h-48 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all resize-none custom-scrollbar"
                  placeholder="Optional if you uploaded a resume. Paste the job requirements for a tighter draft…"
                />
              </div>
              <div class="flex flex-col">
                <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">
                  Additional AI instructions
                </label>
                <textarea
                  v-model="coverLetter.additionalInstructions"
                  class="w-full h-28 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all resize-none custom-scrollbar"
                  placeholder="Optional. Example: Keep the cover letter to one page. Emphasize leadership and German language skills."
                />
                <p class="mt-1.5 text-[11px] text-slate-500">Passed to AI as extra tasks or constraints.</p>
              </div>
              <div class="flex flex-col">
                <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-2">Tone</label>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    class="flex flex-col items-center justify-center p-3 rounded-lg border transition-all cursor-pointer"
                    :class="coverLetter.tone === 'professional' ? 'border-blue-500 bg-blue-500/20 text-blue-300' : 'border-white/10 bg-white/5 hover:border-blue-400/50 text-slate-300'"
                    @click="selectTone('professional')"
                  >
                    <span class="material-symbols-outlined text-lg mb-1">work</span>
                    <span class="text-[10px] font-bold">Professional</span>
                  </button>
                  <button
                    type="button"
                    class="flex flex-col items-center justify-center p-3 rounded-lg border transition-all cursor-pointer"
                    :class="coverLetter.tone === 'enthusiastic' ? 'border-blue-500 bg-blue-500/20 text-blue-300' : 'border-white/10 bg-white/5 hover:border-blue-400/50 text-slate-300'"
                    @click="selectTone('enthusiastic')"
                  >
                    <span class="material-symbols-outlined text-lg mb-1">bolt</span>
                    <span class="text-[10px] font-bold">Enthusiastic</span>
                  </button>
                  <button
                    type="button"
                    class="flex flex-col items-center justify-center p-3 rounded-lg border transition-all cursor-pointer"
                    :class="coverLetter.tone === 'confident' ? 'border-blue-500 bg-blue-500/20 text-blue-300' : 'border-white/10 bg-white/5 hover:border-blue-400/50 text-slate-300'"
                    @click="selectTone('confident')"
                  >
                    <span class="material-symbols-outlined text-lg mb-1">verified_user</span>
                    <span class="text-[10px] font-bold">Confident</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                :disabled="enhancing || importing"
                class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.35)]"
                @click="enhanceCoverLetter"
              >
                <span class="material-symbols-outlined text-[18px]" :class="{ 'animate-spin': enhancing }">
                  {{ enhancing ? 'refresh' : 'auto_awesome' }}
                </span>
                {{ enhancing ? 'Drafting…' : 'Draft cover letter with AI' }}
              </button>
            </div>
          </div>

          <div v-else>
            <div class="mb-6 flex items-start justify-between gap-3">
              <div>
                <h1 class="font-bold text-2xl text-white mb-1">Letter Content</h1>
                <p class="text-blue-200/60 text-sm">Edit your draft, or regenerate with AI from resume and/or job details.</p>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <button
                  v-if="canUndoAiScope('coverLetter:content')"
                  type="button"
                  class="text-[10px] flex items-center gap-1 bg-amber-500/15 text-amber-200 hover:bg-amber-500/30 px-2 py-1 rounded border border-amber-500/30 transition-colors cursor-pointer"
                  @click="() => { const entry = undoAiScope('coverLetter:content'); if (entry) toast.info('Cover letter draft undone.') }"
                >
                  <span class="material-symbols-outlined text-[12px]">undo</span>
                  Undo
                </button>
                <button
                  type="button"
                  :disabled="enhancing"
                  class="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white px-2 py-1 rounded border border-indigo-500/30 transition-colors disabled:opacity-50"
                  @click="enhanceCoverLetter"
                >
                  <span class="material-symbols-outlined text-[12px]" :class="{ 'animate-spin': enhancing }">
                    {{ enhancing ? 'refresh' : 'auto_awesome' }}
                  </span>
                  {{ enhancing ? 'Drafting...' : 'AI Draft / Enhance' }}
                </button>
              </div>
            </div>

            <BuilderRichTextEditor
              v-model="coverLetter.content"
              editor-class="min-h-[420px] text-slate-100"
            />
          </div>
        </section>

        <section
          class="h-full bg-slate-800/80 overflow-auto p-4 sm:p-8 lg:p-12 justify-start lg:justify-center items-start shadow-inner w-full lg:w-[60%]"
          :class="mobilePane === 'preview' ? 'flex' : 'hidden lg:flex'"
        >
          <div class="shrink-0 mx-auto w-full max-w-[240mm]">
            <BuilderPdfCoverLetterPdfPreview
              :resume="resumeData"
              :cover-letter="coverLetter"
            />
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

:deep(.ql-toolbar.ql-snow) {
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(0, 0, 0, 0.2);
}
:deep(.ql-container.ql-snow) {
  border: none;
  font-family: inherit;
  font-size: 0.875rem;
}
:deep(.ql-snow .ql-stroke) {
  stroke: #94a3b8;
}
:deep(.ql-snow .ql-fill) {
  fill: #94a3b8;
}
:deep(.ql-snow .ql-picker) {
  color: #94a3b8;
}
:deep(.ql-snow .ql-picker-options) {
  background-color: #1e293b;
  border-color: rgba(255, 255, 255, 0.1);
}
:deep(.ql-editor) {
  min-height: 380px;
  color: #e2e8f0;
}
:deep(.ql-editor.ql-blank::before) {
  color: #64748b;
  font-style: italic;
}

.cover-letter-body :deep(p) {
  margin: 0 0 0.75rem;
}
</style>
