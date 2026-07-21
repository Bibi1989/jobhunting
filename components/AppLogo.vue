<script setup lang="ts">
/**
 * JobFlow wordmark — gradient “j” mark + title.
 */
const props = withDefaults(
  defineProps<{
    to?: string
    showTagline?: boolean
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    to: '/',
    showTagline: true,
    size: 'md',
  },
)

const markClass = computed(() => {
  if (props.size === 'sm') return 'w-8 h-8 text-base rounded-lg'
  if (props.size === 'lg') return 'w-12 h-12 text-2xl rounded-2xl'
  return 'w-10 h-10 text-xl rounded-xl'
})

const titleClass = computed(() => {
  if (props.size === 'sm') return 'text-lg'
  if (props.size === 'lg') return 'text-3xl'
  return 'text-xl md:text-2xl'
})
</script>

<template>
  <NuxtLink :to="to" class="flex items-center gap-3 min-w-0 group">
    <div
      class="jobflow-mark shrink-0 flex items-center justify-center font-bold lowercase text-white select-none"
      :class="markClass"
      aria-hidden="true"
    >
      j
    </div>
    <div class="min-w-0 leading-tight">
      <p class="font-extrabold tracking-tight truncate" :class="titleClass">
        <span class="text-white">Job</span><span class="text-[#d8b4fe] group-hover:text-[#e9d5ff] transition-colors">Flow</span>
      </p>
      <p
        v-if="showTagline"
        class="text-[9px] font-mono text-slate-500 uppercase tracking-widest -mt-0.5 hidden sm:block"
      >
        Intelligent Job Hub
      </p>
    </div>
  </NuxtLink>
</template>

<style scoped>
.jobflow-mark {
  background: linear-gradient(135deg, #f472b6 0%, #a855f7 48%, #6d28d9 100%);
  box-shadow: 0 0 22px rgba(168, 85, 247, 0.35);
}
</style>
