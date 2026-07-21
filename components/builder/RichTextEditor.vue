<script setup lang="ts">
import { prepareEditorHtml } from '~/utils/richText'

/**
 * Quill wrapper. External model updates (e.g. AI Enhance) are applied when the
 * editor is not focused. While typing we only emit Quill HTML — never re-paste
 * sanitized HTML back into Quill (that was clearing whole descriptions on delete).
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
  getQuill?: () => { root?: HTMLElement; getSelection?: () => unknown; setSelection?: (...args: unknown[]) => void }
}

const quillRef = ref<QuillApi | null>(null)
const ready = ref(false)
const syncing = ref(false)
const focused = ref(false)
/** Seed once for Quill; after ready, content is driven by pasteHTML / user input. */
const initialContent = ref(prepareEditorHtml(props.modelValue || '') || '')

function normalize(html?: string | null) {
  return String(html || '')
    .replace(/<p><br\s*\/?><\/p>/gi, '')
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function getEditorHtml(): string {
  try {
    return quillRef.value?.getHTML?.() || ''
  } catch {
    return ''
  }
}

function applyExternalHtml(html: string) {
  const editor = quillRef.value
  if (!editor || !ready.value) return

  const cleaned = prepareEditorHtml(html)
  syncing.value = true
  try {
    if (typeof editor.pasteHTML === 'function') {
      editor.pasteHTML(cleaned || '<p><br></p>', 'api')
    } else {
      editor.setHTML(cleaned || '')
    }
  } finally {
    window.setTimeout(() => {
      syncing.value = false
    }, 0)
  }
}

function onReady() {
  ready.value = true
  const desired = prepareEditorHtml(props.modelValue || '')
  if (normalize(getEditorHtml()) !== normalize(desired)) {
    applyExternalHtml(desired)
  }
}

watch(
  () => props.modelValue,
  (value) => {
    if (!ready.value || syncing.value || focused.value) return
    if (normalize(getEditorHtml()) === normalize(value)) return
    applyExternalHtml(value || '')
  },
)

function onUpdate(content?: string) {
  if (syncing.value) return
  // Prefer the event payload from Quill; fall back to getHTML.
  const html = typeof content === 'string' ? content : getEditorHtml()
  // Do NOT run prepareEditorHtml here — it rewrites lists/structure mid-edit and
  // can wipe the whole field when deleting a selection or characters.
  if (html === props.modelValue) return
  syncing.value = true
  emit('update:modelValue', html)
  nextTick(() => {
    syncing.value = false
  })
}

function onFocus() {
  focused.value = true
}

function onBlur(event: FocusEvent) {
  const root = event.currentTarget as HTMLElement | null
  const next = event.relatedTarget as Node | null
  // Ignore toolbar / internal Quill focus moves.
  if (root && next && root.contains(next)) return
  focused.value = false
  // Light cleanup only after the user leaves the field.
  const html = getEditorHtml()
  const cleaned = prepareEditorHtml(html)
  if (normalize(cleaned) !== normalize(props.modelValue)) {
    syncing.value = true
    emit('update:modelValue', cleaned)
    nextTick(() => {
      syncing.value = false
    })
  }
}
</script>

<template>
  <ClientOnly>
    <div class="builder-rich-text" @focusin="onFocus" @focusout="onBlur($event)">
      <QuillEditor
        ref="quillRef"
        theme="snow"
        content-type="html"
        :content="initialContent"
        :toolbar="[
          ['bold', 'italic', 'underline'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['clean'],
        ]"
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
