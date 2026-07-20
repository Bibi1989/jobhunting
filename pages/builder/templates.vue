<script setup lang="ts">
import { ref } from 'vue'

import { resumeTemplates, coverLetterTemplates } from '~/utils/templates'
import { PORTFOLIO_TEMPLATES, SAMPLE_PROFILE } from '~/shared/types/portfolio'

const activeFilter = ref('All')
const filters = ['All', 'Professional', 'Modern', 'Minimalist', 'Technical', 'Creative']
const portfolioPreviewSlug = ref<string | null>(null)

const filteredTemplates = computed(() => {
  if (activeFilter.value === 'All') return resumeTemplates
  return resumeTemplates.filter(t => t.category === activeFilter.value)
})

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
</script>

<template>
    <div class="pt-8 min-h-screen pb-20">
      <div class="max-w-[1200px] mx-auto px-6">
        <!-- Header Section -->
        <div class="mb-12">
          <h1 class="font-serif text-4xl text-white mb-3">Template Gallery</h1>
          <p class="text-blue-200/80 max-w-xl text-lg">Choose from our curated Stitch resume layouts and cover letter styles. Switch templates instantly while preserving your data.</p>
        </div>

        <!-- Filters & Categories -->
        <div class="sticky top-16 z-30 bg-slate-900/60 backdrop-blur-md py-4 mb-10 border-b border-white/10">
          <div class="flex flex-wrap items-center gap-6">
            <button 
              v-for="filter in filters" :key="filter"
              @click="activeFilter = filter"
              :class="['font-semibold text-sm pb-1 border-b-2 transition-colors', activeFilter === filter ? 'text-blue-400 border-blue-400' : 'text-slate-400 border-transparent hover:text-slate-200']"
            >
              {{ filter }}
            </button>
          </div>
        </div>

        <!-- Resume Templates Grid -->
        <div class="mb-8 flex items-center justify-between">
          <h2 class="font-serif text-2xl text-white">Resume Templates</h2>
          <span class="text-blue-300/60 text-sm font-semibold uppercase tracking-wider">{{ filteredTemplates.length }} Results</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16">
          <div v-for="tpl in filteredTemplates" :key="tpl.id" class="group relative flex flex-col cursor-pointer" @click="navigateTo('/builder/resume/new?template=' + tpl.id)">
            <div class="relative aspect-[3/4] bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 mb-4 hover:border-blue-400/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300">
              <BuilderTemplateThumbnail :template-id="tpl.id" :name="tpl.name" />
              
              <!-- Hover Overlay -->
              <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4">
                <button type="button" class="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:bg-blue-400 transition-colors">Use Template</button>
              </div>
            </div>
            <div>
              <h4 class="font-semibold text-lg text-white group-hover:text-blue-400 transition-colors">{{ tpl.name }}</h4>
              <p class="text-xs font-semibold text-blue-200/60 uppercase tracking-widest mt-1">{{ tpl.category }} • {{ tpl.desc }}</p>
            </div>
          </div>
        </div>

        <!-- Cover Letter Templates Grid -->
        <div class="mb-8 flex items-center justify-between border-t border-white/10 pt-16">
          <h2 class="font-serif text-2xl text-white">Cover Letter Templates</h2>
          <span class="text-blue-300/60 text-sm font-semibold uppercase tracking-wider">4 Results</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div
            v-for="tpl in coverLetterTemplates"
            :key="tpl.id"
            class="group relative flex flex-col cursor-pointer"
            @click="navigateTo('/builder/cover-letter/new?template=' + tpl.id)"
          >
            <div class="relative aspect-[3/4] bg-white rounded-xl overflow-hidden border border-white/10 mb-4 hover:border-blue-400/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300">
              <!-- Mini layout previews -->
              <div v-if="tpl.id === 'cl-standard'" class="h-full p-5 flex flex-col text-slate-800 font-serif">
                <div class="text-center border-b-2 border-slate-900 pb-3 mb-4">
                  <div class="h-3 w-2/3 mx-auto bg-slate-900 rounded mb-2" />
                  <div class="h-1.5 w-1/2 mx-auto bg-slate-400 rounded" />
                </div>
                <div class="space-y-2 flex-1">
                  <div class="h-1.5 w-full bg-slate-300 rounded" />
                  <div class="h-1.5 w-11/12 bg-slate-300 rounded" />
                  <div class="h-1.5 w-full bg-slate-300 rounded" />
                  <div class="h-1.5 w-4/5 bg-slate-300 rounded" />
                </div>
              </div>
              <div v-else-if="tpl.id === 'cl-creative'" class="h-full flex text-slate-800">
                <div class="w-2 bg-teal-700 shrink-0" />
                <div class="flex-1 p-5">
                  <div class="h-2 w-16 bg-teal-600/40 rounded mb-2" />
                  <div class="h-5 w-3/4 bg-slate-900 rounded mb-4" />
                  <div class="space-y-2">
                    <div class="h-1.5 w-full bg-slate-300 rounded" />
                    <div class="h-1.5 w-11/12 bg-slate-300 rounded" />
                    <div class="h-1.5 w-full bg-slate-300 rounded" />
                  </div>
                </div>
              </div>
              <div v-else-if="tpl.id === 'cl-executive'" class="h-full p-5 bg-[#fafaf8] text-slate-800">
                <div class="h-1.5 bg-slate-900 mb-4" />
                <div class="flex justify-between mb-4">
                  <div class="h-3 w-1/2 bg-slate-900 rounded" />
                  <div class="space-y-1 w-1/4">
                    <div class="h-1 bg-slate-300 rounded" />
                    <div class="h-1 bg-slate-300 rounded" />
                  </div>
                </div>
                <div class="space-y-2 border-t border-slate-300 pt-3">
                  <div class="h-1.5 w-full bg-slate-300 rounded" />
                  <div class="h-1.5 w-11/12 bg-slate-300 rounded" />
                  <div class="h-1.5 w-4/5 bg-slate-300 rounded" />
                </div>
              </div>
              <div v-else class="h-full flex text-slate-800">
                <div class="w-[28%] bg-slate-900 p-3 space-y-2">
                  <div class="h-2 w-full bg-white/30 rounded" />
                  <div class="h-1 w-2/3 bg-cyan-400/50 rounded" />
                  <div class="h-1 w-full bg-white/20 rounded mt-4" />
                  <div class="h-1 w-full bg-white/20 rounded" />
                </div>
                <div class="flex-1 p-4 space-y-2">
                  <div class="h-1.5 w-full bg-slate-300 rounded" />
                  <div class="h-1.5 w-11/12 bg-slate-300 rounded" />
                  <div class="h-1.5 w-full bg-slate-300 rounded" />
                  <div class="h-1.5 w-3/4 bg-slate-300 rounded" />
                </div>
              </div>

              <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4">
                <button type="button" class="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:bg-blue-400 transition-colors">Use Template</button>
              </div>
            </div>
            <div>
              <h4 class="font-semibold text-lg text-white group-hover:text-blue-400 transition-colors">{{ tpl.name }}</h4>
              <p class="text-xs font-semibold text-blue-200/60 uppercase tracking-widest mt-1">{{ tpl.category }} • {{ tpl.desc }}</p>
            </div>
          </div>
        </div>

        <!-- Portfolio Templates -->
        <div class="mb-8 flex items-center justify-between border-t border-white/10 pt-16">
          <div>
            <h2 class="font-serif text-2xl text-white">Portfolio Templates</h2>
            <p class="text-blue-200/60 text-sm mt-1">Ten live site themes for AI Portfolio — preview interactively, then publish.</p>
          </div>
          <span class="text-blue-300/60 text-sm font-semibold uppercase tracking-wider">{{ PORTFOLIO_TEMPLATES.length }} Designs</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          <div
            v-for="tpl in PORTFOLIO_TEMPLATES"
            :key="tpl.slug"
            class="group relative flex flex-col rounded-xl border border-white/10 overflow-hidden bg-white/[0.02] hover:border-blue-400/50 transition"
          >
            <div class="relative h-44 overflow-hidden bg-slate-900 border-b border-white/10">
              <div
                class="absolute top-0 left-0 origin-top-left pointer-events-none"
                style="width: 400%; height: 400%; transform: scale(0.25);"
              >
                <PortfolioRenderer :slug="tpl.slug" :data="SAMPLE_PROFILE" />
              </div>
            </div>
            <div class="p-4 flex flex-col gap-3 flex-1">
              <div>
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full" :class="tpl.accentClass" />
                  <h4 class="font-semibold text-white">{{ tpl.name }}</h4>
                </div>
                <p class="text-xs text-blue-200/60 uppercase tracking-wider mt-1">{{ tpl.persona }}</p>
                <p class="text-sm text-blue-200/50 mt-2 line-clamp-2">{{ tpl.description }}</p>
              </div>
              <div class="mt-auto flex gap-2">
                <button
                  type="button"
                  class="flex-1 rounded-lg border border-white/15 hover:bg-white/5 px-3 py-2 text-sm font-semibold text-blue-100"
                  @click="portfolioPreviewSlug = tpl.slug"
                >
                  Preview
                </button>
                <NuxtLink
                  :to="`/dashboard/portfolio?template=${tpl.slug}`"
                  class="flex-1 text-center rounded-lg bg-blue-500 hover:bg-blue-400 px-3 py-2 text-sm font-semibold text-white"
                >
                  Use
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <Teleport to="body">
          <div
            v-if="portfolioPreviewSlug"
            class="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex flex-col"
            @click.self="portfolioPreviewSlug = null"
          >
            <div class="flex items-center justify-between px-6 h-14 bg-slate-900 border-b border-white/10 shrink-0">
              <p class="font-semibold text-white">
                {{ PORTFOLIO_TEMPLATES.find(t => t.slug === portfolioPreviewSlug)?.name }} — interactive preview
              </p>
              <div class="flex items-center gap-2">
                <NuxtLink
                  :to="`/dashboard/portfolio?template=${portfolioPreviewSlug}`"
                  class="rounded-lg bg-blue-500 hover:bg-blue-400 px-4 py-1.5 text-sm font-semibold text-white"
                  @click="portfolioPreviewSlug = null"
                >
                  Use this template
                </NuxtLink>
                <button
                  type="button"
                  class="rounded-lg border border-white/15 hover:bg-white/5 px-3 py-1.5 text-sm text-blue-100"
                  @click="portfolioPreviewSlug = null"
                >
                  Close
                </button>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto bg-white">
              <PortfolioRenderer :slug="portfolioPreviewSlug" :data="SAMPLE_PROFILE" />
            </div>
          </div>
        </Teleport>
      </div>
    </div>
</template>
