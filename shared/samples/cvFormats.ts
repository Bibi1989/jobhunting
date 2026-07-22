import type { ProfessionalJobContext } from './professionalDocuments'
import {
  type CandidateProfile,
  formatCandidateContactLine,
} from './candidateProfile'

export interface CvFormat {
  id: string
  name: string
  description: string
  bestFor: string
}

export const CV_FORMATS: CvFormat[] = [
  {
    id: 'classic-professional',
    name: 'Classic Professional',
    description: 'Traditional single-column CV with summary, skills, experience, education.',
    bestFor: 'Most corporate roles',
  },
  {
    id: 'modern-compact',
    name: 'Modern Compact',
    description: 'Tighter spacing and short bullets for recruiters who skim fast.',
    bestFor: 'High-volume applications',
  },
  {
    id: 'executive-leadership',
    name: 'Executive Leadership',
    description: 'Leadership narrative, scope of ownership, and org-level outcomes.',
    bestFor: 'Senior and director roles',
  },
  {
    id: 'technical-engineer',
    name: 'Technical Engineer',
    description: 'Skills matrix, systems, stack depth, and delivery metrics.',
    bestFor: 'Software and platform roles',
  },
  {
    id: 'product-strategy',
    name: 'Product Strategy',
    description: 'Discovery, roadmap impact, stakeholder work, and shipped outcomes.',
    bestFor: 'Product management',
  },
  {
    id: 'data-insights',
    name: 'Data & Insights',
    description: 'Analytics tools, experiment design, and decision impact.',
    bestFor: 'Data analyst / scientist roles',
  },
  {
    id: 'design-craft',
    name: 'Design Craft',
    description: 'Portfolio-forward with process, tools, and product collaboration.',
    bestFor: 'Design and UX roles',
  },
  {
    id: 'research-academic',
    name: 'Research Academic',
    description: 'Publications, methods, teaching, and research contributions.',
    bestFor: 'Research and academic posts',
  },
  {
    id: 'startup-generalist',
    name: 'Startup Generalist',
    description: 'Breadth, ownership, speed, and wearing multiple hats.',
    bestFor: 'Early-stage startups',
  },
  {
    id: 'impact-first',
    name: 'Impact First',
    description: 'Leads with quantified wins before role chronology.',
    bestFor: 'Results-driven hiring teams',
  },
  {
    id: 'federal-plain',
    name: 'Federal Plain',
    description: 'Clean, conservative wording with clear duties and keywords.',
    bestFor: 'Government and formal orgs',
  },
  {
    id: 'hybrid-skills-left',
    name: 'Hybrid Skills Spotlight',
    description: 'Skills and tools listed prominently, then experience detail.',
    bestFor: 'Specialist IC roles',
  },
  {
    id: 'the-corporate',
    name: 'The Corporate',
    description: 'Header with strong color block, structured full-width sections, and side-by-side core skills & education.',
    bestFor: 'Corporate, finance, and traditional corporate leadership roles',
  },
  {
    id: 'the-executive',
    name: 'The Executive',
    description: 'Centered bold header with a two-column layout separating skills, education, and credentials from experience.',
    bestFor: 'SVP, Director, and high-level executive positions',
  },
  {
    id: 'the-strategist',
    name: 'The Strategist',
    description: 'Asymmetrical design featuring a prominent left sidebar with profile image placeholder, contacts, and core expertise.',
    bestFor: 'Consulting, strategic planning, and advisory roles',
  },
  {
    id: 'the-creative-director',
    name: 'The Creative Director',
    description: 'Asymmetric teal sidebar with large display header, Awards, and timeline layout.',
    bestFor: 'Creative, design, advertising, and marketing leadership',
  },
  {
    id: 'the-partner',
    name: 'The Partner',
    description: 'Centered header with dual horizontal line accents and a traditional elegant layout.',
    bestFor: 'Legal, consulting partners, brand, and advisory roles',
  },
  {
    id: 'the-innovator',
    name: 'The Innovator',
    description: 'Dark-themed cyberpunk neon design featuring green border glow panels.',
    bestFor: 'Creative tech, startup founders, and game development',
  },
  {
    id: 'the-digital-nomad',
    name: 'The Digital Nomad',
    description: '50/50 vertical split screen with a bold dark sidebar profile and white experience canvas.',
    bestFor: 'Remote designers, freelance architects, and digital nomads',
  },
  {
    id: 'the-social-media-pro',
    name: 'The Social Media Pro',
    description: 'Top banner strip with a two-column modern layout.',
    bestFor: 'Social media, digital marketing, content creators, and PR pros',
  },
  {
    id: 'the-typographer',
    name: 'The Typographer',
    description: 'Typography-first editorial layout with a large name and inline skills.',
    bestFor: 'Editorial designers, copywriters, and print journalists',
  },
  {
    id: 'the-researcher',
    name: 'The Researcher',
    description: 'Traditional academic CV prioritizing appointments, publications, and methods.',
    bestFor: 'Postdocs, researchers, professors, and academic fellows',
  },
  {
    id: 'the-engineer',
    name: 'The Engineer',
    description: 'Dedicated sidebar for tech stack, code highlights, and distribution architecture.',
    bestFor: 'Systems engineers, network architects, and platform developers',
  },
  {
    id: 'the-distinguished',
    name: 'The Distinguished',
    description: 'Top accent bar with a two-column split for skills and experience.',
    bestFor: 'Distinguished specialists, executives, and senior advisors',
  },
]

