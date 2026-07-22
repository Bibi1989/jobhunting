<script setup lang="ts">
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-vue-next'
import type { UserDocumentSummary } from '~/shared/types/job'
import { scoreLocalAts, type LocalAtsResult } from '~/utils/localAtsScore'

const resumeDoc = ref<UserDocumentSummary | null>(null)
const resumeText = ref('')
const jobDescription = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const analysisResult = ref<LocalAtsResult | null>(null)
const { loggedIn, isPro } = useSaaS()

async function loadDocuments() {
  try {
    const data = await $fetch<{
      resume: UserDocumentSummary | null
    }>('/api/documents')
    resumeDoc.value = data.resume
    if (data.resume?.contentText && !resumeText.value.trim()) {
      resumeText.value = data.resume.contentText
    }
  } catch {
    // ignore
  }
}

onMounted(() => {
  if (loggedIn.value) {
    loadDocuments()
  }
})

function runLocalAnalysis() {
  error.value = null
  analysisResult.value = null

  const text = resumeText.value.trim()
  if (!text) {
    error.value = 'Paste your resume text (or upload a resume while signed in).'
    return
  }

  loading.value = true
  try {
    analysisResult.value = scoreLocalAts(text, jobDescription.value)
  } catch (err: unknown) {
    const e = err as { message?: string }
    error.value = e.message || 'Failed to analyze resume.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 selection:bg-indigo-500/30">
    <div class="max-w-[1000px] mx-auto">
      <div class="mb-10 flex items-center justify-between">
        <AppLogo />
        <NuxtLink to="/" class="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
          Back to Home
        </NuxtLink>
      </div>

      <div class="glass-panel rounded-3xl p-8 md:p-12 relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-emerald-500/5" />

        <div class="relative z-10 flex flex-col items-center text-center">
          <div class="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 shadow-xl shadow-emerald-500/10">
            <CheckCircle2 :size="32" />
          </div>

          <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-4">
            Keyword ATS Checker
          </h1>
          <p class="text-slate-400 max-w-xl mx-auto mb-10">
            Free local keyword coverage — paste a job description and your resume to see which skills match. No AI credits required.
          </p>

          <div class="w-full max-w-3xl bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 mb-8 text-left space-y-5">
            <div v-if="loggedIn" class="mb-2">
              <DocumentsPanel
                :resume="resumeDoc"
                :cover-letter="null"
                @uploaded="loadDocuments"
                @removed="loadDocuments"
              />
              <p class="text-xs text-slate-500 mt-2">Uploaded resume text is prefilled below when available.</p>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Job description (optional)
              </label>
              <textarea
                v-model="jobDescription"
                rows="5"
                class="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                placeholder="Paste the target job description for better keyword matching…"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Resume text
              </label>
              <textarea
                v-model="resumeText"
                rows="8"
                class="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                placeholder="Paste your resume text here…"
              />
            </div>

            <button
              type="button"
              :disabled="loading"
              class="w-full px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              @click="runLocalAnalysis"
            >
              <Loader2 v-if="loading" class="animate-spin" :size="20" />
              <UploadCloud v-else :size="20" />
              {{ loading ? 'Scoring…' : 'Run keyword ATS check' }}
            </button>
          </div>

          <div
            v-if="!isPro"
            class="w-full max-w-3xl mb-8 rounded-2xl border border-amber-500/25 bg-amber-950/30 px-6 py-5 text-left"
          >
            <div class="flex items-center gap-2 mb-2">
              <Sparkles class="text-amber-400" :size="18" />
              <p class="text-sm font-semibold text-amber-100">Want deeper AI ATS feedback?</p>
            </div>
            <p class="text-xs text-slate-400 mb-4">
              Pro unlocks Gemini-powered structure analysis, rewrite suggestions, and ATS fix in the resume builder.
            </p>
            <NuxtLink
              to="/pricing"
              class="inline-flex px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition-all"
            >
              Upgrade to Pro
            </NuxtLink>
          </div>
          <div
            v-else
            class="w-full max-w-3xl mb-8 rounded-2xl border border-indigo-500/25 bg-indigo-950/30 px-6 py-5 text-left"
          >
            <p class="text-sm text-slate-300">
              For full AI ATS analysis and one-click fixes, open a resume in the
              <NuxtLink to="/builder" class="text-indigo-300 hover:text-indigo-200 underline underline-offset-2">builder</NuxtLink>.
            </p>
          </div>

          <div v-if="error" class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl w-full max-w-2xl text-sm flex items-center gap-3 mb-8 text-left">
            <AlertCircle :size="18" />
            {{ error }}
          </div>

          <div v-if="analysisResult" class="w-full max-w-2xl bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-left">
            <h3 class="text-xl font-bold text-white mb-8 flex items-center justify-between">
              <span class="flex items-center gap-2">
                <Sparkles class="text-indigo-400" :size="20" />
                Keyword coverage
              </span>
              <span class="text-sm font-medium text-slate-400">
                {{ analysisResult.matched }}/{{ analysisResult.total || '—' }} matched
              </span>
            </h3>

            <div class="flex flex-col items-center justify-center mb-10">
              <div class="relative w-32 h-32 flex items-center justify-center rounded-full bg-slate-950 shadow-inner">
                <svg class="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle class="text-slate-800" stroke-width="8" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64"/>
                  <circle
                    :class="analysisResult.score >= 80 ? 'text-emerald-500' : analysisResult.score >= 60 ? 'text-amber-500' : 'text-red-500'"
                    stroke-width="8"
                    :stroke-dasharray="364"
                    :stroke-dashoffset="364 - (364 * analysisResult.score) / 100"
                    stroke-linecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="58" cx="64" cy="64"
                    class="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div class="flex flex-col items-center">
                  <span class="text-3xl font-extrabold text-white">{{ analysisResult.score }}</span>
                  <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Score</span>
                </div>
              </div>
            </div>

            <div v-if="analysisResult.keywords.length" class="mb-8">
              <h4 class="text-sm font-bold text-slate-300 mb-3">Keywords</h4>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="k in analysisResult.keywords"
                  :key="k.keyword"
                  class="text-xs font-medium rounded-full px-2.5 py-1 border"
                  :class="k.found
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400'"
                >
                  {{ k.keyword }}
                </span>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
                <h4 class="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 :size="16" /> Strengths
                </h4>
                <ul class="text-sm text-slate-300 space-y-2 list-disc pl-4 marker:text-emerald-500">
                  <li v-for="s in analysisResult.strengths" :key="s">{{ s }}</li>
                </ul>
              </div>

              <div class="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
                <h4 class="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                  <AlertCircle :size="16" /> Areas to Improve
                </h4>
                <ul class="text-sm text-slate-300 space-y-2 list-disc pl-4 marker:text-amber-500">
                  <li v-for="i in analysisResult.improvements" :key="i">{{ i }}</li>
                </ul>
              </div>
            </div>

            <div class="mt-8 flex justify-center">
              <button type="button" class="text-sm font-semibold text-slate-400 hover:text-white transition-colors" @click="analysisResult = null">
                Run another check
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
