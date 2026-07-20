<script setup lang="ts">
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-vue-next'
import type {
  ApplicationFormExtract,
  ApplicationQuestion,
  Job,
  UserDocumentSummary,
} from '~/shared/types/job'
import { downloadTextFile, slugifyFilename } from '~/utils/download'

const props = defineProps<{
  job: Job
  resume: UserDocumentSummary | null
  coverLetter: UserDocumentSummary | null
  resumeText: string
  coverLetterText: string
}>()

const emit = defineEmits<{
  apply: []
}>()

const loading = ref(false)
const answering = ref(false)
const error = ref<string | null>(null)
const copiedId = ref<string | null>(null)
const copiedAll = ref(false)
const form = ref<ApplicationFormExtract | null>(null)

const answeredCount = computed(
  () => form.value?.questions.filter((q) => q.answer?.trim()).length || 0,
)

function isTechnicalQuestion(question: ApplicationQuestion): boolean {
  const hay = `${question.label} ${question.section || ''} ${question.helpText || ''}`.toLowerCase()
  return /tech|stack|architect|system|design|coding|algorithm|cloud|kubernetes|api|database|experience|project|challenge|accomplish|skill|framework|language|devops|frontend|backend|full.?stack|debug|scale|performance|security|test/i.test(
    hay,
  )
}

async function loadForm(withAnswers = true) {
  loading.value = true
  error.value = null

  try {
    const data = await $fetch<{ form: ApplicationFormExtract }>('/api/application/extract', {
      method: 'POST',
      body: {
        job: props.job,
        jobId: props.job.id,
        answer: withAnswers,
        resumeText: props.resumeText || props.resume?.contentText,
        coverLetterText: props.coverLetterText || props.coverLetter?.contentText,
      },
    })
    form.value = data.form
  } catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string }; message?: string }
    error.value =
      fetchError.data?.statusMessage || fetchError.message || 'Failed to extract application form'
  } finally {
    loading.value = false
  }
}

async function regenerateAnswers() {
  if (!form.value?.questions.length) return

  answering.value = true
  error.value = null

  try {
    const data = await $fetch<{ questions: ApplicationQuestion[] }>('/api/application/answer', {
      method: 'POST',
      body: {
        job: props.job,
        jobId: props.job.id,
        questions: form.value.questions,
        resumeText: props.resumeText || props.resume?.contentText,
        coverLetterText: props.coverLetterText || props.coverLetter?.contentText,
      },
    })
    form.value = {
      ...form.value,
      questions: data.questions,
    }
  } catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string }; message?: string }
    error.value =
      fetchError.data?.statusMessage || fetchError.message || 'Failed to generate answers'
  } finally {
    answering.value = false
  }
}

async function copyAnswer(question: ApplicationQuestion) {
  if (!question.answer?.trim()) return
  await navigator.clipboard.writeText(question.answer)
  copiedId.value = question.id
  setTimeout(() => {
    if (copiedId.value === question.id) copiedId.value = null
  }, 1600)
}

async function copyAllAnswers() {
  if (!form.value?.questions.length) return
  const text = form.value.questions
    .filter((q) => q.answer?.trim())
    .map((q, i) => `${i + 1}. ${q.label}\n${q.answer}`)
    .join('\n\n')
  if (!text.trim()) return
  await navigator.clipboard.writeText(text)
  copiedAll.value = true
  setTimeout(() => {
    copiedAll.value = false
  }, 1600)
}

function exportAnswers() {
  if (!form.value) return
  const lines = form.value.questions.map((q, i) => {
    return `## ${i + 1}. ${q.label}${q.required ? ' *' : ''}\nType: ${q.type}${
      q.options?.length ? `\nOptions: ${q.options.join(' | ')}` : ''
    }\n\n${q.answer || '(no answer yet)'}${q.notes ? `\n\n_Note: ${q.notes}_` : ''}`
  })

  const content = `# Application answers — ${props.job.title}\nCompany: ${
    props.job.company || 'Unknown'
  }\nURL: ${props.job.url}\n\n${lines.join('\n\n---\n\n')}\n`

  downloadTextFile(
    `${slugifyFilename(props.job.title)}-application-answers.md`,
    content,
    'text/markdown',
  )
}

onMounted(() => {
  loadForm(true)
})

watch(
  () => [props.resumeText, props.resume?.contentText] as const,
  ([text, saved]) => {
    // If the user uploads a CV after opening this tab and answers are empty, refill
    if ((text || saved) && form.value?.questions.length && answeredCount.value === 0 && !loading.value) {
      regenerateAnswers()
    }
  },
)
</script>

