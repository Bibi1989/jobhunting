<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import {
  FileText,
  Loader2,
  Copy,
  Check,
  ArrowLeft,
  Sparkles,
  FileUp,
  Trash2,
} from 'lucide-vue-next'

useHead({
  title: 'Document Generator',
})

interface ApplyResponse {
  resume: string
  coverLetter: string
  mode?: 'pdf' | 'template'
  model?: string
}

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
})

const jobDescription = ref('')
const resumeFile = ref<File | null>(null)
const coverLetterFile = ref<File | null>(null)
const dragging = ref<'resume' | 'coverLetter' | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const result = ref<ApplyResponse | null>(null)
const copied = ref<'resume' | 'coverLetter' | null>(null)
const selectedFormat = ref('the-corporate')

const resumeHtml = computed(() => (result.value?.resume ? md.render(result.value.resume) : ''))
const coverLetterHtml = computed(() =>
  result.value?.coverLetter ? md.render(result.value.coverLetter) : '',
)

const canGenerate = computed(() => jobDescription.value.trim().length >= 40)

function onFileSelect(event: Event, kind: 'resume' | 'coverLetter') {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) assignFile(file, kind)
  input.value = ''
}

function assignFile(file: File, kind: 'resume' | 'coverLetter') {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    error.value = 'Please upload a PDF file.'
    return
  }
  error.value = null
  if (kind === 'resume') resumeFile.value = file
  else coverLetterFile.value = file
}

function onDrop(event: DragEvent, kind: 'resume' | 'coverLetter') {
  event.preventDefault()
  dragging.value = null
  const file = event.dataTransfer?.files?.[0]
  if (file) assignFile(file, kind)
}

function removeFile(kind: 'resume' | 'coverLetter') {
  if (kind === 'resume') resumeFile.value = null
  else coverLetterFile.value = null
}

async function generate() {
  if (!canGenerate.value) {
    error.value = 'Paste a job description (at least a short posting).'
    return
  }

  loading.value = true
  error.value = null
  result.value = null

  try {
    const form = new FormData()
    form.append('jobDescription', jobDescription.value.trim())
    if (resumeFile.value) form.append('userResume', resumeFile.value)
    if (coverLetterFile.value) form.append('userCoverLetter', coverLetterFile.value)

    const data = await $fetch<ApplyResponse>('/api/apply', {
      method: 'POST',
      body: form,
    })

    result.value = data
  } catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string }; message?: string }
    error.value =
      fetchError.data?.statusMessage || fetchError.message || 'Generation failed'
  } finally {
    loading.value = false
  }
}

