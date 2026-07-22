<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps<{
  markdown: string
  formatId?: string
}>()

interface ParsedResume {
  name: string
  title: string
  contact: string[]
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
  website: string
  summary: string
  skills: string[]
  experience: Array<{
    title: string
    company: string
    dates: string
    location: string
    bullets: string[]
  }>
  education: Array<{
    degree: string
    school: string
    dates: string
    location: string
    bullets: string[]
  }>
  credentials: string[]
  projects: Array<{
    name: string
    bullets: string[]
  }>
  extras: Array<{
    title: string
    items: Array<{ title: string; subtitle?: string; bullets: string[] }>
  }>
}

/**
 * Strip inline markdown emphasis markers so themed resumes never render literal
 * `**bold**` / `*italic*` / `` `code` `` asterisks (they showed up verbatim in the
 * PDF). Leading "* " / "- " bullet markers are preserved for the line parser.
 */
function stripInlineEmphasis(text: string): string {
  return text
    .replace(/\*\*([^*]+?)\*\*/g, '$1') // **bold**
    .replace(/__([^_]+?)__/g, '$1') // __bold__
    .replace(/`([^`]+?)`/g, '$1') // `code`
    .replace(/(^|[^*\s])\*([^*\n]+?)\*(?=[^*]|$)/g, '$1$2') // *italic* (not bullet markers)
    .replace(/\*\*/g, '') // any stray leftover doubles
}

const parsed = computed<ParsedResume>(() => {
  const mdText = stripInlineEmphasis(props.markdown || '')
  const lines = mdText.split('\n')
  
  const resume: ParsedResume = {
    name: 'Jordan Ellis',
    title: 'Software Engineer',
    contact: [],
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    website: '',
    summary: '',
    skills: [],
    experience: [],
    education: [],
    credentials: [],
    projects: [],
    extras: [],
  }

  let currentSection = ''
  let currentJob: any = null
  let currentSchool: any = null
  let currentProject: any = null
  let currentExtra: ParsedResume['extras'][number] | null = null
  let currentExtraItem: ParsedResume['extras'][number]['items'][number] | null = null

  // Flags to avoid eating details multiple times
  let foundName = false
  let foundTitle = false
  let foundContact = false

  const flushExtraItem = () => {
    if (currentExtra && currentExtraItem) {
      currentExtra.items.push(currentExtraItem)
      currentExtraItem = null
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Detect main H1 (name)
    if (line.startsWith('# ') && !foundName) {
      resume.name = line.replace('# ', '').trim()
      foundName = true
      continue
    }

    // Detect section headers
    if (line.startsWith('## ')) {
      if (currentJob) { resume.experience.push(currentJob); currentJob = null }
      if (currentSchool) { resume.education.push(currentSchool); currentSchool = null }
      if (currentProject) { resume.projects.push(currentProject); currentProject = null }
      flushExtraItem()
      currentExtra = null

      const rawTitle = line.replace('## ', '').trim()
      const secName = rawTitle.toLowerCase()
      if (secName.includes('summary') || secName.includes('profile')) {
        currentSection = 'summary'
      } else if (secName.includes('experience') || secName.includes('employment') || secName.includes('leadership')) {
        currentSection = 'experience'
      } else if (secName.includes('skills') || secName.includes('competencies') || secName.includes('expertise') || secName.includes('technologies') || secName.includes('stack')) {
        currentSection = 'skills'
      } else if (secName.includes('education')) {
        currentSection = 'education'
      } else if (secName.includes('project')) {
        currentSection = 'projects'
      } else if (secName.includes('credential') || secName.includes('certif') || secName.includes('achievement')) {
        currentSection = 'credentials'
      } else {
        currentSection = 'extra'
        currentExtra = { title: rawTitle, items: [] }
        resume.extras.push(currentExtra)
      }
      continue
    }

    // If we haven't found the title yet and name is found, take first lines
    if (foundName && !foundTitle && !line.startsWith('#') && !line.includes('@') && !line.includes('·') && !line.includes('|')) {
      resume.title = line
      foundTitle = true
      continue
    }

    // If contact line is not found yet and contains separators
    if (foundName && !foundContact && (line.includes('·') || line.includes('|') || line.includes('@'))) {
      const parts = line.split(/[·|•]/).map(p => p.trim())
      resume.contact = parts
      parts.forEach(part => {
        if (part.includes('@')) {
          resume.email = part
        } else if (part.includes('linkedin.com') || /^in\//i.test(part)) {
          resume.linkedin = part
        } else if (part.includes('github.com') || /^gh\//i.test(part)) {
          resume.github = part
        } else if (part.match(/\+?\d[\d\s-()]{7,}/)) {
          resume.phone = part
        } else if (part.includes('.com') || part.includes('.io') || part.includes('.org') || part.includes('.me') || part.includes('.dev')) {
          resume.website = resume.website || part
        } else {
          resume.location = part
        }
      })
      foundContact = true
      continue
    }

    // Parse section contents
    if (currentSection === 'summary') {
      if (!line.startsWith('#')) {
        resume.summary += (resume.summary ? '\n' : '') + line
      }
    } else if (currentSection === 'skills') {
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const skill = line.substring(2).trim()
        if (skill) resume.skills.push(skill)
      } else if (line.includes('·') || line.includes('|') || line.includes(',')) {
        const splitChar = line.includes('·') ? '·' : line.includes('|') ? '|' : ','
        line.split(splitChar).forEach(s => {
          const trimmed = s.trim()
          if (trimmed) resume.skills.push(trimmed)
        })
      } else if (line && !line.startsWith('#')) {
        resume.skills.push(line)
      }
    } else if (currentSection === 'experience') {
      if (line.startsWith('### ')) {
        if (currentJob) resume.experience.push(currentJob)
        const headerText = line.replace('### ', '').trim()
        const commaIdx = headerText.indexOf(',')
        let title = headerText
        let company = ''
        if (commaIdx !== -1) {
          title = headerText.substring(0, commaIdx).trim()
          company = headerText.substring(commaIdx + 1).trim()
        }
        currentJob = {
          title,
          company,
          dates: '',
          location: '',
          bullets: []
        }
      } else if (line.startsWith('*') && line.endsWith('*') && currentJob) {
        const meta = line.replace(/\*/g, '').trim()
        const metaParts = meta.split(/[·|•]/).map(p => p.trim())
        if (metaParts.length > 1) {
          currentJob.location = metaParts[0]
          currentJob.dates = metaParts[1]
        } else {
          currentJob.dates = meta
        }
      } else if ((line.startsWith('- ') || line.startsWith('* ')) && currentJob) {
        currentJob.bullets.push(line.substring(2).trim())
      }
    } else if (currentSection === 'education') {
      if (line.startsWith('### ')) {
        if (currentSchool) resume.education.push(currentSchool)
        const headerText = line.replace('### ', '').trim()
        const commaIdx = headerText.indexOf(',')
        let degree = headerText
        let school = ''
        if (commaIdx !== -1) {
          degree = headerText.substring(0, commaIdx).trim()
          school = headerText.substring(commaIdx + 1).trim()
        }
        currentSchool = {
          degree,
          school,
          dates: '',
          location: '',
          bullets: []
        }
      } else if (line.startsWith('*') && line.endsWith('*') && currentSchool) {
        const meta = line.replace(/\*/g, '').trim()
        const metaParts = meta.split(/[·|•]/).map(p => p.trim())
        if (metaParts.length > 1) {
          currentSchool.location = metaParts[0]
          currentSchool.dates = metaParts[1]
        } else {
          currentSchool.dates = meta
        }
      } else if ((line.startsWith('- ') || line.startsWith('* ')) && currentSchool) {
        currentSchool.bullets.push(line.substring(2).trim())
      }
    } else if (currentSection === 'projects') {
      if (line.startsWith('### ')) {
        if (currentProject) resume.projects.push(currentProject)
        currentProject = {
          name: line.replace('### ', '').trim(),
          bullets: []
        }
      } else if ((line.startsWith('- ') || line.startsWith('* ')) && currentProject) {
        currentProject.bullets.push(line.substring(2).trim())
      }
    } else if (currentSection === 'credentials') {
      if (line.startsWith('- ') || line.startsWith('* ')) {
        resume.credentials.push(line.substring(2).trim())
      } else if (!line.startsWith('#')) {
        line.split(/[·|,]/).forEach(c => {
          const trimmed = c.trim()
          if (trimmed) resume.credentials.push(trimmed)
        })
      }
    } else if (currentSection === 'extra' && currentExtra) {
      if (line.startsWith('### ')) {
        flushExtraItem()
        currentExtraItem = {
          title: line.replace('### ', '').trim(),
          bullets: [],
        }
      } else if (line.startsWith('*') && line.endsWith('*') && currentExtraItem) {
        currentExtraItem.subtitle = line.replace(/\*/g, '').trim()
      } else if ((line.startsWith('- ') || line.startsWith('* ')) && currentExtraItem) {
        currentExtraItem.bullets.push(line.substring(2).trim())
      } else if ((line.startsWith('- ') || line.startsWith('* ')) && !currentExtraItem) {
        currentExtra.items.push({ title: line.substring(2).trim(), bullets: [] })
      }
    }
  }

  // Push last items
  if (currentJob) resume.experience.push(currentJob)
  if (currentSchool) resume.education.push(currentSchool)
  if (currentProject) resume.projects.push(currentProject)
  flushExtraItem()

  // Fallbacks
  if (!resume.email && resume.contact.length) {
    resume.email = resume.contact.find(c => c.includes('@')) || ''
  }

  resume.skills = resume.skills.map(s => s.trim()).filter(Boolean)
  resume.education = resume.education.filter(e => {
    const degree = (e.degree || '').trim()
    const school = (e.school || '').trim()
    return Boolean(school || (degree && degree.toLowerCase() !== 'degree'))
  })

  return resume
})

const hasProfileLinks = computed(
  () => Boolean(parsed.value.linkedin || parsed.value.github || parsed.value.website),
)

const profileLinksLabel = computed(() =>
  [parsed.value.linkedin, parsed.value.github, parsed.value.website].filter(Boolean).join(' · '),
)

// Standard markdown fallback html
const plainHtml = computed(() => (props.markdown ? marked(props.markdown) : ''))
</script>

<template>
  <!-- THE CORPORATE THEME -->
  <div
    v-if="formatId === 'the-corporate' || formatId === 'corporate-accent'"
    class="theme-corporate w-full bg-white relative overflow-hidden flex flex-col text-slate-800 text-left select-text p-0"
  >
    <header class="bg-[#091426] text-white p-7">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div class="flex flex-col gap-1">
          <h1 class="font-extrabold text-2xl tracking-tight text-white leading-tight">{{ parsed.name }}</h1>
          <p class="text-[10px] uppercase tracking-[0.2em] text-indigo-300 font-bold">{{ parsed.title }}</p>
        </div>
        <div class="flex flex-col gap-1 items-start sm:items-end text-left sm:text-right text-[10px] text-slate-300 font-medium">
          <span class="flex items-center gap-1.5" v-if="parsed.email">{{ parsed.email }}</span>
          <span class="flex items-center gap-1.5" v-if="parsed.phone">{{ parsed.phone }}</span>
          <span class="flex items-center gap-1.5" v-if="parsed.location">{{ parsed.location }}</span>
          <span class="flex items-center gap-1.5 text-indigo-300" v-if="hasProfileLinks">{{ profileLinksLabel }}</span>
        </div>
      </div>
    </header>

    <div class="px-7 py-5">
      <div class="mb-2.5">
        <h3 class="text-[10px] font-bold text-[#091426] uppercase tracking-widest mb-1 select-none">Professional Profile</h3>
        <div class="h-[1px] bg-slate-200 w-full"></div>
      </div>
      <p class="text-[10.5px] leading-relaxed text-slate-600">{{ parsed.summary }}</p>
    </div>

    <div class="px-7 pb-5">
      <div class="mb-3">
        <h3 class="text-[10px] font-bold text-[#091426] uppercase tracking-widest mb-1 select-none">Professional Experience</h3>
        <div class="h-[1px] bg-slate-200 w-full"></div>
      </div>
      <div v-for="(job, index) in parsed.experience" :key="index" class="mb-4 last:mb-0">
        <div class="flex justify-between items-baseline mb-0.5">
          <h4 class="text-[11px] font-bold text-[#091426]">{{ job.title }}</h4>
          <span class="text-[8.5px] text-slate-400 italic uppercase font-bold">{{ job.dates }}</span>
        </div>
        <div class="flex justify-between items-baseline mb-1.5">
          <span class="text-[10px] text-slate-500 font-semibold">{{ job.company }}</span>
          <span class="text-[9px] text-slate-400 font-medium">{{ job.location }}</span>
        </div>
        <ul class="list-none space-y-1 pl-1">
          <li v-for="(b, bIdx) in job.bullets" :key="bIdx" class="flex gap-2 items-start text-[10px] leading-normal text-slate-600">
            <span class="mt-1.5 w-1.5 h-1.5 bg-[#091426]/60 shrink-0"></span>
            <p>{{ b }}</p>
          </li>
        </ul>
      </div>
    </div>

    <div class="px-7 pb-5" v-if="parsed.projects.length">
      <div class="mb-3">
        <h3 class="text-[10px] font-bold text-[#091426] uppercase tracking-widest mb-1 select-none">Projects</h3>
        <div class="h-[1px] bg-slate-200 w-full"></div>
      </div>
      <div v-for="(p, pIdx) in parsed.projects" :key="pIdx" class="mb-3.5 last:mb-0">
        <h4 class="text-[11px] font-bold text-[#091426] mb-1.5">{{ p.name }}</h4>
        <ul class="list-none space-y-1 pl-1">
          <li v-for="(b, bIdx) in p.bullets" :key="bIdx" class="flex gap-2 items-start text-[10px] leading-normal text-slate-600">
            <span class="mt-1.5 w-1.5 h-1.5 bg-[#091426]/60 shrink-0"></span>
            <p>{{ b }}</p>
          </li>
        </ul>
      </div>
    </div>

    <div class="px-7 pb-8 grid grid-cols-1 md:grid-cols-2 gap-5">
      <div>
        <div class="mb-2.5">
          <h3 class="text-[10px] font-bold text-[#091426] uppercase tracking-widest mb-1 select-none">Core Competencies</h3>
          <div class="h-[1px] bg-slate-200 w-full"></div>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <span v-for="(s, sIdx) in parsed.skills" :key="sIdx" class="pdf-avoid-break px-2.5 py-1 leading-normal bg-slate-50 border border-slate-200 text-[9px] font-bold text-[#091426] uppercase rounded">
            {{ s }}
          </span>
        </div>
      </div>
      <div>
        <div class="mb-2.5">
          <h3 class="text-[10px] font-bold text-[#091426] uppercase tracking-widest mb-1 select-none">Education</h3>
          <div class="h-[1px] bg-slate-200 w-full"></div>
        </div>
        <div class="space-y-2">
          <div v-for="(edu, eduIdx) in parsed.education" :key="eduIdx">
            <h5 class="text-[10px] font-bold text-[#091426]">{{ edu.degree }}</h5>
            <p class="text-[9.5px] text-slate-500 font-medium">{{ edu.school }} <span v-if="edu.dates" class="text-slate-400 font-normal">| {{ edu.dates }}</span></p>
          </div>
        </div>
      </div>
    </div>

    <section v-for="extra in parsed.extras" :key="extra.title" class="preview-extra-section px-7 pb-4">
      <h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">{{ extra.title }}</h2>
      <div class="space-y-2">
        <div v-for="(item, iIdx) in extra.items" :key="iIdx">
          <h4 class="font-bold text-[10.5px] text-slate-800">{{ item.title }}</h4>
          <p v-if="item.subtitle" class="text-[9px] text-slate-500">{{ item.subtitle }}</p>
          <ul v-if="item.bullets.length" class="text-[9.5px] text-slate-600 list-disc space-y-0.5">
            <li v-for="(b, bIdx) in item.bullets" :key="bIdx">{{ b }}</li>
          </ul>
        </div>
      </div>
    </section>

    <footer class="h-[5px] bg-[#091426] shrink-0"></footer>

  </div>

  <!-- THE EXECUTIVE THEME -->
  <div
    v-else-if="formatId === 'the-executive' || formatId === 'executive-two-column'"
    class="theme-executive w-full bg-white relative p-7 flex flex-col text-slate-800 text-left select-text"
  >
    <header class="text-center mb-5 border-b border-slate-200 pb-4">
      <h1 class="text-2xl font-bold tracking-tight text-[#091426] mb-1 leading-tight">{{ parsed.name }}</h1>
      <p class="text-[9px] uppercase tracking-[0.2em] text-[#006a61] font-bold mb-2.5">{{ parsed.title }}</p>
      <div class="flex flex-wrap justify-center gap-x-2.5 gap-y-1 text-[9.5px] text-slate-500 font-medium">
        <span v-if="parsed.location">{{ parsed.location }}</span>
        <span class="text-slate-400" v-if="parsed.location && parsed.phone">•</span>
        <span v-if="parsed.phone">{{ parsed.phone }}</span>
        <span class="text-slate-400" v-if="parsed.phone && parsed.email">•</span>
        <span v-if="parsed.email">{{ parsed.email }}</span>
        <span class="text-slate-400" v-if="parsed.email && (hasProfileLinks)">•</span>
        <span v-if="hasProfileLinks" class="text-[#006a61]">{{ profileLinksLabel }}</span>
      </div>
    </header>

    <div class="grid grid-cols-12 gap-5 flex-grow">
      <!-- Left Column (col-span-4) -->
      <aside class="col-span-4 flex flex-col gap-4 border-r border-slate-200 pr-4">
        <section v-if="parsed.education.length">
          <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none">Education</h2>
          <div class="h-[1px] bg-slate-200 w-full mb-2"></div>
          <div class="flex flex-col gap-2.5">
            <div v-for="(edu, idx) in parsed.education" :key="idx">
              <h3 class="text-[9.5px] font-bold text-slate-800 leading-snug">{{ edu.school }}</h3>
              <p class="text-[9px] italic text-slate-500 leading-snug">{{ edu.degree }}</p>
              <p class="text-[8px] text-slate-400 mt-0.5">{{ edu.dates }}</p>
            </div>
          </div>
        </section>

        <section v-if="parsed.skills.length">
          <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none">Core Expertise</h2>
          <div class="h-[1px] bg-slate-200 w-full mb-2"></div>
          <ul class="flex flex-col gap-1">
            <li v-for="(s, idx) in parsed.skills" :key="idx" class="flex items-center gap-2 text-[9.5px] text-slate-700 font-medium">
              <span class="w-1.5 h-1.5 bg-[#006a61] rotate-45 shrink-0"></span>
              <span>{{ s }}</span>
            </li>
          </ul>
        </section>

        <section v-if="parsed.credentials.length">
          <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none">Credentials</h2>
          <div class="h-[1px] bg-slate-200 w-full mb-2"></div>
          <div class="text-[9px] text-slate-600 space-y-1 font-medium">
            <p v-for="(c, idx) in parsed.credentials" :key="idx">{{ c }}</p>
          </div>
        </section>
      </aside>

      <!-- Right Column (col-span-8) -->
      <section class="col-span-8 flex flex-col gap-4">
        <div v-if="parsed.summary">
          <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none">Executive Summary</h2>
          <div class="h-[1px] bg-slate-200 w-full mb-2"></div>
          <p class="text-[10px] leading-relaxed text-slate-600">{{ parsed.summary }}</p>
        </div>

        <div v-if="parsed.experience.length">
          <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none">Experience</h2>
          <div class="h-[1px] bg-slate-200 w-full mb-2"></div>
          <div class="flex flex-col gap-3.5">
            <article v-for="(job, idx) in parsed.experience" :key="idx">
              <div class="flex justify-between items-baseline mb-0.5">
                <h3 class="text-[10.5px] font-bold text-slate-800">{{ job.title }}</h3>
                <span class="text-[7.5px] text-slate-400 uppercase font-bold">{{ job.dates }}</span>
              </div>
              <p class="text-[9.5px] italic text-[#006a61] mb-1 font-semibold">{{ job.company }} <span v-if="job.location" class="text-slate-400 font-normal">| {{ job.location }}</span></p>
              <ul class="flex flex-col gap-1 pl-1">
                <li v-for="(b, bIdx) in job.bullets" :key="bIdx" class="relative pl-3 text-[9.5px] text-slate-600 leading-normal before:content-['-'] before:absolute before:left-0 before:font-bold before:text-slate-400">
                  {{ b }}
                </li>
              </ul>
            </article>
          </div>
        </div>

        <div v-if="parsed.projects.length">
          <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none">Projects</h2>
          <div class="h-[1px] bg-slate-200 w-full mb-2"></div>
          <div class="flex flex-col gap-3">
            <div v-for="(p, pIdx) in parsed.projects" :key="pIdx">
              <h4 class="text-[10.5px] font-bold text-slate-800 mb-1 leading-snug">{{ p.name }}</h4>
              <ul class="flex flex-col gap-1 pl-1">
                <li v-for="(b, bIdx) in p.bullets" :key="bIdx" class="relative pl-3 text-[9.5px] text-slate-600 leading-normal before:content-['-'] before:absolute before:left-0 before:font-bold before:text-slate-400">
                  {{ b }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>

      <section v-for="extra in parsed.extras" :key="extra.title" class="preview-extra-section">
        <h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">{{ extra.title }}</h2>
        <div class="space-y-2">
          <div v-for="(item, iIdx) in extra.items" :key="iIdx">
            <h4 class="font-bold text-[10.5px] text-slate-800">{{ item.title }}</h4>
            <p v-if="item.subtitle" class="text-[9px] text-slate-500">{{ item.subtitle }}</p>
            <ul v-if="item.bullets.length" class="text-[9.5px] text-slate-600 list-disc space-y-0.5">
              <li v-for="(b, bIdx) in item.bullets" :key="bIdx">{{ b }}</li>
            </ul>
          </div>
        </div>
      </section>

  </div>

  <!-- THE STRATEGIST THEME -->
  <div
    v-else-if="formatId === 'the-strategist' || formatId === 'strategist-sidebar'"
    class="theme-strategist w-full bg-white relative flex overflow-hidden text-slate-800 text-left select-text p-0"
  >
    <!-- Left Sidebar Column (1/3) -->
    <section class="theme-sidebar w-1/3 bg-[#f8f9ff] p-5 border-r border-slate-200 flex flex-col gap-5 shrink-0">
      <!-- Contact Details -->
      <div>
        <h3 class="text-[10px] font-bold text-[#091426] uppercase tracking-widest border-b border-slate-300 pb-1 mb-2 select-none">Contact</h3>
        <div class="flex flex-col gap-1.5 text-[9px] text-slate-600 font-medium">
          <div class="flex items-start gap-1.5" v-if="parsed.email">
            <span class="w-1 h-1 mt-1.5 shrink-0 bg-slate-400 rounded-full"></span>
            <span class="break-all leading-normal">{{ parsed.email }}</span>
          </div>
          <div class="flex items-start gap-1.5" v-if="parsed.phone">
            <span class="w-1 h-1 mt-1.5 shrink-0 bg-slate-400 rounded-full"></span>
            <span class="leading-normal">{{ parsed.phone }}</span>
          </div>
          <div class="flex items-start gap-1.5" v-if="parsed.location">
            <span class="w-1 h-1 mt-1.5 shrink-0 bg-slate-400 rounded-full"></span>
            <span class="break-words leading-normal">{{ parsed.location }}</span>
          </div>
          <div class="flex items-start gap-1.5 text-[#006a61]" v-if="hasProfileLinks">
            <span class="w-1 h-1 mt-1.5 shrink-0 bg-slate-400 rounded-full"></span>
            <span class="break-all leading-normal">{{ profileLinksLabel }}</span>
          </div>
        </div>
      </div>

      <!-- Core Expertise -->
      <div v-if="parsed.skills.length">
        <h3 class="text-[10px] font-bold text-[#091426] uppercase tracking-widest border-b border-slate-300 pb-1 mb-2 select-none">Expertise</h3>
        <div class="flex flex-col gap-1">
          <div v-for="(s, idx) in parsed.skills" :key="idx" class="pdf-avoid-break text-[9px] text-slate-700 font-bold uppercase tracking-wider bg-white border border-slate-200/80 px-2 py-1 rounded shadow-sm text-center leading-normal break-words">
            {{ s }}
          </div>
        </div>
      </div>

      <!-- Education -->
      <div v-if="parsed.education.length">
        <h3 class="text-[10px] font-bold text-[#091426] uppercase tracking-widest border-b border-slate-300 pb-1 mb-2 select-none">Education</h3>
        <div class="space-y-2">
          <div v-for="(edu, idx) in parsed.education" :key="idx">
            <h5 class="text-[9.5px] font-bold text-slate-800 leading-snug">{{ edu.school }}</h5>
            <p class="text-[9px] text-slate-500 leading-snug">{{ edu.degree }}</p>
            <p class="text-[8px] text-slate-400 mt-0.5" v-if="edu.dates">{{ edu.dates }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Right Main Column (2/3) -->
    <section class="w-2/3 p-6 flex flex-col gap-4">
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight text-[#091426] mb-0.5 leading-tight">{{ parsed.name }}</h1>
        <h2 class="text-[9.5px] font-bold tracking-[0.15em] text-[#006a61] uppercase mb-3 leading-snug">{{ parsed.title }}</h2>
        <div class="h-[2px] bg-gradient-to-r from-[#091426] via-[#006a61] to-transparent w-full opacity-30"></div>
      </div>

      <div v-if="parsed.summary">
        <h3 class="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest mb-1 select-none">Profile</h3>
        <p class="text-[10px] leading-relaxed text-slate-600">{{ parsed.summary }}</p>
      </div>

      <div v-if="parsed.experience.length">
        <h3 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest mb-2 select-none">Experience</h3>
        <div class="space-y-3">
          <div v-for="(job, idx) in parsed.experience" :key="idx">
            <div class="flex justify-between items-baseline mb-0.5">
              <h4 class="text-[10.5px] font-bold text-slate-800">{{ job.title }}</h4>
              <span class="text-[7.5px] text-slate-400 font-bold uppercase">{{ job.dates }}</span>
            </div>
            <p class="text-[9px] text-[#006a61] font-bold mb-1 leading-snug">{{ job.company }} <span v-if="job.location" class="text-slate-400 font-normal">· {{ job.location }}</span></p>
            <ul class="space-y-0.5 pl-0.5 list-none">
              <li v-for="(b, bIdx) in job.bullets" :key="bIdx" class="flex gap-2 items-start text-[9.5px] leading-normal text-slate-600">
                <span class="mt-1.5 w-1 h-1 bg-slate-300 rounded-full shrink-0"></span>
                <p>{{ b }}</p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div v-if="parsed.projects.length">
        <h3 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest mb-2 select-none">Projects</h3>
        <div class="space-y-3">
          <div v-for="(p, pIdx) in parsed.projects" :key="pIdx">
            <h4 class="text-[10.5px] font-bold text-slate-800 mb-1 leading-snug">{{ p.name }}</h4>
            <ul class="space-y-0.5 pl-0.5 list-none">
              <li v-for="(b, bIdx) in p.bullets" :key="bIdx" class="flex gap-2 items-start text-[9.5px] leading-normal text-slate-600">
                <span class="mt-1.5 w-1.5 h-1.5 bg-slate-300 rounded-full shrink-0"></span>
                <p>{{ b }}</p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <section v-for="extra in parsed.extras" :key="extra.title" class="preview-extra-section">
        <h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">{{ extra.title }}</h2>
        <div class="space-y-2">
          <div v-for="(item, iIdx) in extra.items" :key="iIdx">
            <h4 class="font-bold text-[10.5px] text-slate-800">{{ item.title }}</h4>
            <p v-if="item.subtitle" class="text-[9px] text-slate-500">{{ item.subtitle }}</p>
            <ul v-if="item.bullets.length" class="text-[9.5px] text-slate-600 list-disc space-y-0.5">
              <li v-for="(b, bIdx) in item.bullets" :key="bIdx">{{ b }}</li>
            </ul>
          </div>
        </div>
      </section>
    </section>

  </div>

  <!-- THE CREATIVE DIRECTOR THEME -->
  <div
    v-else-if="formatId === 'the-creative-director'"
    class="theme-creative-director w-full relative flex flex-row items-stretch text-slate-800 text-left select-text p-0"
  >
    <aside
      class="theme-sidebar w-[280px] shrink-0 flex flex-col justify-start p-7 self-stretch"
      style="background-color:#006a61;color:#ffffff;"
    >
      <div>
        <h1 class="text-3xl font-black leading-none uppercase break-words" style="color:#ffffff;">{{ parsed.name }}</h1>
        <p class="text-[9px] uppercase tracking-widest mt-2 font-bold" style="color:#ccfbf1;">{{ parsed.title }}</p>
        
        <div class="mt-6 space-y-4">
          <div>
            <h4 class="text-[9px] uppercase tracking-widest font-bold border-b pb-1 mb-2" style="color:#99f6e4;border-color:rgba(255,255,255,0.25);">Contact</h4>
            <ul class="list-none space-y-1.5 text-[9.5px] leading-normal pl-0" style="color:#ffffff;list-style:none;">
              <li v-if="parsed.email" class="break-all leading-normal" style="color:#ffffff;overflow:visible;height:auto;list-style:none;">{{ parsed.email }}</li>
              <li v-if="parsed.phone" class="leading-normal" style="color:#ffffff;overflow:visible;height:auto;list-style:none;">{{ parsed.phone }}</li>
              <li v-if="parsed.location" class="break-words leading-normal" style="color:#ffffff;overflow:visible;height:auto;list-style:none;">{{ parsed.location }}</li>
              <li v-if="hasProfileLinks" class="break-all leading-normal" style="color:#ccfbf1;overflow:visible;height:auto;list-style:none;">{{ profileLinksLabel }}</li>
            </ul>
          </div>

          <div v-if="parsed.skills.length">
            <h4 class="text-[9px] uppercase tracking-widest font-bold border-b pb-1 mb-2" style="color:#99f6e4;border-color:rgba(255,255,255,0.25);">Skills</h4>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="(s, idx) in parsed.skills"
                :key="idx"
                class="pdf-avoid-break inline-block px-2.5 py-1.5 text-[9px] leading-normal font-semibold rounded"
                style="background-color:#0f766e;border:1px solid #5eead4;color:#ffffff;overflow:visible;height:auto;max-height:none;white-space:normal;"
              >
                {{ s }}
              </span>
            </div>
          </div>

          <div v-if="parsed.education.length">
            <h4 class="text-[9px] uppercase tracking-widest font-bold border-b pb-1 mb-2" style="color:#99f6e4;border-color:rgba(255,255,255,0.25);">Education</h4>
            <div class="space-y-2.5 text-[9.5px]">
              <div v-for="(edu, idx) in parsed.education" :key="idx">
                <p class="font-bold" style="color:#ffffff;">{{ edu.degree }}</p>
                <p style="color:#e2e8f0;">{{ edu.school }} <span v-if="edu.dates">, {{ edu.dates }}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <div class="flex-1 bg-white p-8 flex flex-col gap-4 min-w-0 self-stretch">
      <section v-if="parsed.summary" class="pdf-avoid-break">
        <h2 class="text-[10px] font-bold text-[#006a61] uppercase tracking-wider mb-2 flex items-center gap-2">
          <span>Profile</span>
          <span class="h-[1px] flex-1 bg-teal-100"></span>
        </h2>
        <p class="text-[11px] leading-relaxed text-slate-600">{{ parsed.summary }}</p>
      </section>

      <section v-if="parsed.experience.length">
        <h2 class="text-[10px] font-bold text-[#006a61] uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>Experience</span>
          <span class="h-[1px] flex-1 bg-teal-100"></span>
        </h2>
        <div class="space-y-4">
          <div v-for="(job, idx) in parsed.experience" :key="idx" class="relative pl-4 border-l border-teal-200/60">
            <div class="absolute -left-[4px] top-1 w-2 h-2 rounded-full bg-[#006a61]"></div>
            <div class="flex justify-between items-start mb-0.5 gap-2 pdf-avoid-break">
              <h4 class="font-bold text-[11.5px] text-slate-800">{{ job.title }}</h4>
              <span class="text-[8px] text-slate-400 uppercase font-bold shrink-0">{{ job.dates }}</span>
            </div>
            <p class="text-[#006a61] font-semibold text-[9.5px] mb-1.5 pdf-avoid-break">{{ job.company }} <span v-if="job.location" class="text-slate-500 font-normal">| {{ job.location }}</span></p>
            <ul class="text-[10px] text-slate-600 space-y-1 list-disc">
              <li v-for="(b, bIdx) in job.bullets" :key="bIdx" class="pdf-avoid-break">{{ b }}</li>
            </ul>
          </div>
        </div>
      </section>

      <section v-if="parsed.projects.length">
        <h2 class="text-[10px] font-bold text-[#006a61] uppercase tracking-wider mb-2.5 flex items-center gap-2">
          <span>Selected Work</span>
          <span class="h-[1px] flex-1 bg-teal-100"></span>
        </h2>
        <div class="space-y-2">
          <div v-for="(p, pIdx) in parsed.projects" :key="pIdx">
            <h4 class="font-bold text-[10.5px] text-slate-800">{{ p.name }}</h4>
            <ul class="text-[9.5px] text-slate-600 space-y-0.5 list-disc">
              <li v-for="(b, bIdx) in p.bullets" :key="bIdx">{{ b }}</li>
            </ul>
          </div>
        </div>
      </section>

      <section v-if="parsed.credentials.length">
        <h2 class="text-[10px] font-bold text-[#006a61] uppercase tracking-wider mb-2 flex items-center gap-2">
          <span>Awards & Credentials</span>
          <span class="h-[1px] flex-1 bg-teal-100"></span>
        </h2>
        <ul class="text-[9.5px] text-slate-600 space-y-1 list-disc">
          <li v-for="(c, idx) in parsed.credentials" :key="idx">{{ c }}</li>
        </ul>
      </section>

      <section v-for="extra in parsed.extras" :key="extra.title">
        <h2 class="text-[10px] font-bold text-[#006a61] uppercase tracking-wider mb-2 flex items-center gap-2">
          <span>{{ extra.title }}</span>
          <span class="h-[1px] flex-1 bg-teal-100"></span>
        </h2>
        <div class="space-y-2">
          <div v-for="(item, iIdx) in extra.items" :key="iIdx">
            <h4 class="font-bold text-[10.5px] text-slate-800">{{ item.title }}</h4>
            <p v-if="item.subtitle" class="text-[9px] text-slate-500 mb-0.5">{{ item.subtitle }}</p>
            <ul v-if="item.bullets.length" class="text-[9.5px] text-slate-600 space-y-0.5 list-disc">
              <li v-for="(b, bIdx) in item.bullets" :key="bIdx">{{ b }}</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  </div>

  <!-- THE PARTNER THEME -->
  <div
    v-else-if="formatId === 'the-partner'"
    class="theme-partner w-full bg-white relative p-8 flex flex-col gap-5 text-slate-800 text-left select-text"
  >
    <header class="text-center flex flex-col items-center gap-2 pt-4">
      <h1 class="text-2xl font-semibold tracking-wider text-[#091426] serif">{{ parsed.name }}</h1>
      <p class="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-bold border-y border-slate-200 py-1 w-full max-w-md">{{ parsed.title }}</p>
      <div class="flex flex-wrap justify-center gap-3 text-[9.5px] text-slate-500 mt-1 font-medium">
        <span v-if="parsed.location">{{ parsed.location }}</span>
        <span v-if="parsed.phone">{{ parsed.phone }}</span>
        <span v-if="parsed.email">{{ parsed.email }}</span>
        <span v-if="hasProfileLinks" class="underline text-slate-700">{{ profileLinksLabel }}</span>
      </div>
    </header>

    <section v-if="parsed.summary" class="mt-2">
      <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] border-b-2 border-[#091426] pb-0.5 mb-2">Executive Profile</h2>
      <p class="text-[10.5px] leading-relaxed text-slate-600 serif">{{ parsed.summary }}</p>
    </section>

    <section v-if="parsed.experience.length">
      <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] border-b-2 border-[#091426] pb-0.5 mb-2.5">Professional Experience</h2>
      <div class="space-y-4">
        <div v-for="(job, idx) in parsed.experience" :key="idx">
          <div class="flex justify-between items-baseline mb-0.5">
            <h3 class="text-[11px] font-bold text-slate-800">{{ job.title }}</h3>
            <span class="text-[8px] text-slate-400 font-bold uppercase">{{ job.dates }}</span>
          </div>
          <p class="text-[9.5px] text-slate-500 font-bold italic mb-1">{{ job.company }} <span v-if="job.location" class="text-slate-400 font-normal">| {{ job.location }}</span></p>
          <ul class="space-y-0.5 list-disc text-[10px] text-slate-600">
            <li v-for="(b, bIdx) in job.bullets" :key="bIdx">{{ b }}</li>
          </ul>
        </div>
      </div>
    </section>

    <section v-if="parsed.projects.length">
      <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] border-b-2 border-[#091426] pb-0.5 mb-2.5">Selected Engagements</h2>
      <div class="space-y-2">
        <div v-for="(p, pIdx) in parsed.projects" :key="pIdx">
          <h4 class="text-[10.5px] font-bold text-slate-800">{{ p.name }}</h4>
          <ul class="space-y-0.5 list-disc text-[9.5px] text-slate-600">
            <li v-for="(b, bIdx) in p.bullets" :key="bIdx">{{ b }}</li>
          </ul>
        </div>
      </div>
    </section>

    <div class="grid grid-cols-2 gap-6">
      <section v-if="parsed.skills.length">
        <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] border-b-2 border-[#091426] pb-0.5 mb-2">Core Expertise</h2>
        <div class="grid grid-cols-2 gap-y-1 gap-x-2">
          <div v-for="(s, idx) in parsed.skills" :key="idx" class="flex items-center gap-1.5 text-[9.5px] text-slate-600">
            <span class="text-[#091426] font-bold">✓</span>
            <span>{{ s }}</span>
          </div>
        </div>
      </section>

      <section v-if="parsed.education.length">
        <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] border-b-2 border-[#091426] pb-0.5 mb-2">Education</h2>
        <div class="space-y-2">
          <div v-for="(edu, idx) in parsed.education" :key="idx">
            <h5 class="text-[10px] font-bold text-slate-800">{{ edu.school }}</h5>
            <p class="text-[9px] text-slate-500 leading-tight">{{ edu.degree }} <span v-if="edu.dates" class="text-slate-400">| {{ edu.dates }}</span></p>
          </div>
        </div>
      </section>

      <section v-if="parsed.credentials.length" class="col-span-2">
        <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] border-b-2 border-[#091426] pb-0.5 mb-2">Credentials</h2>
        <ul class="list-disc text-[9.5px] text-slate-600 space-y-0.5">
          <li v-for="(c, idx) in parsed.credentials" :key="idx">{{ c }}</li>
        </ul>
      </section>
    </div>

      <section v-for="extra in parsed.extras" :key="extra.title" class="preview-extra-section">
        <h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">{{ extra.title }}</h2>
        <div class="space-y-2">
          <div v-for="(item, iIdx) in extra.items" :key="iIdx">
            <h4 class="font-bold text-[10.5px] text-slate-800">{{ item.title }}</h4>
            <p v-if="item.subtitle" class="text-[9px] text-slate-500">{{ item.subtitle }}</p>
            <ul v-if="item.bullets.length" class="text-[9.5px] text-slate-600 list-disc space-y-0.5">
              <li v-for="(b, bIdx) in item.bullets" :key="bIdx">{{ b }}</li>
            </ul>
          </div>
        </div>
      </section>

  </div>

  <!-- THE INNOVATOR THEME -->
  <div
    v-else-if="formatId === 'the-innovator'"
    class="theme-innovator w-full bg-[#091426] text-white relative p-8 flex flex-col gap-5 text-left select-text"
  >
    <div class="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>

    <header class="relative border-b border-teal-500/20 pb-5 z-10">
      <h1 class="text-3xl font-black tracking-tight text-white uppercase">{{ parsed.name }}</h1>
      <p class="text-[9.5px] font-bold tracking-[0.2em] text-teal-400 uppercase mt-1">{{ parsed.title }}</p>
      <div class="flex flex-wrap gap-4 text-[9.5px] text-slate-400 mt-4">
        <span v-if="parsed.email">✉ {{ parsed.email }}</span>
        <span v-if="parsed.phone">☎ {{ parsed.phone }}</span>
        <span v-if="parsed.location">⚲ {{ parsed.location }}</span>
        <span v-if="hasProfileLinks" class="text-teal-400">{{ profileLinksLabel }}</span>
      </div>
    </header>

    <div class="grid grid-cols-12 gap-5 relative z-10 flex-grow">
      <!-- Left Column (col-span-8) -->
      <section class="col-span-8 flex flex-col gap-4">
        <div v-if="parsed.summary">
          <h2 class="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-1.5 select-none">Innovation Profile</h2>
          <p class="text-[10.5px] leading-relaxed text-slate-300 bg-slate-900/40 p-3 rounded-lg border border-slate-800/60">{{ parsed.summary }}</p>
        </div>

        <div v-if="parsed.experience.length">
          <h2 class="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-2 select-none">Professional Experience</h2>
          <div class="space-y-4">
            <div v-for="(job, idx) in parsed.experience" :key="idx" class="bg-slate-900/20 border border-slate-800/40 p-3 rounded-xl">
              <div class="flex justify-between items-baseline mb-1">
                <h3 class="text-[11px] font-bold text-white">{{ job.title }}</h3>
                <span class="text-[8px] text-teal-300 font-bold bg-teal-950/60 border border-teal-500/20 px-1.5 py-0.5 rounded">{{ job.dates }}</span>
              </div>
              <p class="text-[9.5px] text-teal-400/90 font-medium mb-2">{{ job.company }} <span v-if="job.location" class="text-slate-500">| {{ job.location }}</span></p>
              <ul class="space-y-1 pl-1 list-none text-[9.5px] text-slate-300">
                <li v-for="(b, bIdx) in job.bullets" :key="bIdx" class="flex gap-2 items-start">
                  <span class="text-teal-400 font-bold mt-0.5 shrink-0">»</span>
                  <p>{{ b }}</p>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div v-if="parsed.projects.length">
          <h2 class="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-2 select-none">Selected Works</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div
              v-for="(p, pIdx) in parsed.projects"
              :key="pIdx"
              class="p-3 bg-slate-900/40 border border-slate-800/60 rounded-lg"
            >
              <h4 class="text-[10px] font-bold text-white mb-1">{{ p.name }}</h4>
              <p
                v-for="(b, bIdx) in p.bullets.slice(0, 2)"
                :key="bIdx"
                class="text-[9px] text-slate-400 leading-snug"
              >
                {{ b }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Right Column (col-span-4) -->
      <aside class="col-span-4 flex flex-col gap-4">
        <section v-if="parsed.skills.length" class="bg-slate-900/40 border border-slate-800/80 p-3 rounded-xl">
          <h2 class="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-2 select-none">Technologies</h2>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="(s, idx) in parsed.skills" :key="idx" class="pdf-avoid-break px-2 py-1 leading-normal bg-slate-950 text-[9px] font-bold text-teal-300 border border-teal-500/20 rounded">
              {{ s }}
            </span>
          </div>
        </section>

        <section v-if="parsed.education.length" class="bg-slate-900/40 border border-slate-800/80 p-3 rounded-xl">
          <h2 class="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-2 select-none">Education</h2>
          <div class="space-y-2.5">
            <div v-for="(edu, idx) in parsed.education" :key="idx">
              <h5 class="text-[9.5px] font-bold text-white">{{ edu.degree }}</h5>
              <p class="text-[8.5px] text-slate-400">{{ edu.school }}</p>
              <p class="text-[8px] text-teal-300/80" v-if="edu.dates">{{ edu.dates }}</p>
            </div>
          </div>
        </section>

        <section v-if="parsed.credentials.length" class="bg-slate-900/40 border border-slate-800/80 p-3 rounded-xl">
          <h2 class="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-2 select-none">Verified</h2>
          <ul class="space-y-2 list-none">
            <li
              v-for="(c, idx) in parsed.credentials"
              :key="idx"
              class="border-l-2 border-teal-500/40 pl-2 text-[9px] text-slate-300 font-medium"
            >
              {{ c }}
            </li>
          </ul>
        </section>
      </aside>
    </div>

    <section
      v-for="extra in parsed.extras"
      :key="extra.title"
      class="preview-extra-section relative z-10 bg-slate-900/40 border border-slate-800/80 p-3 rounded-xl"
    >
      <h2 class="text-[10px] font-bold uppercase tracking-widest text-teal-400 mb-2 select-none">{{ extra.title }}</h2>
      <div class="space-y-2">
        <div v-for="(item, iIdx) in extra.items" :key="iIdx">
          <h4 class="font-bold text-[10.5px] text-white">{{ item.title }}</h4>
          <p v-if="item.subtitle" class="text-[9px] text-slate-400">{{ item.subtitle }}</p>
          <ul v-if="item.bullets.length" class="text-[9.5px] text-slate-300 list-disc space-y-0.5">
            <li v-for="(b, bIdx) in item.bullets" :key="bIdx">{{ b }}</li>
          </ul>
        </div>
      </div>
    </section>

  </div>

  <!-- THE DIGITAL NOMAD THEME -->
  <div
    v-else-if="formatId === 'the-digital-nomad'"
    class="theme-digital-nomad w-full bg-white relative flex flex-row items-stretch text-slate-800 text-left select-text p-0"
  >
    <!-- Left Split Column (50%) -->
    <div
      class="theme-sidebar w-1/2 p-8 flex flex-col justify-start shrink-0"
      style="background-color:#0b1c30;color:#ffffff;"
    >
      <div>
        <h1 class="text-3xl font-black text-white leading-tight uppercase">{{ parsed.name }}</h1>
        <p class="text-[9.5px] uppercase tracking-[0.25em] text-[#ff4e69] font-bold mt-1.5">{{ parsed.title }}</p>
        
        <div class="mt-6 space-y-4">
          <section v-if="parsed.summary">
            <h3 class="text-[9.5px] uppercase tracking-widest text-[#ff4e69] font-bold mb-2.5">Nomad Profile</h3>
            <p class="text-[10.5px] leading-relaxed text-slate-300 opacity-90 max-w-sm">{{ parsed.summary }}</p>
          </section>

          <section>
            <h3 class="text-[9.5px] uppercase tracking-widest text-[#ff4e69] font-bold mb-2.5">Contact</h3>
            <ul class="list-none space-y-2 text-[9.5px] text-slate-300 pl-0" style="list-style:none;">
              <li v-if="parsed.email" class="break-all leading-normal" style="list-style:none;overflow:visible;height:auto;">✉ {{ parsed.email }}</li>
              <li v-if="parsed.phone" class="leading-normal" style="list-style:none;overflow:visible;height:auto;">☎ {{ parsed.phone }}</li>
              <li v-if="parsed.location" class="break-words leading-normal" style="list-style:none;overflow:visible;height:auto;">⚲ {{ parsed.location }}</li>
              <li v-if="hasProfileLinks" class="text-[#ff4e69] font-semibold break-all leading-normal" style="list-style:none;overflow:visible;height:auto;">{{ profileLinksLabel }}</li>
            </ul>
          </section>

          <section v-if="parsed.skills.length">
            <h3 class="text-[9.5px] uppercase tracking-widest text-[#ff4e69] font-bold mb-2.5">Skills</h3>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="(s, idx) in parsed.skills"
                :key="idx"
                class="px-2 py-1 leading-normal bg-white/10 border border-white/15 text-[9px] font-semibold text-white rounded"
              >
                {{ s }}
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>

    <!-- Right Split Column (50%) -->
    <div class="w-1/2 bg-white p-8 flex flex-col gap-4 min-w-0">
      <section v-if="parsed.experience.length">
        <h2 class="text-[10px] font-bold uppercase tracking-widest text-[#091426] border-b border-slate-200 pb-1 mb-3">Experience</h2>
        <div class="space-y-4">
          <div v-for="(job, idx) in parsed.experience" :key="idx">
            <div class="flex justify-between items-baseline mb-0.5">
              <h4 class="font-bold text-[11px] text-slate-800">{{ job.title }}</h4>
              <span class="text-[7.5px] text-[#ff4e69] font-bold uppercase">{{ job.dates }}</span>
            </div>
            <p class="text-[#0b1c30] font-semibold text-[9.5px] mb-1.5">{{ job.company }} <span v-if="job.location" class="text-slate-400 font-normal">| {{ job.location }}</span></p>
            <ul class="text-[9.5px] text-slate-600 space-y-1 list-disc">
              <li v-for="(b, bIdx) in job.bullets" :key="bIdx">{{ b }}</li>
            </ul>
          </div>
        </div>
      </section>

      <section v-if="parsed.projects.length">
        <h2 class="text-[10px] font-bold uppercase tracking-widest text-[#091426] border-b border-slate-200 pb-1 mb-3">Selected Work</h2>
        <div class="space-y-3">
          <div v-for="(p, pIdx) in parsed.projects" :key="pIdx">
            <h4 class="font-bold text-[10.5px] text-slate-800">{{ p.name }}</h4>
            <ul class="text-[9.5px] text-slate-600 space-y-0.5 list-disc">
              <li v-for="(b, bIdx) in p.bullets" :key="bIdx">{{ b }}</li>
            </ul>
          </div>
        </div>
      </section>

      <section v-if="parsed.skills.length">
        <h2 class="text-[10px] font-bold uppercase tracking-widest text-[#091426] border-b border-slate-200 pb-1 mb-2.5">Skills</h2>
        <div class="flex flex-wrap gap-1">
          <span v-for="(s, idx) in parsed.skills" :key="idx" class="pdf-avoid-break px-2 py-1 leading-normal border border-[#0b1c30] rounded-full text-[9px] text-[#0b1c30] font-bold">
            {{ s }}
          </span>
        </div>
      </section>

      <section v-if="parsed.education.length">
        <h2 class="text-[10px] font-bold uppercase tracking-widest text-[#091426] border-b border-slate-200 pb-1 mb-2">Education</h2>
        <div class="space-y-2">
          <div v-for="(edu, idx) in parsed.education" :key="idx" class="text-[9.5px]">
            <p class="font-bold text-slate-800">{{ edu.degree }}</p>
            <p class="text-slate-500">{{ edu.school }} <span v-if="edu.dates" class="text-slate-400">, {{ edu.dates }}</span></p>
          </div>
        </div>
      </section>

      <section v-if="parsed.credentials.length">
        <h2 class="text-[10px] font-bold uppercase tracking-widest text-[#091426] border-b border-slate-200 pb-1 mb-2">Credentials</h2>
        <ul class="text-[9px] text-slate-600 space-y-1 list-disc">
          <li v-for="(c, idx) in parsed.credentials" :key="idx">{{ c }}</li>
        </ul>
      </section>

      <section v-for="extra in parsed.extras" :key="extra.title" class="preview-extra-section">
        <h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">{{ extra.title }}</h2>
        <div class="space-y-2">
          <div v-for="(item, iIdx) in extra.items" :key="iIdx">
            <h4 class="font-bold text-[10.5px] text-slate-800">{{ item.title }}</h4>
            <p v-if="item.subtitle" class="text-[9px] text-slate-500">{{ item.subtitle }}</p>
            <ul v-if="item.bullets.length" class="text-[9.5px] text-slate-600 list-disc space-y-0.5">
              <li v-for="(b, bIdx) in item.bullets" :key="bIdx">{{ b }}</li>
            </ul>
          </div>
        </div>
      </section>
    </div>

  </div>

  <!-- THE SOCIAL MEDIA PRO THEME -->
  <div
    v-else-if="formatId === 'the-social-media-pro'"
    class="theme-social-media-pro w-full bg-white relative flex flex-col text-slate-800 text-left select-text p-0"
  >
    <!-- Top banner with colorful gradient -->
    <div class="h-28 bg-gradient-to-r from-[#091426] via-[#334155] to-[#0f172a] relative shrink-0"></div>

    <div class="px-7 relative flex-grow flex flex-col pb-8">
      <!-- Info overlap block -->
      <div class="flex flex-col sm:flex-row justify-between items-start gap-4 -mt-10 mb-5 relative z-10">
        <div class="w-20 h-20 bg-slate-100 rounded-full border-4 border-white shadow-md flex items-center justify-center shrink-0">
          <span class="text-slate-400 text-xs select-none">📷 Photo</span>
        </div>
        <div class="flex-grow pt-10 sm:pt-12">
          <h1 class="text-2xl font-extrabold text-[#091426] tracking-tight leading-none">{{ parsed.name }}</h1>
          <p class="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">{{ parsed.title }}</p>
        </div>
        <div class="sm:text-right pt-2 sm:pt-12 text-[9.5px] text-slate-500 font-medium space-y-0.5">
          <p v-if="parsed.email">✉ {{ parsed.email }}</p>
          <p v-if="parsed.phone">☎ {{ parsed.phone }}</p>
          <p v-if="parsed.location">⚲ {{ parsed.location }}</p>
          <p v-if="hasProfileLinks" class="text-[#006a61] font-semibold">{{ profileLinksLabel }}</p>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-5 flex-grow">
        <!-- Main Column (col-span-8) -->
        <section class="col-span-8 flex flex-col gap-4">
          <div v-if="parsed.summary">
            <h3 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-1.5">Bio</h3>
            <p class="text-[10.5px] leading-relaxed text-slate-600">{{ parsed.summary }}</p>
          </div>

          <div v-if="parsed.experience.length">
            <h3 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2">Campaign Experience</h3>
            <div class="space-y-3.5">
              <div v-for="(job, idx) in parsed.experience" :key="idx">
                <div class="flex justify-between items-baseline mb-0.5">
                  <h4 class="text-[10.5px] font-bold text-slate-800">{{ job.title }}</h4>
                  <span class="text-[7.5px] text-slate-800 font-bold uppercase">{{ job.dates }}</span>
                </div>
                <p class="text-[9.5px] text-[#006a61] font-bold mb-1">{{ job.company }} <span v-if="job.location" class="text-slate-400 font-normal">| {{ job.location }}</span></p>
                <ul class="space-y-0.5 list-disc text-[9.5px] text-slate-600">
                  <li v-for="(b, bIdx) in job.bullets" :key="bIdx">{{ b }}</li>
                </ul>
              </div>
            </div>
          </div>

          <div v-if="parsed.projects.length">
            <h3 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2">Featured Work</h3>
            <div class="space-y-2.5">
              <div v-for="(p, pIdx) in parsed.projects" :key="pIdx">
                <h4 class="text-[10.5px] font-bold text-slate-800">{{ p.name }}</h4>
                <ul class="space-y-0.5 list-disc text-[9.5px] text-slate-600">
                  <li v-for="(b, bIdx) in p.bullets" :key="bIdx">{{ b }}</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <!-- Sidebar Column (col-span-4) -->
        <aside class="col-span-4 flex flex-col gap-4">
          <section v-if="parsed.skills.length">
            <h3 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2">Capabilities</h3>
            <div class="flex flex-wrap gap-1">
              <span v-for="(s, idx) in parsed.skills" :key="idx" class="pdf-avoid-break px-2 py-1 leading-normal bg-slate-50 border border-slate-200 text-[9px] font-semibold text-slate-700 rounded">
                {{ s }}
              </span>
            </div>
          </section>

          <section v-if="parsed.education.length">
            <h3 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2">Education</h3>
            <div class="space-y-2 text-[9.5px]">
              <div v-for="(edu, idx) in parsed.education" :key="idx">
                <p class="font-bold text-slate-800 leading-snug">{{ edu.school }}</p>
                <p class="text-slate-500 leading-tight">{{ edu.degree }}</p>
              </div>
            </div>
          </section>

          <section v-if="parsed.credentials.length">
            <h3 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2">Highlights</h3>
            <ul class="space-y-1 text-[9px] text-slate-600 list-disc">
              <li v-for="(c, idx) in parsed.credentials" :key="idx">{{ c }}</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
    <div class="h-1 bg-[#0f172a] shrink-0"></div>

      <section v-for="extra in parsed.extras" :key="extra.title" class="preview-extra-section">
        <h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">{{ extra.title }}</h2>
        <div class="space-y-2">
          <div v-for="(item, iIdx) in extra.items" :key="iIdx">
            <h4 class="font-bold text-[10.5px] text-slate-800">{{ item.title }}</h4>
            <p v-if="item.subtitle" class="text-[9px] text-slate-500">{{ item.subtitle }}</p>
            <ul v-if="item.bullets.length" class="text-[9.5px] text-slate-600 list-disc space-y-0.5">
              <li v-for="(b, bIdx) in item.bullets" :key="bIdx">{{ b }}</li>
            </ul>
          </div>
        </div>
      </section>

  </div>

  <!-- THE BRAND ARCHITECT THEME -->
  <div
    v-else-if="formatId === 'the-brand-architect'"
    class="theme-brand-architect w-full bg-white relative p-8 flex flex-col gap-5 text-slate-800 text-left select-text overflow-hidden"
  >
    <!-- Background Monogram Letter -->
    <div class="absolute -top-6 -left-10 text-[160px] font-extrabold text-slate-50 opacity-[0.45] select-none pointer-events-none serif">
      {{ parsed.name ? parsed.name.replace(/^Dr.s*/i, '').charAt(0).toUpperCase() : 'M' }}
    </div>

    <header class="relative z-10 flex flex-col md:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-5">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-[#091426] uppercase serif">{{ parsed.name }}</h1>
        <p class="text-[9px] uppercase tracking-[0.25em] text-[#006a61] bg-[#091426] text-white px-2 py-0.5 inline-block font-bold mt-2">{{ parsed.title }}</p>
      </div>
      <div class="flex flex-col gap-0.5 text-[9.5px] text-slate-500 font-medium border-l border-slate-300 pl-3 md:pl-0 md:border-l-0 md:border-r md:pr-3 md:text-right">
        <span v-if="parsed.email">{{ parsed.email }}</span>
        <span v-if="parsed.phone">{{ parsed.phone }}</span>
        <span v-if="parsed.location">{{ parsed.location }}</span>
        <span v-if="hasProfileLinks" class="underline text-slate-600">{{ profileLinksLabel }}</span>
      </div>
    </header>

    <div class="relative z-10 flex flex-col gap-5 flex-grow">
      <section v-if="parsed.summary">
        <h2 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2 select-none">Profile</h2>
        <p class="text-[10.5px] leading-relaxed text-slate-600 font-medium">{{ parsed.summary }}</p>
      </section>

      <section v-if="parsed.experience.length">
        <h2 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-3 select-none">Experience</h2>
        <div class="space-y-4">
          <div v-for="(job, idx) in parsed.experience" :key="idx">
            <div class="flex justify-between items-baseline mb-0.5">
              <h4 class="text-[11px] font-bold text-slate-800 leading-snug">{{ job.title }}</h4>
              <span class="text-[8px] text-slate-400 font-bold uppercase">{{ job.dates }}</span>
            </div>
            <p class="text-[9px] text-[#006a61] font-bold uppercase tracking-wider mb-1.5 leading-snug">{{ job.company }} <span v-if="job.location" class="text-slate-400 font-normal">| {{ job.location }}</span></p>
            <ul class="space-y-1 list-none pl-1 text-[9.5px] text-slate-600">
              <li v-for="(b, bIdx) in job.bullets" :key="bIdx" class="flex gap-2 items-start">
                <span class="text-[#006a61] font-bold mt-0.5">▪</span>
                <p>{{ b }}</p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section v-if="parsed.projects.length">
        <h2 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-3 select-none">Selected Work</h2>
        <div class="space-y-2.5">
          <div v-for="(p, pIdx) in parsed.projects" :key="pIdx">
            <h4 class="text-[10.5px] font-bold text-slate-800">{{ p.name }}</h4>
            <ul class="text-[9.5px] text-slate-600 space-y-0.5 list-disc">
              <li v-for="(b, bIdx) in p.bullets" :key="bIdx">{{ b }}</li>
            </ul>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-2 gap-5">
        <section v-if="parsed.skills.length">
          <h2 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2 select-none">Expertise</h2>
          <div class="flex flex-wrap gap-1">
            <span v-for="(s, idx) in parsed.skills" :key="idx" class="pdf-avoid-break px-2.5 py-1 leading-normal bg-slate-50 border border-slate-200 text-[9px] font-bold text-[#091426] uppercase rounded">
              {{ s }}
            </span>
          </div>
        </section>

        <section v-if="parsed.education.length">
          <h2 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2 select-none">Education</h2>
          <div class="space-y-2">
            <div v-for="(edu, idx) in parsed.education" :key="idx" class="text-[9.5px]">
              <h5 class="font-bold text-slate-800 leading-snug">{{ edu.school }}</h5>
              <p class="text-slate-500 leading-tight">{{ edu.degree }} <span v-if="edu.dates" class="text-slate-400">, {{ edu.dates }}</span></p>
            </div>
          </div>
        </section>

        <section v-if="parsed.credentials.length" class="col-span-2">
          <h2 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2 select-none">Credentials</h2>
          <ul class="list-disc text-[9.5px] text-slate-600 space-y-0.5">
            <li v-for="(c, idx) in parsed.credentials" :key="idx">{{ c }}</li>
          </ul>
        </section>
      </div>
    </div>

      <section v-for="extra in parsed.extras" :key="extra.title" class="preview-extra-section">
        <h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">{{ extra.title }}</h2>
        <div class="space-y-2">
          <div v-for="(item, iIdx) in extra.items" :key="iIdx">
            <h4 class="font-bold text-[10.5px] text-slate-800">{{ item.title }}</h4>
            <p v-if="item.subtitle" class="text-[9px] text-slate-500">{{ item.subtitle }}</p>
            <ul v-if="item.bullets.length" class="text-[9.5px] text-slate-600 list-disc space-y-0.5">
              <li v-for="(b, bIdx) in item.bullets" :key="bIdx">{{ b }}</li>
            </ul>
          </div>
        </div>
      </section>

  </div>

  <!-- THE TYPOGRAPHER THEME -->
  <div
    v-else-if="formatId === 'the-typographer'"
    class="theme-typographer w-full bg-white relative p-8 flex flex-col gap-4 text-slate-800 text-left select-text"
  >
    <header class="grid grid-cols-12 border-b-2 border-slate-900 pb-5">
      <div class="col-span-8">
        <h1 class="text-3xl font-black tracking-tighter text-slate-900 leading-[0.95] uppercase break-words">{{ parsed.name }}</h1>
        <p class="text-[9.5px] font-bold uppercase tracking-widest text-[#006a61] mt-2 select-none">{{ parsed.title }}</p>
      </div>
      <div class="col-span-4 text-right text-[9.5px] text-slate-500 font-medium space-y-0.5">
        <p v-if="parsed.email">{{ parsed.email }}</p>
        <p v-if="parsed.phone">{{ parsed.phone }}</p>
        <p v-if="parsed.location">{{ parsed.location }}</p>
        <p v-if="hasProfileLinks" class="underline text-slate-800">{{ profileLinksLabel }}</p>
      </div>
    </header>

    <div class="grid grid-cols-12 gap-5 flex-grow">
      <!-- Left main content (col-span-8) -->
      <section class="col-span-8 flex flex-col gap-5 border-r border-slate-200 pr-5">
        <div v-if="parsed.summary">
          <h2 class="text-[9.5px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2 select-none">Profile Summary</h2>
          <p class="text-[10px] leading-relaxed text-slate-600 serif">{{ parsed.summary }}</p>
        </div>

        <div v-if="parsed.experience.length">
          <h2 class="text-[9.5px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-3 select-none">Experience Timeline</h2>
          <div class="space-y-4">
            <div v-for="(job, idx) in parsed.experience" :key="idx">
              <div class="flex justify-between items-baseline mb-0.5">
                <h3 class="text-[10.5px] font-extrabold text-slate-900 uppercase tracking-tight">{{ job.title }}</h3>
                <span class="text-[7.5px] text-slate-400 font-extrabold uppercase">{{ job.dates }}</span>
              </div>
              <p class="text-[9px] text-[#006a61] font-bold uppercase tracking-wider mb-1.5">{{ job.company }} <span v-if="job.location" class="text-slate-400 font-normal">| {{ job.location }}</span></p>
              <ul class="space-y-1 list-disc text-[9.5px] text-slate-600">
                <li v-for="(b, bIdx) in job.bullets" :key="bIdx">{{ b }}</li>
              </ul>
            </div>
          </div>
        </div>

        <div v-if="parsed.projects.length">
          <h2 class="text-[9.5px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-3 select-none">Selected Work</h2>
          <div class="space-y-3">
            <div v-for="(p, pIdx) in parsed.projects" :key="pIdx">
              <h4 class="text-[10.5px] font-extrabold text-slate-900 uppercase tracking-tight">{{ p.name }}</h4>
              <ul class="space-y-1 list-disc text-[9.5px] text-slate-600">
                <li v-for="(b, bIdx) in p.bullets" :key="bIdx">{{ b }}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Right sidebar (col-span-4) -->
      <aside class="col-span-4 flex flex-col gap-5">
        <section v-if="parsed.skills.length">
          <h2 class="text-[9.5px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2 select-none">Core Stack</h2>
          <ul class="space-y-1 font-bold text-[9px] text-slate-700 uppercase tracking-wider pl-1 list-none">
            <li v-for="(s, idx) in parsed.skills" :key="idx" class="flex gap-1.5 items-center">
              <span class="w-1.5 h-1.5 bg-slate-900 rounded-full shrink-0"></span>
              <span>{{ s }}</span>
            </li>
          </ul>
        </section>

        <section v-if="parsed.education.length">
          <h2 class="text-[9.5px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2 select-none">Academic</h2>
          <div class="space-y-2.5 text-[9px]">
            <div v-for="(edu, idx) in parsed.education" :key="idx">
              <p class="font-extrabold text-slate-900 uppercase leading-snug">{{ edu.school }}</p>
              <p class="text-slate-500 leading-tight">{{ edu.degree }}</p>
            </div>
          </div>
        </section>

        <section v-if="parsed.credentials.length">
          <h2 class="text-[9.5px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2 select-none">Credentials</h2>
          <ul class="space-y-1 text-[9px] text-slate-600 list-disc">
            <li v-for="(c, idx) in parsed.credentials" :key="idx">{{ c }}</li>
          </ul>
        </section>
      </aside>
    </div>

      <section v-for="extra in parsed.extras" :key="extra.title" class="preview-extra-section">
        <h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">{{ extra.title }}</h2>
        <div class="space-y-2">
          <div v-for="(item, iIdx) in extra.items" :key="iIdx">
            <h4 class="font-bold text-[10.5px] text-slate-800">{{ item.title }}</h4>
            <p v-if="item.subtitle" class="text-[9px] text-slate-500">{{ item.subtitle }}</p>
            <ul v-if="item.bullets.length" class="text-[9.5px] text-slate-600 list-disc space-y-0.5">
              <li v-for="(b, bIdx) in item.bullets" :key="bIdx">{{ b }}</li>
            </ul>
          </div>
        </div>
      </section>

  </div>

  <!-- THE RESEARCHER THEME (ACADEMIC) -->
  <div
    v-else-if="formatId === 'the-researcher' || formatId === 'the-researcher-updated'"
    class="theme-researcher w-full bg-white relative p-8 flex flex-col gap-5 text-slate-800 text-left select-text"
  >
    <header class="text-center mb-4">
      <h1 class="text-xl font-bold tracking-wide text-slate-900 serif">{{ parsed.name }}</h1>
      <div class="flex flex-wrap justify-center gap-x-3 gap-y-0.5 text-[9.5px] text-slate-500 mt-1.5 font-medium">
        <span v-if="parsed.email">{{ parsed.email }}</span>
        <span v-if="parsed.phone">{{ parsed.phone }}</span>
        <span v-if="parsed.location">{{ parsed.location }}</span>
        <span v-if="hasProfileLinks" class="underline text-slate-600">{{ profileLinksLabel }}</span>
      </div>
      <p class="text-[9.5px] uppercase tracking-wider text-slate-400 font-bold mt-2 select-none">{{ parsed.title }}</p>
    </header>

    <section v-if="parsed.summary">
      <h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2 select-none">Research Profile</h2>
      <p class="text-[10px] leading-relaxed text-slate-600 serif">{{ parsed.summary }}</p>
    </section>

    <section v-if="parsed.experience.length">
      <h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2.5 select-none">Academic Appointments</h2>
      <div class="space-y-4">
        <div v-for="(job, idx) in parsed.experience" :key="idx">
          <div class="flex justify-between items-baseline mb-0.5">
            <h3 class="text-[10.5px] font-bold text-slate-800">{{ job.title }}</h3>
            <span class="text-[8px] text-slate-400 font-bold uppercase">{{ job.dates }}</span>
          </div>
          <p class="text-[9px] text-[#006a61] font-bold mb-1 leading-snug">{{ job.company }} <span v-if="job.location" class="text-slate-400 font-normal">| {{ job.location }}</span></p>
          <ul class="space-y-0.5 list-disc text-[9.5px] text-slate-600 leading-normal">
            <li v-for="(b, bIdx) in job.bullets" :key="bIdx">{{ b }}</li>
          </ul>
        </div>
      </div>
    </section>

    <section v-if="parsed.projects.length">
      <h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2.5 select-none">Projects & Publications</h2>
      <div class="space-y-2.5">
        <div v-for="(p, pIdx) in parsed.projects" :key="pIdx">
          <h4 class="text-[10.5px] font-bold text-slate-800">{{ p.name }}</h4>
          <ul class="space-y-0.5 list-disc text-[9.5px] text-slate-600">
            <li v-for="(b, bIdx) in p.bullets" :key="bIdx">{{ b }}</li>
          </ul>
        </div>
      </div>
    </section>

    <section v-if="parsed.credentials.length">
      <h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2 select-none">Credentials</h2>
      <ul class="list-disc text-[9.5px] text-slate-600 space-y-0.5">
        <li v-for="(c, idx) in parsed.credentials" :key="idx">{{ c }}</li>
      </ul>
    </section>

    <div class="grid grid-cols-2 gap-5">
      <section v-if="parsed.education.length">
        <h2 class="text-[9.5px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2 select-none">Education</h2>
        <div class="space-y-2 text-[9px]">
          <div v-for="(edu, idx) in parsed.education" :key="idx">
            <p class="font-bold text-slate-800 leading-snug">{{ edu.school }}</p>
            <p class="text-slate-500 leading-tight">{{ edu.degree }} <span v-if="edu.dates" class="text-slate-400">, {{ edu.dates }}</span></p>
          </div>
        </div>
      </section>

      <section v-if="parsed.skills.length">
        <h2 class="text-[9.5px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2 select-none">Fields & Methodologies</h2>
        <div class="flex flex-wrap gap-1">
          <span v-for="(s, idx) in parsed.skills" :key="idx" class="pdf-avoid-break px-2 py-1 leading-normal bg-slate-50 border border-slate-200 text-[9px] text-slate-700 rounded">
            {{ s }}
          </span>
        </div>
      </section>
    </div>

      <section v-for="extra in parsed.extras" :key="extra.title" class="preview-extra-section">
        <h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">{{ extra.title }}</h2>
        <div class="space-y-2">
          <div v-for="(item, iIdx) in extra.items" :key="iIdx">
            <h4 class="font-bold text-[10.5px] text-slate-800">{{ item.title }}</h4>
            <p v-if="item.subtitle" class="text-[9px] text-slate-500">{{ item.subtitle }}</p>
            <ul v-if="item.bullets.length" class="text-[9.5px] text-slate-600 list-disc space-y-0.5">
              <li v-for="(b, bIdx) in item.bullets" :key="bIdx">{{ b }}</li>
            </ul>
          </div>
        </div>
      </section>

  </div>

  <!-- THE ENGINEER THEME (TECHNICAL) -->
  <div
    v-else-if="formatId === 'the-engineer'"
    class="theme-engineer w-full bg-white relative flex flex-row items-stretch text-slate-800 text-left select-text p-0 ring-1 ring-slate-200/50"
  >
    <!-- Left Main Content (66%) -->
    <div class="flex-[2] p-6 border-r border-slate-200/80 flex flex-col gap-5 min-w-0">
      <header>
        <h1 class="text-2xl font-extrabold text-slate-900 uppercase tracking-tight leading-none">{{ parsed.name }}</h1>
        <p class="text-[9.5px] font-bold uppercase tracking-widest text-[#006a61] mt-1.5 pb-2 border-b border-slate-100">{{ parsed.title }}</p>
        <div class="flex flex-wrap gap-3 text-[9.5px] text-slate-500 mt-2 font-medium">
          <span v-if="parsed.email">✉ {{ parsed.email }}</span>
          <span v-if="parsed.location">⚲ {{ parsed.location }}</span>
          <span v-if="hasProfileLinks" class="text-[#006a61]">{{ profileLinksLabel }}</span>
        </div>
      </header>

      <section v-if="parsed.summary">
        <h2 class="text-[9.5px] font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-0.5 mb-2 select-none">Profile</h2>
        <p class="text-[10px] leading-relaxed text-slate-600">{{ parsed.summary }}</p>
      </section>

      <section v-if="parsed.experience.length" class="flex-grow">
        <h2 class="text-[9.5px] font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-0.5 mb-3 select-none">Engineering Experience</h2>
        <div class="space-y-4">
          <div v-for="(job, idx) in parsed.experience" :key="idx">
            <div class="flex justify-between items-baseline mb-0.5">
              <h4 class="font-bold text-[10.5px] text-slate-800">{{ job.title }}</h4>
              <span class="text-[7.5px] text-slate-400 font-bold bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">{{ job.dates }}</span>
            </div>
            <p class="text-[9px] text-[#006a61] font-bold mb-1.5">{{ job.company }} <span v-if="job.location" class="text-slate-400 font-normal">| {{ job.location }}</span></p>
            <ul class="space-y-0.5 list-none pl-0.5 text-[9.5px] text-slate-600 leading-normal">
              <li v-for="(b, bIdx) in job.bullets" :key="bIdx" class="flex gap-2 items-start">
                <span class="text-slate-400 mt-1 shrink-0 font-bold">▪</span>
                <p>{{ b }}</p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section v-if="parsed.projects.length">
        <h2 class="text-[9.5px] font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-0.5 mb-3 select-none">Selected Projects</h2>
        <div class="space-y-3">
          <div v-for="(p, pIdx) in parsed.projects" :key="pIdx">
            <h4 class="font-bold text-[10.5px] text-slate-800">{{ p.name }}</h4>
            <ul class="space-y-0.5 list-disc text-[9.5px] text-slate-600">
              <li v-for="(b, bIdx) in p.bullets" :key="bIdx">{{ b }}</li>
            </ul>
          </div>
        </div>
      </section>

      <section v-for="extra in parsed.extras" :key="extra.title" class="preview-extra-section">
        <h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">{{ extra.title }}</h2>
        <div class="space-y-2">
          <div v-for="(item, iIdx) in extra.items" :key="iIdx">
            <h4 class="font-bold text-[10.5px] text-slate-800">{{ item.title }}</h4>
            <p v-if="item.subtitle" class="text-[9px] text-slate-500">{{ item.subtitle }}</p>
            <ul v-if="item.bullets.length" class="text-[9.5px] text-slate-600 list-disc space-y-0.5">
              <li v-for="(b, bIdx) in item.bullets" :key="bIdx">{{ b }}</li>
            </ul>
          </div>
        </div>
      </section>
    </div>

    <!-- Right Sidebar Content (33%) -->
    <div class="theme-sidebar flex-1 bg-slate-50/50 p-6 flex flex-col gap-5 shrink-0">
      <section v-if="parsed.skills.length">
        <h2 class="text-[9.5px] font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-0.5 mb-2.5 select-none">Stack & Tools</h2>
        <div class="flex flex-wrap gap-1">
          <span v-for="(s, idx) in parsed.skills" :key="idx" class="pdf-avoid-break px-2 py-1 leading-normal bg-white border border-slate-200 rounded text-[9px] font-semibold text-slate-700">
            {{ s }}
          </span>
        </div>
      </section>

      <section v-if="parsed.education.length">
        <h2 class="text-[9.5px] font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-0.5 mb-2 select-none">Education</h2>
        <div class="space-y-2.5 text-[9px]">
          <div v-for="(edu, idx) in parsed.education" :key="idx">
            <h5 class="font-bold text-slate-800 leading-snug">{{ edu.school }}</h5>
            <p class="text-slate-500 leading-tight">{{ edu.degree }}</p>
            <p class="text-slate-400 text-[8px] mt-0.5" v-if="edu.dates">{{ edu.dates }}</p>
          </div>
        </div>
      </section>

      <section v-if="parsed.credentials.length">
        <h2 class="text-[9.5px] font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-0.5 mb-2 select-none">Certifications</h2>
        <ul class="space-y-1 text-[9px] text-slate-600 list-disc">
          <li v-for="(c, idx) in parsed.credentials" :key="idx">{{ c }}</li>
        </ul>
      </section>
    </div>

  </div>

  <!-- THE DISTINGUISHED THEME -->
  <div
    v-else-if="formatId === 'the-distinguished'"
    class="theme-distinguished w-full bg-white relative p-8 flex flex-col gap-5 text-slate-800 text-left select-text"
  >
    <div class="absolute top-0 left-0 right-0 h-1 bg-[#091426] shrink-0"></div>

    <header class="flex flex-col sm:flex-row justify-between items-end border-b border-slate-200 pb-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-[#091426] serif">{{ parsed.name }}</h1>
        <p class="text-[9px] uppercase tracking-[0.2em] text-[#006a61] font-bold mt-1">{{ parsed.title }}</p>
      </div>
      <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-[9.5px] text-slate-500 mt-2 sm:mt-0 font-medium">
        <span v-if="parsed.email">{{ parsed.email }}</span>
        <span v-if="parsed.phone">{{ parsed.phone }}</span>
        <span v-if="parsed.location">{{ parsed.location }}</span>
      </div>
    </header>

    <div class="grid grid-cols-12 gap-5 flex-grow">
      <!-- Left sidebar (col-span-4) -->
      <aside class="col-span-4 flex flex-col gap-4 border-r border-slate-200 pr-4">
        <section v-if="parsed.skills.length">
          <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none">Expertise</h2>
          <div class="h-[1px] bg-slate-200 w-full mb-2"></div>
          <ul class="flex flex-col gap-1 list-none pl-0.5 text-[9.5px] text-slate-600 font-medium">
            <li v-for="(s, idx) in parsed.skills" :key="idx" class="flex gap-1.5 items-center">
              <span class="w-1.5 h-1.5 bg-[#006a61] rounded-full shrink-0"></span>
              <span>{{ s }}</span>
            </li>
          </ul>
        </section>

        <section v-if="parsed.education.length">
          <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none">Credentials</h2>
          <div class="h-[1px] bg-slate-200 w-full mb-2"></div>
          <div class="space-y-2 text-[9px]">
            <div v-for="(edu, idx) in parsed.education" :key="idx">
              <h5 class="font-bold text-slate-800 leading-snug">{{ edu.school }}</h5>
              <p class="text-slate-500 leading-tight">{{ edu.degree }}</p>
            </div>
          </div>
        </section>
      </aside>

      <!-- Right main body (col-span-8) -->
      <section class="col-span-8 flex flex-col gap-4">
        <div v-if="parsed.summary">
          <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none">Professional Profile</h2>
          <div class="h-[1px] bg-slate-200 w-full mb-2"></div>
          <p class="text-[10.5px] leading-relaxed text-slate-600 serif">{{ parsed.summary }}</p>
        </div>

        <div v-if="parsed.experience.length">
          <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none">Experience Timeline</h2>
          <div class="h-[1px] bg-slate-200 w-full mb-2"></div>
          <div class="space-y-4">
            <div v-for="(job, idx) in parsed.experience" :key="idx">
              <div class="flex justify-between items-baseline mb-0.5">
                <h3 class="text-[10.5px] font-bold text-slate-800">{{ job.title }}</h3>
                <span class="text-[8px] text-slate-400 font-bold uppercase">{{ job.dates }}</span>
              </div>
              <p class="text-[9.5px] text-[#006a61] font-bold mb-1.5">{{ job.company }} <span v-if="job.location" class="text-slate-400 font-normal">| {{ job.location }}</span></p>
              <ul class="space-y-0.5 list-disc text-[9.5px] text-slate-600">
                <li v-for="(b, bIdx) in job.bullets" :key="bIdx">{{ b }}</li>
              </ul>
            </div>
          </div>
        </div>

        <div v-if="parsed.projects.length">
          <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none">Projects</h2>
          <div class="h-[1px] bg-slate-200 w-full mb-2"></div>
          <div class="space-y-3">
            <div v-for="(p, pIdx) in parsed.projects" :key="pIdx">
              <h4 class="text-[10.5px] font-bold text-slate-800">{{ p.name }}</h4>
              <ul class="space-y-0.5 list-disc text-[9.5px] text-slate-600">
                <li v-for="(b, bIdx) in p.bullets" :key="bIdx">{{ b }}</li>
              </ul>
            </div>
          </div>
        </div>

        <div v-if="parsed.credentials.length">
          <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none">Achievements</h2>
          <div class="h-[1px] bg-slate-200 w-full mb-2"></div>
          <ul class="space-y-0.5 list-disc text-[9.5px] text-slate-600">
            <li v-for="(c, idx) in parsed.credentials" :key="idx">{{ c }}</li>
          </ul>
        </div>
      </section>
    </div>

      <section v-for="extra in parsed.extras" :key="extra.title" class="preview-extra-section">
        <h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">{{ extra.title }}</h2>
        <div class="space-y-2">
          <div v-for="(item, iIdx) in extra.items" :key="iIdx">
            <h4 class="font-bold text-[10.5px] text-slate-800">{{ item.title }}</h4>
            <p v-if="item.subtitle" class="text-[9px] text-slate-500">{{ item.subtitle }}</p>
            <ul v-if="item.bullets.length" class="text-[9.5px] text-slate-600 list-disc space-y-0.5">
              <li v-for="(b, bIdx) in item.bullets" :key="bIdx">{{ b }}</li>
            </ul>
          </div>
        </div>
      </section>

  </div>

  <!-- PLAIN MARKDOWN FALLBACK (DEFAULT) -->
  <div v-else class="markdown-preview max-w-none text-left" v-html="plainHtml" />
</template>

<style scoped>
.theme-creative-director {
  align-items: stretch;
  height: auto;
  max-height: none;
}
.theme-creative-director > .theme-sidebar {
  background-color: #006a61;
  color: #ffffff;
  align-self: stretch;
  height: auto;
  max-height: none;
  min-height: 100%;
}
.theme-creative-director > .theme-sidebar :deep(*) {
  color: inherit;
}
.theme-creative-director > .theme-sidebar :deep(h4) {
  color: #99f6e4 !important;
}
.theme-creative-director > .theme-sidebar :deep(li),
.theme-creative-director > .theme-sidebar :deep(p),
.theme-creative-director > .theme-sidebar :deep(span) {
  overflow: visible !important;
  height: auto !important;
  max-height: none !important;
  line-height: 1.45 !important;
  white-space: normal !important;
  text-overflow: clip !important;
}

/* Bullets: outside markers aligned to the first line (preview + PDF) */
.theme-creative-director :deep(ul:not(.list-none)),
.theme-digital-nomad :deep(ul:not(.list-none)),
.theme-engineer :deep(ul:not(.list-none)),
.theme-strategist :deep(ul:not(.list-none)),
.theme-corporate :deep(ul:not(.list-none)),
.theme-executive :deep(ul:not(.list-none)),
.theme-partner :deep(ul:not(.list-none)),
.theme-innovator :deep(ul:not(.list-none)),
.theme-distinguished :deep(ul:not(.list-none)),
.theme-brand-architect :deep(ul:not(.list-none)),
.theme-typographer :deep(ul:not(.list-none)),
.theme-researcher :deep(ul:not(.list-none)),
.theme-social-media-pro :deep(ul:not(.list-none)) {
  list-style: none !important;
  padding-left: 0 !important;
  margin-left: 0;
}
.theme-creative-director :deep(ul:not(.list-none) > li),
.theme-digital-nomad :deep(ul:not(.list-none) > li),
.theme-engineer :deep(ul:not(.list-none) > li),
.theme-strategist :deep(ul:not(.list-none) > li),
.theme-corporate :deep(ul:not(.list-none) > li),
.theme-executive :deep(ul:not(.list-none) > li),
.theme-partner :deep(ul:not(.list-none) > li),
.theme-innovator :deep(ul:not(.list-none) > li),
.theme-distinguished :deep(ul:not(.list-none) > li),
.theme-brand-architect :deep(ul:not(.list-none) > li),
.theme-typographer :deep(ul:not(.list-none) > li),
.theme-researcher :deep(ul:not(.list-none) > li),
.theme-social-media-pro :deep(ul:not(.list-none) > li) {
  position: relative;
  display: block;
  list-style: none !important;
  line-height: 1.45;
  padding-left: 1.15em;
  margin: 0.15em 0;
  overflow: visible;
  height: auto;
  max-height: none;
}
.theme-creative-director :deep(ul:not(.list-none) > li)::before,
.theme-digital-nomad :deep(ul:not(.list-none) > li)::before,
.theme-engineer :deep(ul:not(.list-none) > li)::before,
.theme-strategist :deep(ul:not(.list-none) > li)::before,
.theme-corporate :deep(ul:not(.list-none) > li)::before,
.theme-executive :deep(ul:not(.list-none) > li)::before,
.theme-partner :deep(ul:not(.list-none) > li)::before,
.theme-innovator :deep(ul:not(.list-none) > li)::before,
.theme-distinguished :deep(ul:not(.list-none) > li)::before,
.theme-brand-architect :deep(ul:not(.list-none) > li)::before,
.theme-typographer :deep(ul:not(.list-none) > li)::before,
.theme-researcher :deep(ul:not(.list-none) > li)::before,
.theme-social-media-pro :deep(ul:not(.list-none) > li)::before {
  content: '•';
  position: absolute;
  left: 0;
  top: 0.3em;
  width: 1em;
  text-align: center;
  line-height: 1;
  font-size: 0.95em;
  color: inherit;
  transform: none;
}

.markdown-preview :deep(h1) {
  margin: 0 0 0.5rem;
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  text-align: center;
}

.markdown-preview :deep(h2) {
  margin: 1.25rem 0 0.5rem;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.25rem;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #4f46e5;
}

.markdown-preview :deep(h3) {
  margin: 0.85rem 0 0.25rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
}

.markdown-preview :deep(p),
.markdown-preview :deep(li) {
  margin: 0.35rem 0;
  font-size: 0.85rem;
  color: #334155;
}

.markdown-preview :deep(ul) {
  margin: 0.25rem 0 0.75rem;
  padding-left: 1.25rem;
  list-style-type: disc;
}

.markdown-preview :deep(em) {
  color: #64748b;
  font-style: italic;
}

.markdown-preview :deep(strong) {
  color: #0f172a;
  font-weight: 700;
}
</style>
