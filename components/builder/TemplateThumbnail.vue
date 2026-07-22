<script setup lang="ts">
/**
 * Mini visual thumbnail for resume template gallery / picker.
 * Each layout mirrors the real ResumeThemeRenderer silhouette.
 */
defineProps<{
  templateId: string
  name?: string
}>()
</script>

<template>
  <div class="w-full h-full bg-white text-slate-800 overflow-hidden relative select-none pointer-events-none">
    <!-- The Distinguished — top accent bar + two-column -->
    <div v-if="templateId === 'the-distinguished'" class="flex flex-col h-full">
      <div class="h-1.5 bg-slate-800 shrink-0" />
      <div class="flex flex-1 min-h-0">
        <div class="w-[34%] p-2 space-y-1.5 border-r border-slate-200">
          <div class="h-1 w-1/2 bg-slate-700 rounded-sm" />
          <div class="h-1 w-full bg-slate-200 rounded-sm" />
          <div class="h-1 w-5/6 bg-slate-200 rounded-sm" />
          <div class="mt-2 h-1 w-1/3 bg-slate-700 rounded-sm" />
          <div class="h-1 w-full bg-slate-200 rounded-sm" />
        </div>
        <div class="flex-1 p-2 space-y-1.5">
          <div class="h-1.5 w-2/3 mx-auto bg-slate-800 rounded-sm" />
          <div class="h-1 w-1/2 mx-auto bg-slate-400 rounded-sm" />
          <div class="mt-2 h-1 w-1/3 bg-slate-700 rounded-sm" />
          <div class="h-1 w-full bg-slate-200 rounded-sm" />
          <div class="h-1 w-11/12 bg-slate-200 rounded-sm" />
        </div>
      </div>
    </div>

    <!-- The Corporate — dark header band -->
    <div v-else-if="templateId === 'the-corporate'" class="flex flex-col h-full">
      <div class="bg-slate-900 px-2 py-2 space-y-1">
        <div class="h-2 w-1/2 bg-white rounded-sm" />
        <div class="h-1 w-1/3 bg-white/50 rounded-sm" />
      </div>
      <div class="flex-1 p-2 space-y-1.5">
        <div class="h-1 w-1/4 bg-slate-800 rounded-sm" />
        <div class="h-1 w-full bg-slate-200 rounded-sm" />
        <div class="h-1 w-5/6 bg-slate-200 rounded-sm" />
        <div class="mt-2 flex justify-between">
          <div class="h-1 w-1/3 bg-slate-700 rounded-sm" />
          <div class="h-1 w-1/5 bg-slate-300 rounded-sm" />
        </div>
        <div class="h-1 w-full bg-slate-200 rounded-sm" />
        <div class="h-1 w-11/12 bg-slate-200 rounded-sm" />
      </div>
    </div>

    <!-- The Executive — centered two-column -->
    <div v-else-if="templateId === 'the-executive'" class="flex flex-col h-full p-2">
      <div class="text-center space-y-1 mb-2 pb-1.5 border-b border-slate-300">
        <div class="h-2 w-2/3 mx-auto bg-slate-900 rounded-sm" />
        <div class="h-1 w-1/2 mx-auto bg-slate-400 rounded-sm" />
      </div>
      <div class="flex gap-2 flex-1">
        <div class="flex-1 space-y-1">
          <div class="h-1 w-1/2 bg-slate-800 rounded-sm" />
          <div class="h-1 w-full bg-slate-200 rounded-sm" />
          <div class="h-1 w-5/6 bg-slate-200 rounded-sm" />
        </div>
        <div class="flex-1 space-y-1">
          <div class="h-1 w-1/2 bg-slate-800 rounded-sm" />
          <div class="h-1 w-full bg-slate-200 rounded-sm" />
          <div class="h-1 w-4/5 bg-slate-200 rounded-sm" />
        </div>
      </div>
    </div>

    <!-- The Partner — dual horizontal rules -->
    <div v-else-if="templateId === 'the-partner'" class="flex flex-col h-full p-2">
      <div class="border-y-2 border-slate-900 py-1.5 mb-2 space-y-1">
        <div class="h-2 w-1/2 bg-slate-900 rounded-sm" />
        <div class="h-1 w-1/3 bg-slate-500 rounded-sm" />
      </div>
      <div class="space-y-1.5 flex-1">
        <div class="h-1 w-1/4 bg-slate-800 rounded-sm" />
        <div class="h-1 w-full bg-slate-200 rounded-sm" />
        <div class="h-1 w-11/12 bg-slate-200 rounded-sm" />
        <div class="mt-2 h-1 w-1/4 bg-slate-800 rounded-sm" />
        <div class="h-1 w-full bg-slate-200 rounded-sm" />
      </div>
    </div>

    <!-- The Innovator — dark neon -->
    <div v-else-if="templateId === 'the-innovator'" class="flex flex-col h-full bg-slate-950 p-2 space-y-1.5">
      <div class="h-2 w-1/2 bg-fuchsia-400 rounded-sm" />
      <div class="h-1 w-1/3 bg-cyan-400/70 rounded-sm" />
      <div class="mt-1 rounded border border-slate-700 bg-slate-900/80 p-1.5 space-y-1">
        <div class="h-1 w-1/4 bg-fuchsia-400/60 rounded-sm" />
        <div class="h-1 w-full bg-slate-600 rounded-sm" />
        <div class="h-1 w-5/6 bg-slate-600 rounded-sm" />
      </div>
      <div class="rounded border border-slate-700 bg-slate-900/80 p-1.5 space-y-1">
        <div class="h-1 w-1/4 bg-cyan-400/60 rounded-sm" />
        <div class="h-1 w-full bg-slate-600 rounded-sm" />
      </div>
    </div>

    <!-- The Digital Nomad — 50/50 split -->
    <div v-else-if="templateId === 'the-digital-nomad'" class="flex h-full">
      <div class="w-1/2 bg-[#0b1c30] p-2 space-y-1.5">
        <div class="h-2 w-3/4 bg-white rounded-sm" />
        <div class="h-1 w-1/2 bg-sky-300/50 rounded-sm" />
        <div class="mt-3 space-y-1">
          <div class="h-1 w-full bg-white/30 rounded-sm" />
          <div class="h-1 w-5/6 bg-white/25 rounded-sm" />
          <div class="h-1 w-full bg-white/20 rounded-sm" />
        </div>
        <div class="flex flex-wrap gap-0.5 mt-2">
          <div class="h-1.5 w-5 bg-sky-500/40 rounded-sm" />
          <div class="h-1.5 w-6 bg-sky-500/40 rounded-sm" />
          <div class="h-1.5 w-4 bg-sky-500/40 rounded-sm" />
        </div>
      </div>
      <div class="w-1/2 bg-white p-2 space-y-1.5">
        <div class="h-1 w-1/3 bg-slate-800 rounded-sm" />
        <div class="h-1 w-full bg-slate-200 rounded-sm" />
        <div class="h-1 w-5/6 bg-slate-200 rounded-sm" />
        <div class="mt-2 h-1 w-1/3 bg-slate-800 rounded-sm" />
        <div class="h-1 w-full bg-slate-200 rounded-sm" />
        <div class="h-1 w-11/12 bg-slate-200 rounded-sm" />
      </div>
    </div>

    <!-- The Social Media Pro — gradient banner -->
    <div v-else-if="templateId === 'the-social-media-pro'" class="flex flex-col h-full">
      <div class="h-8 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 px-2 py-1.5">
        <div class="h-2 w-1/2 bg-white rounded-sm" />
        <div class="h-1 w-1/3 bg-white/70 rounded-sm mt-1" />
      </div>
      <div class="flex-1 p-2 space-y-1.5">
        <div class="h-1 w-1/4 bg-slate-800 rounded-sm" />
        <div class="h-1 w-full bg-slate-200 rounded-sm" />
        <div class="h-1 w-5/6 bg-slate-200 rounded-sm" />
        <div class="mt-2 grid grid-cols-3 gap-1">
          <div class="h-4 bg-slate-100 rounded-sm" />
          <div class="h-4 bg-slate-100 rounded-sm" />
          <div class="h-4 bg-slate-100 rounded-sm" />
        </div>
      </div>
    </div>

    <!-- The Creative Director — teal sidebar + timeline -->
    <div v-else-if="templateId === 'the-creative-director'" class="flex h-full">
      <div class="w-[34%] bg-[#006a61] p-2 space-y-1.5">
        <div class="h-2 w-3/4 bg-white rounded-sm" />
        <div class="h-1 w-1/2 bg-teal-200/60 rounded-sm" />
        <div class="mt-3 space-y-1">
          <div class="h-1 w-2/3 bg-teal-100/50 rounded-sm" />
          <div class="h-1 w-full bg-white/30 rounded-sm" />
          <div class="h-1 w-5/6 bg-white/25 rounded-sm" />
        </div>
        <div class="flex flex-wrap gap-0.5 mt-2">
          <div class="h-1.5 w-5 bg-teal-800 rounded-sm border border-teal-300/40" />
          <div class="h-1.5 w-6 bg-teal-800 rounded-sm border border-teal-300/40" />
        </div>
      </div>
      <div class="flex-1 bg-white p-2 space-y-1.5">
        <div class="h-1 w-1/3 bg-[#006a61] rounded-sm" />
        <div class="border-l-2 border-teal-200 pl-1.5 space-y-1">
          <div class="h-1 w-2/3 bg-slate-800 rounded-sm" />
          <div class="h-1 w-full bg-slate-200 rounded-sm" />
          <div class="h-1 w-5/6 bg-slate-200 rounded-sm" />
        </div>
        <div class="h-1 w-1/3 bg-[#006a61] rounded-sm mt-1" />
        <div class="h-1 w-full bg-slate-200 rounded-sm" />
      </div>
    </div>

    <!-- The Brand Architect — monogram asymmetric -->
    <div v-else-if="templateId === 'the-brand-architect'" class="flex h-full p-2 gap-2">
      <div class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[8px] font-black shrink-0">
        BA
      </div>
      <div class="flex-1 space-y-1.5 pt-0.5">
        <div class="h-2 w-1/2 bg-slate-900 rounded-sm" />
        <div class="h-1 w-1/3 bg-slate-400 rounded-sm" />
        <div class="mt-2 h-1 w-full bg-slate-200 rounded-sm" />
        <div class="h-1 w-5/6 bg-slate-200 rounded-sm" />
        <div class="h-1 w-full bg-slate-200 rounded-sm" />
      </div>
    </div>

    <!-- The Typographer — editorial -->
    <div v-else-if="templateId === 'the-typographer'" class="flex flex-col h-full p-2.5">
      <div class="h-3 w-3/4 bg-slate-900 rounded-sm mb-1" />
      <div class="h-1 w-1/2 bg-slate-400 rounded-sm mb-3" />
      <div class="space-y-1 flex-1">
        <div class="h-1 w-full bg-slate-200 rounded-sm" />
        <div class="h-1 w-11/12 bg-slate-200 rounded-sm" />
        <div class="h-1 w-full bg-slate-200 rounded-sm" />
        <div class="h-1 w-4/5 bg-slate-200 rounded-sm" />
        <div class="mt-3 h-1.5 w-1/4 bg-slate-900 rounded-sm" />
        <div class="h-1 w-full bg-slate-200 rounded-sm" />
        <div class="h-1 w-5/6 bg-slate-200 rounded-sm" />
      </div>
    </div>

    <!-- The Strategist — left profile sidebar -->
    <div v-else-if="templateId === 'the-strategist'" class="flex h-full">
      <div class="w-[30%] bg-slate-100 p-2 space-y-1.5 border-r border-slate-200">
        <div class="h-6 w-6 rounded-full bg-slate-400 mx-auto" />
        <div class="h-1 w-full bg-slate-300 rounded-sm" />
        <div class="h-1 w-5/6 bg-slate-300 rounded-sm" />
        <div class="mt-2 h-1 w-1/2 bg-slate-500 rounded-sm" />
        <div class="h-1 w-full bg-slate-300 rounded-sm" />
      </div>
      <div class="flex-1 p-2 space-y-1.5">
        <div class="h-2 w-1/2 bg-slate-900 rounded-sm" />
        <div class="h-1 w-1/3 bg-slate-500 rounded-sm" />
        <div class="mt-2 h-1 w-1/4 bg-slate-800 rounded-sm" />
        <div class="h-1 w-full bg-slate-200 rounded-sm" />
        <div class="h-1 w-5/6 bg-slate-200 rounded-sm" />
      </div>
    </div>

    <!-- The Engineer — tech stack sidebar -->
    <div v-else-if="templateId === 'the-engineer'" class="flex h-full">
      <div class="w-[32%] bg-slate-900 p-2 space-y-1">
        <div class="h-2 w-3/4 bg-emerald-400 rounded-sm" />
        <div class="h-1 w-1/2 bg-slate-500 rounded-sm" />
        <div class="mt-2 space-y-0.5">
          <div class="h-1.5 w-full bg-slate-700 rounded-sm" />
          <div class="h-1.5 w-full bg-slate-700 rounded-sm" />
          <div class="h-1.5 w-4/5 bg-slate-700 rounded-sm" />
          <div class="h-1.5 w-full bg-emerald-900/80 rounded-sm border border-emerald-500/30" />
        </div>
      </div>
      <div class="flex-1 p-2 space-y-1.5 font-mono">
        <div class="h-1 w-1/3 bg-emerald-700 rounded-sm" />
        <div class="h-1 w-full bg-slate-200 rounded-sm" />
        <div class="h-1 w-5/6 bg-slate-200 rounded-sm" />
        <div class="mt-2 h-1 w-1/3 bg-emerald-700 rounded-sm" />
        <div class="h-1 w-full bg-slate-200 rounded-sm" />
      </div>
    </div>

    <!-- The Researcher / Researcher+ — academic -->
    <div v-else-if="templateId === 'the-researcher' || templateId === 'the-researcher-updated'" class="flex flex-col h-full p-2">
      <div class="text-center mb-2 space-y-1">
        <div class="h-2 w-2/3 mx-auto bg-slate-900 rounded-sm" />
        <div class="h-1 w-1/2 mx-auto bg-slate-400 rounded-sm" />
        <div class="h-0.5 w-full bg-slate-300 mt-1" />
      </div>
      <div class="space-y-1.5 flex-1">
        <div class="h-1 w-1/3 bg-slate-800 rounded-sm" />
        <div class="flex justify-between gap-1">
          <div class="h-1 flex-1 bg-slate-200 rounded-sm" />
          <div class="h-1 w-8 bg-slate-300 rounded-sm" />
        </div>
        <div class="h-1 w-full bg-slate-200 rounded-sm" />
        <div class="mt-2 h-1 w-1/3 bg-slate-800 rounded-sm" />
        <div class="grid grid-cols-2 gap-1" :class="templateId === 'the-researcher-updated' ? 'mt-1' : ''">
          <div class="h-3 bg-slate-100 border border-slate-200 rounded-sm" />
          <div class="h-3 bg-slate-100 border border-slate-200 rounded-sm" />
        </div>
      </div>
    </div>

    <!-- Fallback -->
    <div v-else class="flex flex-col h-full p-2 space-y-1.5">
      <div class="h-2 w-1/2 bg-slate-800 rounded-sm" />
      <div class="h-1 w-1/3 bg-slate-400 rounded-sm" />
      <div class="h-1 w-full bg-slate-200 rounded-sm mt-2" />
      <div class="h-1 w-5/6 bg-slate-200 rounded-sm" />
      <div class="h-1 w-full bg-slate-200 rounded-sm" />
    </div>
  </div>
</template>
