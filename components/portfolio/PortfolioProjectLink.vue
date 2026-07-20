<script setup lang="ts">
import type { PortfolioProject } from '~/shared/types/portfolio'
import { absoluteUrl } from '~/shared/types/portfolio'

const props = defineProps<{
  project: PortfolioProject
  index?: number
}>()

const href = computed(() => absoluteUrl(props.project.url))
const anchor = computed(() => `project-${(props.index ?? 0) + 1}`)
</script>

<template>
  <a
    v-if="href"
    :id="anchor"
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    class="group block outline-none"
  >
    <slot :has-link="true" />
  </a>
  <article v-else :id="anchor" class="group block">
    <slot :has-link="false" />
  </article>
</template>
