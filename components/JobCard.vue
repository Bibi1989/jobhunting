<script setup lang="ts">
import { Bookmark, ExternalLink, Trash2 } from 'lucide-vue-next'
import type { Job } from '~/shared/types/job'

const props = defineProps<{
  job: Job
  isFavorite?: boolean
  hasTailored?: boolean
  visitedAt?: number
}>()

const emit = defineEmits<{
  toggleFavorite: [job: Job]
  visit: [job: Job]
  select: [job: Job]
  remove: [job: Job]
  apply: [job: Job]
}>()

const logoText = computed(() => {
  const source = props.job.company || props.job.title
  return source.substring(0, 2).toUpperCase()
})

const logoGradient = computed(() => {
  const company = props.job.company || props.job.title || 'Unknown'
  let hash = 0
  for (let i = 0; i < company.length; i++) {
    hash = company.charCodeAt(i) + ((hash << 5) - hash)
  }
  const gradients = [
    'from-indigo-500 to-purple-500 text-white',
    'from-blue-500 to-indigo-500 text-white',
    'from-violet-600 to-fuchsia-600 text-white',
    'from-pink-500 to-rose-500 text-white',
    'from-teal-500 to-emerald-500 text-white',
    'from-emerald-500 to-teal-600 text-white',
    'from-cyan-500 to-blue-500 text-white',
    'from-amber-500 to-orange-500 text-slate-950',
  ]
  const idx = Math.abs(hash) % gradients.length
  return gradients[idx]
})

const salary = computed(() => formatSalary(props.job.salaryMin, props.job.salaryMax, props.job.currency))

function formatSalary(min?: number, max?: number, currency = '€') {
  const raw = (currency || '€').trim()
  const upper = raw.toUpperCase()
  const symbol =
    !raw || raw === '$' || upper === 'USD' || upper === 'US$' || upper === 'EUR' || upper === 'EURO'
      ? '€'
      : raw
  if (!min && !max) return ''
  if (min && !max) return `${symbol}${min.toLocaleString('de-DE')}+`
  if (!min && max) return `Up to ${symbol}${max.toLocaleString('de-DE')}`
  return `${symbol}${min!.toLocaleString('de-DE')} – ${max!.toLocaleString('de-DE')}`
}
</script>

<template>
  <div
    class="p-5 bg-slate-900/30 backdrop-blur-sm border border-slate-800/80 rounded-2xl flex flex-col justify-between hover:border-slate-700/80 hover:bg-slate-900/60 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-[2px] transition-all duration-300 group relative cursor-pointer"
    @click="emit('select', job)"
  >
    <div>
      <div class="flex items-start gap-4 mb-4">
        <div 
          class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 bg-gradient-to-tr shadow-md"
          :class="logoGradient"
        >
          {{ logoText }}
        </div>
        <div class="flex-grow min-w-0 pr-10">
          <div class="flex justify-between items-start gap-2">
            <a
              :href="job.url"
              target="_blank"
              rel="noopener noreferrer"
              class="font-bold text-sm text-slate-100 group-hover:text-indigo-400 truncate transition-colors"
              :title="job.title"
              @click.stop="emit('visit', job)"
            >
              {{ job.title }}
            </a>
          </div>
          <p class="text-xs text-slate-400 mt-1 truncate" :title="job.location">
            {{ job.company ? `${job.company} • ` : '' }}{{ job.location }}
          </p>
        </div>
        <!-- Actions overlay -->
        <div class="flex items-center shrink-0 gap-1 absolute right-3 top-3 opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            title="Remove job"
            class="text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg p-1.5 transition-colors"
            @click.stop.prevent="emit('remove', job)"
          >
            <Trash2 :size="14" />
          </button>
          <button
            type="button"
            class="text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg p-1.5 transition-colors"
            @click.stop.prevent="emit('toggleFavorite', job)"
          >
            <Bookmark :size="15" :class="isFavorite ? 'fill-indigo-400 text-indigo-400' : ''" />
          </button>
        </div>
      </div>

      <div class="flex flex-wrap gap-1.5 mb-4">
        <span v-if="hasTailored" class="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-400">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Tailored Saved
        </span>
        <span v-if="visitedAt" class="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
          Visited
        </span>
      </div>
    </div>

    <div class="flex justify-between items-center gap-2 pt-3 border-t border-slate-905/30 mt-auto">
      <div class="flex flex-wrap gap-2">
        <a
          :href="job.url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[9px] px-3 py-1.5 font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/15 hover:bg-emerald-500 hover:text-slate-950 transition-colors flex items-center gap-1 shadow-sm"
          @click.stop="emit('apply', job)"
        >
          Apply <ExternalLink :size="11" />
        </a>
        <button
          type="button"
          class="text-[9px] px-3 py-1.5 font-bold tracking-wider uppercase bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/15 hover:bg-indigo-500 hover:text-white transition-colors"
          @click.stop="emit('select', job)"
        >
          Details
        </button>
      </div>
      <span v-if="salary" class="text-emerald-400 font-mono text-xs font-semibold whitespace-nowrap">{{ salary }}</span>
    </div>
  </div>
</template>