export function getCvFormat(id?: string): CvFormat {
  const aliases: Record<string, string> = {
    'the-brand-architect': 'the-partner',
    'the-researcher-updated': 'the-researcher',
  }
  const resolved = aliases[id || ''] || id
  return CV_FORMATS.find((f) => f.id === resolved) || CV_FORMATS[0]
}

/** Stable sample used for format picker previews. */
export const CV_FORMAT_PREVIEW_CONTEXT: ProfessionalJobContext = {
  title: 'Software Engineer',
  company: 'Northline Systems',
  keywords: ['TypeScript', 'APIs', 'ownership'],
  requiredSkills: ['TypeScript', 'Node.js', 'PostgreSQL', 'System Design'],
  preferredSkills: ['React', 'AWS'],
  responsibilities: [
    'Own end-to-end delivery for customer-facing features',
    'Improve reliability with clearer runbooks and ownership',
    'Partner with product and design on scoped releases',
  ],
  tone: 'professional',
  seniority: 'mid-level',
}

export function buildCvFormatPreview(formatId?: string): string {
  return buildCvByFormat(formatId, CV_FORMAT_PREVIEW_CONTEXT)
}

export function replaceEmDashes(text: string): string {
  return text
    .replace(/\u2014/g, ',')
    .replace(/\u2013/g, ',')
    .replace(/—/g, ',')
    .replace(/–/g, ',')
    .replace(/-{2,}/g, ',')
    .replace(/\s*,\s*/g, ', ')
    .replace(/,\s*,+/g, ',')
    .replace(/^\s*,\s*/gm, '')
    .replace(/\s+,/g, ',')
}

