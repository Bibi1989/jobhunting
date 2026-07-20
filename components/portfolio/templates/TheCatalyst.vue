<script setup lang="ts">
import { portfolioContactCta } from '~/composables/usePortfolioContact'
import type { PortfolioProfileData } from '~/shared/types/portfolio'
import { orderedBodySections } from '~/shared/types/portfolio'

const props = defineProps<{ data: PortfolioProfileData }>()

const sections = computed(() =>
  orderedBodySections(props.data, { projects: 'Case Studies', skills: 'The growth toolkit' }),
)

const initials = computed(() => {
  const parts = props.data.full_name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
})

const primaryCta = computed(() => portfolioContactCta())

/** Bar heights derived from project/skill counts so the chart reflects real data shape. */
const growthBars = computed(() => {
  const projectCount = props.data.formatted_projects?.length ?? 0
  const skillCount = props.data.core_skills?.length ?? 0
  const base = [28, 40, 34, 52, 61, 55, 74, 88, 100]
  const scale = Math.min(1.15, 0.55 + (projectCount + skillCount) * 0.05)
  return base.map((h, i) => Math.round(Math.min(100, h * scale * (0.9 + (i % 3) * 0.05))))
})

const growthLabels = computed(() => {
  const projects = props.data.formatted_projects ?? []
  const skills = props.data.core_skills ?? []
  return growthBars.value.map((_, i) => {
    if (projects[i % Math.max(projects.length, 1)]) {
      return projects[i % projects.length]!.title.slice(0, 12)
    }
    return skills[i % Math.max(skills.length, 1)]?.slice(0, 10) || `Q${i + 1}`
  })
})

const leadFocusLabel = computed(() => {
  const skill = props.data.core_skills?.[0]
  if (skill) return skill.length > 12 ? skill.slice(0, 11) + '…' : skill
  return 'Full-Funnel'
})

const statTiles = computed(() => [
  {
    value: String(props.data.formatted_projects?.length ?? 0),
    label: 'Case Studies',
    icon: 'trending_up',
  },
  {
    value: String(props.data.core_skills?.length ?? 0),
    label: 'Growth Levers',
    icon: 'bolt',
  },
  {
    value: leadFocusLabel.value,
    label: 'Lead Focus',
    icon: 'target',
  },
])
</script>

