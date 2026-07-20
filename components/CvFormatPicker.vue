<script setup lang="ts">
import { marked } from 'marked'
import { CV_FORMATS, buildCvFormatPreview, getCvFormat } from '~/shared/samples/cvFormats'

const model = defineModel<string>({ required: true })

const cvFormats = CV_FORMATS
const selected = computed(() => getCvFormat(model.value))
const previewMarkdown = computed(() => buildCvFormatPreview(model.value))
const previewHtml = computed(() => marked(previewMarkdown.value))
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

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
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

      <div class="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">
        <div class="flex items-center justify-between border-b border-slate-800 px-3 py-2">
          <p class="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Format preview
          </p>
          <p class="truncate text-[10px] text-slate-400">{{ selected.name }}</p>
        </div>
        <div class="max-h-72 overflow-y-auto bg-[#f7f4ef] p-4">
          <div class="cv-format-preview origin-top scale-[0.92] text-[#1c1c1c]" v-html="previewHtml" />
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
