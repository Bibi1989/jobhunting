<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { BuilderResumeData, BuilderCoverLetter } from '~/shared/types/builder'
import { downloadServerPdf } from '~/utils/downloadServerPdf'
import { sanitizeRichTextHtml } from '~/utils/richText'
import { slugifyFilename } from '~/utils/download'
import { coverLetterTemplates } from '~/utils/templates'

const toast = useAppToast()
const { canAccessAI, aiBlockedMessage, refreshCredits } = useSaaS()

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const resumeId = route.params.id as string
const previewRef = ref<HTMLElement | null>(null)
const pagedPreview = ref<{ contentEl?: HTMLElement | null } | null>(null)
const exporting = ref(false)
const activeTab = ref('details')
const translating = ref(false)

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

const previewContentHtml = computed(() => sanitizeRichTextHtml(coverLetter.value.content))
const letterDate = computed(() =>
  new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
)
const previewWatchKey = computed(() => [
  coverLetter.value,
  resumeData.value.personalInfo,
  resumeData.value.templateId,
])

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
})

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
    const base = slugifyFilename(
      `${resumeData.value.personalInfo.fullName || resumeData.value.name || 'cover'}-cover-letter`,
    )
    await downloadServerPdf({
      kind: 'cover_letter',
      filename: base,
      resume: resumeData.value,
      coverLetter: resumeData.value.coverLetter,
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
      toast.success(`Translated to ${LANG_LABELS[targetLang]}.`)
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
  if (!coverLetter.value.jobDescription?.trim()) {
    toast.info('Paste a job description before using AI Enhance.')
    return
  }
  if (!coverLetter.value.companyName?.trim()) {
    toast.info('Enter the company name before using AI Enhance.')
    return
  }

  enhancing.value = true
  try {
    const response = await $fetch<{ content?: string }>('/api/ai/generate-cover-letter', {
      method: 'POST',
      body: {
        resumeData: resumeData.value,
        jobDescription: coverLetter.value.jobDescription,
        companyName: coverLetter.value.companyName,
        hiringManager: coverLetter.value.hiringManager,
        tone: coverLetter.value.tone,
        currentContent: coverLetter.value.content,
        additionalInstructions: coverLetter.value.additionalInstructions || '',
      },
    })

    if (response?.content) {
      coverLetter.value.content = response.content
      toast.success('Cover letter enhanced.')
      await refreshCredits()
    }
  } catch (e) {
    console.error(e)
    toast.error('AI enhancement failed. Please try again.')
  } finally {
    enhancing.value = false
  }
}

function selectTone(t: 'professional' | 'enthusiastic' | 'confident') {
  coverLetter.value.tone = t
}
</script>

<template>
  <div class="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-100 font-sans selection:bg-blue-500/30 h-screen flex flex-col">
    <header class="flex justify-between items-center px-6 h-16 shrink-0 bg-slate-900/40 backdrop-blur-md border-b border-white/10">
      <div class="flex items-center gap-8">
        <NuxtLink to="/" class="font-serif text-2xl text-white font-bold hover:text-blue-300 transition-colors">ScrapeEngine</NuxtLink>
        <nav class="hidden md:flex gap-6 items-center">
          <NuxtLink to="/builder" class="font-semibold text-slate-300 hover:text-white transition-colors duration-200">My Projects</NuxtLink>
        </nav>
      </div>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-white text-sm font-semibold opacity-80 mr-4 border-r border-white/20 pr-4">Cover Letter</span>
          <select
            v-model="resumeData.language"
            class="bg-white/5 border border-white/10 rounded px-3 py-1 text-sm focus:border-blue-400 focus:bg-white/10 outline-none text-white transition-all cursor-pointer"
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
            class="bg-white/5 border border-white/10 rounded px-3 py-1 text-sm focus:border-blue-400 focus:bg-white/10 outline-none text-white transition-all"
            placeholder="Document Name"
          />
        </div>
        <button
          :disabled="saving"
          class="px-4 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/50 rounded hover:bg-blue-500 hover:text-white transition-colors font-semibold text-sm disabled:opacity-50 cursor-pointer"
          @click="saveDraft"
        >
          {{ saving ? 'Saving...' : 'Save Draft' }}
        </button>
        <button
          :disabled="exporting"
          class="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors font-semibold text-sm shadow-[0_0_15px_rgba(59,130,246,0.5)] cursor-pointer disabled:opacity-50"
          @click="exportPdf"
        >
          {{ exporting ? 'Exporting...' : 'Export PDF' }}
        </button>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <aside class="w-64 shrink-0 flex flex-col py-6 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 overflow-y-auto">
        <nav class="flex-1">
          <ul class="space-y-1">
            <li
              v-for="tab in [
                { id: 'template', label: 'Template', icon: 'view_quilt' },
                { id: 'contact', label: 'Contact Info', icon: 'person' },
                { id: 'details', label: 'Target Role', icon: 'work' },
                { id: 'content', label: 'Letter Content', icon: 'edit_note' },
              ]"
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
                @click="activeTab = tab.id"
              >
                <span class="material-symbols-outlined">{{ tab.icon }}</span> {{ tab.label }}
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <main class="flex-1 flex overflow-hidden">
        <section class="w-1/2 h-full flex flex-col bg-slate-900/40 backdrop-blur-md border-r border-white/10 overflow-y-auto p-8 custom-scrollbar relative">
          <div v-if="activeTab === 'template'">
            <div class="mb-8">
              <h1 class="font-bold text-2xl text-white mb-1">Choose Template</h1>
              <p class="text-blue-200/60 text-sm">Switch cover letter layouts without losing your draft.</p>
            </div>
            <div class="grid grid-cols-2 gap-4">
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
              <div class="grid grid-cols-2 gap-4">
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
                <div class="flex flex-col col-span-2">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Location</label>
                  <input v-model="resumeData.personalInfo.location" type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" />
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'details'">
            <div class="mb-8">
              <h1 class="font-bold text-2xl text-white mb-1">Target Role</h1>
              <p class="text-blue-200/60 text-sm">Company and job details used by AI Enhance.</p>
            </div>
            <div class="space-y-5">
              <div class="flex flex-col">
                <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">
                  Target Company <span class="text-blue-400 ml-2">*Required</span>
                </label>
                <input
                  v-model="coverLetter.companyName"
                  type="text"
                  class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all"
                  placeholder="e.g. Google, Stripe"
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
                  Job Description <span class="text-blue-400 ml-2">*Required</span>
                </label>
                <textarea
                  v-model="coverLetter.jobDescription"
                  class="w-full h-48 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all resize-none custom-scrollbar"
                  placeholder="Paste the job requirements here..."
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
                <p class="mt-1.5 text-[11px] text-slate-500">Passed to AI Enhance as extra tasks or constraints.</p>
              </div>
              <div class="flex flex-col">
                <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-2">Tone</label>
                <div class="grid grid-cols-3 gap-2">
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
            </div>
          </div>

          <div v-else>
            <div class="mb-6 flex items-start justify-between gap-3">
              <div>
                <h1 class="font-bold text-2xl text-white mb-1">Letter Content</h1>
                <p class="text-blue-200/60 text-sm">Edit your draft, then enhance it with AI.</p>
              </div>
              <button
                type="button"
                :disabled="enhancing"
                class="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white px-2 py-1 rounded border border-indigo-500/30 transition-colors disabled:opacity-50 shrink-0"
                @click="enhanceCoverLetter"
              >
                <span class="material-symbols-outlined text-[12px]" :class="{ 'animate-spin': enhancing }">
                  {{ enhancing ? 'refresh' : 'auto_awesome' }}
                </span>
                {{ enhancing ? 'Enhancing...' : 'AI Enhance' }}
              </button>
            </div>

            <BuilderRichTextEditor
              v-model="coverLetter.content"
              editor-class="min-h-[420px] text-slate-100"
            />
          </div>
        </section>

        <section class="w-1/2 h-full bg-slate-800/80 overflow-y-auto p-12 flex justify-center items-start shadow-inner">
          <BuilderPagedDocumentPreview ref="pagedPreview" :watch-key="previewWatchKey">
            <div ref="previewRef" class="w-full overflow-hidden">
              <BuilderCoverLetterThemeRenderer
                :template-id="resumeData.templateId"
                :full-name="resumeData.personalInfo.fullName"
                :job-title="resumeData.personalInfo.jobTitle"
                :location="resumeData.personalInfo.location"
                :email="resumeData.personalInfo.email"
                :phone="resumeData.personalInfo.phone"
                :company-name="coverLetter.companyName"
                :hiring-manager="coverLetter.hiringManager"
                :letter-date="letterDate"
                :body-html="previewContentHtml"
              />
            </div>
          </BuilderPagedDocumentPreview>
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
