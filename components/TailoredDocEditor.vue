<script setup lang="ts">
import { marked } from 'marked'
import { Eye, Pencil } from 'lucide-vue-next'

const props = defineProps<{
  title: string
  modelValue: string
  editing?: boolean
  minHeightClass?: string
  /** When set (e.g. the-corporate), preview uses ResumeThemeRenderer full page. */
  formatId?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:editing': [value: boolean]
}>()

const html = computed(() => (props.modelValue ? marked(props.modelValue) : ''))
const usesThemeRenderer = computed(() => String(props.formatId || '').startsWith('the-'))

const previewShell = ref<HTMLElement | null>(null)
const pageScale = ref(0.5)
const PAGE_W = 794
const PAGE_H = 1123
let resizeObserver: ResizeObserver | null = null

function updateScale() {
  const el = previewShell.value
  if (!el || !import.meta.client) return
  const pad = 24
  const availW = Math.max(120, el.clientWidth - pad)
  const availH = Math.max(200, el.clientHeight - pad)
  pageScale.value = Math.min(availW / PAGE_W, availH / PAGE_H, 1)
}

onMounted(() => {
  updateScale()
  if (!import.meta.client || typeof ResizeObserver === 'undefined') return
  resizeObserver = new ResizeObserver(() => updateScale())
  if (previewShell.value) resizeObserver.observe(previewShell.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

watch(
  () => [props.formatId, props.modelValue, props.editing] as const,
  async () => {
    await nextTick()
    updateScale()
  },
)
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
      <h3 class="text-xs font-bold uppercase tracking-widest text-emerald-400">{{ title }}</h3>
      <div class="flex items-center gap-2">
        <slot name="actions" />
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold"
          :class="
            editing
              ? 'border-blue-500 bg-blue-950/40 text-blue-300'
              : 'border-slate-700 text-slate-300 hover:border-slate-500'
          "
          @click="emit('update:editing', true)"
        >
          <Pencil :size="12" /> Edit
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold"
          :class="
            !editing
              ? 'border-blue-500 bg-blue-950/40 text-blue-300'
              : 'border-slate-700 text-slate-300 hover:border-slate-500'
          "
          @click="emit('update:editing', false)"
        >
          <Eye :size="12" /> Preview
        </button>
      </div>
    </div>

    <textarea
      v-if="editing"
      :value="modelValue"
      :class="minHeightClass || 'min-h-[18rem]'"
      class="w-full bg-slate-950/50 px-4 py-4 font-mono text-sm leading-relaxed text-slate-200 outline-none border-t border-slate-800/80 focus:bg-slate-950/80 transition-colors"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <div
      v-else-if="usesThemeRenderer"
      ref="previewShell"
      class="relative min-h-[36rem] max-h-[min(70vh,48rem)] overflow-hidden bg-slate-900/80 flex items-center justify-center p-4 border-t border-slate-800"
    >
      <div
        class="relative shadow-2xl shadow-black/40 bg-white overflow-hidden"
        :style="{
          width: `${PAGE_W * pageScale}px`,
          height: `${PAGE_H * pageScale}px`,
        }"
      >
        <div
          class="absolute top-0 left-0 origin-top-left bg-white pointer-events-none"
          :style="{
            width: `${PAGE_W}px`,
            minHeight: `${PAGE_H}px`,
            transform: `scale(${pageScale})`,
          }"
        >
          <ResumeThemeRenderer :markdown="modelValue" :format-id="formatId" />
        </div>
      </div>
    </div>
    <div
      v-else
      :class="minHeightClass || 'min-h-[18rem]'"
      class="tailored-preview max-h-[28rem] overflow-y-auto bg-white p-6 md:p-8 text-slate-800 border-t border-slate-100 shadow-inner select-text"
      v-html="html"
    />
  </div>
</template>

<style scoped>
.tailored-preview {
  font-family: 'Plus Jakarta Sans', Georgia, serif;
  line-height: 1.6;
}

.tailored-preview :deep(h1) {
  margin: 0 0 0.5rem;
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  text-align: center;
}

.tailored-preview :deep(h2) {
  margin: 1.25rem 0 0.5rem;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.25rem;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #4f46e5;
}

.tailored-preview :deep(h3) {
  margin: 0.85rem 0 0.25rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
}

.tailored-preview :deep(p),
.tailored-preview :deep(li) {
  margin: 0.35rem 0;
  font-size: 0.85rem;
  color: #334155;
}

.tailored-preview :deep(ul) {
  margin: 0.25rem 0 0.75rem;
  padding-left: 1.25rem;
  list-style-type: disc;
}
</style>
