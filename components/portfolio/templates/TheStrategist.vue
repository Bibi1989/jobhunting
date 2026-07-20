<script setup lang="ts">
import { portfolioContactCta } from '~/composables/usePortfolioContact'
import { absoluteUrl, mailtoHref, orderedBodySections, type PortfolioProfileData } from '~/shared/types/portfolio'

const props = defineProps<{ data: PortfolioProfileData }>()

const sections = computed(() =>
  orderedBodySections(props.data, { projects: 'Selected Work', skills: 'Toolkit' }),
)

const initials = computed(() => {
  const parts = props.data.full_name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
})

const primaryCta = computed(() => portfolioContactCta())

const kpiTiles = computed(() => [
  {
    value: String(props.data.formatted_projects?.length ?? 0),
    label: 'Projects Shipped',
    icon: 'rocket_launch',
  },
  {
    value: String(props.data.core_skills?.length ?? 0),
    label: 'Core Skills',
    icon: 'workspace_premium',
  },
  {
    value: 'E2E',
    label: 'End-to-end Ownership',
    icon: 'route',
  },
  {
    value: 'PM',
    label: 'Product Strategy',
    icon: 'target',
  },
])
</script>

<template>
  <div id="top" class="min-h-screen bg-primary-900 text-primary-100">
    <!-- Nav -->
    <header class="sticky top-0 z-50 border-b border-primary-800 bg-primary-900/90 backdrop-blur">
      <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#top" class="flex items-center gap-2 text-base font-bold tracking-tight text-primary-100">
          <span
            class="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary-400 to-primary-500 text-xs font-bold text-primary-950"
          >
            {{ initials }}
          </span>
          {{ data.full_name }}
        </a>
        <div class="hidden items-center gap-8 text-sm font-medium text-primary-400 sm:flex">
          <a href="#work" class="transition-colors hover:text-primary-400">{{ data.button_texts?.nav_projects || 'Work' }}</a>
          <a href="#skills" class="transition-colors hover:text-primary-400">{{ data.button_texts?.nav_skills || 'Skills' }}</a>
          <a href="#contact" class="transition-colors hover:text-primary-400">{{ data.button_texts?.contact_cta || data.cta_text || 'Contact' }}</a>
        </div>
        <a
          :href="primaryCta.href"
          :target="primaryCta.external ? '_blank' : undefined"
          :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
          class="rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-primary-950 transition-colors hover:bg-primary-400"
        >
          Get in touch
        </a>
      </nav>
    </header>

    <!-- Hero -->
    <section class="relative overflow-hidden border-b border-primary-800 px-6 py-24 sm:py-32">
      <div
        class="pointer-events-none absolute inset-x-0 top-0 -z-0 h-96 bg-gradient-to-b from-primary-500/10 via-primary-500/5 to-transparent"
      />
      <div class="relative mx-auto max-w-4xl text-center">
        <p class="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400">
          Product Strategy &amp; Growth
        </p>
        <h1
          class="text-4xl font-bold leading-tight text-primary-50 sm:text-6xl"
          style="font-family:'Playfair Display',serif"
        >
          Defining user needs.
          <span
            class="bg-gradient-to-r from-primary-400 to-primary-400 bg-clip-text text-transparent"
          >Driving product growth.</span>
        </h1>
        <p v-if="data.professional_bio" class="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-primary-400">
          {{ data.professional_bio }}
        </p>
        <div class="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#work"
            class="rounded-md bg-primary-500 px-6 py-3 text-sm font-semibold text-primary-950 transition-colors hover:bg-primary-400"
          >
            View the work
          </a>
          <a
            :href="primaryCta.href"
            :target="primaryCta.external ? '_blank' : undefined"
            :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
            class="rounded-md border border-primary-700 bg-primary-900 px-6 py-3 text-sm font-semibold text-primary-100 transition-colors hover:border-primary-400 hover:text-primary-300"
          >
            Start a conversation
          </a>
        </div>
      </div>

      <!-- KPI tile row -->
      <div class="relative mx-auto mt-20 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-4">
        <div
          v-for="tile in kpiTiles"
          :key="tile.label"
          class="rounded-lg border border-primary-800 bg-primary-900/70 p-6 text-center transition-colors hover:border-primary-500/50"
        >
          <span class="material-symbols-outlined mb-2 inline-block text-2xl text-primary-400">{{ tile.icon }}</span>
          <p class="text-2xl font-bold text-primary-50" style="font-family:'JetBrains Mono',monospace">
            {{ tile.value }}
          </p>
          <p class="mt-1 text-xs uppercase tracking-wide text-primary-500">{{ tile.label }}</p>
        </div>
      </div>
    </section>

    <template v-for="section in sections" :key="section.key">
      <!-- Work -->
      <section v-if="section.kind === 'projects'" id="work" class="border-b border-primary-800 px-6 py-24">
        <div class="mx-auto max-w-6xl">
          <div class="mb-12 flex items-end justify-between gap-6">
            <div>
              <p class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400">
                Selected Work
              </p>
              <h2 class="text-3xl font-bold text-primary-50" style="font-family:'Playfair Display',serif">
                Outcomes, not output.
              </h2>
            </div>
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
                class="h-full rounded-lg border border-primary-800 bg-primary-900/60 p-6 transition-colors group-hover:border-primary-500/50"
              >
                <p
                  class="mb-3 flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-widest text-primary-400"
                >
                  <span class="inline-flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">flag</span>
                    Focus {{ String(idx + 1).padStart(2, '0') }}
                  </span>
                  <span
                    v-if="hasLink"
                    class="material-symbols-outlined text-sm"
                    aria-hidden="true"
                  >
                    open_in_new
                  </span>
                </p>
                <h3 class="text-lg font-semibold text-primary-50">{{ project.title }}</h3>
                <p v-if="project.description" class="mt-2 text-sm leading-relaxed text-primary-400">
                  {{ project.description }}
                </p>
                <div v-if="project.tech_stack?.length" class="mt-5 flex flex-wrap gap-2">
                  <span
                    v-for="tech in project.tech_stack"
                    :key="tech"
                    class="rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-300"
                  >
                    {{ tech }}
                  </span>
                </div>
                <p v-if="hasLink" class="mt-4 text-sm font-semibold text-primary-400">
                  Open project →
                </p>
              </div>
            </PortfolioProjectLink>
          </div>
        </div>
      </section>

      <!-- Skills -->
      <section v-else-if="section.kind === 'skills'" id="skills" class="border-b border-primary-800 bg-primary-900/40 px-6 py-24">
        <div class="mx-auto max-w-6xl">
          <p class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400">
            Toolkit
          </p>
          <h2 class="text-3xl font-bold text-primary-50" style="font-family:'Playfair Display',serif">
            The strategic toolkit.
          </h2>

          <div v-if="data.core_skills?.length" class="mt-10 flex flex-wrap gap-3">
            <span
              v-for="skill in data.core_skills"
              :key="skill"
              class="flex items-center gap-2 rounded-md border border-primary-700 bg-primary-950 px-4 py-2 text-sm font-medium text-primary-200 transition-colors hover:border-primary-500/50"
            >
              <span class="material-symbols-outlined text-sm text-primary-400">check_circle</span>
              {{ skill }}
            </span>
          </div>
        </div>
      </section>

      <!-- Custom section -->
      <section
        v-else-if="section.custom && section.custom.content && section.custom.content.trim()"
        :id="`section-${section.key}`"
        class="border-b border-primary-800 px-6 py-24"
      >
        <div class="mx-auto max-w-6xl">
          <p class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400">
            {{ section.title }}
          </p>
          <h2 class="text-3xl font-bold text-primary-50" style="font-family:'Playfair Display',serif">
            {{ section.title }}
          </h2>

          <div class="mt-8 max-w-3xl space-y-4">
            <p
              v-for="(paragraph, index) in section.custom.content.split(/\n{2,}/)"
              :key="index"
              class="text-sm leading-relaxed text-primary-400"
            >
              {{ paragraph }}
            </p>
          </div>
        </div>
      </section>
    </template>

    <!-- Contact / Footer -->
    <footer id="contact" class="px-6 py-24">
      <div class="mx-auto max-w-3xl text-center">
        <p class="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400">
          Let's build the roadmap
        </p>
        <h2 class="text-3xl font-bold text-primary-50 sm:text-4xl" style="font-family:'Playfair Display',serif">
          Ready to define what's next.
        </h2>
        <p class="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-primary-400">
          Open to product strategy, roadmap, and growth engagements &mdash; let's talk about
          the problem worth solving next.
        </p>
        <a
          :href="primaryCta.href"
          :target="primaryCta.external ? '_blank' : undefined"
          :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
          class="mt-8 inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-primary-500 to-primary-500 px-6 py-3 text-sm font-semibold text-primary-950 transition-colors hover:opacity-90"
        >
          <span class="material-symbols-outlined text-base">mail</span>
          Reach out
        </a>

        <PortfolioContactLinks
          :data="data"
          variant="row"
          class-name="mt-10 justify-center text-primary-400 [&_a]:text-primary-300"
        />

        <div class="mt-16 flex items-center justify-center gap-3 text-xs text-primary-500">
          <span
            class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-500 text-[11px] font-bold text-primary-950"
          >
            {{ initials }}
          </span>
          <span>{{ data.full_name }} &mdash; Product Strategy</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped></style>
