<script setup lang="ts">
import {
  ArrowLeft,
  AlertCircle,
  MapPin,
  DollarSign,
  Building2,
  Bookmark,
  ExternalLink,
  Loader2,
  FileText,
  CheckCircle,
  Upload,
  Download,
  Trash2,
  ClipboardList,
  Save,
  X,
  LayoutTemplate,
} from 'lucide-vue-next'
import type { Job, UserDocumentSummary } from '~/shared/types/job'
import { CV_FORMATS, getCvFormat } from '~/shared/samples/cvFormats'
import {
  EMPTY_CANDIDATE_PROFILE,
  normalizeCandidateProfile,
  type CandidateProfile,
} from '~/shared/samples/candidateProfile'
import { downloadTextFile, slugifyFilename } from '~/utils/download'
import { downloadProfessionalPdf } from '~/utils/exportPdf'

useHead({
  title: 'Job Details | JobFlow',
})

const route = useRoute()
const router = useRouter()
const jobId = route.params.id as string

const { data: jobData, error: fetchError, pending } = await useFetch<{ job: Job }>(`/api/jobs/${jobId}`)
const job = computed(() => jobData.value?.job)

const logoGradient = computed(() => {
  if (!job.value) return ''
  const company = job.value.company || job.value.title || 'Unknown'
  let hash = 0
  for (let i = 0; i < company.length; i++) {
    hash = company.charCodeAt(i) + ((hash << 5) - hash)
  }
  const gradients = [
    'from-indigo-500 to-purple-500 text-white',
    'from-blue-500 to-indigo-500 text-white',
    'from-violet-600 to-fuchsia-600 text-white',
    'from-pink-500 to-rose-500 text-white',
    'from-teal-500 to-emerald-500 text-white',
    'from-emerald-500 to-teal-600 text-white',
    'from-cyan-500 to-blue-500 text-white',
    'from-amber-500 to-orange-500 text-slate-950',
  ]
  const idx = Math.abs(hash) % gradients.length
  return gradients[idx]
})

const { getMaterials, saveMaterials } = useJobMaterials()
const { favorites, isFavorite: checkFavorite, toggleFavorite: favToggle, saveJobWithMaterials, removeFavorite } = useFavorites()
const { visitedJobs, markVisited } = useVisitedJobs()

const isFavorite = computed(() => job.value ? checkFavorite(job.value) : false)

type Tab = 'description' | 'tailor' | 'result' | 'application'

const activeTab = ref<Tab>('description')
const resumeDoc = ref<UserDocumentSummary | null>(null)
const coverLetterDoc = ref<UserDocumentSummary | null>(null)
const resumeText = ref('')
const coverLetterText = ref('')
const isTailoring = ref(false)
const uploading = ref<'resume' | 'cover_letter' | null>(null)
const removing = ref<'resume' | 'cover_letter' | null>(null)
const tailoredResume = ref('')
const tailoredCoverLetter = ref('')
const error = ref<string | null>(null)
const toastMessage = ref<string | null>(null)
const useSavedDocuments = ref(true)
const cvFormat = ref(CV_FORMATS[0].id)
const editingResume = ref(false)
const editingCoverLetter = ref(false)
const saving = ref<'resume' | 'cover_letter' | 'both' | 'job' | null>(null)
const saveMessage = ref<string | null>(null)
const candidateProfile = ref<
  CandidateProfile & { skillsText?: string; experienceText?: string }
>({
  ...EMPTY_CANDIDATE_PROFILE,
  skillsText: '',
  experienceText: '',
})

const selectedFormat = computed(() => getCvFormat(cvFormat.value))
const hasTailored = computed(() => Boolean(tailoredResume.value || tailoredCoverLetter.value))
const needsProfileDetails = computed(() => !resumeText.value.trim())
const profileReady = computed(() => {
  const p = candidateProfile.value
  return Boolean(
    p.fullName?.trim() &&
      p.email?.trim() &&
      p.phone?.trim() &&
      p.location?.trim() &&
      (p.skillsText?.trim() || p.skills?.length) &&
      p.experienceText?.trim(),
  )
})
const canGenerate = computed(
  () => !needsProfileDetails.value || profileReady.value,
)

function builderResumePath() {
  return job.value?.id ? `/builder/resume/new?jobId=${encodeURIComponent(job.value.id)}` : '/builder/resume/new'
}
function builderCoverLetterPath() {
  return job.value?.id
    ? `/builder/cover-letter/new?jobId=${encodeURIComponent(job.value.id)}`
    : '/builder/cover-letter/new'
}
function builderPortfolioPath() {
  return job.value?.id
    ? `/dashboard/portfolio?jobId=${encodeURIComponent(job.value.id)}`
    : '/dashboard/portfolio'
}

async function loadDocuments() {
  try {
    const data = await $fetch<{
      resume: UserDocumentSummary | null
      coverLetter: UserDocumentSummary | null
    }>('/api/documents')
    resumeDoc.value = data.resume
    coverLetterDoc.value = data.coverLetter
  } catch {
    // ignore
  }
}

