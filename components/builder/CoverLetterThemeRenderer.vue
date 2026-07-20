<script setup lang="ts">
/**
 * Cover letter layouts aligned to Stitch style variants.
 */
defineProps<{
  templateId: string
  fullName: string
  jobTitle?: string
  location?: string
  email?: string
  phone?: string
  companyName?: string
  hiringManager?: string
  letterDate: string
  bodyHtml: string
}>()
</script>

<template>
  <!-- Standard: centered classic letterhead -->
  <div
    v-if="templateId === 'cl-standard' || !templateId.startsWith('cl-')"
    class="bg-white text-slate-900 w-full min-h-full p-10 flex flex-col font-serif"
  >
    <header class="text-center mb-6 border-b-2 border-slate-900 pb-4">
      <h1 class="text-3xl font-bold tracking-tight mb-1 uppercase">{{ fullName || 'Your Name' }}</h1>
      <h2 v-if="jobTitle" class="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wider">
        {{ jobTitle }}
      </h2>
      <div class="flex justify-center flex-wrap gap-x-3 gap-y-1 text-slate-600 text-[11px] uppercase tracking-widest font-sans">
        <span v-if="location">{{ location }}</span>
        <span v-if="email">| {{ email }}</span>
        <span v-if="phone">| {{ phone }}</span>
      </div>
    </header>
    <div v-if="companyName || hiringManager" class="mb-5 text-[13px] font-sans">
      <p>{{ letterDate }}</p>
      <p class="mt-3 font-bold">{{ hiringManager || 'Hiring Manager' }}</p>
      <p>{{ companyName }}</p>
    </div>
    <div class="rich-text-content cover-letter-body text-[13px] leading-relaxed flex-1" v-html="bodyHtml" />
  </div>

  <!-- Creative: bold left accent + large name -->
  <div
    v-else-if="templateId === 'cl-creative'"
    class="bg-white text-slate-900 w-full min-h-full flex font-sans overflow-hidden"
  >
    <div class="w-3 bg-[#006a61] shrink-0 self-stretch" />
    <div class="flex-1 p-10 flex flex-col min-h-full bg-white">
      <header class="mb-8">
        <p class="text-[10px] uppercase tracking-[0.25em] text-[#006a61] font-bold mb-2">Cover Letter</p>
        <h1 class="text-4xl font-black tracking-tight text-slate-900 leading-none">{{ fullName || 'Your Name' }}</h1>
        <p v-if="jobTitle" class="mt-2 text-sm text-slate-500 font-semibold">{{ jobTitle }}</p>
        <div class="mt-3 flex flex-wrap gap-x-4 text-[11px] text-slate-500">
          <span v-if="email">{{ email }}</span>
          <span v-if="phone">{{ phone }}</span>
          <span v-if="location">{{ location }}</span>
        </div>
      </header>
      <div v-if="companyName || hiringManager" class="mb-5 text-[13px]">
        <p class="text-slate-400 text-[11px] uppercase tracking-wider">{{ letterDate }}</p>
        <p class="mt-2 font-bold text-[#006a61]">{{ hiringManager || 'Hiring Manager' }}</p>
        <p class="text-slate-700">{{ companyName }}</p>
      </div>
      <div class="rich-text-content cover-letter-body text-[13px] leading-relaxed text-slate-700 flex-1" v-html="bodyHtml" />
    </div>
  </div>

  <!-- Executive: memo header with top rule -->
  <div
    v-else-if="templateId === 'cl-executive'"
    class="bg-[#fafaf8] text-slate-900 w-full min-h-full p-10 flex flex-col font-serif"
  >
    <div class="h-1.5 bg-[#091426] mb-6 shrink-0" />
    <header class="mb-8 border-b border-slate-300 pb-4 shrink-0">
      <div class="flex justify-between items-start gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-[#091426]">{{ fullName || 'Your Name' }}</h1>
          <p v-if="jobTitle" class="text-[11px] uppercase tracking-[0.15em] text-[#006a61] font-bold mt-1">{{ jobTitle }}</p>
        </div>
        <div class="text-right text-[11px] text-slate-500 font-sans space-y-0.5">
          <div v-if="email">{{ email }}</div>
          <div v-if="phone">{{ phone }}</div>
          <div v-if="location">{{ location }}</div>
        </div>
      </div>
      <div class="mt-5 grid grid-cols-[72px_1fr] gap-y-1.5 text-[12px] font-sans">
        <span class="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Date</span>
        <span>{{ letterDate }}</span>
        <span class="font-bold text-slate-500 uppercase text-[10px] tracking-wider">To</span>
        <span>{{ hiringManager || 'Hiring Manager' }}{{ companyName ? `, ${companyName}` : '' }}</span>
        <span class="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Re</span>
        <span>Application — {{ jobTitle || 'Open Role' }}</span>
      </div>
    </header>
    <div class="rich-text-content cover-letter-body text-[13px] leading-relaxed flex-1" v-html="bodyHtml" />
  </div>

  <!-- Tech: left rail contact + mono accents -->
  <div
    v-else
    class="bg-white text-slate-900 w-full min-h-full flex font-sans overflow-hidden"
  >
    <aside class="w-[180px] bg-slate-900 text-slate-100 p-6 flex flex-col gap-6 shrink-0 self-stretch min-h-full">
      <div>
        <h1 class="text-lg font-bold leading-tight">{{ fullName || 'Your Name' }}</h1>
        <p v-if="jobTitle" class="text-[10px] text-cyan-300 mt-1 font-mono uppercase tracking-wider">{{ jobTitle }}</p>
      </div>
      <div class="space-y-3 text-[10px] text-slate-300 font-mono">
        <div v-if="email">
          <p class="text-slate-500 uppercase tracking-wider text-[8px] mb-0.5">Email</p>
          <p class="break-all">{{ email }}</p>
        </div>
        <div v-if="phone">
          <p class="text-slate-500 uppercase tracking-wider text-[8px] mb-0.5">Phone</p>
          <p>{{ phone }}</p>
        </div>
        <div v-if="location">
          <p class="text-slate-500 uppercase tracking-wider text-[8px] mb-0.5">Location</p>
          <p>{{ location }}</p>
        </div>
      </div>
      <div class="mt-auto text-[8px] text-slate-500 font-mono border-t border-white/10 pt-3">
        TECH INTRO
      </div>
    </aside>
    <div class="flex-1 p-8 flex flex-col min-h-full bg-white">
      <div v-if="companyName || hiringManager" class="mb-6 text-[12px] shrink-0">
        <p class="font-mono text-[10px] text-slate-400">{{ letterDate }}</p>
        <p class="mt-3 font-bold">{{ hiringManager || 'Hiring Manager' }}</p>
        <p class="text-slate-600">{{ companyName }}</p>
      </div>
      <div class="rich-text-content cover-letter-body text-[13px] leading-relaxed text-slate-800 flex-1" v-html="bodyHtml" />
    </div>
  </div>
</template>

<style scoped>
.cover-letter-body :deep(p) {
  margin: 0 0 0.75rem;
}
</style>
