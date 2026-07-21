<script setup lang="ts">
import { sanitizeRichTextHtml } from '~/utils/richText'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  content?: string
}>()

const attrs = useAttrs()

const isRich = computed(() => Boolean(props.content && /<[a-z][\s\S]*>/i.test(props.content)))
const html = computed(() => sanitizeRichTextHtml(props.content || ''))
</script>

<template>
  <div
    v-if="content && isRich"
    class="portfolio-rich-text"
    v-bind="attrs"
    v-html="html"
  />
  <p
    v-else-if="content"
    class="whitespace-pre-wrap"
    v-bind="attrs"
  >
    {{ content }}
  </p>
</template>

<style scoped>
.portfolio-rich-text :deep(p) {
  margin: 0 0 0.5rem;
}
.portfolio-rich-text :deep(p:last-child) {
  margin-bottom: 0;
}
.portfolio-rich-text :deep(ul),
.portfolio-rich-text :deep(ol) {
  margin: 0.35rem 0 0;
  padding-left: 1.15rem;
  list-style: disc;
}
.portfolio-rich-text :deep(ol) {
  list-style: decimal;
}
.portfolio-rich-text :deep(li) {
  margin: 0.15rem 0;
}
.portfolio-rich-text :deep(strong),
.portfolio-rich-text :deep(b) {
  font-weight: 700;
}
.portfolio-rich-text :deep(em),
.portfolio-rich-text :deep(i) {
  font-style: italic;
}
</style>