export function buildCvByFormat(
  formatId: string | undefined,
  analysis: ProfessionalJobContext,
  profile?: CandidateProfile | null,
): string {
  const format = getCvFormat(formatId)
  const skills = unique([
    ...(profile?.skills || []),
    ...analysis.requiredSkills,
    ...analysis.preferredSkills,
    ...analysis.keywords,
  ]).slice(0, 14)

  const skillLine =
    skills.length > 0
      ? skills.join(' · ')
      : 'TypeScript · Node.js · PostgreSQL · API Design · Collaboration · Ownership'

  const bullets = (
    analysis.responsibilities.length
      ? analysis.responsibilities
      : [
          'Owned end-to-end delivery for features used by thousands of weekly active users',
          'Reduced average incident recovery time by 28% through clearer runbooks and ownership',
          'Partnered with design and product to ship scoped releases every two weeks',
        ]
  )
    .slice(0, 5)
    .map((item) => `- ${toMetricBullet(item)}`)
    .join('\n')

  const name = profile?.fullName?.trim() || 'Jordan Ellis'
  const contact =
    (profile && formatCandidateContactLine(profile)) ||
    'San Francisco, CA · jordan.ellis@email.com · (415) 555-0142 · linkedin.com/in/jordanellis'
  const title = analysis.title
  const company = analysis.company
  const website = profile?.website?.trim() || profile?.linkedin?.trim() || ''
  const summaryText =
    profile?.summary?.trim() ||
    `${cap(analysis.seniority)} professional focused on ${title.toLowerCase()} work. Clear communicator with ownership of outcomes and measurable delivery quality. Seeking to contribute to **${company}** in ${skills.slice(0, 3).join(', ') || 'core product work'}.`
  const educationText =
    profile?.education?.trim() ||
    '### B.S., Computer Science, University of California, Santa Cruz\n*Santa Cruz, CA · 2019*\n- Coursework: Distributed Systems, Databases, Human-Computer Interaction'
  const experienceBlock = buildExperienceMarkdown(profile, title, bullets)
  const projectsBlock = buildProjectsMarkdown(profile)

  if (profile?.fullName?.trim()) {
    return replaceEmDashes(buildPersonalizedCv(format.id, {
      name,
      contact,
      title,
      company,
      skillLine,
      skills,
      summaryText,
      educationText,
      experienceBlock,
      projectsBlock,
      website,
      analysis,
    }))
  }

  const builders: Record<string, () => string> = {
    'classic-professional': () => `# ${name}
${title}
${contact} · github.com/jordanellis

## Professional Summary
${cap(analysis.seniority)} professional focused on ${title.toLowerCase()} work. Clear communicator seeking to contribute to **${company}**.

## Core Competencies
${skillLine}

## Professional Experience
### Northline Systems, ${title}
*San Francisco, CA · Jan 2022 – Present*
${bullets}

## Education
### B.S., Computer Science, University of California, Santa Cruz
*Santa Cruz, CA*
`,
    'modern-compact': () => `# ${name} | ${title}
${contact}

**Summary:** ${summaryText}

**Skills:** ${skillLine}

**Experience**
### Northline Systems, ${title} (${bullets.split('\n')[0]})
`,
    'executive-leadership': () => `# ${name}
${title} | Leadership Profile
${contact}

## Executive Summary
${summaryText}

## Leadership Competencies
${skillLine}

## Selected Leadership Experience
### Northline Systems, ${title}
${bullets}
`,
    'technical-engineer': () => `# ${name}
${title}
${contact}

## Technical Summary
${summaryText}

## Technical Skills
${skillLine}

## Engineering Experience
### Northline Systems, ${title}
${bullets}
`,
    'product-strategy': () => `# ${name}
${title}
${contact}

## Product Summary
${summaryText}

## Core Experience
### Northline Systems, ${title}
${bullets}
`,
    'data-insights': () => `# ${name}
${title}
${contact}

## Data Summary
${summaryText}

## Analytical Experience
### Northline Systems, ${title}
${bullets}
`,
    'design-craft': () => `# ${name}
${title}
${contact}

## Design Philosophy
${summaryText}

## Craft Experience
### Northline Systems, ${title}
${bullets}
`,
    'research-academic': () => `# ${name}
${title}
${contact}

## Research Profile
${summaryText}

## Academic Experience
### Northline Systems, ${title}
${bullets}
`,
    'startup-generalist': () => `# ${name}
${title}
${contact}

## Startup Narrative
${summaryText}

## Execution Experience
### Northline Systems, ${title}
${bullets}
`,
    'impact-first': () => `# ${name}
${title}
${contact}

## Selected Impact
- Quantified win based on ${skills[0] || 'core engineering'} deliverables

## Experience Timeline
### Northline Systems, ${title}
${bullets}
`,
    'federal-plain': () => `# ${name}
${title}
${contact}

## Summary
${summaryText}

## Skills
${skills.map((s) => `- ${s}`).join('\n')}

## Work Experience
### Northline Systems, ${title}
${bullets}
`,
    'hybrid-skills-left': () => `# ${name}
${title}
${contact}

## Skills Spotlight
${skills.map((s) => `- ${s}`).join('\n')}

## Professional Experience
### Northline Systems, ${title}
${bullets}
`,
    'the-corporate': () => `# ${name}
${title}
${contact}

## Professional Profile
${summaryText}

## Core Competencies & Education
### Core Competencies
${skillLine}

### Education
${educationText}

## Professional Experience
### Northline Systems, ${title}
*San Francisco, CA · Jan 2022 – Present*
${bullets}
`,
    'the-executive': () => `# ${name}
${title} | Executive Profile
${contact}

## Core Expertise
${skillLine}

## Education & Credentials
${educationText}

- Credentials: CFA Charterholder · Six Sigma Black Belt

## Professional Experience
### Northline Systems, ${title}
*San Francisco, CA · Jan 2022 – Present*
${bullets}

## Leadership & Impact
Served as a board member and mentor, delivering financial literacy programs.
`,
    'the-strategist': () => `# ${name}
${title} | Strategic Profile
${contact}

## Core Expertise
${skillLine}

## Education & Credentials
${educationText}

- Credentials: PMP · CSM

## Strategist Profile
${summaryText}

## Professional Experience
### Northline Systems, ${title}
*San Francisco, CA · Jan 2022 – Present*
${bullets}
`,
    'the-creative-director': () => `# ${name}
${title} | Creative Director Profile
${contact}

## Creative Director Profile
${summaryText}

## Recognition
- Red Dot Design Award 2022
- Awwwards Site of the Year 2021

## Professional Experience
### Northline Systems, dots
*2022 — PRESENT*
${bullets}
`,
    'the-partner': () => `# ${name}
${title}
${contact}

## Executive Profile
${summaryText}

## Professional Experience
### Northline Systems, ${title}
*2022 — PRESENT*
${bullets}

## Education
${educationText}

## Core Expertise
${skillLine}
`,
    'the-innovator': () => `# ${name}
${title}
${contact}

## Innovator Profile
${summaryText}

## Professional Experience
### Northline Systems, ${title}
${bullets}

## Skills & Technologies
${skillLine}
`,
    'the-digital-nomad': () => `# ${name}
${title}
${contact}

## Nomad Profile
${summaryText}

## Skills
${skillLine}

## Experience
### Northline Systems, ${title}
${bullets}
`,
    'the-social-media-pro': () => `# ${name}
${title}
${contact}

## Social Media Profile
${summaryText}

## Core Competencies
${skillLine}

## Professional Experience
### Northline Systems, ${title}
${bullets}
`,
    'the-brand-architect': () => `# ${name}
${title}
${contact}

## Brand Profile
${summaryText}

## Experience
### Northline Systems, ${title}
${bullets}
`,
    'the-typographer': () => `# ${name}
${title}
${contact}

## Editorial Profile
${summaryText}

## Professional Experience
### Northline Systems, ${title}
${bullets}
`,
    'the-researcher': () => `# ${name}
${title}
${contact}

## Research Profile
${summaryText}

## Academic Appointments
### Northline Systems, ${title}
${bullets}
`,
    'the-engineer': () => `# ${name}
${title}
${contact}

## System Profile
${summaryText}

## Stack & Tools
${skillLine}

## Engineering Experience
### Northline Systems, ${title}
${bullets}
`,
    'the-distinguished': () => `# ${name}
${title}
${contact}

## Distinguished Profile
${summaryText}

## Experience
### Northline Systems, ${title}
${bullets}
`,
    'the-researcher-updated': () => `# ${name}
${title}
${contact}

## Research Profile
${summaryText}

## Academic Appointments
### Northline Systems, ${title}
${bullets}
`,
  }

  const build = builders[format.id] || builders['classic-professional']
  return replaceEmDashes(build())
}

