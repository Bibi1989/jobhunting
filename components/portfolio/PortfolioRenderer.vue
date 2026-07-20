<script setup lang="ts">
import type { Component } from 'vue'
import type { PortfolioProfileData } from '~/shared/types/portfolio'
import { DEFAULT_TEMPLATE_SLUG } from '~/shared/types/portfolio'

import TheVisionary from './templates/TheVisionary.vue'
import TheMinimalist from './templates/TheMinimalist.vue'
import TheArchitect from './templates/TheArchitect.vue'
import TheDirector from './templates/TheDirector.vue'
import TheLeader from './templates/TheLeader.vue'
import TheStrategist from './templates/TheStrategist.vue'
import TheCreator from './templates/TheCreator.vue'
import TheInvestigator from './templates/TheInvestigator.vue'
import TheBuilder from './templates/TheBuilder.vue'
import TheCatalyst from './templates/TheCatalyst.vue'

const props = defineProps<{
  slug: string
  data: PortfolioProfileData
}>()

const registry: Record<string, Component> = {
  'the-visionary': TheVisionary,
  'the-minimalist': TheMinimalist,
  'the-architect': TheArchitect,
  'the-director': TheDirector,
  'the-leader': TheLeader,
  'the-strategist': TheStrategist,
  'the-creator': TheCreator,
  'the-investigator': TheInvestigator,
  'the-builder': TheBuilder,
  'the-catalyst': TheCatalyst,
}

const resolved = computed<Component>(
  () => registry[props.slug] ?? registry[DEFAULT_TEMPLATE_SLUG]!,
)
const themeClass = computed(() => `theme-${props.data.theme_color || 'emerald'}`)
</script>

<template>
  <div :class="themeClass">
    <component :is="resolved" :data="data" />
  </div>
</template>
