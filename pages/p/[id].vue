<script setup lang="ts">
import type { Portfolio } from '~/shared/types/portfolio'
import { getPortfolioTemplate } from '~/shared/types/portfolio'

// Public, chrome-free hosted portfolio. Point a custom domain at /p/:id to host.
definePageMeta({ layout: false })

const route = useRoute()
const id = computed(() => String(route.params.id))

const { data, error } = await useFetch<{ portfolio: Portfolio }>(
  () => `/api/portfolio/public/${id.value}`,
)

const portfolio = computed(() => data.value?.portfolio ?? null)

useHead(() => {
  const p = portfolio.value
  if (!p) return { title: 'Portfolio' }
  const template = getPortfolioTemplate(p.templateSlug)
  return {
    title: `${p.profileData.full_name} — Portfolio`,
    meta: [
      {
        name: 'description',
        content: p.profileData.professional_bio?.slice(0, 160) || `Portfolio · ${template.name}`,
      },
    ],
  }
})
</script>

<template>
  <div>
    <template v-if="portfolio">
      <PortfolioRenderer :slug="portfolio.templateSlug" :data="portfolio.profileData" />
      <PortfolioContactModal
        :portfolio-id="portfolio.id"
        :owner-name="portfolio.profileData.full_name"
        :owner-email="portfolio.profileData.email"
      />
    </template>
    <div
      v-else
      class="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 text-slate-200 px-6 text-center"
    >
      <p class="text-2xl font-semibold">Portfolio not found</p>
      <p class="text-slate-400">
        {{ (error as any)?.statusMessage || 'This portfolio may have been removed or the link is incorrect.' }}
      </p>
      <NuxtLink to="/" class="mt-2 rounded-lg bg-indigo-500 px-5 py-2.5 font-semibold text-white hover:bg-indigo-400">
        Go home
      </NuxtLink>
    </div>
  </div>
</template>