export function buildRichCoverLetter(
  analysis: ProfessionalJobContext,
  formatId?: string,
  profile?: CandidateProfile | null,
): string {
  const format = getCvFormat(formatId)
  const company = analysis.company || 'your organization'
  const name = profile?.fullName?.trim() || 'Jordan Ellis'
  const contact =
    (profile && formatCandidateContactLine(profile)) ||
    'San Francisco, CA · jordan.ellis@email.com · (415) 555-0142 · linkedin.com/in/jordanellis'
  const skills =
    (profile?.skills || []).slice(0, 4).join(', ') ||
    analysis.requiredSkills.slice(0, 4).join(', ') ||
    analysis.keywords.slice(0, 4).join(', ') ||
    analysis.title
  const proofBullets = (profile?.experiences?.[0]?.bullets || analysis.responsibilities || [])
    .slice(0, 3)
    .map((b) => b.replace(/^[-*•]\s*/, ''))
  const focus =
    proofBullets[0] ||
    analysis.responsibilities[0] ||
    `the priorities described for the ${analysis.title} role`
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const proofParagraph = proofBullets.length
    ? `In recent roles I have ${proofBullets.join('; ')}. Those results map directly to what ${company} needs for this posting.`
    : `In my current work I have focused on shipping in small increments, measuring what changed, and keeping stakeholders aligned with written decisions and named owners. I bring the same discipline to ${format.bestFor.toLowerCase()}: prioritize what moves the needle, document the decision, then follow through.`

  return replaceEmDashes(`# ${name}
${contact}

${today}

Hiring Manager
${company}

Dear Hiring Manager,

I am writing to apply for the **${analysis.title}** position at ${company}. Your posting stood out because it emphasizes ${focus.toLowerCase()}, which aligns with the problems I have owned recently and the kind of impact I want to keep delivering. I am looking for a team where clear priorities, honest tradeoffs, and measurable outcomes matter more than slogans.

${proofParagraph}

I am particularly strong in ${skills}. Day to day, I translate ambiguous requests into scoped plans, surface risks early, and keep quality visible in production. I prefer short feedback loops, readable systems, and collaboration that respects both craft and deadlines. When requirements shift, I renegotiate scope rather than silently overpromising.

What draws me to ${company} is the chance to contribute where my experience can shorten ramp-up time and raise the quality bar for the ${analysis.title} seat. In the first 90 days I would expect to learn the team’s operating cadence, map the highest-leverage gaps against this posting, and deliver a few concrete wins that make the next quarter easier, not just busier.

Thank you for considering my application. I would welcome a conversation about the role, the team’s current challenges, and how my background can help. I can adjust to your interview schedule and am happy to share additional work samples on request.

Sincerely,
${name}
`)
}

