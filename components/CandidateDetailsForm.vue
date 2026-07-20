<script setup lang="ts">
import {
  EMPTY_CANDIDATE_PROFILE,
  normalizeCandidateProfile,
  type CandidateProfile,
} from '~/shared/samples/candidateProfile'

const model = defineModel<
  CandidateProfile & { skillsText?: string; experienceText?: string }
>({
  default: () => ({
    ...EMPTY_CANDIDATE_PROFILE,
    skillsText: '',
    experienceText: '',
  }),
})

const props = defineProps<{
  required?: boolean
  hint?: string
}>()

const local = computed({
  get: () => model.value,
  set: (value) => {
    model.value = value
  },
})

function syncSkills() {
  local.value = normalizeCandidateProfile({
    ...local.value,
    skillsText: local.value.skillsText,
  }) as CandidateProfile & { skillsText?: string; experienceText?: string }
  local.value.skillsText = (local.value.skills || []).join(', ')
}

const isComplete = computed(() => {
  const p = local.value
  return Boolean(
    p.fullName?.trim() &&
      p.email?.trim() &&
      p.phone?.trim() &&
      p.location?.trim() &&
      (p.skillsText?.trim() || p.skills?.length) &&
      p.experienceText?.trim(),
  )
})

defineExpose({ isComplete, syncSkills })
</script>

<template>
  <div
    class="space-y-5 rounded-2xl border p-5"
    :class="required ? 'border-amber-500/20 bg-amber-950/15' : 'border-slate-800 bg-slate-900/40 backdrop-blur-sm'"
  >
    <div>
      <p class="text-xs font-bold uppercase tracking-widest text-amber-400 select-none">
        {{ required ? 'Required details' : 'Your details' }}
      </p>
      <p class="mt-1 text-xs text-slate-400 select-none leading-relaxed">
        {{
          hint ||
          'No CV uploaded. Fill these in so we can generate documents with your real name and contact info.'
        }}
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <label class="space-y-1 text-xs flex flex-col">
        <span class="font-bold text-slate-400 select-none">Full Name *</span>
        <input
          v-model="local.fullName"
          type="text"
          class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 transition-all duration-300 placeholder:text-slate-650"
          placeholder="Ada Lovelace"
        />
      </label>
      <label class="space-y-1 text-xs flex flex-col">
        <span class="font-bold text-slate-400 select-none">Email *</span>
        <input
          v-model="local.email"
          type="email"
          class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 transition-all duration-300 placeholder:text-slate-650"
          placeholder="you@email.com"
        />
      </label>
      <label class="space-y-1 text-xs flex flex-col">
        <span class="font-bold text-slate-400 select-none">Phone *</span>
        <input
          v-model="local.phone"
          type="tel"
          class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 transition-all duration-300 placeholder:text-slate-650"
          placeholder="+1 555 0100"
        />
      </label>
      <label class="space-y-1 text-xs flex flex-col">
        <span class="font-bold text-slate-400 select-none">City / address *</span>
        <input
          v-model="local.location"
          type="text"
          class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 transition-all duration-300 placeholder:text-slate-650"
          placeholder="Berlin, Germany"
        />
      </label>
      <label class="space-y-1 text-xs flex flex-col">
        <span class="font-bold text-slate-400 select-none">LinkedIn</span>
        <input
          v-model="local.linkedin"
          type="text"
          class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 transition-all duration-300 placeholder:text-slate-650"
          placeholder="linkedin.com/in/you"
        />
      </label>
      <label class="space-y-1 text-xs flex flex-col">
        <span class="font-bold text-slate-400 select-none">Website / Portfolio</span>
        <input
          v-model="local.website"
          type="text"
          class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 transition-all duration-300 placeholder:text-slate-650"
          placeholder="yoursite.com"
        />
      </label>
    </div>

    <label class="block space-y-1 text-xs">
      <span class="font-bold text-slate-400 select-none">Skills * (comma-separated)</span>
      <input
        v-model="local.skillsText"
        type="text"
        class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 transition-all duration-300 placeholder:text-slate-650"
        placeholder="TypeScript, React, PostgreSQL, Leadership"
        @blur="syncSkills"
      />
    </label>

    <label class="block space-y-1 text-xs">
      <span class="font-bold text-slate-400 select-none">Work experience * (one bullet per line)</span>
      <textarea
        v-model="local.experienceText"
        rows="5"
        class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 transition-all duration-300 placeholder:text-slate-650"
        placeholder="Company, Role (2021-Present)&#10;- Led delivery of X&#10;- Improved Y by 20%&#10;Earlier Company, Role (2018-2021)&#10;- Built Z"
      />
    </label>

    <label class="block space-y-1 text-xs">
      <span class="font-bold text-slate-400 select-none">Education</span>
      <input
        v-model="local.education"
        type="text"
        class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 transition-all duration-300 placeholder:text-slate-650"
        placeholder="B.S. Computer Science, University Name, 2019"
      />
    </label>

    <p v-if="required && !isComplete" class="text-[11px] text-amber-300">
      Fill all required fields (*) before generating.
    </p>
  </div>
</template>