<template>
  <div class="space-y-5 max-w-3xl mx-auto">
    <div class="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-4 text-sm text-slate-300">
      <p class="font-bold text-blue-400 text-xs uppercase tracking-widest mb-2">
        Application form assistant
      </p>
      <p>
        Fields are auto-filled from your uploaded CV. Technical questions are answered from your
        real roles and projects. Use the copy icon on each field, paste into the company site —
        this app does not submit applications for you.
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-900 text-slate-200 hover:border-blue-500 flex items-center gap-1.5 disabled:opacity-50"
        :disabled="loading"
        @click="loadForm(true)"
      >
        <RefreshCw :size="14" :class="loading ? 'animate-spin' : ''" />
        {{ loading ? 'Auto-filling...' : 'Reload + auto-fill' }}
      </button>
      <button
        type="button"
        class="px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-900 text-slate-200 hover:border-blue-500 flex items-center gap-1.5 disabled:opacity-50"
        :disabled="answering || !form?.questions.length"
        @click="regenerateAnswers"
      >
        <Sparkles :size="14" :class="answering ? 'animate-pulse' : ''" />
        {{ answering ? 'Answering...' : 'Regenerate answers' }}
      </button>
      <button
        type="button"
        class="px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-900 text-slate-200 hover:border-blue-500 flex items-center gap-1.5 disabled:opacity-50"
        :disabled="!answeredCount"
        @click="copyAllAnswers"
      >
        <Check v-if="copiedAll" :size="14" class="text-emerald-400" />
        <Copy v-else :size="14" />
        {{ copiedAll ? 'Copied all' : 'Copy all answers' }}
      </button>
      <button
        type="button"
        class="px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-900 text-slate-200 hover:border-blue-500 flex items-center gap-1.5 disabled:opacity-50"
        :disabled="!form?.questions.length"
        @click="exportAnswers"
      >
        <Download :size="14" /> Export
      </button>
      <button
        type="button"
        class="px-3 py-2 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-600 hover:text-white flex items-center gap-1.5"
        @click="emit('apply')"
      >
        Open real form <ExternalLink :size="14" />
      </button>
    </div>

    <div
      v-if="error"
      class="text-red-400 text-xs bg-red-950/20 border border-red-500/20 rounded-xl px-3 py-2"
    >
      {{ error }}
    </div>

    <div
      v-if="loading && !form"
      class="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm"
    >
      <Loader2 class="animate-spin" :size="18" />
      Reading form and auto-filling answers from your CV...
    </div>

    <template v-else-if="form">
      <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>
          <span class="text-emerald-400 font-bold">{{ answeredCount }}</span>/{{
            form.questions.length
          }}
          auto-filled
        </span>
        <span class="uppercase tracking-widest font-bold"> Source: {{ form.extractedFrom }} </span>
      </div>

      <p
        v-if="form.notes"
        class="text-xs text-amber-400/90 bg-amber-950/20 border border-amber-500/20 rounded-xl px-3 py-2"
      >
        {{ form.notes }}
      </p>

      <div v-if="!form.questions.length" class="text-center text-slate-500 text-sm py-10">
        No questions found. Open the company form and try Reload, or ensure the job has a
        description so technical screening questions can be inferred.
      </div>

      <div
        v-for="(question, index) in form.questions"
        :key="question.id"
        class="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 space-y-4 backdrop-blur-sm shadow-md"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <p class="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1.5 flex flex-wrap items-center gap-2 select-none">
              <span>{{ question.section || 'Question' }} {{ index + 1 }}</span>
              <span v-if="question.required" class="text-red-400 border border-red-500/20 bg-red-950/20 px-1.5 py-0.5 rounded">Required</span>
              <span
                v-if="isTechnicalQuestion(question)"
                class="rounded border border-indigo-500/20 bg-indigo-950/30 px-1.5 py-0.5 text-indigo-300 normal-case tracking-normal font-semibold"
              >
                Technical Q&amp;A
              </span>
            </p>
            <h4 class="text-sm font-bold text-slate-100 leading-snug">{{ question.label }}</h4>
            <p v-if="question.helpText" class="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {{ question.helpText }}
            </p>
          </div>

          <button
            type="button"
            title="Copy answer"
            class="shrink-0 inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold transition-all duration-300 disabled:opacity-40 cursor-pointer"
            :class="
              copiedId === question.id
                ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-350'
                : 'border-slate-850 bg-slate-950/40 text-slate-300 hover:border-indigo-500 hover:text-white'
            "
            :disabled="!question.answer?.trim()"
            @click="copyAnswer(question)"
          >
            <Check v-if="copiedId === question.id" :size="13" class="text-emerald-400" />
            <Copy v-else :size="13" />
            {{ copiedId === question.id ? 'Copied' : 'Copy' }}
          </button>
        </div>

        <div v-if="question.options?.length" class="flex flex-wrap gap-1.5 select-none">
          <button
            v-for="option in question.options"
            :key="option"
            type="button"
            class="text-[10px] px-2.5 py-1 rounded-lg border transition-all duration-300 cursor-pointer font-medium"
            :class="
              question.answer === option
                ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-300'
                : 'border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            "
            @click="question.answer = option"
          >
            {{ option }}
          </button>
        </div>

        <div class="relative flex items-center">
          <textarea
            v-model="question.answer"
            :rows="isTechnicalQuestion(question) ? 6 : 3"
            class="w-full bg-slate-950/50 border border-slate-800 focus:border-indigo-500/85 rounded-xl p-3.5 pr-12 text-sm text-slate-200 leading-relaxed outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/70 transition-all duration-300 placeholder:text-slate-650"
            placeholder="Auto-filled answer appears here — edit before pasting into the real form"
          />
          <button
            type="button"
            title="Copy answer"
            class="absolute right-3.5 top-3.5 rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-400 hover:border-indigo-500 hover:text-white transition-all duration-300 disabled:opacity-40 cursor-pointer"
            :disabled="!question.answer?.trim()"
            @click="copyAnswer(question)"
          >
            <Check v-if="copiedId === question.id" :size="13" class="text-emerald-450" />
            <Copy v-else :size="13" />
          </button>
        </div>

        <p v-if="question.notes" class="text-xs text-slate-500 italic">{{ question.notes }}</p>
      </div>
    </template>
  </div>
</template>
