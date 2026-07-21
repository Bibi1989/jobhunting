<script setup lang="ts">
import type { PortfolioExperience } from '~/shared/types/portfolio'
import { sanitizeRichTextHtml } from '~/utils/richText'

const props = withDefaults(
  defineProps<{
    title: string
    items: PortfolioExperience[]
    /** Visual tone for dark vs light portfolio canvases. */
    tone?: 'light' | 'dark'
  }>(),
  { tone: 'light' },
)

function dateLabel(role: PortfolioExperience) {
  const start = role.start_date?.trim()
  const end = role.is_current ? 'Present' : role.end_date?.trim()
  if (start && end) return `${start} – ${end}`
  return start || end || ''
}

function isRichDescription(description?: string) {
  return Boolean(description && /<[a-z][\s\S]*>/i.test(description))
}

function descriptionHtml(description?: string) {
  return sanitizeRichTextHtml(description || '')
}

const isDark = computed(() => props.tone === 'dark')
</script>

<template>
  <section
    id="experience"
    class="px-6 py-20"
    :class="isDark ? 'border-t border-white/10' : 'border-t border-primary-200/60'"
  >
    <div class="mx-auto max-w-6xl">
      <p
        class="mb-3 text-sm font-semibold uppercase tracking-wider"
        :class="isDark ? 'text-cyan-300/80' : 'text-primary-600'"
      >
        Experience
      </p>
      <h2
        class="text-3xl font-extrabold tracking-tight sm:text-4xl mb-12"
        :class="isDark ? 'text-white' : 'text-primary-900'"
      >
        {{ title }}
      </h2>

      <div class="space-y-10">
        <article
          v-for="(role, index) in items"
          :key="`${role.title}-${role.company}-${index}`"
          class="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start"
        >
          <div class="min-w-0">
            <h3
              class="text-xl font-bold"
              :class="isDark ? 'text-white' : 'text-primary-900'"
            >
              {{ role.title || 'Role' }}
            </h3>
            <p
              class="mt-1 text-sm font-semibold"
              :class="isDark ? 'text-slate-300' : 'text-primary-700'"
            >
              {{ role.company }}
              <span v-if="role.location" class="font-normal opacity-70"> · {{ role.location }}</span>
            </p>

            <div
              v-if="role.description && isRichDescription(role.description)"
              class="experience-desc mt-3 text-sm leading-relaxed"
              :class="isDark ? 'text-slate-400' : 'text-primary-600'"
              v-html="descriptionHtml(role.description)"
            />
            <p
              v-else-if="role.description"
              class="mt-3 text-sm leading-relaxed whitespace-pre-wrap"
              :class="isDark ? 'text-slate-400' : 'text-primary-600'"
            >
              {{ role.description }}
            </p>

            <ul
              v-if="role.highlights?.length"
              class="mt-3 space-y-1.5 text-sm"
              :class="isDark ? 'text-slate-400' : 'text-primary-600'"
            >
              <li
                v-for="(item, hi) in role.highlights"
                :key="hi"
                class="flex gap-2"
              >
                <span class="shrink-0 opacity-50">•</span>
                <span>{{ item }}</span>
              </li>
            </ul>

            <div
              v-if="role.tech_stack?.length"
              class="mt-4 flex flex-wrap gap-2"
            >
              <span
                v-for="tech in role.tech_stack"
                :key="tech"
                class="rounded-md px-2.5 py-1 text-xs font-medium"
                :class="isDark
                  ? 'bg-white/10 text-slate-200'
                  : 'bg-primary-100 text-primary-800'"
              >
                {{ tech }}
              </span>
            </div>
          </div>
          <p
            v-if="dateLabel(role)"
            class="text-xs font-semibold uppercase tracking-wider shrink-0 sm:text-right"
            :class="isDark ? 'text-slate-500' : 'text-primary-500'"
          >
            {{ dateLabel(role) }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.experience-desc :deep(p) {
  margin: 0 0 0.5rem;
}
.experience-desc :deep(p:last-child) {
  margin-bottom: 0;
}
.experience-desc :deep(ul),
.experience-desc :deep(ol) {
  margin: 0.35rem 0 0;
  padding-left: 1.15rem;
  list-style: disc;
}
.experience-desc :deep(ol) {
  list-style: decimal;
}
.experience-desc :deep(li) {
  margin: 0.15rem 0;
}
.experience-desc :deep(strong),
.experience-desc :deep(b) {
  font-weight: 700;
}
.experience-desc :deep(em),
.experience-desc :deep(i) {
  font-style: italic;
}
</style>