function buildExperienceMarkdown(
  profile: CandidateProfile | null | undefined,
  fallbackTitle: string,
  fallbackBullets: string,
): string {
  if (profile?.experiences?.length) {
    return profile.experiences
      .map((exp) => {
        const heading = `### ${[exp.title, exp.company].filter(Boolean).join(', ') || fallbackTitle}`
        const dates = [exp.startDate, exp.endDate || 'Present'].filter(Boolean).join(' – ')
        const meta = [exp.location, dates].filter(Boolean).join(' · ')
        const bullets = (exp.bullets?.length ? exp.bullets : ['Contributed to team delivery goals'])
          .map((b) => `- ${b.replace(/^[-*•]\s*/, '')}`)
          .join('\n')
        return `${heading}\n${meta ? `*${meta}*\n` : ''}${bullets}`
      })
      .join('\n\n')
  }

  return `### Prior Employer, ${fallbackTitle}
*Location · Recent years*
${fallbackBullets}`
}

function buildProjectsMarkdown(profile: CandidateProfile | null | undefined): string {
  if (!profile?.projects?.length) return ''
  return profile.projects
    .map((project) => {
      const bullets = (project.bullets?.length ? project.bullets : ['Delivered a scoped project'])
        .map((b) => `- ${b.replace(/^[-*•]\s*/, '')}`)
        .join('\n')
      return `### ${project.name}\n${bullets}`
    })
    .join('\n\n')
}

function withProjectsSection(experienceBlock: string, projectsBlock: string): string {
  if (!projectsBlock.trim()) return experienceBlock
  return `${experienceBlock}\n\n## Projects\n${projectsBlock}`
}

