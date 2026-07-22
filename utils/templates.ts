/**
 * Builder template catalog — IDs match Stitch layouts in ResumeThemeRenderer.
 * Near-duplicates are remapped via resolveResumeTemplateId so the gallery only
 * shows visually distinct PDF layouts.
 */

export type BuilderTemplateMeta = {
  id: string
  name: string
  category: string
  desc: string
  bg: string
  text: string
  img?: string
}

/** Distinct resume themes shown in the gallery / template picker. */
export const resumeTemplates: BuilderTemplateMeta[] = [
  {
    id: 'the-corporate',
    name: 'The Corporate',
    category: 'Professional',
    desc: 'Dark header band, structured single column',
    bg: 'bg-white',
    text: 'text-slate-900',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtYP9H4isUc7tV9_qK-s67Te2c5bmQEGCcMLe6QQlw2aNFzbtILYqF9GOyKa1pUB8VL7tQPTqFP8jGZ3mXg-tRGFkpfxKwFRmiu2ErC1PdqQAbFcxUxfQmUJWjfHx_Zw_gVa0HDafPcQDuzus-1y9yNPOKNX0TLaH0Mwr0Yp47ZMy-ZIFoj7dWsK4mTAWIfeFTWJY1k_0CknY3LhQ0xIT-JgMRq8Ai3CoSQESF0ZbCq-hBtL5a8TjPEw',
  },
  {
    id: 'the-partner',
    name: 'The Partner',
    category: 'Professional',
    desc: 'Dual rules, elegant single column',
    bg: 'bg-white',
    text: 'text-slate-900',
  },
  {
    id: 'the-distinguished',
    name: 'The Distinguished',
    category: 'Professional',
    desc: 'Accent bar, two-column split',
    bg: 'bg-white',
    text: 'text-slate-900',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbSs7xYTrMpMsX7NUiDSxi-ZQdCCMQfCA6vGLDUam3vuACYwSIJxXdzJujO14vL2TmMQK_hSdccqqjF4osDtYNMlh4kF7KE1FX1kfBnNEdEc5J1Jq3joP9Jj_Do0j7AQV7WzTKH_SnxGxvpqJ2_SArHHTRCoNBRLJgWuP7bqJG7YhZ3ecz4NJQtpwbn7QSXxA4I8Zs_YD7sfjWYZAanWgEcJ-drWuLPzHshgIW9r9iaZFacQSZBjl9Aw',
  },
  {
    id: 'the-executive',
    name: 'The Executive',
    category: 'Professional',
    desc: 'Centered header, two-column',
    bg: 'bg-white',
    text: 'text-slate-900',
  },
  {
    id: 'the-social-media-pro',
    name: 'The Social Media Pro',
    category: 'Creative',
    desc: 'Top banner strip, two-column',
    bg: 'bg-white',
    text: 'text-slate-900',
  },
  {
    id: 'the-typographer',
    name: 'The Typographer',
    category: 'Minimalist',
    desc: 'Large editorial name, inline skills',
    bg: 'bg-white',
    text: 'text-slate-900',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDeOT4dcxhBI6UNg4ysM6sOWdYlsyarXg0fNC8YTpL8yDshBHofCpRkFWKrk2WW_3AD_E7nveuOcCfnrfDOIHLWU9R0h_EgC-ocQ-Pj4EMUK_f91rwdK82J0brfviukm_1PcQCQFjZ01UGby_RmFuCKgo6OVzcYu3vIDpmw1kk1XF2ThSkn6gfseuWFjg8HD4lzXKpP8CcVnXM6DFnshOTPoOeX9wEk1-61iF_qBCzxKHa03Pcajg_a8Q',
  },
  {
    id: 'the-researcher',
    name: 'The Researcher',
    category: 'Technical',
    desc: 'Academic single column, inline skills',
    bg: 'bg-white',
    text: 'text-slate-900',
  },
  {
    id: 'the-innovator',
    name: 'The Innovator',
    category: 'Modern',
    desc: 'Dark neon panels',
    bg: 'bg-slate-950',
    text: 'text-white',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtX1gK7ViHrxtzjLH_jzBsn8o-05rtGu-V9wn8OIWLZcojI28LmultNL-A3tbw9hYK04RBmE8DZ9hjhNlJNl32XlyPz-bHVjRc78HCxe9Mgr9PeLTwp_goHN3K9TD_KYChO9xRJ0NDidkn3KGrC7kfAAq8lGb8oX37T9NBiQMhZmOQatMbcZDvBBZVWzWDPot48cCltDB3yEFTxAAElCh1jlos1dwOOppBRROaAJr_ZqGirAi9QxAIXQ',
  },
  {
    id: 'the-digital-nomad',
    name: 'The Digital Nomad',
    category: 'Modern',
    desc: '50/50 split sidebar',
    bg: 'bg-white',
    text: 'text-slate-900',
  },
  {
    id: 'the-creative-director',
    name: 'The Creative Director',
    category: 'Creative',
    desc: 'Teal sidebar, timeline',
    bg: 'bg-white',
    text: 'text-slate-900',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7BD4IWVRWQilqUtPsb8RcRcpM9mhsIwURhO37OU0djfkZbBfnPMnZqqxruthEkwu05dHJMpYvaVWZxKrXqiDBpfrQD1-ELMRRm8LWmcSJ0i_Y7NmnCedHcI8mlp-moQktTZUUucJPEeE1bWgwiFf3UlG4SXuskgkrZ80XayHgRHFehQmFK86nrShOn45mj8bk2nw7JWuJYVy_OfGcXXAVkG3xheGMi6NzjsxCvc7VIyW0j4UYIlb7Sw',
  },
  {
    id: 'the-strategist',
    name: 'The Strategist',
    category: 'Minimalist',
    desc: 'Left profile sidebar',
    bg: 'bg-white',
    text: 'text-slate-900',
  },
  {
    id: 'the-engineer',
    name: 'The Engineer',
    category: 'Technical',
    desc: 'Tech stack sidebar',
    bg: 'bg-white',
    text: 'text-slate-900',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXqSv3_04KMB6m_ar3_4EyE9OA5FZ8c9l486zLIZeKMjVjg24QNNugH4YPZC65r-2JAKCFXIES-woeqPjg371YxElFqxLLVawP6BXjN_BWnw2Ku7UvyIK21lTnIKhtWdKpP1iaQa2YzPdhRlpiuY08mymzT3-yspqofd7l198J2TRZgnyB9Qch1tKUYubIJmVcI_FCrQi0orWKlsYdHymzq8YY40SHULp6FVfi6FW4JsgivGxauHlNrw',
  },
]

