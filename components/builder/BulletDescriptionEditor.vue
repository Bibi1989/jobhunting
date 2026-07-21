<script setup lang="ts">
import { normalizeBulletListHtml, sanitizeInlineHtml } from '~/utils/richText'

/**
 * Bullet description editor with bold / italic / underline.
 * Uses a contenteditable list (not Quill) so delete/caret stay reliable,
 * while still storing clean <ul><li> HTML for PDF preview.
 */
const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    rows?: number
  }>(),
  {
    modelValue: '',
    placeholder: 'One achievement per line…',
    rows: 5,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const rootRef = ref<HTMLElement | null>(null)
const focused = ref(false)
const empty = ref(true)

function listHtmlFromModel(html?: string | null): string {
  const normalized = normalizeBulletListHtml(html || '')
  if (normalized) return normalized
  return '<ul><li><br></li></ul>'
}

function serializeEditor(): string {
  const root = rootRef.value
  if (!root) return ''
  const items = [...root.querySelectorAll(':scope > li')]
    .map((li) => sanitizeInlineHtml(li.innerHTML))
    .map((item) => item.replace(/^[-*•●▪◦]\s+/, '').trim())
    .filter((item) => item && item !== '<br>')
  if (!items.length) return ''
  return `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`
}

function applyDom(html?: string | null) {
  const root = rootRef.value
  if (!root) return
  root.innerHTML = listHtmlFromModel(html).replace(/^<ul>/i, '').replace(/<\/ul>$/i, '') || '<li><br></li>'
  empty.value = !serializeEditor()
}

function commit() {
  const html = serializeEditor()
  empty.value = !html
  if (html !== (props.modelValue || '')) {
    emit('update:modelValue', html)
  }
}

onMounted(() => {
  applyDom(props.modelValue)
  const html = serializeEditor()
  if (html !== (props.modelValue || '')) {
    emit('update:modelValue', html)
  }
})

watch(
  () => props.modelValue,
  (html) => {
    if (focused.value) return
    const next = normalizeBulletListHtml(html || '')
    const current = serializeEditor()
    if (next !== current) applyDom(html)
  },
)

function onFocus() {
  focused.value = true
}

function onBlur() {
  focused.value = false
  commit()
}

function onInput() {
  const root = rootRef.value
  if (root && !root.querySelector(':scope > li')) {
    root.innerHTML = '<li><br></li>'
  }
  commit()
}

function onKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && !event.altKey) {
    const key = event.key.toLowerCase()
    if (key === 'b') {
      event.preventDefault()
      runFormat('bold')
      return
    }
    if (key === 'i') {
      event.preventDefault()
      runFormat('italic')
      return
    }
    if (key === 'u') {
      event.preventDefault()
      runFormat('underline')
      return
    }
  }
}

function runFormat(command: 'bold' | 'italic' | 'underline') {
  rootRef.value?.focus()
  document.execCommand(command, false)
  commit()
}

function onToolbarMouseDown(event: MouseEvent, command: 'bold' | 'italic' | 'underline') {
  event.preventDefault()
  runFormat(command)
}

function onPaste(event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') || ''
  const html = event.clipboardData?.getData('text/html') || ''
  if (html && /<(strong|b|em|i|u)\b/i.test(html)) {
    const cleaned = sanitizeInlineHtml(html)
    document.execCommand('insertHTML', false, cleaned || escapeText(text))
  } else {
    document.execCommand('insertText', false, text)
  }
  commit()
}

function escapeText(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
</script>

<template>
  <div class="bullet-rich">
    <div class="bullet-rich__toolbar" role="toolbar" aria-label="Typography">
      <button
        type="button"
        class="bullet-rich__btn font-bold"
        title="Bold (⌘B)"
        @mousedown="onToolbarMouseDown($event, 'bold')"
      >
        B
      </button>
      <button
        type="button"
        class="bullet-rich__btn italic"
        title="Italic (⌘I)"
        @mousedown="onToolbarMouseDown($event, 'italic')"
      >
        I
      </button>
      <button
        type="button"
        class="bullet-rich__btn underline"
        title="Underline (⌘U)"
        @mousedown="onToolbarMouseDown($event, 'underline')"
      >
        U
      </button>
      <span class="bullet-rich__hint">Select text, then format · Enter for new bullet</span>
    </div>
    <div class="bullet-rich__body" :style="{ minHeight: `${Math.max(rows, 4) * 1.55}rem` }">
      <ul
        ref="rootRef"
        class="bullet-rich__editor"
        contenteditable="true"
        spellcheck="true"
        role="textbox"
        aria-multiline="true"
        :data-placeholder="placeholder"
        :data-empty="empty ? 'true' : 'false'"
        @focus="onFocus"
        @blur="onBlur"
        @input="onInput"
        @keydown="onKeydown"
        @paste="onPaste"
      />
    </div>
  </div>
</template>

<style scoped>
.bullet-rich {
  display: flex;
  flex-direction: column;
}
.bullet-rich__toolbar {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.25);
}
.bullet-rich__btn {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.35rem;
  border: 1px solid transparent;
  color: #cbd5e1;
  font-size: 0.8rem;
  line-height: 1;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.bullet-rich__btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
  color: #fff;
}
.bullet-rich__hint {
  margin-left: 0.35rem;
  font-size: 10px;
  color: #64748b;
}
.bullet-rich__body {
  padding: 0.55rem 0.65rem 0.75rem;
}
.bullet-rich__editor {
  margin: 0;
  padding: 0 0 0 1.15rem;
  min-height: inherit;
  color: #e2e8f0;
  font-size: 0.875rem;
  line-height: 1.55;
  outline: none;
  list-style: disc;
}
.bullet-rich__editor :deep(li) {
  margin: 0 0 0.2rem;
  padding-left: 0.15rem;
}
.bullet-rich__editor :deep(strong),
.bullet-rich__editor :deep(b) {
  font-weight: 700;
  color: #f8fafc;
}
.bullet-rich__editor :deep(em),
.bullet-rich__editor :deep(i) {
  font-style: italic;
}
.bullet-rich__editor :deep(u) {
  text-decoration: underline;
  text-underline-offset: 2px;
}
.bullet-rich__editor[data-empty='true']:before {
  content: attr(data-placeholder);
  color: #64748b;
  font-style: italic;
  pointer-events: none;
  display: block;
  margin-left: -1.15rem;
  margin-bottom: -1.55em;
}
</style>