watch(
  () => [resumeDoc.value, coverLetterDoc.value] as const,
  ([resume, coverLetter], previous) => {
    const [prevResume, prevCover] = previous || [undefined, undefined]
    if (resume?.contentText && !resumeText.value) {
      resumeText.value = resume.contentText
    } else if (!resume && prevResume) {
      resumeText.value = ''
    }
    if (coverLetter?.contentText && !coverLetterText.value) {
      coverLetterText.value = coverLetter.contentText
    } else if (!coverLetter && prevCover) {
      coverLetterText.value = ''
    }
  },
  { immediate: true },
)

function loadSavedForJob() {
  if (!job.value) return false
  const saved = getMaterials(job.value)
  if (saved) {
    if (saved.resume) tailoredResume.value = saved.resume
    if (saved.coverLetter) tailoredCoverLetter.value = saved.coverLetter
    if (saved.cvFormat) cvFormat.value = saved.cvFormat
    return true
  }
  return false
}

onMounted(async () => {
  await loadDocuments()
  const loaded = loadSavedForJob()
  if (loaded && hasTailored.value) {
    activeTab.value = 'result'
    editingResume.value = false
    editingCoverLetter.value = false
  }
})

watch(
  () => job.value?.url,
  () => {
    tailoredResume.value = ''
    tailoredCoverLetter.value = ''
    loadSavedForJob()
    if (job.value?.url) {
      markVisited(job.value.url)
    }
  },
  { immediate: true }
)

const fileBase = computed(() => {
  if (!job.value) return ''
  const company = job.value.company ? `-${slugifyFilename(job.value.company)}` : ''
  return `${slugifyFilename(job.value.title)}${company}`
})

const editableJob = ref<any>({
  title: '',
  company: '',
  location: '',
  salaryMin: null,
  salaryMax: null,
  currency: 'USD',
  description: '',
  responsibilities: '',
  requirements: '',
})

watch(
  () => job.value,
  (newJob) => {
    if (newJob) {
      editableJob.value = {
        title: newJob.title || '',
        company: newJob.company || '',
        location: newJob.location || '',
        salaryMin: newJob.salaryMin ?? null,
        salaryMax: newJob.salaryMax ?? null,
        currency: newJob.currency || 'USD',
        description: newJob.description ?? '',
        responsibilities: newJob.responsibilities ?? '',
        requirements: newJob.requirements ?? '',
      }
    }
  },
  { immediate: true }
)

const isEditingJob = ref(false)
const savingJob = ref(false)
const tailoringPreset = ref<'ats-first' | 'impact-first' | 'leadership' | 'tech-expert'>('ats-first')

async function saveJobEdits() {
  savingJob.value = true
  error.value = null
  try {
    const data = await $fetch<{ job: Job }>(`/api/jobs/${jobId}`, {
      method: 'PUT',
      body: editableJob.value
    })
    if (jobData.value) {
      jobData.value.job = data.job
    }
    isEditingJob.value = false
    toastMessage.value = 'Job details updated successfully!'
    setTimeout(() => {
      if (toastMessage.value === 'Job details updated successfully!') {
        toastMessage.value = null
      }
    }, 3000)
  } catch (err: any) {
    console.error(err)
    error.value = err.data?.statusMessage || err.message || 'Failed to update job details.'
  } finally {
    savingJob.value = false
  }
}

async function uploadDocument(event: Event, type: 'resume' | 'cover_letter') {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploading.value = type
  error.value = null

  try {
    const form = new FormData()
    form.append('type', type)
    form.append('file', file)

    const data = await $fetch<{ document: UserDocumentSummary }>('/api/documents', {
      method: 'POST',
      body: form,
    })

    if (type === 'resume') resumeText.value = data.document.contentText
    else coverLetterText.value = data.document.contentText

    await loadDocuments()
  } catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string }; message?: string }
    error.value = fetchError.data?.statusMessage || fetchError.message || 'Upload failed'
  } finally {
    uploading.value = null
    input.value = ''
  }
}

async function removeStoredDocument(type: 'resume' | 'cover_letter') {
  removing.value = type
  error.value = null
  try {
    if (
      (type === 'resume' && resumeDoc.value) ||
      (type === 'cover_letter' && coverLetterDoc.value)
    ) {
      await $fetch('/api/documents', {
        method: 'DELETE',
        body: { type },
      })
    }
    if (type === 'resume') resumeText.value = ''
    else coverLetterText.value = ''
    await loadDocuments()
  } catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string }; message?: string }
    error.value = fetchError.data?.statusMessage || fetchError.message || 'Remove failed'
  } finally {
    removing.value = null
  }
}

