<script setup lang="ts">
import { portfolioContactCta } from '~/composables/usePortfolioContact'
import {
  absoluteUrl,
  mailtoHref,
  orderedBodySections,
  type PortfolioProfileData,
} from '~/shared/types/portfolio'

const props = defineProps<{ data: PortfolioProfileData }>()

/** Ordered, renderable body sections (Projects, Skills, and any custom sections). */
const sections = computed(() =>
  orderedBodySections(props.data, { projects: 'The Body of Work', skills: 'Areas of Mastery' })
)

/** Two-letter monogram used for the portrait feature since no photo exists. */
const initials = computed(() => {
  const parts = props.data.full_name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'AD'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase()
})

const firstName = computed(() => {
  const parts = props.data.full_name.trim().split(/\s+/).filter(Boolean)
  return parts[0] || props.data.full_name
})

/** Bio split into sentences so the hero tagline and pull-quote can borrow real lines from it. */
const bioSentences = computed(() => {
  const text = props.data.professional_bio.trim()
  const matches = text.match(/[^.!?]+[.!?]*/g)
  return matches ? matches.map((s) => s.trim()).filter(Boolean) : []
})

const heroLead = computed(() => bioSentences.value[0] || props.data.professional_bio)
const pullQuote = computed(
  () => bioSentences.value[1] || bioSentences.value[0] || props.data.professional_bio
)

/** Leading discipline used to build the editorial tagline beneath the name. */
const leadDiscipline = computed(() => props.data.core_skills[0] || 'Creative Direction')

const primaryCta = computed(() => portfolioContactCta())

function pad(index: number) {
  return String(index + 1).padStart(2, '0')
}
</script>

