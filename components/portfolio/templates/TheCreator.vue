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

const skillGradients = [
  'from-primary-500/20 to-primary-500/20 border-primary-400/40 text-primary-200',
  'from-primary-500/20 to-primary-500/20 border-primary-400/40 text-primary-200',
  'from-primary-500/20 to-primary-500/20 border-primary-400/40 text-primary-200',
]

function skillClass(idx: number) {
  return skillGradients[idx % skillGradients.length]
}

const projectAccents = [
  { ring: 'group-hover:shadow-fuchsia-500/30', chip: 'border-primary-400/40 bg-primary-500/10 text-primary-200' },
  { ring: 'group-hover:shadow-violet-500/30', chip: 'border-primary-400/40 bg-primary-500/10 text-primary-200' },
  { ring: 'group-hover:shadow-cyan-500/30', chip: 'border-primary-400/40 bg-primary-500/10 text-primary-200' },
]

function accent(idx: number) {
  return projectAccents[idx % projectAccents.length]!
}
</script>

<template>
  <div id="top" class="relative min-h-screen overflow-x-hidden bg-[#0a0a12] text-primary-100">
    <!-- Ambient glow blobs -->
    <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        class="blob-float absolute -left-40 -top-32 h-96 w-96 rounded-full bg-primary-600/30 blur-[100px]"
      />
      <div
        class="blob-pulse absolute right-0 top-1/3 h-[28rem] w-[28rem] rounded-full bg-primary-600/30 blur-[110px]"
      />
      <div
        class="blob-float absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-primary-500/25 blur-[100px]"
        style="animation-delay: -4s"
      />
    </div>

    <!-- Sticky Nav -->
    <header class="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a12]/70 backdrop-blur-xl">
      <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a
          href="#top"
          class="bg-gradient-to-r from-primary-400 via-primary-400 to-primary-400 bg-clip-text text-lg font-bold tracking-tight text-transparent"
          style="font-family:'Playfair Display',serif"
        >
          {{ data.full_name }}
        </a>
        <div class="hidden items-center gap-8 text-sm font-medium text-primary-300 sm:flex">
          <a href="#work" class="transition-colors hover:text-primary-300">{{ data.button_texts?.nav_projects || 'Work' }}</a>
          <a href="#skills" class="transition-colors hover:text-primary-300">{{ data.button_texts?.nav_skills || 'Skills' }}</a>
          <a href="#contact" class="transition-colors hover:text-primary-300">{{ data.button_texts?.contact_cta || data.cta_text || 'Contact' }}</a>
        </div>
        <a
          :href="primaryCta.href"
          :target="primaryCta.external ? '_blank' : undefined"
          :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
          class="rounded-full bg-gradient-to-r from-primary-500 via-primary-500 to-primary-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-fuchsia-500/30 transition-transform hover:scale-105"
        >
          Let's Create
        </a>
      </nav>
    </header>

    <!-- Hero -->
    <section class="relative z-10 mx-auto max-w-6xl px-6 py-28 sm:py-36">
      <p
        class="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-primary-300 backdrop-blur"
      >
        <span class="material-symbols-outlined text-sm">auto_awesome</span>
        Digital Creator &amp; Technologist
      </p>
      <h1
        class="max-w-4xl bg-gradient-to-br from-primary-300 via-primary-300 to-primary-300 bg-clip-text text-4xl font-bold leading-tight text-transparent sm:text-6xl"
        style="font-family:'Playfair Display',serif"
      >
        Crafting immersive digital experiences
      </h1>
      <p
        v-if="data.professional_bio"
        class="mt-8 max-w-2xl text-lg leading-relaxed text-primary-300"
      >
        {{ data.professional_bio }}
      </p>
      <p class="mt-2 max-w-2xl text-base text-primary-400">
        {{ data.full_name }} works at the intersection of light, motion, and code.
      </p>
      <div class="mt-10 flex flex-wrap gap-4">
        <a
          href="#work"
          class="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 via-primary-500 to-primary-500 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-fuchsia-500/40 transition-transform hover:scale-105"
        >
          View the Work
          <span class="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
            arrow_forward
          </span>
        </a>
        <a
          :href="primaryCta.href"
          :target="primaryCta.external ? '_blank' : undefined"
          :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
          class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-primary-100 backdrop-blur transition-colors hover:border-primary-400/50 hover:text-primary-200"
        >
          <span class="material-symbols-outlined text-base">mail</span>
          Say Hello
        </a>
      </div>
    </section>

    <template v-for="section in sections" :key="section.key">
      <!-- Work -->
      <section v-if="section.kind === 'projects'" id="work" class="relative z-10 border-t border-white/10 px-6 py-24">
        <div class="mx-auto max-w-6xl">
          <p class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-300">
            Selected Work
          </p>
          <h2
            class="bg-gradient-to-r from-primary-300 to-primary-300 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl"
            style="font-family:'Playfair Display',serif"
          >
            Projects that push pixels &amp; possibilities
          </h2>

          <div v-if="data.formatted_projects?.length" class="mt-12 grid gap-6 sm:grid-cols-2">
            <PortfolioProjectLink
              v-for="(project, idx) in data.formatted_projects"
              :key="project.title + idx"
              :project="project"
              :index="idx"
              v-slot="{ hasLink }"
            >
              <div
                :class="accent(idx).ring"
                class="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-7 shadow-lg backdrop-blur-xl transition-all duration-300 group-hover:-translate-y-1 group-hover:border-white/20"
              >
                <div
                  class="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-primary-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
                <div class="relative">
                  <div class="mb-4 flex items-center justify-between">
                    <div
                      class="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-500 text-sm font-bold text-white shadow-md"
                    >
                      {{ String(idx + 1).padStart(2, '0') }}
                    </div>
                    <span
                      v-if="hasLink"
                      class="material-symbols-outlined text-primary-300"
                      aria-hidden="true"
                    >
                      open_in_new
                    </span>
                  </div>
                  <h3 class="text-lg font-semibold text-primary-50">{{ project.title }}</h3>
                  <p v-if="project.description" class="mt-2 text-sm leading-relaxed text-primary-300">
                    {{ project.description }}
                  </p>
                  <div v-if="project.tech_stack?.length" class="mt-5 flex flex-wrap gap-2">
                    <span
                      v-for="tech in project.tech_stack"
                      :key="tech"
                      :class="accent(idx).chip"
                      class="rounded-full border px-3 py-1 text-xs font-medium"
                      style="font-family:'JetBrains Mono',monospace"
                    >
                      {{ tech }}
                    </span>
                  </div>
                  <p v-if="hasLink" class="mt-4 text-sm font-semibold text-primary-300">
                    Open project →
                  </p>
                </div>
              </div>
            </PortfolioProjectLink>
          </div>
        </div>
      </section>

      <!-- Skills -->
      <section v-else-if="section.kind === 'skills'" id="skills" class="relative z-10 border-t border-white/10 px-6 py-24">
        <div class="mx-auto max-w-6xl">
          <p class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-300">
            Toolkit
          </p>
          <h2
            class="bg-gradient-to-r from-primary-300 to-primary-300 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl"
            style="font-family:'Playfair Display',serif"
          >
            Skills &amp; Superpowers
          </h2>

          <div v-if="data.core_skills?.length" class="mt-10 flex flex-wrap gap-3">
            <span
              v-for="(skill, idx) in data.core_skills"
              :key="skill"
              :class="skillClass(idx)"
              class="rounded-full border bg-gradient-to-r px-5 py-2.5 text-sm font-medium backdrop-blur transition-transform hover:scale-105"
            >
              {{ skill }}
            </span>
          </div>
        </div>
      </section>

      <!-- Custom -->
      <section
        v-else
        :id="`section-${section.key}`"
        class="relative z-10 border-t border-white/10 px-6 py-24"
      >
        <div class="mx-auto max-w-6xl">
          <p class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-300">
            Section
          </p>
          <h2
            class="bg-gradient-to-r from-primary-300 via-primary-300 to-primary-300 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl"
            style="font-family:'Playfair Display',serif"
          >
            {{ section.title }}
          </h2>

          <div
            v-if="section.custom?.content?.trim()"
            class="mt-10 max-w-3xl space-y-4 rounded-2xl border border-white/10 bg-white/5 p-8 text-base leading-relaxed text-primary-300 shadow-lg backdrop-blur-xl"
          >
            <p v-for="(paragraph, pIdx) in section.custom.content.split(/\n{2,}/)" :key="pIdx">
              {{ paragraph }}
            </p>
          </div>
        </div>
      </section>
    </template>

    <!-- Contact / Footer -->
    <footer id="contact" class="relative z-10 border-t border-white/10 px-6 py-28">
      <div class="mx-auto max-w-3xl text-center">
        <div
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 via-primary-500 to-primary-500 text-lg font-bold text-white shadow-xl shadow-fuchsia-500/40"
        >
          {{ initials }}
        </div>
        <h2
          class="mt-8 bg-gradient-to-br from-primary-300 via-primary-300 to-primary-300 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl"
          style="font-family:'Playfair Display',serif"
        >
          Let's build something unforgettable.
        </h2>
        <p class="mx-auto mt-4 max-w-xl text-base text-primary-300">
          {{ data.full_name }} is open to collaborations in design, motion, and interactive
          development.
        </p>
        <a
          :href="primaryCta.href"
          :target="primaryCta.external ? '_blank' : undefined"
          :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
          class="mt-9 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 via-primary-500 to-primary-500 px-8 py-4 text-sm font-semibold text-white shadow-2xl shadow-violet-500/40 transition-transform hover:scale-105"
        >
          <span class="material-symbols-outlined text-base">bolt</span>
          Start a Project
        </a>

        <PortfolioContactLinks
          :data="data"
          variant="pills"
          class-name="mt-10 justify-center text-primary-300 [&_a]:border-white/20 [&_a]:bg-white/5"
        />

        <div class="mt-16 flex items-center justify-center gap-2 text-xs text-primary-500">
          <span class="material-symbols-outlined text-sm text-primary-400">favorite</span>
          <span>{{ data.full_name }} &mdash; light, motion &amp; code</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@keyframes blob-float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(30px, -40px) scale(1.08);
  }
}

@keyframes blob-pulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.12);
  }
}

.blob-float {
  animation: blob-float 12s ease-in-out infinite;
}

.blob-pulse {
  animation: blob-pulse 9s ease-in-out infinite;
}
</style>