async function handleTailor() {
  if (!job.value) return
  if (needsProfileDetails.value && !profileReady.value) {
    error.value =
      'Fill in your name, email, phone, location, skills, and work experience, or upload a CV.'
    return
  }

  isTailoring.value = true
  error.value = null
  saveMessage.value = null

  try {
    const profile = normalizeCandidateProfile({
      ...candidateProfile.value,
      skillsText: candidateProfile.value.skillsText,
      experienceText: candidateProfile.value.experienceText,
    })

    const data = await $fetch<{ resume: string; coverLetter: string }>('/api/tailor', {
      method: 'POST',
      body: {
        job: job.value,
        jobId: job.value.id,
        resumeText: resumeText.value,
        coverLetterText: coverLetterText.value,
        useSavedDocuments: useSavedDocuments.value,
        cvFormat: cvFormat.value,
        tailoringPreset: tailoringPreset.value,
        candidateProfile: {
          ...profile,
          skillsText: candidateProfile.value.skillsText,
          experienceText: candidateProfile.value.experienceText,
        },
      },
    })

    tailoredResume.value = data.resume
    tailoredCoverLetter.value = data.coverLetter
    editingResume.value = false
    editingCoverLetter.value = false
    activeTab.value = 'result'

    if (isFavorite.value) {
      saveMaterials(job.value, {
        resume: data.resume,
        coverLetter: data.coverLetter,
        cvFormat: cvFormat.value,
      })
    }
  } catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string }; message?: string }
    error.value =
      fetchError.data?.statusMessage || fetchError.message || 'Failed to tailor materials'
  } finally {
    isTailoring.value = false
  }
}

function saveTailoredForJob() {
  if (!job.value || !hasTailored.value) return
  saving.value = 'job'
  saveMessage.value = null
  error.value = null

  try {
    saveJobWithMaterials(job.value, {
      resume: tailoredResume.value,
      coverLetter: tailoredCoverLetter.value,
      cvFormat: cvFormat.value,
    })
    saveMessage.value = 'Tailored resume and cover letter saved with this job.'
  } finally {
    saving.value = null
  }
}

function handleToggleFavorite() {
  if (!job.value) return
  if (!isFavorite.value && hasTailored.value) {
    saveMaterials(job.value, {
      resume: tailoredResume.value,
      coverLetter: tailoredCoverLetter.value,
      cvFormat: cvFormat.value,
    })
  }
  favToggle(job.value)
}

async function saveDocument(type: 'resume' | 'cover_letter') {
  if (!job.value) return
  const content =
    type === 'resume' ? tailoredResume.value.trim() : tailoredCoverLetter.value.trim()
  if (!content) return

  saving.value = type
  saveMessage.value = null
  error.value = null

  try {
    await $fetch('/api/documents/text', {
      method: 'POST',
      body: {
        type,
        contentText: content,
        originalName:
          type === 'resume'
            ? `${fileBase.value}-resume.md`
            : `${fileBase.value}-cover-letter.md`,
      },
    })
    saveMaterials(job.value, {
      resume: tailoredResume.value,
      coverLetter: tailoredCoverLetter.value,
      cvFormat: cvFormat.value,
    })
    saveMessage.value =
      type === 'resume' ? 'Resume saved to your documents.' : 'Cover letter saved to your documents.'
    await loadDocuments()
  } catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string }; message?: string }
    error.value = fetchError.data?.statusMessage || fetchError.message || 'Save failed'
  } finally {
    saving.value = null
  }
}

async function saveBoth() {
  if (!job.value || !hasTailored.value) return
  saving.value = 'both'
  saveMessage.value = null
  error.value = null

  try {
    if (tailoredResume.value.trim()) {
      await $fetch('/api/documents/text', {
        method: 'POST',
        body: {
          type: 'resume',
          contentText: tailoredResume.value,
          originalName: `${fileBase.value}-resume.md`,
        },
      })
    }
    if (tailoredCoverLetter.value.trim()) {
      await $fetch('/api/documents/text', {
        method: 'POST',
        body: {
          type: 'cover_letter',
          contentText: tailoredCoverLetter.value,
          originalName: `${fileBase.value}-cover-letter.md`,
        },
      })
    }
    saveJobWithMaterials(job.value, {
      resume: tailoredResume.value,
      coverLetter: tailoredCoverLetter.value,
      cvFormat: cvFormat.value,
    })
    saveMessage.value = 'Saved to documents and attached to this job.'
    await loadDocuments()
  } catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string }; message?: string }
    error.value = fetchError.data?.statusMessage || fetchError.message || 'Save failed'
  } finally {
    saving.value = null
  }
}

function downloadResume(format: 'md' | 'txt') {
  if (!tailoredResume.value) return
  downloadTextFile(
    `${fileBase.value}-resume.${format}`,
    tailoredResume.value,
    format === 'md' ? 'text/markdown' : 'text/plain',
  )
}

function downloadCoverLetter(format: 'md' | 'txt') {
  if (!tailoredCoverLetter.value) return
  downloadTextFile(
    `${fileBase.value}-cover-letter.${format}`,
    tailoredCoverLetter.value,
    format === 'md' ? 'text/markdown' : 'text/plain',
  )
}

function downloadAll() {
  downloadResume('md')
  downloadCoverLetter('md')
}

async function downloadResumePdf() {
  if (!tailoredResume.value) return
  await downloadProfessionalPdf(tailoredResume.value, 'resume', fileBase.value)
}

async function downloadCoverLetterPdf() {
  if (!tailoredCoverLetter.value) return
  await downloadProfessionalPdf(tailoredCoverLetter.value, 'coverLetter', fileBase.value)
}