function buildPersonalizedCv(
  formatId: string,
  ctx: {
    name: string
    contact: string
    title: string
    company: string
    skillLine: string
    skills: string[]
    summaryText: string
    educationText: string
    experienceBlock: string
    projectsBlock: string
    website: string
    analysis: ProfessionalJobContext
  },
): string {
  const {
    name,
    contact,
    title,
    company,
    skillLine,
    skills,
    summaryText,
    educationText,
    experienceBlock,
    projectsBlock,
    website,
    analysis,
  } = ctx
  const experienceWithProjects = withProjectsSection(experienceBlock, projectsBlock)

  switch (formatId) {
    case 'modern-compact':
      return `# ${name} | ${title}
${contact}

**Summary:** ${summaryText}

**Skills:** ${skillLine}

**Experience**
${experienceWithProjects}

**Education:** ${educationText.replace(/^###\s*/, '').split('\n')[0]}
`
    case 'executive-leadership':
      return `# ${name}
${title} | Leadership Profile
${contact}

## Executive Summary
${summaryText}

## Leadership Competencies
${skillLine}

## Selected Leadership Experience
${experienceWithProjects}

## Education
${educationText}
`
    case 'technical-engineer':
      return `# ${name}
${title}
${contact}${website ? ` · ${website}` : ''}

## Technical Summary
${summaryText}

## Technical Skills
**Core:** ${skillLine}

## Engineering Experience
${experienceWithProjects}

## Education
${educationText}
`
    case 'impact-first':
      return `# ${name}
${title}
${contact}

## Selected Impact
${(ctx.analysis.responsibilities.slice(0, 3).length
  ? analysis.responsibilities.slice(0, 3)
  : skills.slice(0, 3)
)
  .map((r) => `- ${toMetricBullet(r)}`)
  .join('\n')}

## Skills
${skillLine}

## Experience Timeline
${experienceWithProjects}

## Education
${educationText}
`
    case 'federal-plain':
      return `# ${name}
${title}
${contact}

## Summary
${summaryText}

## Skills
${skills.map((s) => `- ${s}`).join('\n') || '- Communication\n- Analysis\n- Documentation'}

## Work Experience
${experienceWithProjects}

## Education
${educationText}
`
    case 'hybrid-skills-left':
      return `# ${name}
${title}
${contact}

## Skills Spotlight
${skills.map((s) => `- ${s}`).join('\n') || '- Collaboration\n- Delivery\n- Communication'}

## Professional Experience
${experienceWithProjects}

## Education
${educationText}
`
    case 'the-corporate':
      return `# ${name}
${title}
${contact}

## Professional Profile
${summaryText}

## Core Competencies & Education
### Core Competencies
${skillLine}

### Education
${educationText}

## Professional Experience
${experienceWithProjects}
`
    case 'the-executive':
      return `# ${name}
${title} | Executive Profile
${contact}

## Core Expertise
${skillLine}

## Education & Credentials
${educationText}

- Credentials: CFA Charterholder · Six Sigma Black Belt

## Professional Experience
${experienceWithProjects}

## Leadership & Impact
Served as a board member and mentor, delivering financial and technical literacy programs to underserved communities, and acting as a keynote speaker at national forums.
`
    case 'the-strategist':
      return `# ${name}
${title} | Strategic Profile
${contact}

## Core Expertise
${skillLine}

## Education & Credentials
${educationText}

- Credentials: Project Management Professional (PMP) · Certified Scrum Master (CSM)

## Strategist Profile
${summaryText}

## Professional Experience
${experienceWithProjects}

## Leadership & Impact
Recognized as a thought leader in SaaS business models. Frequently invited panelist at national technology conferences and board advisor to growth-stage startups.
`
    case 'the-creative-director':
      return `# ${name}
${title} | Creative Director Profile
${contact}

## Creative Director Profile
${summaryText}

## Recognition
- Red Dot Design Award 2022
- Awwwards Site of the Year 2021

## Professional Experience
${experienceWithProjects}
`
    case 'the-partner':
      return `# ${name}
${title}
${contact}

## Executive Profile
${summaryText}

## Professional Experience
${experienceWithProjects}

## Education
${educationText}

## Core Expertise
${skillLine}
`
    case 'the-innovator':
      return `# ${name}
${title}
${contact}

## Innovator Profile
${summaryText}

## Professional Experience
${experienceWithProjects}

## Skills & Technologies
${skillLine}
`
    case 'the-digital-nomad':
      return `# ${name}
${title}
${contact}

## Nomad Profile
${summaryText}

## Skills
${skillLine}

## Experience
${experienceWithProjects}
`
    case 'the-social-media-pro':
      return `# ${name}
${title}
${contact}

## Social Media Profile
${summaryText}

## Core Competencies
${skillLine}

## Professional Experience
${experienceWithProjects}
`
    case 'the-brand-architect':
      return `# ${name}
${title}
${contact}

## Brand Profile
${summaryText}

## Experience
${experienceWithProjects}
`
    case 'the-typographer':
      return `# ${name}
${title}
${contact}

## Editorial Profile
${summaryText}

## Professional Experience
${experienceWithProjects}
`
    case 'the-researcher':
      return `# ${name}
${title}
${contact}

## Research Profile
${summaryText}

## Academic Appointments
${experienceWithProjects}
`
    case 'the-engineer':
      return `# ${name}
${title}
${contact}

## System Profile
${summaryText}

## Stack & Tools
${skillLine}

## Engineering Experience
${experienceWithProjects}
`
    case 'the-distinguished':
      return `# ${name}
${title}
${contact}

## Distinguished Profile
${summaryText}

## Experience
${experienceWithProjects}
`
    case 'the-researcher-updated':
      return `# ${name}
${title}
${contact}

## Research Profile
${summaryText}

## Academic Appointments
${experienceWithProjects}
`
    default:
      return `# ${name}
${title}
${contact}${website ? ` · ${website}` : ''}

## Professional Summary
${summaryText}

## Core Competencies
${skillLine}

## Professional Experience
${experienceWithProjects}

## Education
${educationText}
`
  }
}

function toMetricBullet(raw: string): string {
  const cleaned = replaceEmDashes(raw.replace(/^[-*•\d.\s]+/, '').trim())
  if (/improved|reduced|increased|grew|cut|saved|shipped|owned|led|built|designed/i.test(cleaned)) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }
  return `Delivered ${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1)}, measured against an agreed success metric`
}

function cap(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function unique(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const key = value.toLowerCase()
    if (!value.trim() || seen.has(key)) continue
    seen.add(key)
    out.push(value.trim())
  }
  return out
}
