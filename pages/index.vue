<script setup lang="ts">
import { Sparkles, FileText, Briefcase, Search, UploadCloud, CheckCircle2, ArrowRight } from 'lucide-vue-next'

const features = [
  {
    title: 'ATS Resume Builder',
    description: 'Create beautiful, ATS-optimized resumes tailored to your dream role with AI-powered keyword matching.',
    icon: FileText,
    href: '/builder',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20'
  },
  {
    title: 'Smart Cover Letters',
    description: 'Instantly generate highly personalized cover letters that align your experience directly with the job description.',
    icon: Sparkles,
    href: '/apply',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20'
  },
  {
    title: 'ATS Checker',
    description: 'Upload your existing resume and let our AI analyze it against standard Applicant Tracking Systems to find gaps.',
    icon: CheckCircle2,
    href: '/ats-checker',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20'
  },
  {
    title: 'Job Scraper',
    description: 'Automatically extract requirements from job boards and match them against your profile in one click.',
    icon: Search,
    href: '/scraper',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20'
  }
]

const { loggedIn, logout } = useSaaS()
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
    <div class="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5" />
    
    <!-- Navbar -->
    <header class="relative z-10 border-b border-slate-900/80 bg-slate-950/50 backdrop-blur-md">
      <div class="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
        <AppLogo />
        <div class="flex items-center gap-4">
          <NuxtLink to="/pricing" class="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Pricing</NuxtLink>
          <template v-if="loggedIn">
            <NuxtLink to="/scraper" class="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Dashboard</NuxtLink>
            <button @click="logout" class="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Sign out</button>
            <NuxtLink to="/builder" class="px-4 py-2 bg-white text-slate-950 hover:bg-slate-200 text-sm font-bold rounded-xl transition-all shadow-sm">
              Go to Builder
            </NuxtLink>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Sign in</NuxtLink>
            <NuxtLink to="/builder" class="px-4 py-2 bg-white text-slate-950 hover:bg-slate-200 text-sm font-bold rounded-xl transition-all shadow-sm">
              Get Started
            </NuxtLink>
          </template>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <main class="relative z-10 max-w-[1400px] mx-auto px-6 pt-24 pb-32">
      <div class="flex flex-col items-center text-center max-w-4xl mx-auto mb-20">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-8">
          <Sparkles :size="14" />
          The Ultimate AI Career Toolkit
        </div>
        <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Land your dream job <br class="hidden md:block" />
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">
            smarter & faster
          </span>
        </h1>
        <p class="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
          Upload your resume, scrape job descriptions, and let our AI instantly tailor your resume and cover letter to beat the ATS.
        </p>
        <div class="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <NuxtLink to="/builder" class="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all hover:scale-[1.02]">
            Build Your Resume <ArrowRight :size="18" />
          </NuxtLink>
          <NuxtLink to="/ats-checker" class="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all">
            <UploadCloud :size="18" class="text-emerald-400" />
            Check ATS Score
          </NuxtLink>
        </div>
      </div>

      <!-- Feature Categories -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <NuxtLink 
          v-for="feat in features" 
          :key="feat.title" 
          :to="feat.href"
          class="group p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 hover:bg-slate-900 transition-all duration-300 hover:shadow-xl flex flex-col items-start gap-4"
        >
          <div :class="['p-3 rounded-2xl border', feat.bg, feat.color, 'group-hover:scale-110 transition-transform duration-300']">
            <component :is="feat.icon" :size="24" />
          </div>
          <h3 class="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">{{ feat.title }}</h3>
          <p class="text-sm text-slate-400 leading-relaxed">{{ feat.description }}</p>
        </NuxtLink>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-900/80 py-12 relative z-10">
      <div class="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-sm font-medium">
        <p>© 2026 AI Job Scraper. All rights reserved.</p>
        <div class="flex items-center gap-6">
          <a href="#" class="hover:text-slate-300 transition-colors">Privacy Policy</a>
          <a href="#" class="hover:text-slate-300 transition-colors">Terms of Service</a>
          <a href="#" class="hover:text-slate-300 transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  </div>
</template>
