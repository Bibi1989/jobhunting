<script setup lang="ts">
import {
  FileText,
  Loader2,
  ArrowLeft,
  Sparkles,
  FileUp,
  Trash2,
} from 'lucide-vue-next'
import {
  guessTitleFromJobDescription,
  persistApplyPrefill,
} from '~/utils/builderJobPrefill'

const { t } = useI18n()

useHead({
  title: () => t('applyPage.title'),
})

const APPLY_DRAFT_STORAGE_KEY = 'jobflow-apply-draft'

const jobDescription = ref('')
const resumeFile = ref<File | null>(null)
const coverLetterFile = ref<File | null>(null)
const dragging = ref<'resume' | 'coverLetter' | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(() => {
  if (!import.meta.client) return
  try {
    const raw = sessionStorage.getItem(APPLY_DRAFT_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as { description?: string }
    if (typeof parsed.description === 'string' && parsed.description.trim()) {
      jobDescription.value = parsed.description
    }
  } catch {
    /* ignore */
  }
})

watch(
  jobDescription,
  (value) => {
    if (!import.meta.client) return
    try {
      const trimmed = value.trim()
      if (!trimmed) {
        sessionStorage.removeItem(APPLY_DRAFT_STORAGE_KEY)
        return
      }
      sessionStorage.setItem(APPLY_DRAFT_STORAGE_KEY, JSON.stringify({ description: value }))
    } catch {
      /* ignore quota */
    }
  },
  { flush: 'post' },
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
    error.value = t('applyPage.errorPdfOnly')
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
    error.value = t('applyPage.errorMinDescription')
    return
  }

  loading.value = true
  error.value = null

  try {
    const description = jobDescription.value.trim()
    const title = guessTitleFromJobDescription(description)

    persistApplyPrefill({
      description,
      title,
      resumeFile: resumeFile.value,
      resumeName: resumeFile.value?.name,
    })

    if (resumeFile.value) {
      try {
        const form = new FormData()
        form.append('type', 'resume')
        form.append('file', resumeFile.value)
        await $fetch('/api/documents', { method: 'POST', body: form })
      } catch {
        // Not signed in or upload failed — builder still gets the in-memory File.
      }
    }

    await navigateTo({
      path: '/builder/resume/new',
      query: { from: 'apply' },
    })
  } catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string }; message?: string }
    error.value =
      fetchError.data?.statusMessage || fetchError.message || t('applyPage.errorOpenBuilder')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 py-8 md:py-12">
    <div class="mx-auto max-w-[1400px] px-4 md:px-6">
      <div class="mb-10 flex flex-wrap items-start justify-between gap-4 border-b border-slate-900 pb-8">
        <div>
          <NuxtLink
            to="/scraper"
            class="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft :size="14" /> {{ t('applyPage.backToScraper') }}
          </NuxtLink>
          <div class="mb-4">
            <AppLogo />
          </div>
          <h1 class="text-3xl font-extrabold tracking-tight md:text-4xl">
            {{ t('applyPage.titleDocument') }} <span class="text-gradient">{{ t('applyPage.titleAccent') }}</span>
          </h1>
          <p class="mt-2 max-w-2xl text-sm text-slate-400">
            {{ t('applyPage.subtitle') }}
          </p>
        </div>
      </div>

      <ExtensionInstallBanner class="mb-6" />

      <div class="grid gap-8 lg:grid-cols-12 items-start">
        <section class="lg:col-span-5 space-y-6 glass-panel rounded-3xl p-6 relative overflow-hidden group">
          <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-500" />

          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-indigo-400 select-none">
              {{ t('applyPage.jobDescription') }}
            </label>
            <textarea
              v-model="jobDescription"
              rows="12"
              :placeholder="t('applyPage.jobDescPlaceholder')"
              class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-2xl px-4 py-3.5 text-slate-100 text-sm leading-relaxed outline-none transition-all duration-300 focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 placeholder:text-slate-650"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <p class="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400 select-none">
                {{ t('applyPage.resumePdf') }}
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
                  {{ resumeFile?.name || t('applyPage.dropOrBrowse') }}
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
                <Trash2 :size="12" /> {{ t('applyPage.removeResume') }}
              </button>
            </div>

            <div>
              <p class="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400 select-none">
                {{ t('applyPage.coverLetterPdf') }}
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
                  {{ coverLetterFile?.name || t('applyPage.optionalPdf') }}
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
                <Trash2 :size="12" /> {{ t('applyPage.removeCoverLetter') }}
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
            {{ loading ? t('applyPage.preparing') : t('applyPage.generateTailored') }}
          </button>
          <p class="text-[11px] text-slate-500 text-center">
            {{ t('applyPage.creditHint') }}
          </p>
        </section>

        <section class="lg:col-span-7">
          <div
            class="flex min-h-[34rem] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-850 bg-slate-900/10 px-6 text-center text-slate-500"
          >
            <div
              v-if="loading"
              class="flex flex-col items-center gap-4 text-sm text-slate-400"
            >
              <Loader2 class="animate-spin text-indigo-400" :size="28" />
              <span>{{ t('applyPage.preparing') }}</span>
            </div>
            <template v-else>
              <div class="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mb-4">
                <FileText :size="24" class="text-slate-400" />
              </div>
              <p class="text-sm font-bold text-slate-400 select-none">{{ t('applyPage.ready') }}</p>
              <p class="mt-1 max-w-sm text-xs leading-relaxed">
                {{ t('applyPage.readyHint') }}
              </p>
              <ol class="mt-6 text-left text-xs text-slate-500 space-y-2 max-w-sm">
                <li>{{ t('applyPage.step1') }}</li>
                <li>{{ t('applyPage.step2') }}</li>
                <li>{{ t('applyPage.step3') }}</li>
              </ol>
            </template>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
