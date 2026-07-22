<script setup lang="ts">
import {
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Copy,
  Save,
  Trash2,
  Upload,
  FileText,
} from 'lucide-vue-next'
import type { BuilderResumeData } from '~/shared/types/builder'
import type { UserDocumentSummary } from '~/shared/types/job'
import {
  deleteApplyEmailTemplate,
  loadApplyEmailTemplates,
  upsertApplyEmailTemplate,
  type ApplyEmailTemplate,
} from '~/utils/applyEmailTemplates'

const props = withDefaults(
  defineProps<{
    resumeData: BuilderResumeData
    /** page = full-page compose; modal = quick overlay from builder */
    variant?: 'page' | 'modal'
  }>(),
  { variant: 'modal' },
)

const emit = defineEmits<{
  close: []
  saved: [template: ApplyEmailTemplate]
}>()

const toast = useAppToast()
const { refreshCredits, sessionUser, canAccessAI, aiBlockedMessage } = useSaaS()

const to = ref('')
const jobTitle = ref('')
const jobDescription = ref('')
const subject = ref('')
const bodyText = ref('')
const attachResume = ref(true)
const attachCoverLetter = ref(false)
const resumeSource = ref<'builder' | 'upload'>('builder')
const coverLetterSource = ref<'builder' | 'upload'>('builder')

const resumeDoc = ref<UserDocumentSummary | null>(null)
const coverLetterDoc = ref<UserDocumentSummary | null>(null)
const uploadedResumeFile = ref<File | null>(null)
const uploadedCoverLetterFile = ref<File | null>(null)

const templates = ref<ApplyEmailTemplate[]>([])
const selectedTemplateId = ref('')
const templateName = ref('')

const sending = ref(false)
const generating = ref(false)
const uploading = ref<'resume' | 'cover_letter' | null>(null)
const error = ref<string | null>(null)
const success = ref(false)
const copied = ref(false)

const resumeFileInput = ref<HTMLInputElement | null>(null)
const coverLetterFileInput = ref<HTMLInputElement | null>(null)

const hasBuilderCoverLetter = computed(() => !!props.resumeData.coverLetter?.content)

async function loadDocuments() {
  try {
    const data = await $fetch<{ resume: UserDocumentSummary | null; coverLetter: UserDocumentSummary | null }>(
      '/api/documents',
    )
    resumeDoc.value = data.resume
    coverLetterDoc.value = data.coverLetter
  } catch {
    resumeDoc.value = null
    coverLetterDoc.value = null
  }
}

function resetFormFromResume() {
  error.value = null
  success.value = false
  copied.value = false

  const candidateName = props.resumeData.personalInfo?.fullName || ''
  jobTitle.value =
    props.resumeData.personalInfo?.jobTitle ||
    props.resumeData.targetJobDescription?.split('\n')[0]?.slice(0, 80) ||
    ''
  jobDescription.value = props.resumeData.targetJobDescription || ''

  subject.value = jobTitle.value
    ? `Application for ${jobTitle.value} — ${candidateName}`
    : `Job Application — ${candidateName}`

  bodyText.value = `Dear Hiring Team,

I am writing to express my interest in the ${jobTitle.value || 'role'}. Please find my resume${hasBuilderCoverLetter.value ? ' and cover letter' : ''} attached.

Thank you for your time and consideration.

Best regards,
${candidateName}`

  attachResume.value = true
  attachCoverLetter.value = hasBuilderCoverLetter.value
  resumeSource.value = resumeDoc.value ? 'upload' : 'builder'
  coverLetterSource.value =
    hasBuilderCoverLetter.value ? 'builder' : coverLetterDoc.value ? 'upload' : 'builder'
}

function refreshTemplates() {
  templates.value = loadApplyEmailTemplates(sessionUser.value?.id)
}

async function initForm() {
  refreshTemplates()
  selectedTemplateId.value = ''
  templateName.value = ''
  uploadedResumeFile.value = null
  uploadedCoverLetterFile.value = null
  await loadDocuments()
  resetFormFromResume()
}

watch(
  () => props.resumeData,
  () => {
    void initForm()
  },
  { immediate: true },
)