async function copyText(kind: 'resume' | 'coverLetter') {
  const text = kind === 'resume' ? result.value?.resume : result.value?.coverLetter
  if (!text) return
  await navigator.clipboard.writeText(text)
  copied.value = kind
  setTimeout(() => {
    if (copied.value === kind) copied.value = null
  }, 1600)
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 py-8 md:py-12">
    <div class="mx-auto max-w-[1400px] px-4 md:px-6">
      <div class="mb-10 flex flex-wrap items-start justify-between gap-4 border-b border-slate-900 pb-8">
        <div>
          <NuxtLink
            to="/"
            class="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft :size="14" /> Back to scraper
          </NuxtLink>
          <h1 class="text-3xl font-extrabold tracking-tight md:text-4xl">
            Document <span class="text-gradient">Generator</span>
          </h1>
          <p class="mt-2 max-w-2xl text-sm text-slate-400">
            Paste a job description, upload your PDF resume, and generate tailored documents that keep your roles and projects aligned.
          </p>
        </div>
        <!-- <div
          class="rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm px-5 py-4 text-xs text-slate-400 shadow-lg"
        >
          <div class="flex items-center gap-2 mb-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>PDF Mode: <strong class="text-emerald-400 font-mono">gemini-3.1-pro-preview</strong></span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span>Text Mode: <strong class="text-sky-400 font-mono">gemini-2.5-flash-lite</strong></span>
          </div>
        </div> -->
      </div>

      <div class="grid gap-8 lg:grid-cols-12 items-start">
        <section class="lg:col-span-5 space-y-6 glass-panel rounded-3xl p-6 relative overflow-hidden group">
          <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-indigo-400 select-none">
              Job Description
            </label>
            <textarea
              v-model="jobDescription"
              rows="12"
              placeholder="Paste the full job posting details here..."
              class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-2xl px-4 py-3.5 text-slate-100 text-sm leading-relaxed outline-none transition-all duration-300 focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 placeholder:text-slate-650"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <p class="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400 select-none">
                Resume PDF
              </p>
              <label
                class="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center transition-all duration-300"
                :class="
                  dragging === 'resume'
                    ? 'border-indigo-500 bg-indigo-950/20'
                    : 'border-slate-800 bg-slate-950/30 hover:border-slate-700 hover:bg-slate-900/20'
                "
                @dragover.prevent="dragging = 'resume'"
                @dragleave.prevent="dragging = null"
                @drop="onDrop($event, 'resume')"
              >
                <FileUp :size="20" class="mb-2 text-slate-500" />
                <span class="text-[11px] font-medium text-slate-300 leading-snug truncate max-w-full">
                  {{ resumeFile?.name || 'Drop PDF or Browse' }}
                </span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  class="hidden"
                  @change="onFileSelect($event, 'resume')"
                />
              </label>
              <button
                v-if="resumeFile"
                type="button"
                class="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors"
                @click="removeFile('resume')"
              >
                <Trash2 :size="12" /> Remove Resume
              </button>
            </div>

            <div>
              <p class="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400 select-none">
                Cover Letter PDF
              </p>
              <label
                class="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center transition-all duration-300"
                :class="
                  dragging === 'coverLetter'
                    ? 'border-indigo-500 bg-indigo-950/20'
                    : 'border-slate-800 bg-slate-950/30 hover:border-slate-700 hover:bg-slate-900/20'
                "
                @dragover.prevent="dragging = 'coverLetter'"
                @dragleave.prevent="dragging = null"
                @drop="onDrop($event, 'coverLetter')"
              >
                <FileUp :size="20" class="mb-2 text-slate-500" />
                <span class="text-[11px] font-medium text-slate-300 leading-snug truncate max-w-full">
                  {{ coverLetterFile?.name || 'Optional PDF' }}
                </span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  class="hidden"
                  @change="onFileSelect($event, 'coverLetter')"
                />
              </label>
              <button
                v-if="coverLetterFile"
                type="button"
                class="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors"
                @click="removeFile('coverLetter')"
              >
                <Trash2 :size="12" /> Remove Cover Letter
              </button>
            </div>
          </div>

          <div
            v-if="error"
            class="rounded-xl border border-red-500/20 bg-red-950/20 px-3.5 py-2.5 text-xs text-red-300"
          >
            {{ error }}
          </div>

          <button
            type="button"
            :disabled="loading || !canGenerate"
            class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-300 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/30 disabled:opacity-40 disabled:pointer-events-none hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            @click="generate"
          >
            <Loader2 v-if="loading" class="animate-spin" :size="18" />
            <Sparkles v-else :size="18" />
            {{ loading ? 'Generating Tailored Materials...' : 'Generate Tailored Materials' }}
          </button>
        </section>

        <section class="lg:col-span-7 space-y-4">
          <div
            v-if="!result && !loading"
            class="flex min-h-[34rem] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-850 bg-slate-900/10 px-6 text-center text-slate-500"
          >
            <div class="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mb-4">
              <FileText :size="24" class="text-slate-400" />
            </div>
            <p class="text-sm font-bold text-slate-400 select-none">No Previews Generated</p>
            <p class="mt-1 max-w-sm text-xs leading-relaxed">
              Your tailored resume and cover letter output previews will display here after extraction and processing.
            </p>
          </div>

          <div
            v-else-if="loading"
            class="flex min-h-[34rem] items-center justify-center rounded-3xl border border-slate-850 bg-slate-900/30 backdrop-blur-sm"
          >
            <div class="flex flex-col items-center gap-4 text-sm text-slate-400">
              <Loader2 class="animate-spin text-indigo-400" :size="28" />
              <span>
                {{
                  resumeFile
                    ? 'Reading PDF and drafting full tailored CV...'
                    : 'Analyzing role details with Gemini...'
                }}
              </span>
            </div>
          </div>

          <div v-else class="space-y-6">
            <p v-if="result?.model" class="text-xs text-slate-500 select-none">
              Engine model: <span class="font-mono text-slate-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{{ result.model }}</span>
              <span v-if="result.mode" class="ml-2 font-semibold">· Mode: {{ result.mode }}</span>
            </p>

            <div class="glass-panel rounded-3xl p-5 border border-slate-850/60">
              <CvFormatPicker v-model="selectedFormat" />
            </div>

            <div class="grid gap-6 xl:grid-cols-2">
              <article class="overflow-hidden rounded-2xl border border-slate-850 bg-slate-900/40 backdrop-blur-sm shadow-xl flex flex-col">
                <div class="flex items-center justify-between gap-2 border-b border-slate-850/80 px-4 py-3 bg-slate-900/60">
                  <h2 class="text-xs font-bold uppercase tracking-widest text-indigo-400">Cover Letter</h2>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-xl border border-slate-850 bg-slate-950/40 px-3 py-1.5 text-[11px] font-bold text-slate-300 hover:border-indigo-500 hover:text-white transition-all duration-300 cursor-pointer"
                    @click="copyText('coverLetter')"
                  >
                    <Check v-if="copied === 'coverLetter'" :size="12" class="text-emerald-400" />
                    <Copy v-else :size="12" />
                    {{ copied === 'coverLetter' ? 'Copied' : 'Copy' }}
                  </button>
                </div>
                <div
                  class="doc-preview max-h-[32rem] overflow-y-auto bg-white p-6 md:p-8 text-slate-800 border-t border-slate-100 shadow-inner select-text"
                  v-html="coverLetterHtml"
                />
              </article>

              <article class="overflow-hidden rounded-2xl border border-slate-850 bg-slate-900/40 backdrop-blur-sm shadow-xl flex flex-col">
                <div class="flex items-center justify-between gap-2 border-b border-slate-850/80 px-4 py-3 bg-slate-900/60">
                  <h2 class="text-xs font-bold uppercase tracking-widest text-indigo-400">Tailored Resume</h2>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-xl border border-slate-850 bg-slate-950/40 px-3 py-1.5 text-[11px] font-bold text-slate-300 hover:border-indigo-500 hover:text-white transition-all duration-300 cursor-pointer"
                    @click="copyText('resume')"
                  >
                    <Check v-if="copied === 'resume'" :size="12" class="text-emerald-400" />
                    <Copy v-else :size="12" />
                    {{ copied === 'resume' ? 'Copied' : 'Copy' }}
                  </button>
                </div>
                <div class="doc-preview max-h-[32rem] overflow-y-auto bg-white border-t border-slate-100 shadow-inner select-text p-0">
                  <ResumeThemeRenderer :markdown="result?.resume || ''" :format-id="selectedFormat" />
                </div>
              </article>
            </div>
          </div>>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.doc-preview {
  font-family: 'Plus Jakarta Sans', Georgia, serif;
  line-height: 1.6;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.02);
}

.doc-preview :deep(h1) {
  margin: 0 0 0.5rem;
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  text-align: center;
}

.doc-preview :deep(h2) {
  margin: 1.25rem 0 0.5rem;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.25rem;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #4f46e5;
}

.doc-preview :deep(h3) {
  margin: 0.85rem 0 0.25rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
}

.doc-preview :deep(p),
.doc-preview :deep(li) {
  margin: 0.35rem 0;
  font-size: 0.85rem;
  color: #334155;
}

.doc-preview :deep(ul) {
  margin: 0.25rem 0 0.75rem;
  padding-left: 1.25rem;
  list-style-type: disc;
}

.doc-preview :deep(em) {
  color: #64748b;
  font-style: italic;
}

.doc-preview :deep(strong) {
  color: #0f172a;
  font-weight: 700;
}
</style>

