<script setup lang="ts">
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-vue-next'
import type { UserDocumentSummary } from '~/shared/types/job'
import { marked } from 'marked'

const resumeDoc = ref<UserDocumentSummary | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const analysisResult = ref<string | null>(null)
const analysisHtml = computed(() => analysisResult.value ? marked(analysisResult.value) : '')
const { loggedIn, isPro } = useSaaS()

async function loadDocuments() {
  try {
    const data = await $fetch<{
      resume: UserDocumentSummary | null
    }>('/api/documents')
    resumeDoc.value = data.resume
  } catch {
    // ignore
  }
}

onMounted(() => {
  if (loggedIn.value) {
    loadDocuments()
  }
})

async function runAnalysis() {
  if (!resumeDoc.value) {
    error.value = "Please upload a resume first."
    return
  }
  loading.value = true
  error.value = null
  analysisResult.value = null

  try {
    // Placeholder for actual ATS analysis endpoint
    // We simulate an API call here for the layout. In a real scenario, we'd hit a Gemini endpoint.
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    analysisResult.value = `
### ATS Compatibility Score: 85/100

**Strengths:**
- Strong action verbs used (Engineered, Architected).
- Clear formatting detected.

**Areas for Improvement:**
- Missing explicit keywords for "React" or "TypeScript" (if targeting frontend).
- Quantify your impact more in the recent roles (e.g., "Increased performance by X%").
    `
  } catch (err: any) {
    error.value = err.message || "Failed to analyze resume."
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
            Pro ATS Resume Checker
          </h1>
          <p class="text-slate-400 max-w-xl mx-auto mb-10">
            Upload your resume and let our AI analyze its structure, keywords, and readability against standard Applicant Tracking Systems.
          </p>

          <div v-if="!loggedIn" class="w-full max-w-md bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 mb-8 text-left">
            <p class="text-slate-300 text-sm mb-4 text-center">Sign in to upload and analyze your resume.</p>
            <NuxtLink to="/login" class="flex justify-center w-full px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all">
              Sign In
            </NuxtLink>
          </div>
          <div v-else-if="!isPro" class="w-full max-w-md bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 mb-8 text-left">
            <div class="flex items-center justify-center gap-2 mb-4">
              <Sparkles class="text-amber-400" :size="20" />
              <p class="text-slate-300 text-sm font-semibold">ATS Checking is a Pro feature</p>
            </div>
            <p class="text-slate-400 text-xs mb-6 text-center">Upgrade to analyze your resume against ATS systems and get actionable feedback.</p>
            <NuxtLink to="/pricing" class="flex justify-center w-full px-5 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-all">
              Upgrade to Pro
            </NuxtLink>
          </div>
          <div v-else class="w-full max-w-md mb-10">
            <DocumentsPanel
              :resume="resumeDoc"
              :cover-letter="null"
              @uploaded="loadDocuments"
              @removed="loadDocuments"
            />
            
            <button
              v-if="resumeDoc && !analysisResult"
              @click="runAnalysis"
              :disabled="loading"
              class="w-full mt-6 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Loader2 v-if="loading" class="animate-spin" :size="20" />
              <UploadCloud v-else :size="20" />
              {{ loading ? 'Analyzing...' : 'Run ATS Analysis' }}
            </button>
          </div>

          <div v-if="error" class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl w-full max-w-2xl text-sm flex items-center gap-3 mb-8 text-left">
            <AlertCircle :size="18" />
            {{ error }}
          </div>

          <div v-if="analysisResult" class="w-full max-w-2xl bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-left">
            <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Sparkles class="text-indigo-400" :size="20" />
              Analysis Results
            </h3>
            <div class="prose prose-invert prose-sm max-w-none prose-p:text-slate-300 prose-li:text-slate-300" v-html="analysisHtml" />
            
            <div class="mt-8 flex justify-center">
              <button @click="analysisResult = null" class="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
                Run another analysis
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