function applyTemplate(tpl: ApplyEmailTemplate | string) {
  const template = typeof tpl === 'string' ? templates.value.find((t) => t.id === tpl) : tpl
  if (!template) return
  selectedTemplateId.value = template.id
  templateName.value = template.name
  jobTitle.value = template.jobTitle
  jobDescription.value = template.jobDescription
  subject.value = template.subject
  bodyText.value = template.bodyText
  attachResume.value = template.attachResume
  attachCoverLetter.value = template.attachCoverLetter
  resumeSource.value = template.resumeSource
  coverLetterSource.value = template.coverLetterSource
  toast.info(`Loaded "${template.name}"`)
}

function saveTemplate() {
  const name = templateName.value.trim() || jobTitle.value.trim() || 'Application email'
  templates.value = upsertApplyEmailTemplate(
    {
      id: selectedTemplateId.value || undefined,
      name,
      jobTitle: jobTitle.value,
      jobDescription: jobDescription.value,
      subject: subject.value,
      bodyText: bodyText.value,
      attachResume: attachResume.value,
      attachCoverLetter: attachCoverLetter.value,
      resumeSource: resumeSource.value,
      coverLetterSource: coverLetterSource.value,
    },
    sessionUser.value?.id,
  )
  const saved = templates.value.find((t) => t.id === selectedTemplateId.value) || templates.value[0]
  if (saved) {
    selectedTemplateId.value = saved.id
    templateName.value = saved.name
    emit('saved', saved)
  }
  toast.success('Email saved')
  return saved
}

function removeTemplate() {
  if (!selectedTemplateId.value) return
  templates.value = deleteApplyEmailTemplate(selectedTemplateId.value, sessionUser.value?.id)
  selectedTemplateId.value = ''
  templateName.value = ''
  toast.success('Saved email deleted')
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

async function uploadDocument(type: 'resume' | 'cover_letter', file: File) {
  uploading.value = type
  error.value = null
  try {
    const form = new FormData()
    form.append('type', type)
    form.append('file', file)
    await $fetch('/api/documents', { method: 'POST', body: form })
    await loadDocuments()
    if (type === 'resume') {
      uploadedResumeFile.value = file
      resumeSource.value = 'upload'
    } else {
      uploadedCoverLetterFile.value = file
      coverLetterSource.value = 'upload'
    }
    toast.success(type === 'resume' ? 'CV uploaded' : 'Cover letter uploaded')
  } catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string }; message?: string }
    error.value = fetchError.data?.statusMessage || fetchError.message || 'Upload failed'
  } finally {
    uploading.value = null
  }
}

async function onResumeFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadedResumeFile.value = file
  resumeSource.value = 'upload'
  attachResume.value = true
  await uploadDocument('resume', file)
}

async function onCoverLetterFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadedCoverLetterFile.value = file
  coverLetterSource.value = 'upload'
  attachCoverLetter.value = true
  await uploadDocument('cover_letter', file)
}

async function generateEmail() {
  if (!canAccessAI.value) {
    toast.info(aiBlockedMessage() || 'Pro subscription required for AI.')
    return
  }
  if (!jobTitle.value.trim() && !jobDescription.value.trim()) {
    error.value = 'Add a job title and/or job description first.'
    return
  }
  generating.value = true
  error.value = null
  try {
    const result = await $fetch<{ subject: string; bodyText: string }>('/api/apply/generate-email', {
      method: 'POST',
      body: {
        jobTitle: jobTitle.value.trim(),
        jobDescription: jobDescription.value.trim(),
        resumeData: props.resumeData,
        rawResumeText: resumeDoc.value?.contentText || '',
        coverLetterText: coverLetterDoc.value?.contentText || stripHtml(props.resumeData.coverLetter?.content),
      },
    })
    subject.value = result.subject
    bodyText.value = result.bodyText
    toast.success('Email generated (1 credit used)')
    await refreshCredits()
  } catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string }; message?: string }
    error.value = fetchError.data?.statusMessage || fetchError.message || 'Failed to generate email'
  } finally {
    generating.value = false
  }
}