async function removeJob() {
  if (!job.value) return
  const { confirm } = useAppConfirm()
  const confirmed = await confirm({
    title: 'Remove job',
    message: `Remove “${job.value.title}” from your list?`,
    confirmLabel: 'Remove',
    danger: true,
  })
  if (!confirmed) return

  try {
    const id = job.value.id || 'by-url'
    await $fetch(`/api/jobs/${id}`, {
      method: 'DELETE',
      query: job.value.id ? undefined : { url: job.value.url },
    })
  } catch {
    // Still remove locally if API/DB fails
  }

  removeFavorite(job.value)
  toastMessage.value = 'Job removed.'
  setTimeout(async () => {
    toastMessage.value = null
    await navigateTo('/')
  }, 1500)
}

function applyToJob() {
  if (!job.value) return
  markVisited(job.value.url)
  window.open(job.value.url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <div class="min-h-dvh lg:h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 flex flex-col p-4 md:p-6 overflow-x-hidden lg:overflow-hidden">
    <div class="max-w-[1400px] mx-auto w-full grow flex flex-col min-h-0 lg:h-full lg:overflow-hidden">
      <!-- Top Header Nav -->
      <header class="flex justify-between items-center mb-4 md:mb-6 gap-3 shrink-0 border-b border-slate-900 pb-4 md:pb-5">
        <div class="flex items-center gap-3 md:gap-4 min-w-0">
          <NuxtLink
            to="/scraper"
            class="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all duration-300 border border-slate-800 flex items-center justify-center shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft :size="18" />
          </NuxtLink>
          <div class="flex items-center gap-3 min-w-0">
            <AppLogo />
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <NuxtLink
            to="/scraper"
            class="text-xs font-bold text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-all duration-300"
          >
            <span class="hidden sm:inline">Back to Jobs</span>
            <span class="sm:hidden">Jobs</span>
          </NuxtLink>
        </div>
      </header>

      <!-- Main Layout Body -->
      <div v-if="pending" class="flex-grow flex items-center justify-center">
        <Loader2 class="animate-spin text-indigo-500" :size="36" />
      </div>

      <div v-else-if="fetchError || !job" class="flex-grow flex flex-col items-center justify-center text-center opacity-70">
        <AlertCircle class="text-red-400 mb-4 animate-pulse" :size="48" />
        <h2 class="text-lg font-bold text-slate-200">Job Not Found</h2>
        <p class="text-slate-400 text-sm mt-1 mb-6">The job you are looking for does not exist or has been removed.</p>
        <NuxtLink to="/scraper" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all duration-300">
          Return to Dashboard
        </NuxtLink>
      </div>

      <div
        v-else
        class="relative w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col grow min-h-[70vh] lg:min-h-0"
      >
        <!-- Header Info -->
        <div class="p-4 md:p-6 border-b border-slate-800 flex justify-between items-start gap-4 bg-slate-900/50">
          <div class="flex gap-3 md:gap-4 items-start min-w-0">
            <div
              class="w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-bold text-base md:text-lg shrink-0 bg-gradient-to-tr shadow-md"
              :class="logoGradient"
            >
              {{ (job.company || job.title).substring(0, 2).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <h2 class="text-lg md:text-xl font-bold text-slate-100 break-words">{{ job.title }}</h2>
              <div class="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm text-slate-400">
                <span v-if="job.company" class="flex items-center gap-1.5">
                  <Building2 :size="14" /> {{ job.company }}
                </span>
                <span class="flex items-center gap-1.5">
                  <MapPin :size="14" /> {{ job.location }}
                </span>
                <span
                  v-if="job.salaryMin || job.salaryMax"
                  class="flex items-center gap-1.5 text-emerald-400 font-semibold"
                >
                  <DollarSign :size="14" />
                  {{ job.currency || '$' }}{{ job.salaryMin?.toLocaleString() }}
                  <template v-if="job.salaryMax"> - {{ job.salaryMax.toLocaleString() }}</template>
                  <template v-else>+</template>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab List Nav -->
        <div class="px-3 sm:px-6 border-b border-slate-800 flex gap-2 shrink-0 bg-slate-900/80 backdrop-blur z-10 py-3 overflow-x-auto scrollbar-thin">
          <button
            type="button"
            class="px-4 py-2 font-bold text-xs rounded-xl transition-all duration-300 whitespace-nowrap flex items-center gap-2"
            :class="activeTab === 'description' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'"
            @click="activeTab = 'description'"
          >
            Description
          </button>
          <button
            type="button"
            class="px-4 py-2 font-bold text-xs rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
            :class="activeTab === 'tailor' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'"
            @click="activeTab = 'tailor'"
          >
            <FileText :size="14" /> AI Tailoring
          </button>
          <button
            type="button"
            class="px-4 py-2 font-bold text-xs rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
            :class="activeTab === 'application' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'"
            @click="activeTab = 'application'"
          >
            <ClipboardList :size="14" /> Application Q&A
          </button>
          <button
            v-if="hasTailored"
            type="button"
            class="px-4 py-2 font-bold text-xs rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
            :class="activeTab === 'result' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/10' : 'text-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/20'"
            @click="activeTab = 'result'"
          >
            <CheckCircle :size="14" /> Tailored Results
          </button>
        </div>

        <!-- Scrollable content -->
        <div class="p-4 md:p-6 overflow-y-auto flex-grow text-slate-300 leading-relaxed bg-slate-950/50">
          <div v-if="activeTab === 'description'" class="space-y-6 text-left">
            <!-- Structured Review and Edit Mode header -->
            <div class="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider">Scrape Confirmation</h3>
                <p class="text-xs text-slate-400">Review and edit extracted fields before generating tailored materials.</p>
              </div>
              <button
                type="button"
                @click="isEditingJob = !isEditingJob"
                class="px-4 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-white transition duration-200 flex items-center gap-1.5 cursor-pointer"
              >
                <span class="material-symbols-outlined text-[14px]">{{ isEditingJob ? 'close' : 'edit' }}</span>
                {{ isEditingJob ? 'Cancel Edits' : 'Edit Fields' }}
              </button>
            </div>

            <!-- Edit Mode Form -->
            <div v-if="isEditingJob" class="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Job Title</label>
                  <input
                    v-model="editableJob.title"
                    type="text"
                    class="bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-blue-400"
                  />
                </div>
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Company Name</label>
                  <input
                    v-model="editableJob.company"
                    type="text"
                    class="bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-blue-400"
                  />
                </div>
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Location</label>
                  <input
                    v-model="editableJob.location"
                    type="text"
                    class="bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-blue-400"
                  />
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <div class="flex flex-col col-span-1">
                    <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Currency</label>
                    <input
                      v-model="editableJob.currency"
                      type="text"
                      class="bg-slate-950 border border-white/10 rounded-lg px-2 py-2 text-sm text-white outline-none focus:border-blue-400"
                    />
                  </div>
                  <div class="flex flex-col col-span-1">
                    <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Min Salary</label>
                    <input
                      v-model.number="editableJob.salaryMin"
                      type="number"
                      class="bg-slate-950 border border-white/10 rounded-lg px-2 py-2 text-sm text-white outline-none focus:border-blue-400"
                    />
                  </div>
                  <div class="flex flex-col col-span-1">
                    <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Max Salary</label>
                    <input
                      v-model.number="editableJob.salaryMax"
                      type="number"
                      class="bg-slate-950 border border-white/10 rounded-lg px-2 py-2 text-sm text-white outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
              </div>

              <div class="flex flex-col">
                <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Responsibilities</label>
                <textarea
                  v-model="editableJob.responsibilities"
                  rows="4"
                  class="bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-blue-400 resize-y"
                  placeholder="Summarize key responsibilities or duties here…"
                />
              </div>

              <div class="flex flex-col">
                <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Requirements & Qualifications</label>
                <textarea
                  v-model="editableJob.requirements"
                  rows="4"
                  class="bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-blue-400 resize-y"
                  placeholder="Summarize required qualifications, tools, or education here…"
                />
              </div>

              <div class="flex flex-col">
                <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Full Raw Description</label>
                <textarea
                  v-model="editableJob.description"
                  rows="6"
                  class="bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-blue-400 resize-y"
                />
              </div>

              <div class="flex justify-end pt-2">
                <button
                  type="button"
                  @click="saveJobEdits"
                  :disabled="savingJob"
                  class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer disabled:opacity-50"
                >
                  <span class="material-symbols-outlined text-[18px] animate-spin" v-if="savingJob">sync</span>
                  {{ savingJob ? 'Saving Changes…' : 'Save Details' }}
                </button>
              </div>
            </div>

            <!-- Read Only Structured Confirmation View -->
            <div v-else class="space-y-6">
              <!-- Quick Info Cards -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center gap-3">
                  <div class="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                    <span class="material-symbols-outlined text-[20px]">business_center</span>
                  </div>
                  <div>
                    <p class="text-[10px] uppercase font-bold text-slate-500">Job Title & Company</p>
                    <p class="text-sm font-semibold text-white">{{ job.title }}</p>
                    <p class="text-xs text-slate-400">{{ job.company || 'Unknown' }}</p>
                  </div>
                </div>

                <div class="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center gap-3">
                  <div class="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                    <span class="material-symbols-outlined text-[20px]">location_on</span>
                  </div>
                  <div>
                    <p class="text-[10px] uppercase font-bold text-slate-500">Location</p>
                    <p class="text-sm font-semibold text-white">{{ job.location || 'Remote / Unknown' }}</p>
                  </div>
                </div>

                <div class="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center gap-3">
                  <div class="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <span class="material-symbols-outlined text-[20px]">payments</span>
                  </div>
                  <div>
                    <p class="text-[10px] uppercase font-bold text-slate-500">Compensation</p>
                    <p class="text-sm font-semibold text-white" v-if="job.salaryMin || job.salaryMax">
                      {{ job.currency || '$' }}{{ job.salaryMin?.toLocaleString() || '0' }} - {{ job.salaryMax?.toLocaleString() || 'N/A' }}
                    </p>
                    <p class="text-sm font-semibold text-slate-400" v-else>Not specified</p>
                  </div>
                </div>
              </div>

              <!-- Open In Builders Shortcuts -->
              <div class="rounded-xl border border-blue-500/20 bg-blue-950/20 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 class="text-sm font-bold text-blue-300">Ready to build or tailor?</h4>
                  <p class="text-xs text-blue-200/60">Take this verified job description into the professional document editors.</p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <NuxtLink
                    :to="builderResumePath()"
                    class="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition duration-200 cursor-pointer shadow-[0_0_12px_rgba(37,99,235,0.25)]"
                  >
                    <LayoutTemplate :size="14" />
                    Open Resume Builder
                  </NuxtLink>
                  <NuxtLink
                    :to="builderCoverLetterPath()"
                    class="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-indigo-200 flex items-center gap-1.5 transition duration-200 cursor-pointer"
                  >
                    <FileText :size="14" />
                    Open Cover Letter Builder
                  </NuxtLink>
                </div>
              </div>

              <!-- Responsibilities & Requirements lists -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Responsibilities -->
                <div class="space-y-2 text-left">
                  <h4 class="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[16px] text-blue-400">task_alt</span>
                    Core Responsibilities
                  </h4>
                  <div class="rounded-xl border border-white/5 bg-white/[0.01] p-4 text-sm min-h-[120px] whitespace-pre-wrap leading-relaxed">
                    {{ job.responsibilities || 'No structured responsibilities extracted yet. Edit fields to add.' }}
                  </div>
                </div>

                <!-- Requirements -->
                <div class="space-y-2 text-left">
                  <h4 class="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[16px] text-emerald-400">verified</span>
                    Key Requirements
                  </h4>
                  <div class="rounded-xl border border-white/5 bg-white/[0.01] p-4 text-sm min-h-[120px] whitespace-pre-wrap leading-relaxed">
                    {{ job.requirements || 'No structured requirements extracted yet. Edit fields to add.' }}
                  </div>
                </div>
              </div>

              <!-- Raw Description collapsible -->
              <div class="space-y-2 text-left">
                <h4 class="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px] text-slate-400 font-bold">description</span>
                  Full Scraped Posting
                </h4>
                <div class="rounded-xl border border-white/5 bg-white/[0.01] p-4 text-sm text-slate-400 leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                  {{ job.description || 'No description available.' }}
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'application'">
            <ApplicationFormPanel
              :job="job"
              :resume="resumeDoc"
              :cover-letter="coverLetterDoc"
              :resume-text="resumeText"
              :cover-letter-text="coverLetterText"
              @apply="applyToJob"
            />
          </div>

          <div v-else-if="activeTab === 'tailor'" class="space-y-6 max-w-4xl mx-auto pb-6">
            <div class="rounded-2xl border border-blue-500/25 bg-blue-950/25 p-4 space-y-3">
              <div>
                <p class="font-bold text-blue-300 text-xs uppercase tracking-widest mb-1">Prefer the visual builder?</p>
                <p class="text-xs text-slate-400">
                  Open the resume builder with this job’s scraped description and your uploaded CV prefilled.
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <NuxtLink
                  :to="builderResumePath()"
                  class="px-3 py-2 rounded-xl text-xs font-bold border border-blue-500/40 bg-blue-600 text-white hover:bg-blue-500 flex items-center gap-1.5 transition-all"
                >
                  <LayoutTemplate :size="14" />
                  Open resume builder
                </NuxtLink>
                <NuxtLink
                  :to="builderCoverLetterPath()"
                  class="px-3 py-2 rounded-xl text-xs font-bold border border-indigo-500/40 bg-indigo-950/40 text-indigo-200 hover:bg-indigo-600 hover:text-white flex items-center gap-1.5 transition-all"
                >
                  Cover letter builder
                </NuxtLink>
                <NuxtLink
                  :to="builderPortfolioPath()"
                  class="px-3 py-2 rounded-xl text-xs font-bold border border-slate-600 bg-slate-900 text-slate-200 hover:border-blue-500 flex items-center gap-1.5 transition-all"
                >
                  Portfolio
                </NuxtLink>
              </div>
            </div>

            <p class="text-sm text-slate-400">
              Pick a CV format (live preview on the right), then upload or paste your materials.
            </p>

            <CvFormatPicker v-model="cvFormat" />

            <CandidateDetailsForm
              v-if="needsProfileDetails"
              v-model="candidateProfile"
              required
            />

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-2">
                <label
                  class="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs cursor-pointer hover:border-blue-500 transition-colors"
                  :class="{ 'opacity-50 pointer-events-none': !!uploading || !!removing }"
                >
                  <Upload :size="14" />
                  {{ uploading === 'resume' ? 'Uploading CV...' : 'Upload CV' }}
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.md,application/pdf,text/plain"
                    class="hidden"
                    :disabled="!!uploading || !!removing"
                    @change="uploadDocument($event, 'resume')"
                  />
                </label>
                <button
                  v-if="resumeDoc || resumeText.trim()"
                  type="button"
                  class="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-red-400 disabled:opacity-50"
                  :disabled="!!uploading || !!removing"
                  @click="removeStoredDocument('resume')"
                >
                  <Trash2 :size="12" />
                  {{
                    removing === 'resume'
                      ? 'Removing...'
                      : resumeDoc
                        ? 'Remove uploaded CV'
                        : 'Clear CV text'
                  }}
                </button>
              </div>
              <div class="space-y-2">
                <label
                  class="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs cursor-pointer hover:border-blue-500 transition-colors"
                  :class="{ 'opacity-50 pointer-events-none': !!uploading || !!removing }"
                >
                  <Upload :size="14" />
                  {{ uploading === 'cover_letter' ? 'Uploading...' : 'Upload Cover Letter' }}
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.md,application/pdf,text/plain"
                    class="hidden"
                    :disabled="!!uploading || !!removing"
                    @change="uploadDocument($event, 'cover_letter')"
                  />
                </label>
                <button
                  v-if="coverLetterDoc || coverLetterText.trim()"
                  type="button"
                  class="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-red-400 disabled:opacity-50"
                  :disabled="!!uploading || !!removing"
                  @click="removeStoredDocument('cover_letter')"
                >
                  <Trash2 :size="12" />
                  {{
                    removing === 'cover_letter'
                      ? 'Removing...'
                      : coverLetterDoc
                        ? 'Remove uploaded cover letter'
                        : 'Clear cover letter text'
                  }}
                </button>
              </div>
            </div>

            <label class="flex items-center gap-2 text-xs text-slate-400">
              <input v-model="useSavedDocuments" type="checkbox" class="rounded border-slate-700" />
              Fall back to saved documents from the database when fields are empty
            </label>

             <!-- Tailoring Personality Preset Selector -->
            <div class="space-y-2 text-left">
              <label class="text-xs font-bold uppercase tracking-widest text-slate-500 block">
                Tailoring Personality / Preset
              </label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  @click="tailoringPreset = 'ats-first'"
                  :class="['px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer', tailoringPreset === 'ats-first' ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/10' : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600']"
                >
                  ATS-First
                </button>
                <button
                  type="button"
                  @click="tailoringPreset = 'impact-first'"
                  :class="['px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer', tailoringPreset === 'impact-first' ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/10' : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600']"
                >
                  Impact/Metrics
                </button>
                <button
                  type="button"
                  @click="tailoringPreset = 'leadership'"
                  :class="['px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer', tailoringPreset === 'leadership' ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/10' : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600']"
                >
                  Leadership
                </button>
                <button
                  type="button"
                  @click="tailoringPreset = 'tech-expert'"
                  :class="['px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer', tailoringPreset === 'tech-expert' ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/10' : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600']"
                >
                  Tech Expert
                </button>
              </div>
              <p class="text-[10px] text-slate-500">
                <span v-if="tailoringPreset === 'ats-first'">Optimized for parsing and strict keyword density. Uses objective phrasing.</span>
                <span v-if="tailoringPreset === 'impact-first'">Places high-impact quantitative achievements, percentages, and metrics first.</span>
                <span v-if="tailoringPreset === 'leadership'">Showcases management, mentorship, communication, and project ownership.</span>
                <span v-if="tailoringPreset === 'tech-expert'">Focuses on engineering depth, architecture, and tool mastery.</span>
              </p>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-widest text-slate-500">
                Your Resume (Text)
              </label>
              <textarea
                v-model="resumeText"
                placeholder="Paste or upload your resume..."
                class="w-full h-48 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
              />
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-widest text-slate-500">
                Your Cover Letter (Text)
              </label>
              <textarea
                v-model="coverLetterText"
                placeholder="Paste or upload your cover letter..."
                class="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
              />
            </div>

            <div
              v-if="error"
              class="text-red-400 text-xs flex items-center bg-red-950/20 px-3 py-2 rounded-lg border border-red-500/20"
            >
              {{ error }}
            </div>

            <div class="flex justify-end pt-2">
              <button
                type="button"
                :disabled="isTailoring || !canGenerate"
                class="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all duration-300"
                @click="handleTailor"
              >
                <Loader2 v-if="isTailoring" class="animate-spin" :size="18" />
                <FileText v-else :size="18" />
                {{ isTailoring ? 'Generating Materials...' : 'Generate Tailored Materials' }}
              </button>
            </div>
          </div>

          <div v-else class="space-y-6 max-w-4xl mx-auto pb-6">
            <div class="flex flex-wrap gap-2 justify-between items-center">
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="px-3 py-2 rounded-xl text-xs font-bold border border-blue-500/40 bg-blue-950/30 text-blue-300 hover:bg-blue-600 hover:text-white flex items-center gap-1.5 disabled:opacity-50 transition-all"
                  :disabled="!!saving || !hasTailored"
                  @click="saveTailoredForJob"
                >
                  <Loader2 v-if="saving === 'job'" class="animate-spin" :size="14" />
                  <Bookmark v-else :size="14" />
                  Save for this job
                </button>
                <button
                  type="button"
                  class="px-3 py-2 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-600 hover:text-white flex items-center gap-1.5 disabled:opacity-50 transition-all"
                  :disabled="!!saving || !hasTailored"
                  @click="saveBoth"
                >
                  <Loader2 v-if="saving === 'both'" class="animate-spin" :size="14" />
                  <Save v-else :size="14" />
                  Save to documents
                </button>
                <NuxtLink
                  :to="builderResumePath()"
                  class="px-3 py-2 rounded-xl text-xs font-bold border border-indigo-500/40 bg-indigo-600 text-white hover:bg-indigo-500 flex items-center gap-1.5 transition-all"
                >
                  <LayoutTemplate :size="14" />
                  Open resume builder
                </NuxtLink>
                <NuxtLink
                  :to="builderCoverLetterPath()"
                  class="px-3 py-2 rounded-xl text-xs font-bold border border-slate-600 bg-slate-900 text-slate-200 hover:border-blue-500 flex items-center gap-1.5 transition-all"
                >
                  Cover letter builder
                </NuxtLink>
                <NuxtLink
                  :to="builderPortfolioPath()"
                  class="px-3 py-2 rounded-xl text-xs font-bold border border-slate-600 bg-slate-900 text-slate-200 hover:border-blue-500 flex items-center gap-1.5 transition-all"
                >
                  Portfolio
                </NuxtLink>
              </div>
              <p class="text-[11px] text-slate-500">
                Format: {{ selectedFormat.name }} · Opens in preview by default
              </p>
            </div>

            <div
              v-if="saveMessage"
              class="rounded-xl border border-emerald-500/20 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-300"
            >
              {{ saveMessage }}
            </div>
            <div
              v-if="error"
              class="rounded-xl border border-red-500/20 bg-red-950/20 px-3 py-2 text-xs text-red-300"
            >
              {{ error }}
            </div>

            <div class="flex flex-wrap gap-2 justify-end">
              <button
                v-if="tailoredResume"
                type="button"
                class="px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-900 text-slate-200 hover:border-blue-500 flex items-center gap-1.5 transition-all"
                @click="downloadResume('md')"
              >
                <Download :size="14" /> Resume (.md)
              </button>
              <button
                v-if="tailoredCoverLetter"
                type="button"
                class="px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-900 text-slate-200 hover:border-blue-500 flex items-center gap-1.5 transition-all"
                @click="downloadCoverLetter('md')"
              >
                <Download :size="14" /> Cover Letter (.md)
              </button>
              <button
                v-if="tailoredResume"
                type="button"
                class="px-3 py-2 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-600 hover:text-white flex items-center gap-1.5 transition-all"
                @click="downloadResumePdf"
              >
                <Download :size="14" /> Resume PDF
              </button>
              <button
                v-if="tailoredCoverLetter"
                type="button"
                class="px-3 py-2 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-600 hover:text-white flex items-center gap-1.5 transition-all"
                @click="downloadCoverLetterPdf"
              >
                <Download :size="14" /> Cover Letter PDF
              </button>
              <button
                v-if="hasTailored"
                type="button"
                class="px-3 py-2 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-600 hover:text-white flex items-center gap-1.5 transition-all"
                @click="downloadAll"
              >
                <Download :size="14" /> Download all (.md)
              </button>
            </div>

            <div
              class="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-sm text-slate-300"
            >
              Preview shows how the documents look. Switch to Edit to change text, then
              <strong>Save for this job</strong> so the materials stay with this saved role.
            </div>

            <TailoredDocEditor
              v-if="tailoredCoverLetter"
              v-model="tailoredCoverLetter"
              v-model:editing="editingCoverLetter"
              title="Tailored Cover Letter"
              min-height-class="min-h-[16rem]"
            >
              <template #actions>
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:border-emerald-500 disabled:opacity-50 transition-all"
                  :disabled="saving === 'cover_letter' || saving === 'both'"
                  @click="saveDocument('cover_letter')"
                >
                  <Loader2 v-if="saving === 'cover_letter'" class="animate-spin" :size="12" />
                  <Save v-else :size="12" />
                  Save
                </button>
              </template>
            </TailoredDocEditor>

            <TailoredDocEditor
              v-if="tailoredResume"
              v-model="tailoredResume"
              v-model:editing="editingResume"
              title="Tailored Resume"
              min-height-class="min-h-[20rem]"
              :format-id="cvFormat"
            >
              <template #actions>
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:border-emerald-500 disabled:opacity-50 transition-all"
                  :disabled="saving === 'resume' || saving === 'both'"
                  @click="saveDocument('resume')"
                >
                  <Loader2 v-if="saving === 'resume'" class="animate-spin" :size="12" />
                  <Save v-else :size="12" />
                  Save
                </button>
              </template>
            </TailoredDocEditor>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="p-6 border-t border-slate-800 bg-slate-900/50 flex flex-wrap justify-end gap-3 shrink-0">
          <button
            type="button"
            class="px-5 py-2.5 rounded-xl font-bold text-sm border border-red-500/20 bg-red-950/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors flex items-center gap-2"
            @click="removeJob"
          >
            <Trash2 :size="16" /> Remove
          </button>
          <button
            type="button"
            class="px-5 py-2.5 rounded-xl font-bold text-sm border transition-colors flex items-center gap-2"
            :class="
              isFavorite
                ? 'bg-blue-600/20 border-blue-500/20 text-blue-400'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            "
            @click="handleToggleFavorite"
          >
            <Bookmark :size="16" :class="isFavorite ? 'fill-current' : ''" />
            {{ isFavorite ? 'Saved' : 'Save Role' }}
          </button>
          <button
            type="button"
            class="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
            @click="applyToJob"
          >
            Apply on company site <ExternalLink :size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      <div
        v-if="toastMessage"
        class="bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-medium text-sm animate-bounce"
      >
        <CheckCircle :size="18" class="shrink-0" />
        {{ toastMessage }}
      </div>
    </div>
  </div>
</template>
