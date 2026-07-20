<script setup lang="ts">
import { prepareEditorHtml } from '~/utils/richText'

/**
 * Quill wrapper that keeps the editor in sync when modelValue is changed
 * programmatically (e.g. AI Enhance). Stock QuillEditor often leaves the
 * toolbar empty while Vue state / preview already has the new HTML.
 */
const props = withDefaults(
  defineProps<{
    modelValue?: string
    editorClass?: string
  }>(),
  {
    modelValue: '',
    editorClass: 'min-h-[150px]',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

type QuillApi = {
  setHTML: (html: string) => void
  getHTML: () => string
  pasteHTML: (html: string, source?: string) => void
}

const quillRef = ref<QuillApi | null>(null)
const ready = ref(false)
const syncing = ref(false)

function normalize(html?: string | null) {
  const value = String(html || '')
    .replace(/<p><br\s*\/?><\/p>/gi, '')
    .replace(/<p>\s*<\/p>/gi, '')
    .trim()
  return value
}

function applyHtml(html: string, emitCleaned = false) {
  const editor = quillRef.value
  if (!editor || !ready.value) return

  const cleaned = prepareEditorHtml(html)
  syncing.value = true
  try {
    if (typeof editor.pasteHTML === 'function') {
      editor.pasteHTML(cleaned || '', 'api')
    } else {
      editor.setHTML(cleaned || '')
    }
    if (emitCleaned && normalize(cleaned) !== normalize(props.modelValue)) {
      emit('update:modelValue', cleaned)
    }
  } finally {
    window.setTimeout(() => {
      syncing.value = false
    }, 0)
  }
}

function onReady() {
  ready.value = true
  applyHtml(props.modelValue || '', true)
}

watch(
  () => props.modelValue,
  (value) => {
    if (!ready.value || syncing.value) return
    let current = ''
    try {
      current = quillRef.value?.getHTML() || ''
    } catch {
      return
    }
    if (normalize(current) === normalize(value)) return
    applyHtml(value || '')
  },
)

function onUpdate() {
  if (syncing.value) return
  const editor = quillRef.value
  const html = editor && typeof editor.getHTML === 'function' ? editor.getHTML() : ''
  const cleaned = prepareEditorHtml(html)
  if (normalize(cleaned) === normalize(props.modelValue)) return
  emit('update:modelValue', cleaned)
}
</script>

<template>
  <ClientOnly>
    <div class="builder-rich-text">
      <QuillEditor
        ref="quillRef"
        theme="snow"
        content-type="html"
        :content="modelValue || ''"
        class="ql-editor-custom"
        :class="editorClass"
        @ready="onReady"
        @update:content="onUpdate"
      />
    </div>
    <template #fallback>
      <div
        class="rounded border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-500"
        :class="editorClass"
      >
        Loading editor…
      </div>
    </template>
  </ClientOnly>
</template>

<style scoped>
.builder-rich-text :deep(.ql-toolbar.ql-snow) {
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(0, 0, 0, 0.25);
}
.builder-rich-text :deep(.ql-container.ql-snow) {
  border: none;
  font-family: inherit;
  font-size: 0.875rem;
  background: transparent;
  resize: vertical;
  overflow-y: auto;
}
.builder-rich-text :deep(.ql-editor) {
  color: #e2e8f0 !important;
  background: transparent !important;
  min-height: inherit;
}
.builder-rich-text :deep(.ql-editor *),
.builder-rich-text :deep(.ql-editor p),
.builder-rich-text :deep(.ql-editor li),
.builder-rich-text :deep(.ql-editor span) {
  background-color: transparent !important;
  background-image: none !important;
  color: inherit !important;
}
.builder-rich-text :deep(.ql-editor.ql-blank::before) {
  color: #64748b;
  font-style: italic;
}
/* Quill 2 already draws bullets via .ql-ui:before — don't add CSS list markers */
.builder-rich-text :deep(.ql-editor ul),
.builder-rich-text :deep(.ql-editor ol) {
  list-style: none !important;
  padding-left: 0.25rem;
  margin: 0;
}
.builder-rich-text :deep(.ql-editor li) {
  list-style: none !important;
  padding-left: 1.35rem;
  position: relative;
}
.builder-rich-text :deep(.ql-snow .ql-stroke) {
  stroke: #94a3b8;
}
.builder-rich-text :deep(.ql-snow .ql-fill) {
  fill: #94a3b8;
}
.builder-rich-text :deep(.ql-snow .ql-picker) {
  color: #94a3b8;
}
.builder-rich-text :deep(.ql-snow .ql-picker-options) {
  background-color: #1e293b;
  border-color: rgba(255, 255, 255, 0.1);
}
</style>