<template>
  <div id="top" class="min-h-screen bg-white text-primary-900">
    <!-- Nav -->
    <header class="sticky top-0 z-50 border-b border-primary-200 bg-white/90 backdrop-blur">
      <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#top" class="flex items-center gap-2 text-base font-bold tracking-tight text-primary-900">
          <span
            class="flex h-8 w-8 items-center justify-center rounded-md bg-primary-500 text-xs font-bold text-white"
          >
            {{ initials }}
          </span>
          {{ data.full_name }}
        </a>
        <div class="hidden items-center gap-8 text-sm font-semibold text-primary-600 sm:flex">
          <a href="#work" class="transition-colors hover:text-primary-600">{{ data.button_texts?.nav_projects || 'Work' }}</a>
          <a href="#skills" class="transition-colors hover:text-primary-600">{{ data.button_texts?.nav_skills || 'Skills' }}</a>
          <a href="#contact" class="transition-colors hover:text-primary-600">{{ data.button_texts?.contact_cta || data.cta_text || 'Contact' }}</a>
        </div>
        <a
          :href="primaryCta.href"
          :target="primaryCta.external ? '_blank' : undefined"
          :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
          class="rounded-md bg-primary-500 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-green-500/30 transition-colors hover:bg-primary-600"
        >
          Let's talk
        </a>
      </nav>
    </header>

    <!-- Hero -->
    <section class="relative overflow-hidden border-b border-primary-200 px-6 py-20 sm:py-28">
      <div
        class="pointer-events-none absolute inset-x-0 top-0 -z-0 h-80 bg-gradient-to-b from-primary-500/10 via-primary-400/5 to-transparent"
      />
      <div class="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p class="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary-600">
            <span class="material-symbols-outlined text-sm">rocket_launch</span>
            Growth &amp; Marketing Leadership
          </p>
          <h1 class="text-4xl font-extrabold leading-tight tracking-tight text-primary-900 sm:text-5xl">
            Data-Driven Growth for
            <span class="text-primary-500">Market Leaders</span>
          </h1>
          <p v-if="data.professional_bio" class="mt-6 max-w-xl text-base leading-relaxed text-primary-600">
            {{ data.professional_bio }}
          </p>
          <div class="mt-8 flex flex-wrap items-center gap-4">
            <a
              :href="primaryCta.href"
              :target="primaryCta.external ? '_blank' : undefined"
              :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
              class="rounded-md bg-primary-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-green-500/30 transition-colors hover:bg-primary-600"
            >
              Start growing today
            </a>
            <a
              href="#work"
              class="rounded-md border border-primary-300 px-6 py-3 text-sm font-bold text-primary-700 transition-colors hover:border-primary-500 hover:text-primary-600"
            >
              See the case studies
            </a>
          </div>

          <!-- Stat tiles derived from data counts -->
          <div class="mt-10 grid grid-cols-3 gap-4">
            <div
              v-for="tile in statTiles"
              :key="tile.label"
              class="rounded-lg border border-primary-200 bg-primary-50 p-4 text-center"
            >
              <span class="material-symbols-outlined mb-1 inline-block text-xl text-primary-500">{{ tile.icon }}</span>
              <p class="text-xl font-extrabold text-primary-900" style="font-family:'JetBrains Mono',monospace">
                {{ tile.value }}
              </p>
              <p class="mt-1 text-[11px] font-semibold uppercase tracking-wide text-primary-500">{{ tile.label }}</p>
            </div>
          </div>
        </div>

        <!-- Growth visual: CSS bar chart labeled from projects/skills -->
        <div class="rounded-2xl border border-primary-200 bg-primary-50 p-8 shadow-sm">
          <div class="mb-6 flex items-center justify-between">
            <p class="text-sm font-bold text-primary-700">Momentum Curve</p>
            <span class="material-symbols-outlined text-primary-500">show_chart</span>
          </div>
          <div class="flex h-48 items-end gap-2 sm:gap-3">
            <div
              v-for="(height, idx) in growthBars"
              :key="idx"
              class="group/bar relative flex flex-1 flex-col items-center justify-end"
            >
              <div
                class="w-full rounded-t-md bg-gradient-to-t from-primary-500 to-primary-400 transition-transform group-hover/bar:scale-105"
                :style="{ height: height + '%' }"
              />
            </div>
          </div>
          <div class="mt-3 flex gap-2 sm:gap-3">
            <p
              v-for="(label, idx) in growthLabels.slice(0, 9)"
              :key="idx"
              class="flex-1 truncate text-center text-[9px] font-semibold uppercase tracking-wide text-primary-400"
              style="font-family:'JetBrains Mono',monospace"
              :title="label"
            >
              {{ label }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <template v-for="section in sections" :key="section.key">
      <!-- Work -->
      <section
        v-if="section.kind === 'projects'"
        id="work"
        class="border-b border-primary-200 px-6 py-24"
      >
        <div class="mx-auto max-w-6xl">
          <div class="mb-12">
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-primary-600">
              Case Studies
            </p>
            <h2 class="text-3xl font-extrabold text-primary-900 sm:text-4xl">
              {{ section.title === 'Case Studies' ? 'Campaigns that moved the numbers.' : section.title }}
            </h2>
          </div>

          <div
            v-if="data.formatted_projects?.length"
            class="grid gap-6 sm:grid-cols-2"
          >
            <PortfolioProjectLink
              v-for="(project, idx) in data.formatted_projects"
              :key="project.title + idx"
              :project="project"
              :index="idx"
              v-slot="{ hasLink }"
            >
              <div
                class="h-full rounded-xl border border-primary-200 bg-white p-6 shadow-sm transition-all group-hover:-translate-y-1 group-hover:border-primary-500/50 group-hover:shadow-lg"
              >
                <div class="mb-3 flex items-center justify-between">
                  <p class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary-600">
                    <span class="material-symbols-outlined text-sm">campaign</span>
                    Case Study {{ String(idx + 1).padStart(2, '0') }}
                  </p>
                  <span
                    v-if="hasLink"
                    class="material-symbols-outlined text-primary-600"
                    aria-hidden="true"
                  >
                    open_in_new
                  </span>
                  <span
                    v-else
                    class="rounded-full bg-primary-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-600"
                  >
                    Outcome
                  </span>
                </div>
                <h3 class="text-lg font-bold text-primary-900">{{ project.title }}</h3>
                <p v-if="project.description" class="mt-2 text-sm leading-relaxed text-primary-600">
                  {{ project.description }}
                </p>
                <div v-if="project.tech_stack?.length" class="mt-5 flex flex-wrap gap-2">
                  <span
                    v-for="tech in project.tech_stack"
                    :key="tech"
                    class="rounded-full bg-primary-500/10 px-3 py-1 text-xs font-bold text-primary-700"
                  >
                    {{ tech }}
                  </span>
                </div>
                <p v-if="hasLink" class="mt-4 text-sm font-bold text-primary-600">
                  Open project →
                </p>
              </div>
            </PortfolioProjectLink>
          </div>
        </div>
      </section>

      <!-- Skills -->
      <section
        v-else-if="section.kind === 'skills'"
        id="skills"
        class="border-b border-primary-200 bg-primary-50 px-6 py-24"
      >
        <div class="mx-auto max-w-6xl">
          <p class="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-primary-600">
            Capabilities
          </p>
          <h2 class="text-3xl font-extrabold text-primary-900 sm:text-4xl">
            {{ section.title }}
          </h2>

          <div v-if="data.core_skills?.length" class="mt-10 flex flex-wrap gap-3">
            <span
              v-for="skill in data.core_skills"
              :key="skill"
              class="flex items-center gap-2 rounded-full border border-primary-200 bg-white px-4 py-2 text-sm font-bold text-primary-700 shadow-sm transition-colors hover:border-primary-500 hover:text-primary-600"
            >
              <span class="material-symbols-outlined text-sm text-primary-500">check_circle</span>
              {{ skill }}
            </span>
          </div>
        </div>
      </section>

      <!-- Custom -->
      <section
        v-else-if="section.custom && section.custom.content?.trim()"
        :id="`section-${section.key}`"
        class="border-b border-primary-200 px-6 py-24"
      >
        <div class="mx-auto max-w-6xl">
          <p class="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-primary-600">
            {{ section.title }}
          </p>
          <h2 class="text-3xl font-extrabold text-primary-900 sm:text-4xl">
            {{ section.title }}
          </h2>
          <div class="mt-8 max-w-3xl space-y-4 text-sm leading-relaxed text-primary-600">
            <p
              v-for="(paragraph, pIdx) in section.custom.content.split(/\n{2,}/)"
              :key="pIdx"
            >
              {{ paragraph.trim() }}
            </p>
          </div>
        </div>
      </section>
    </template>

    <!-- Contact / Footer CTA band -->
    <footer id="contact" class="relative overflow-hidden bg-primary-500 px-6 py-24 text-white">
      <div
        class="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-400/40 via-transparent to-primary-600/30"
      />
      <div class="relative mx-auto max-w-3xl text-center">
        <p class="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-white/80">
          Let's grow together
        </p>
        <h2 class="text-3xl font-extrabold sm:text-4xl">
          Ready to dominate your market?
        </h2>
        <p class="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/90">
          Open to growth strategy, demand generation, and go-to-market engagements
          &mdash; let's put a plan in motion.
        </p>
        <a
          :href="primaryCta.href"
          :target="primaryCta.external ? '_blank' : undefined"
          :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
          class="mt-8 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-bold text-primary-600 shadow-lg transition-transform hover:scale-105"
        >
          <span class="material-symbols-outlined text-base">mail</span>
          Get in touch
        </a>

        <PortfolioContactLinks
          :data="data"
          variant="pills"
          class-name="mt-10 justify-center text-white [&_a]:border-white/40 [&_a]:bg-white/15"
        />

        <div class="mt-16 flex items-center justify-center gap-3 text-xs text-white/80">
          <span
            class="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[11px] font-bold text-primary-600"
          >
            {{ initials }}
          </span>
          <span>{{ data.full_name }} &mdash; Growth &amp; Marketing</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped></style>