export const coverLetterTemplates = [
  {
    id: 'cl-standard',
    name: 'Standard Letter',
    category: 'Professional',
    desc: 'Centered classic letterhead',
  },
  {
    id: 'cl-creative',
    name: 'Creative Pitch',
    category: 'Creative',
    desc: 'Bold accent bar intro',
  },
  {
    id: 'cl-executive',
    name: 'Executive Memo',
    category: 'Professional',
    desc: 'Direct memo header',
  },
  {
    id: 'cl-tech',
    name: 'Tech Introduction',
    category: 'Technical',
    desc: 'Left-rail stack letter',
  },
] as const

/** Map old gallery / stitch IDs → canonical distinct templates. */
const LEGACY_RESUME_TEMPLATE_MAP: Record<string, string> = {
  scholar: 'the-distinguished',
  standard: 'the-corporate',
  executive: 'the-executive',
  diplomat: 'the-partner',
  innovator: 'the-innovator',
  maverick: 'the-digital-nomad',
  freelancer: 'the-social-media-pro',
  zen: 'the-typographer',
  graduate: 'the-strategist',
  vanguard: 'the-creative-director',
  designer: 'the-partner',
  architect: 'the-engineer',
  analyst: 'the-researcher',
  specialist: 'the-researcher',
  // Near-duplicates folded into keepers
  'the-brand-architect': 'the-partner',
  'the-researcher-updated': 'the-researcher',
}

const STITCH_RESUME_IDS = new Set(resumeTemplates.map((t) => t.id))

export function resolveResumeTemplateId(id?: string | null): string {
  if (!id) return resumeTemplates[0].id
  if (LEGACY_RESUME_TEMPLATE_MAP[id]) return LEGACY_RESUME_TEMPLATE_MAP[id]
  if (STITCH_RESUME_IDS.has(id)) return id
  return resumeTemplates[0].id
}

export function getResumeTemplate(id?: string | null): BuilderTemplateMeta {
  const resolved = resolveResumeTemplateId(id)
  return resumeTemplates.find((t) => t.id === resolved) || resumeTemplates[0]
}