<template>
  <div
    class="min-h-screen w-full bg-[#f5f5f0] text-stone-900 antialiased"
    style="font-family: ui-serif, Georgia, serif"
  >
    <!-- Top navigation -->
    <header
      class="sticky top-0 z-40 border-b border-primary-800/15 bg-[#f5f5f0]/90 backdrop-blur-sm"
    >
      <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
        <a
          href="#top"
          class="text-sm tracking-[0.25em] uppercase"
          style="font-family: 'JetBrains Mono', monospace"
        >
          {{ data.full_name }}
        </a>
        <div class="flex items-center gap-8">
          <a
            href="#work"
            class="hidden text-xs tracking-[0.2em] text-stone-600 uppercase transition hover:text-primary-700 sm:inline"
          >
            {{ data.button_texts?.nav_projects || `<a
            href="#work"
            class="hidden text-xs tracking-[0.2em] text-stone-600 uppercase transition hover:text-primary-700 sm:inline"
          >
            Work
          </a>`.replace(/<[^>]+>/g, '').trim() }}
          </a>
          <a
            href="#skills"
            class="hidden text-xs tracking-[0.2em] text-stone-600 uppercase transition hover:text-primary-700 sm:inline"
          >
            {{ data.button_texts?.nav_skills || `<a
            href="#skills"
            class="hidden text-xs tracking-[0.2em] text-stone-600 uppercase transition hover:text-primary-700 sm:inline"
          >
            Skills
          </a>`.replace(/<[^>]+>/g, '').trim() }}
          </a>
          <a
            href="#contact"
            class="hidden text-xs tracking-[0.2em] text-stone-600 uppercase transition hover:text-primary-700 sm:inline"
          >
            {{ data.button_texts?.contact_cta || data.cta_text || 'Contact' }}
          </a>
          <a
            :href="primaryCta.href"
            :target="primaryCta.external ? '_blank' : undefined"
            :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
            class="inline-flex items-center gap-1.5 border border-stone-900 px-4 py-2 text-xs tracking-[0.15em] uppercase transition hover:bg-stone-900 hover:text-[#f5f5f0]"
          >
            Contact
            <span class="material-symbols-outlined text-sm">north_east</span>
          </a>
        </div>
      </nav>
    </header>

    <!-- Hero -->
    <section id="top" class="mx-auto max-w-6xl px-6 pt-16 pb-24 sm:px-10 sm:pt-24">
      <div class="grid grid-cols-1 items-center gap-16 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p
            class="mb-6 flex items-center gap-3 text-xs tracking-[0.35em] text-primary-700 uppercase"
            style="font-family: 'JetBrains Mono', monospace"
          >
            <span class="h-px w-10 bg-primary-700/60" />
            A Portfolio By
          </p>

          <h1
            class="text-6xl leading-[0.95] font-medium tracking-tight sm:text-7xl lg:text-8xl"
            style="font-family: 'Playfair Display', serif"
          >
            {{ data.full_name }}
          </h1>

          <p
            class="mt-6 text-2xl text-stone-700 italic sm:text-3xl"
            style="font-family: 'Playfair Display', serif"
          >
            Orchestrating {{ leadDiscipline }} Narratives.
          </p>

          <p v-if="heroLead" class="mt-8 max-w-lg text-base leading-relaxed text-stone-600">
            {{ heroLead }}
          </p>

          <div class="mt-10 flex flex-wrap items-center gap-6">
            <a
              href="#work"
              class="inline-flex items-center gap-2 bg-stone-900 px-6 py-3 text-xs tracking-[0.2em] text-[#f5f5f0] uppercase transition hover:bg-primary-800"
            >
              View the Work
              <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
            <a
              :href="primaryCta.href"
              :target="primaryCta.external ? '_blank' : undefined"
              :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
              class="inline-flex items-center gap-2 text-xs tracking-[0.2em] text-stone-700 uppercase underline decoration-amber-700/50 underline-offset-8 transition hover:text-primary-800"
            >
              Get in Touch
            </a>
          </div>
        </div>

        <!-- Portrait feature: framed monogram standing in for a photograph -->
        <div class="mx-auto w-full max-w-[320px]">
          <div
            class="relative aspect-[3/4] w-full border border-primary-700/40 p-3"
          >
            <div class="pointer-events-none absolute top-2 left-2 h-4 w-4 border-t border-l border-primary-700/60" />
            <div class="pointer-events-none absolute top-2 right-2 h-4 w-4 border-t border-r border-primary-700/60" />
            <div class="pointer-events-none absolute bottom-2 left-2 h-4 w-4 border-b border-l border-primary-700/60" />
            <div class="pointer-events-none absolute right-2 bottom-2 h-4 w-4 border-r border-b border-primary-700/60" />
            <div
              class="flex h-full w-full items-center justify-center"
              style="
                background: radial-gradient(
                    ellipse at 50% 30%,
                    rgba(217, 160, 89, 0.16),
                    transparent 65%
                  ),
                  linear-gradient(160deg, #eae7de 0%, #d8d3c6 55%, #c9c2b0 100%);
              "
            >
              <span
                class="text-7xl text-stone-800/70"
                style="font-family: 'Playfair Display', serif"
              >
                {{ initials }}
              </span>
            </div>
          </div>
          <p
            class="mt-4 text-center text-[11px] tracking-[0.3em] text-stone-500 uppercase"
            style="font-family: 'JetBrains Mono', monospace"
          >
            {{ data.full_name }} &mdash; {{ leadDiscipline }}
          </p>
        </div>
      </div>
    </section>

    <!-- About / Leadership & Legacy -->
    <section class="border-t border-primary-800/15">
      <div class="mx-auto max-w-6xl px-6 py-24 sm:px-10">
        <p
          class="mb-10 text-xs tracking-[0.35em] text-primary-700 uppercase"
          style="font-family: 'JetBrains Mono', monospace"
        >
          {{ data.section_titles?.profile || 'Leadership & Legacy' }}
        </p>

        <div class="grid grid-cols-1 gap-14 lg:grid-cols-2">
          <p class="director-dropcap text-lg leading-relaxed text-stone-700">
            {{ data.professional_bio }}
          </p>

          <div class="border-l border-primary-800/25 pl-8">
            <p
              class="text-xs tracking-[0.3em] text-stone-500 uppercase"
              style="font-family: 'JetBrains Mono', monospace"
            >
              Philosophy
            </p>
            <p
              class="mt-4 text-2xl leading-snug text-stone-800 italic"
              style="font-family: 'Playfair Display', serif"
            >
              &ldquo;{{ pullQuote }}&rdquo;
            </p>
            <p class="mt-6 text-sm tracking-[0.2em] text-stone-500 uppercase">
              &mdash; {{ data.full_name }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Body sections: Projects, Skills, and any custom sections, in user-controlled order -->
    <template v-for="section in sections" :key="section.key">
      <!-- Experience -->
      <PortfolioExperienceSection
        v-if="section.kind === 'experience'"
        :title="section.title"
        :items="data.formatted_experience || []"
        tone="light"
      />
      <section v-else-if="section.kind === 'projects'" id="work" class="border-t border-primary-800/15">
        <div class="mx-auto max-w-6xl px-6 py-24 sm:px-10">
          <div class="mb-16 flex items-end justify-between">
            <div>
              <p
                class="mb-4 text-xs tracking-[0.35em] text-primary-700 uppercase"
                style="font-family: 'JetBrains Mono', monospace"
              >
                Selected Work
              </p>
              <h2
                class="text-4xl sm:text-5xl"
                style="font-family: 'Playfair Display', serif"
              >
                {{ section.title }}
              </h2>
            </div>
          </div>

          <div v-if="data.formatted_projects && data.formatted_projects.length">
            <PortfolioProjectLink
              v-for="(project, index) in data.formatted_projects"
              :key="project.title + index"
              :project="project"
              :index="index"
              v-slot="{ hasLink }"
            >
              <div
                class="grid grid-cols-1 gap-6 border-t border-primary-800/15 py-12 first:border-t-0 md:grid-cols-[auto_1fr] md:gap-12"
              >
                <span
                  class="text-sm text-primary-700"
                  style="font-family: 'JetBrains Mono', monospace"
                >
                  {{ pad(index) }}
                </span>

                <div :class="index % 2 === 1 ? 'md:text-right' : ''">
                  <div
                    class="flex items-start gap-3"
                    :class="index % 2 === 1 ? 'md:flex-row-reverse' : ''"
                  >
                    <h3
                      class="text-3xl leading-tight sm:text-4xl"
                      style="font-family: 'Playfair Display', serif"
                    >
                      {{ project.title }}
                    </h3>
                    <span
                      v-if="hasLink"
                      class="material-symbols-outlined mt-2 shrink-0 text-primary-700"
                      aria-hidden="true"
                    >
                      open_in_new
                    </span>
                  </div>
                  <PortfolioRichText class="mt-4 max-w-2xl text-base leading-relaxed text-stone-600" :class="index % 2 === 1 ? 'md:ml-auto' : ''" :content="project.description" />
                  <div
                    v-if="project.tech_stack && project.tech_stack.length"
                    class="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[11px] tracking-[0.25em] text-stone-500 uppercase"
                    :class="index % 2 === 1 ? 'md:justify-end' : ''"
                    style="font-family: 'JetBrains Mono', monospace"
                  >
                    <span v-for="tech in project.tech_stack" :key="tech">{{ tech }}</span>
                  </div>
                  <p
                    v-if="hasLink"
                    class="mt-4 text-xs tracking-[0.2em] text-primary-700 uppercase"
                    :class="index % 2 === 1 ? 'md:text-right' : ''"
                    style="font-family: 'JetBrains Mono', monospace"
                  >
                    Open project →
                  </p>
                </div>
              </div>
            </PortfolioProjectLink>
          </div>
        </div>
      </section>

      <!-- Skills -->
      <section v-else-if="section.kind === 'skills'" id="skills" class="border-t border-primary-800/15 bg-stone-900/[0.02]">
        <div class="mx-auto max-w-6xl px-6 py-24 sm:px-10">
          <p
            class="mb-4 text-xs tracking-[0.35em] text-primary-700 uppercase"
            style="font-family: 'JetBrains Mono', monospace"
          >
            Capabilities
          </p>
          <h2 class="mb-14 text-4xl sm:text-5xl" style="font-family: 'Playfair Display', serif">
            {{ section.title }}
          </h2>

          <ul
            v-if="data.core_skills && data.core_skills.length"
            class="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            <li
              v-for="(skill, index) in data.core_skills"
              :key="skill"
              class="flex items-center gap-4 border-b border-primary-800/15 pb-4"
            >
              <span
                class="text-xs text-primary-700"
                style="font-family: 'JetBrains Mono', monospace"
              >
                {{ pad(index) }}
              </span>
              <span class="text-sm tracking-[0.15em] text-stone-800 uppercase">{{ skill }}</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- Custom section -->
      <section v-else :id="`section-${section.key}`" class="border-t border-primary-800/15">
        <div class="mx-auto max-w-6xl px-6 py-24 sm:px-10">
          <h2
            class="mb-6 text-4xl sm:text-5xl"
            style="font-family: 'Playfair Display', serif"
          >
            {{ section.title }}
          </h2>
          <span class="mb-10 block h-px w-16 bg-primary-700/60" />

          <div v-if="section.custom?.content?.trim()" class="max-w-2xl space-y-6">
            <p
              v-for="(paragraph, pIndex) in section.custom.content.trim().split(/\n{2,}/)"
              :key="pIndex"
              class="text-base leading-relaxed text-stone-600"
            >
              {{ paragraph }}
            </p>
          </div>
        </div>
      </section>
    </template>

    <!-- Contact / footer -->
    <footer id="contact" class="border-t border-primary-800/15">
      <div class="mx-auto max-w-6xl px-6 py-24 text-center sm:px-10">
        <p
          class="text-4xl leading-snug sm:text-5xl"
          style="font-family: 'Playfair Display', serif"
        >
          Let's build the next classic.
        </p>
        <p class="mx-auto mt-6 max-w-md text-base text-stone-600">
          {{ data.full_name }} is currently open to new collaborations, commissions, and
          creative partnerships.
        </p>

        <a
          :href="primaryCta.href"
          :target="primaryCta.external ? '_blank' : undefined"
          :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
          class="mt-10 inline-flex items-center gap-2 border border-stone-900 bg-stone-900 px-6 py-3 text-xs tracking-[0.2em] text-[#f5f5f0] uppercase transition hover:bg-primary-800 hover:border-primary-800"
        >
          Get in Touch
          <span class="material-symbols-outlined text-sm">north_east</span>
        </a>

        <PortfolioContactLinks
          :data="data"
          variant="row"
          class-name="mt-10 justify-center text-stone-600 [&_a]:text-primary-800"
        />

        <div class="mt-10 flex flex-wrap items-center justify-center gap-8">
          <a
            href="#work"
            class="text-xs tracking-[0.2em] text-stone-600 uppercase transition hover:text-primary-700"
          >
            Review the Work
          </a>
          <a
            href="#skills"
            class="text-xs tracking-[0.2em] text-stone-600 uppercase transition hover:text-primary-700"
          >
            See Capabilities
          </a>
          <a
            href="#top"
            class="inline-flex items-center gap-2 border border-stone-900 px-6 py-3 text-xs tracking-[0.2em] text-stone-900 uppercase transition hover:bg-stone-900 hover:text-[#f5f5f0]"
          >
            Back to Top
            <span class="material-symbols-outlined text-sm">north</span>
          </a>
        </div>

        <p
          class="mt-16 text-[11px] tracking-[0.3em] text-stone-400 uppercase"
          style="font-family: 'JetBrains Mono', monospace"
        >
          {{ data.full_name }} &middot; Portfolio Edition
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.director-dropcap::first-letter {
  float: left;
  font-family: 'Playfair Display', serif;
  font-size: 4.5rem;
  line-height: 0.8;
  padding-right: 0.6rem;
  padding-top: 0.3rem;
  color: #92400e;
}
</style>
