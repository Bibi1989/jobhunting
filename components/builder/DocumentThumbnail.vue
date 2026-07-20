<script setup lang="ts">
export type BuilderDocumentPreview = {
  kind: 'resume' | 'cover_letter'
  fullName: string
  jobTitle: string
  location: string
  email: string
  phone: string
  summary: string
  experience: Array<{ title: string; company: string; dates: string }>
  skills: string[]
  companyName?: string
  hiringManager?: string
  contentPreview?: string
}

const props = defineProps<{
  preview: BuilderDocumentPreview | null
  type: string
}>()

const isCover = computed(() => props.type === 'cover_letter' || props.preview?.kind === 'cover_letter')

const contactLine = computed(() => {
  const p = props.preview
  if (!p) return ''
  return [p.location, p.email, p.phone].filter(Boolean).join(' · ')
})
</script>

<template>
  <div class="w-full h-full bg-white text-slate-800 shadow-sm rounded-sm overflow-hidden relative">
    <!-- Mini page scaled to fit card -->
    <div class="absolute inset-0 origin-top-left scale-[0.92] p-3 pointer-events-none select-none">
      <template v-if="preview && isCover">
        <p class="text-[9px] font-bold text-slate-900 leading-tight truncate">{{ preview.fullName }}</p>
        <p v-if="preview.jobTitle" class="text-[7px] text-slate-500 mt-0.5 truncate">{{ preview.jobTitle }}</p>
        <p v-if="contactLine" class="text-[6px] text-slate-400 mt-0.5 truncate">{{ contactLine }}</p>
        <div class="mt-2 space-y-0.5 text-[6.5px] text-slate-600 leading-snug">
          <p v-if="preview.hiringManager || preview.companyName" class="font-semibold text-slate-800">
            {{ preview.hiringManager || 'Hiring Manager' }}
            <span v-if="preview.companyName"> · {{ preview.companyName }}</span>
          </p>
          <p class="line-clamp-[14] whitespace-pre-wrap">
            {{ preview.contentPreview || 'Cover letter draft…' }}
          </p>
        </div>
      </template>

      <template v-else-if="preview">
        <p class="text-[9px] font-bold uppercase tracking-wide text-slate-900 leading-tight truncate">
          {{ preview.fullName }}
        </p>
        <p v-if="preview.jobTitle" class="text-[7px] font-semibold text-slate-500 mt-0.5 truncate uppercase tracking-wider">
          {{ preview.jobTitle }}
        </p>
        <p v-if="contactLine" class="text-[6px] text-slate-400 mt-0.5 truncate">{{ contactLine }}</p>

        <div v-if="preview.summary" class="mt-2">
          <p class="text-[6px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Summary</p>
          <p class="text-[6.5px] text-slate-600 leading-snug line-clamp-3">{{ preview.summary }}</p>
        </div>

        <div v-if="preview.experience.length" class="mt-2">
          <p class="text-[6px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Experience</p>
          <div
            v-for="(exp, i) in preview.experience"
            :key="i"
            class="mb-1"
          >
            <p class="text-[7px] font-semibold text-slate-800 truncate">
              {{ exp.title || 'Role' }}
              <span v-if="exp.company" class="font-normal text-slate-500"> · {{ exp.company }}</span>
            </p>
            <p v-if="exp.dates" class="text-[6px] text-slate-400">{{ exp.dates }}</p>
          </div>
        </div>

        <div v-if="preview.skills.length" class="mt-1.5">
          <p class="text-[6px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Skills</p>
          <p class="text-[6.5px] text-slate-600 leading-snug line-clamp-2">{{ preview.skills.join(' · ') }}</p>
        </div>
      </template>

      <template v-else>
        <div class="h-full flex flex-col items-center justify-center text-slate-300 gap-1">
          <span class="material-symbols-outlined text-4xl">
            {{ isCover ? 'article' : 'quick_reference' }}
          </span>
          <span class="text-[8px] uppercase tracking-wider">Empty draft</span>
        </div>
      </template>
    </div>
  </div>
</template>
