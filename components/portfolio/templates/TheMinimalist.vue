<script setup lang="ts">
import { portfolioContactCta } from '~/composables/usePortfolioContact'
import {
  absoluteUrl,
  mailtoHref,
  orderedBodySections,
  type PortfolioProfileData,
} from '~/shared/types/portfolio'

const props = defineProps<{ data: PortfolioProfileData }>()

const sections = computed(() =>
  orderedBodySections(props.data, { projects: 'Selected work', skills: 'Skills' }),
)

/** Short caption pulled from the opening phrase of the bio, e.g. "Product-minded engineer and designer". */
const caption = computed(() => {
  const bio = props.data.professional_bio?.trim() ?? ''
  if (!bio) return ''
  const words = bio.split(/\s+/).slice(0, 6).join(' ')
  return words.replace(/[.,;:]+$/, '')
})

const primaryCta = computed(() => portfolioContactCta())

function pad(index: number): string {
  return String(index + 1).padStart(2, '0')
}
</script>

<template>
  <div class="min-h-screen bg-primary-950 text-primary-100">
    <!-- Nav -->
    <header class="sticky top-0 z-40 border-b border-white/10 bg-primary-950/90 backdrop-blur">
      <nav class="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 sm:px-10">
        <a
          href="#top"
          class="text-xs tracking-[0.3em] text-primary-300 uppercase hover:text-white"
          style="font-family: 'JetBrains Mono', monospace"
        >
          {{ data.full_name }}
        </a>
        <div class="flex items-center gap-6 sm:gap-8">
          <a
            href="#work"
            class="text-[11px] tracking-[0.2em] text-primary-400 uppercase transition hover:text-white"
            style="font-family: 'JetBrains Mono', monospace"
          >
            {{ data.button_texts?.nav_projects || `<a
            href="#work"
            class="text-[11px] tracking-[0.2em] text-primary-400 uppercase transition hover:text-white"
            style="font-family: 'JetBrains Mono', monospace"
          >
            Work
          </a>`.replace(/<[^>]+>/g, '').trim() }}
          </a>
          <a
            href="#skills"
            class="text-[11px] tracking-[0.2em] text-primary-400 uppercase transition hover:text-white"
            style="font-family: 'JetBrains Mono', monospace"
          >
            {{ data.button_texts?.nav_skills || `<a
            href="#skills"
            class="text-[11px] tracking-[0.2em] text-primary-400 uppercase transition hover:text-white"
            style="font-family: 'JetBrains Mono', monospace"
          >
            Skills
          </a>`.replace(/<[^>]+>/g, '').trim() }}
          </a>
          <a
            href="#contact"
            class="text-[11px] tracking-[0.2em] text-primary-400 uppercase transition hover:text-white"
            style="font-family: 'JetBrains Mono', monospace"
          >
            {{ data.button_texts?.contact_cta || data.cta_text || 'Contact' }}
          </a>
        </div>
      </nav>
    </header>

    <!-- Hero -->
    <section id="top" class="mx-auto flex max-w-5xl flex-col justify-center px-6 pt-28 pb-32 sm:px-10 sm:pt-40 sm:pb-44">
      <p
        v-if="caption"
        class="mb-8 text-xs tracking-[0.35em] text-primary-500 uppercase"
        style="font-family: 'JetBrains Mono', monospace"
      >
        {{ caption }}
      </p>
      <h1
        class="text-[13vw] leading-[0.95] font-normal text-primary-50 sm:text-7xl md:text-8xl"
        style="font-family: 'Playfair Display', serif"
      >
        {{ data.full_name }}
      </h1>
      <div class="mt-14 flex flex-wrap items-center gap-8">
        <a
          href="#work"
          class="inline-flex items-center gap-2 text-xs tracking-[0.2em] text-primary-300 uppercase transition hover:text-white"
          style="font-family: 'JetBrains Mono', monospace"
        >
          <span>View the work</span>
          <span class="material-symbols-outlined text-sm">arrow_downward</span>
        </a>
        <a
          :href="primaryCta.href"
          :target="primaryCta.external ? '_blank' : undefined"
          :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
          class="inline-flex items-center gap-2 text-xs tracking-[0.2em] text-primary-300 uppercase transition hover:text-white"
          style="font-family: 'JetBrains Mono', monospace"
        >
          <span>Get in touch</span>
          <span class="material-symbols-outlined text-sm">north_east</span>
        </a>
      </div>
    </section>

    <!-- About / pull-quote -->
    <section
      v-if="data.professional_bio"
      class="border-t border-white/10 px-6 py-24 sm:px-10 sm:py-32"
    >
      <div class="mx-auto max-w-4xl">
        <blockquote
          class="pl-6 text-2xl leading-[1.7] text-primary-200 italic sm:pl-12 sm:text-3xl md:text-4xl"
          style="font-family: 'Playfair Display', serif; border-left: 1px solid rgba(255, 255, 255, 0.15)"
        >
          &ldquo;{{ data.professional_bio }}&rdquo;
        </blockquote>
      </div>
    </section>

    <!-- Body sections: Work, Skills, and any custom sections, in user-controlled order -->
    <template v-for="section in sections" :key="section.key">
      <!-- Work -->
      <section
        v-if="section.kind === 'projects'"
        id="work"
        class="border-t border-white/10 px-6 py-24 sm:px-10 sm:py-32"
      >
        <div class="mx-auto max-w-4xl">
          <p
            class="mb-16 text-xs tracking-[0.35em] text-primary-500 uppercase"
            style="font-family: 'JetBrains Mono', monospace"
          >
            {{ section.title }}
          </p>

          <div>
            <PortfolioProjectLink
              v-for="(project, index) in data.formatted_projects"
              :key="project.title + index"
              :project="project"
              :index="index"
              v-slot="{ hasLink }"
            >
              <div
                class="grid grid-cols-[3rem_1fr] gap-6 border-t border-white/10 py-10 first:border-t-0 sm:grid-cols-[4rem_1fr] sm:gap-10"
              >
                <span
                  class="pt-1 text-sm text-primary-600"
                  style="font-family: 'JetBrains Mono', monospace"
                >
                  {{ pad(index) }}
                </span>
                <div>
                  <div class="flex items-start gap-3">
                    <h3
                      class="text-2xl text-primary-50 sm:text-3xl"
                      style="font-family: 'Playfair Display', serif"
                    >
                      {{ project.title }}
                    </h3>
                    <span
                      v-if="hasLink"
                      class="material-symbols-outlined mt-1 text-primary-400 transition group-hover:text-white"
                      aria-hidden="true"
                    >
                      open_in_new
                    </span>
                  </div>
                  <p v-if="project.description" class="mt-4 max-w-2xl text-[15px] leading-relaxed text-primary-400">
                    {{ project.description }}
                  </p>
                  <p
                    v-if="project.tech_stack && project.tech_stack.length"
                    class="mt-5 text-xs tracking-wide text-primary-500"
                    style="font-family: 'JetBrains Mono', monospace"
                  >
                    <span v-for="(tech, techIndex) in project.tech_stack" :key="tech">
                      <span v-if="techIndex > 0" class="px-2 text-primary-700">·</span>{{ tech }}
                    </span>
                  </p>
                  <p
                    v-if="hasLink"
                    class="mt-4 text-xs tracking-[0.2em] text-primary-400 uppercase transition group-hover:text-white"
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
      <section
        v-else-if="section.kind === 'skills'"
        id="skills"
        class="border-t border-white/10 px-6 py-24 sm:px-10 sm:py-32"
      >
        <div class="mx-auto max-w-4xl">
          <p
            class="mb-12 text-xs tracking-[0.35em] text-primary-500 uppercase"
            style="font-family: 'JetBrains Mono', monospace"
          >
            {{ section.title }}
          </p>
          <p class="text-lg leading-loose text-primary-300 sm:text-xl">
            <span v-for="(skill, index) in data.core_skills" :key="skill">
              <span v-if="index > 0" class="px-3 text-primary-700">·</span>{{ skill }}
            </span>
          </p>
        </div>
      </section>

      <!-- Custom section -->
      <section
        v-else
        :id="`section-${section.key}`"
        class="border-t border-white/10 px-6 py-24 sm:px-10 sm:py-32"
      >
        <div class="mx-auto max-w-4xl">
          <p
            class="mb-12 text-xs tracking-[0.35em] text-primary-500 uppercase"
            style="font-family: 'JetBrains Mono', monospace"
          >
            {{ section.title }}
          </p>
          <div v-if="section.custom?.content?.trim()" class="space-y-6">
            <p
              v-for="(paragraph, paragraphIndex) in section.custom.content.split(/\n{2,}/)"
              :key="paragraphIndex"
              class="max-w-2xl text-[15px] leading-relaxed text-primary-400"
            >
              {{ paragraph }}
            </p>
          </div>
        </div>
      </section>
    </template>

    <!-- Footer / Contact -->
    <footer id="contact" class="border-t border-white/10 px-6 py-24 sm:px-10 sm:py-36">
      <div class="mx-auto flex max-w-4xl flex-col items-start gap-10">
        <h2
          class="text-5xl text-primary-50 sm:text-6xl md:text-7xl"
          style="font-family: 'Playfair Display', serif"
        >
          Let&rsquo;s talk.
        </h2>
        <a
          :href="primaryCta.href"
          :target="primaryCta.external ? '_blank' : undefined"
          :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
          class="inline-flex items-center gap-2 text-xs tracking-[0.25em] text-primary-300 uppercase transition hover:text-white"
          style="font-family: 'JetBrains Mono', monospace"
        >
          <span>Get in touch</span>
          <span class="material-symbols-outlined text-sm">north_east</span>
        </a>
        <PortfolioContactLinks
          :data="data"
          variant="stack"
          class-name="text-primary-400 [&_a]:text-primary-300"
        />
        <p
          class="text-[11px] tracking-[0.2em] text-primary-600 uppercase"
          style="font-family: 'JetBrains Mono', monospace"
        >
          {{ data.full_name }} — <a href="#top" class="hover:text-primary-300">Back to top</a>
        </p>
      </div>
    </footer>
  </div>
</template>
