<script setup lang="ts">
import { marked } from 'marked'
import { CV_FORMATS, buildCvFormatPreview, getCvFormat } from '~/shared/samples/cvFormats'

const model = defineModel<string>({ required: true })

const cvFormats = CV_FORMATS
const selected = computed(() => getCvFormat(model.value))
const previewMarkdown = computed(() => buildCvFormatPreview(model.value))
const previewHtml = computed(() => marked(previewMarkdown.value))

/** Stitch themes render via ResumeThemeRenderer; others use classic markdown layout. */
const usesThemeRenderer = computed(() => String(model.value || '').startsWith('the-'))

const previewShell = ref<HTMLElement | null>(null)
const pageScale = ref(0.42)
let resizeObserver: ResizeObserver | null = null

const PAGE_W = 794
const PAGE_H = 1123

function updateScale() {
  const el = previewShell.value
  if (!el || !import.meta.client) return
  const pad = 24
  const availW = Math.max(120, el.clientWidth - pad)
  const availH = Math.max(160, el.clientHeight - pad)
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
  resizeObserver = null
})

watch(model, async () => {
  await nextTick()
  updateScale()
})
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <label class="text-xs font-bold uppercase tracking-widest text-slate-500">
        CV format ({{ cvFormats.length }} options)
      </label>
      <p class="text-[11px] text-slate-500">
        Selected: <span class="text-slate-300">{{ selected.name }}</span>
      </p>
    </div>

    <div class="grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] items-stretch">
      <!-- Format list (scrolls independently) -->
      <div class="grid max-h-[min(70vh,48rem)] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-1 content-start">
        <button
          v-for="format in cvFormats"
          :key="format.id"
          type="button"
          class="rounded-xl border px-3 py-2.5 text-left transition-colors"
          :class="
            model === format.id
              ? 'border-blue-500 bg-blue-950/40 text-slate-100'
              : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
          "
          @click="model = format.id"
        >
          <p class="text-xs font-bold">{{ format.name }}</p>
          <p class="mt-0.5 text-[11px] leading-snug text-slate-400">{{ format.description }}</p>
          <p class="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{{ format.bestFor }}</p>
        </button>
      </div>

      <!-- Full A4 page preview — scaled to fit, no internal scroll -->
      <div class="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 flex flex-col min-h-[min(70vh,48rem)] h-full">
        <div class="flex items-center justify-between border-b border-slate-800 px-3 py-2 shrink-0">
          <p class="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Format preview
          </p>
          <p class="truncate text-[10px] text-slate-400">{{ selected.name }} · full page</p>
        </div>
        <div
          ref="previewShell"
          class="relative flex-1 min-h-[36rem] bg-slate-900/80 flex items-center justify-center overflow-hidden p-3"
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
              <ResumeThemeRenderer
                v-if="usesThemeRenderer"
                :markdown="previewMarkdown"
                :format-id="model"
              />
              <div
                v-else
                class="cv-format-preview p-10 text-[#1c1c1c]"
                v-html="previewHtml"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cv-format-preview {
  font-family: "Times New Roman", Times, Georgia, serif;
  line-height: 1.35;
}

.cv-format-preview :deep(h1) {
  margin: 0 0 0.2rem;
  font-size: 1.15rem;
  font-weight: 700;
  color: #1c1c1c;
}

.cv-format-preview :deep(h2) {
  margin: 0.75rem 0 0.25rem;
  border-bottom: 1px solid #b4b4b4;
  padding-bottom: 0.15rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1c1c1c;
}

.cv-format-preview :deep(h3) {
  margin: 0.5rem 0 0.1rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #1c1c1c;
}

.cv-format-preview :deep(p),
.cv-format-preview :deep(li) {
  margin: 0.15rem 0;
  font-size: 0.72rem;
  color: #222;
}

.cv-format-preview :deep(ul) {
  margin: 0.15rem 0 0.35rem;
  padding-left: 1.25rem;
  list-style-type: disc;
}

.cv-format-preview :deep(em) {
  color: #5a5a5a;
}

.cv-format-preview :deep(strong) {
  color: #1c1c1c;
  font-weight: 700;
}
</style>