function stripHtml(html?: string | null) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function copyEmail() {
  const text = `Subject: ${subject.value}\n\n${bodyText.value}`
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    toast.success('Email copied to clipboard')
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    toast.error('Could not copy — select and copy manually')
  }
}

async function handleSend() {
  if (!to.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.value)) {
    error.value = 'Please enter a valid recipient email.'
    return
  }
  if (!subject.value.trim() || !bodyText.value.trim()) {
    error.value = 'Subject and message are required.'
    return
  }
  if (!attachResume.value && !attachCoverLetter.value) {
    error.value = 'Attach at least one document.'
    return
  }
  if (attachResume.value && resumeSource.value === 'upload' && !uploadedResumeFile.value && !resumeDoc.value) {
    error.value = 'Upload a CV or switch resume attachment to builder PDF.'
    return
  }
  if (
    attachCoverLetter.value &&
    coverLetterSource.value === 'upload' &&
    !uploadedCoverLetterFile.value &&
    !coverLetterDoc.value
  ) {
    error.value = 'Upload a cover letter or switch to builder PDF.'
    return
  }
  if (attachCoverLetter.value && coverLetterSource.value === 'builder' && !hasBuilderCoverLetter.value) {
    error.value = 'Create a cover letter in the builder or attach an uploaded file.'
    return
  }

  sending.value = true
  error.value = null

  try {
    const payload: Record<string, unknown> = {
      to: to.value.trim(),
      subject: subject.value.trim(),
      bodyText: bodyText.value.trim(),
      resume: props.resumeData,
      coverLetter: props.resumeData.coverLetter,
      attachResume: attachResume.value,
      attachCoverLetter: attachCoverLetter.value,
      resumeSource: resumeSource.value,
      coverLetterSource: coverLetterSource.value,
    }

    if (attachResume.value && resumeSource.value === 'upload') {
      const file = uploadedResumeFile.value
      if (file) {
        payload.uploadedResume = { filename: file.name, content: await fileToBase64(file) }
      }
    }
    if (attachCoverLetter.value && coverLetterSource.value === 'upload') {
      const file = uploadedCoverLetterFile.value
      if (file) {
        payload.uploadedCoverLetter = { filename: file.name, content: await fileToBase64(file) }
      }
    }

    await $fetch('/api/apply/email', { method: 'POST', body: payload })

    success.value = true
    toast.success('Application email sent (1 credit used)')
    await refreshCredits()
    if (props.variant === 'modal') {
      setTimeout(() => emit('close'), 2000)
    }
  } catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string }; message?: string }
    error.value = fetchError.data?.statusMessage || fetchError.message || 'Failed to send email'
  } finally {
    sending.value = false
  }
}

const resumeAttachmentLabel = computed(() => {
  if (resumeSource.value === 'builder') return 'Builder PDF (from current resume)'
  return uploadedResumeFile.value?.name || resumeDoc.value?.originalName || 'Uploaded CV'
})

const coverAttachmentLabel = computed(() => {
  if (coverLetterSource.value === 'builder') return 'Builder PDF (cover letter draft)'
  return uploadedCoverLetterFile.value?.name || coverLetterDoc.value?.originalName || 'Uploaded cover letter'
})

defineExpose({
  applyTemplate,
  saveTemplate,
  refreshTemplates,
  initForm,
})
</script>

<template>
  <div class="space-y-5">
    <div v-if="success" class="flex flex-col items-center justify-center py-10 text-center">
      <div class="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mb-4">
        <CheckCircle :size="32" />
      </div>
      <h3 class="text-lg font-bold text-white mb-1">Email Sent</h3>
      <p class="text-sm text-slate-400">Delivered to {{ to }}</p>
    </div>

    <template v-else>
      <div v-if="error" class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs flex items-center gap-3">
        <AlertCircle :size="16" class="shrink-0" />
        <span>{{ error }}</span>
      </div>

      <!-- Quick load in modal only -->
      <div v-if="variant === 'modal' && templates.length" class="rounded-xl border border-slate-800 bg-slate-950/30 p-4 space-y-3">
        <p class="text-[10px] uppercase tracking-wider font-bold text-slate-500">Load saved email</p>
        <select
          v-model="selectedTemplateId"
          class="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none cursor-pointer"
          @change="selectedTemplateId && applyTemplate(selectedTemplateId)"
        >
          <option value="" class="bg-slate-900">Choose a saved email…</option>
          <option v-for="tpl in templates" :key="tpl.id" :value="tpl.id" class="bg-slate-900">
            {{ tpl.name }}
          </option>
        </select>
      </div>

      <!-- Job context -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="sm:col-span-2 flex flex-col">
          <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Job title</label>
          <input
            v-model="jobTitle"
            type="text"
            class="w-full bg-slate-950/40 border border-slate-700/80 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
            placeholder="Senior Frontend Engineer"
          />
        </div>
        <div class="sm:col-span-2 flex flex-col">
          <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Job description</label>
          <textarea
            v-model="jobDescription"
            rows="4"
            class="w-full bg-slate-950/40 border border-slate-700/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white outline-none resize-y min-h-[88px]"
            placeholder="Paste the job description to tailor the email…"
          />
        </div>
      </div>

      <button
        type="button"
        :disabled="generating"
        class="w-full py-2.5 rounded-xl border border-indigo-500/40 bg-indigo-500/15 text-indigo-200 hover:bg-indigo-500/25 text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        @click="generateEmail"
      >
        <Loader2 v-if="generating" class="animate-spin" :size="14" />
        <Sparkles v-else :size="14" />
        {{ generating ? 'Generating…' : 'Generate email with AI (1 Cr)' }}
      </button>

      <!-- Email fields -->
      <div class="space-y-4 border-t border-slate-800 pt-4">
        <div class="flex flex-col">
          <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Recipient (To)</label>
          <input
            v-model="to"
            type="email"
            class="w-full bg-slate-950/40 border border-slate-700/80 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
            placeholder="hiring@company.com"
          />
        </div>
        <div class="flex flex-col">
          <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Subject</label>
          <input
            v-model="subject"
            type="text"
            class="w-full bg-slate-950/40 border border-slate-700/80 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
          />
        </div>
        <div class="flex flex-col">
          <div class="flex items-center justify-between mb-1">
            <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider">Message</label>
            <button
              type="button"
              class="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
              @click="copyEmail"
            >
              <Copy :size="12" />
              {{ copied ? 'Copied' : 'Copy email' }}
            </button>
          </div>
          <textarea
            v-model="bodyText"
            rows="7"
            class="w-full bg-slate-950/40 border border-slate-700/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white outline-none resize-y font-sans"
          />
        </div>
      </div>

      <!-- Attachments -->
      <div class="space-y-3 border-t border-slate-800 pt-4">
        <p class="text-xs uppercase font-semibold text-slate-400 tracking-wider">Attachments</p>

        <div class="rounded-xl border border-slate-800 p-3 space-y-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="attachResume" type="checkbox" class="rounded border-slate-700 text-emerald-500 w-4 h-4" />
            <span class="text-xs font-semibold text-white">Attach resume / CV</span>
          </label>
          <div class="flex flex-wrap gap-2 pl-6">
            <label class="inline-flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
              <input v-model="resumeSource" type="radio" value="builder" class="text-emerald-500" />
              Builder PDF
            </label>
            <label class="inline-flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
              <input v-model="resumeSource" type="radio" value="upload" class="text-emerald-500" />
              Upload file
            </label>
          </div>
          <div v-if="resumeSource === 'upload'" class="pl-6 flex items-center gap-2 flex-wrap">
            <input ref="resumeFileInput" type="file" class="hidden" accept=".pdf,.doc,.docx,.txt" @change="onResumeFile" />
            <button
              type="button"
              class="text-[11px] px-3 py-1.5 rounded-lg border border-slate-700 hover:border-emerald-500/50 inline-flex items-center gap-1.5 cursor-pointer"
              :disabled="uploading === 'resume'"
              @click="resumeFileInput?.click()"
            >
              <Loader2 v-if="uploading === 'resume'" class="animate-spin" :size="12" />
              <Upload v-else :size="12" />
                    Upload CV
                  </button>
                  <span class="text-[10px] text-slate-500">Max 3 pages</span>
            <span v-if="resumeAttachmentLabel" class="text-[10px] text-slate-400 truncate max-w-[200px] inline-flex items-center gap-1">
              <FileText :size="12" class="text-emerald-400 shrink-0" />
              {{ resumeAttachmentLabel }}
            </span>
          </div>
        </div>

        <div class="rounded-xl border border-slate-800 p-3 space-y-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="attachCoverLetter" type="checkbox" class="rounded border-slate-700 text-emerald-500 w-4 h-4" />
            <span class="text-xs font-semibold text-white">Attach cover letter</span>
          </label>
          <div class="flex flex-wrap gap-2 pl-6">
            <label
              class="inline-flex items-center gap-1.5 text-[11px] cursor-pointer"
              :class="hasBuilderCoverLetter ? 'text-slate-300' : 'text-slate-500'"
            >
              <input
                v-model="coverLetterSource"
                type="radio"
                value="builder"
                :disabled="!hasBuilderCoverLetter"
                class="text-emerald-500"
              />
              Builder PDF
            </label>
            <label class="inline-flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
              <input v-model="coverLetterSource" type="radio" value="upload" class="text-emerald-500" />
              Upload file
            </label>
          </div>
          <div v-if="coverLetterSource === 'upload'" class="pl-6 flex items-center gap-2 flex-wrap">
            <input ref="coverLetterFileInput" type="file" class="hidden" accept=".pdf,.doc,.docx,.txt" @change="onCoverLetterFile" />
            <button
              type="button"
              class="text-[11px] px-3 py-1.5 rounded-lg border border-slate-700 hover:border-emerald-500/50 inline-flex items-center gap-1.5 cursor-pointer"
              :disabled="uploading === 'cover_letter'"
              @click="coverLetterFileInput?.click()"
            >
              <Loader2 v-if="uploading === 'cover_letter'" class="animate-spin" :size="12" />
              <Upload v-else :size="12" />
                    Upload cover letter
                  </button>
                  <span class="text-[10px] text-slate-500">Max 3 pages</span>
            <span v-if="coverAttachmentLabel" class="text-[10px] text-slate-400 truncate max-w-[200px] inline-flex items-center gap-1">
              <FileText :size="12" class="text-emerald-400 shrink-0" />
              {{ coverAttachmentLabel }}
            </span>
          </div>
        </div>
      </div>

      <!-- Page: save name + save button -->
      <div v-if="variant === 'page'" class="rounded-xl border border-slate-800 bg-slate-950/30 p-4 space-y-3">
        <p class="text-[10px] uppercase tracking-wider font-bold text-slate-500">Save this email</p>
        <div class="flex flex-col sm:flex-row gap-2">
          <input
            v-model="templateName"
            type="text"
            placeholder="Email name (e.g. Frontend role at Acme)"
            class="flex-1 min-w-0 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none"
          />
          <button
            type="button"
            class="shrink-0 px-4 py-2 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            @click="saveTemplate"
          >
            <Save :size="14" />
            Save email
          </button>
        </div>
      </div>

      <div class="flex flex-wrap justify-end gap-2 pt-2 border-t border-slate-800">
        <button
          v-if="variant === 'modal'"
          type="button"
          :disabled="sending || generating"
          class="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950/60 text-xs font-semibold text-slate-200 hover:bg-slate-800 cursor-pointer disabled:opacity-40"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          type="button"
          :disabled="sending || generating"
          class="px-4 py-2.5 rounded-xl border border-slate-600 text-xs font-semibold text-slate-200 hover:bg-slate-800 inline-flex items-center gap-2 cursor-pointer disabled:opacity-40"
          @click="copyEmail"
        >
          <Copy :size="14" />
          Copy
        </button>
        <button
          type="button"
          :disabled="sending || generating"
          class="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 inline-flex items-center gap-2 cursor-pointer disabled:opacity-40"
          @click="handleSend"
        >
          <Loader2 v-if="sending" class="animate-spin" :size="14" />
          <Sparkles v-else :size="14" />
          {{ sending ? 'Sending…' : 'Send (1 Cr)' }}
        </button>
      </div>
    </template>
  </div>
</template>
