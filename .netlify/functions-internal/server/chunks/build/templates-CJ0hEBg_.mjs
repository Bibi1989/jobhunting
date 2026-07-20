const resumeTemplates = [
  {
    id: "the-distinguished",
    name: "The Distinguished",
    category: "Professional",
    desc: "Serif, sidebar expertise",
    bg: "bg-white",
    text: "text-slate-900",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbSs7xYTrMpMsX7NUiDSxi-ZQdCCMQfCA6vGLDUam3vuACYwSIJxXdzJujO14vL2TmMQK_hSdccqqjF4osDtYNMlh4kF7KE1FX1kfBnNEdEc5J1Jq3joP9Jj_Do0j7AQV7WzTKH_SnxGxvpqJ2_SArHHTRCoNBRLJgWuP7bqJG7YhZ3ecz4NJQtpwbn7QSXxA4I8Zs_YD7sfjWYZAanWgEcJ-drWuLPzHshgIW9r9iaZFacQSZBjl9Aw"
  },
  {
    id: "the-corporate",
    name: "The Corporate",
    category: "Professional",
    desc: "Color header, structured",
    bg: "bg-white",
    text: "text-slate-900",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDtYP9H4isUc7tV9_qK-s67Te2c5bmQEGCcMLe6QQlw2aNFzbtILYqF9GOyKa1pUB8VL7tQPTqFP8jGZ3mXg-tRGFkpfxKwFRmiu2ErC1PdqQAbFcxUxfQmUJWjfHx_Zw_gVa0HDafPcQDuzus-1y9yNPOKNX0TLaH0Mwr0Yp47ZMy-ZIFoj7dWsK4mTAWIfeFTWJY1k_0CknY3LhQ0xIT-JgMRq8Ai3CoSQESF0ZbCq-hBtL5a8TjPEw"
  },
  {
    id: "the-executive",
    name: "The Executive",
    category: "Professional",
    desc: "Centered, two-column",
    bg: "bg-white",
    text: "text-slate-900"
  },
  {
    id: "the-partner",
    name: "The Partner",
    category: "Professional",
    desc: "Elegant dual rules",
    bg: "bg-white",
    text: "text-slate-900"
  },
  {
    id: "the-innovator",
    name: "The Innovator",
    category: "Modern",
    desc: "Dark neon panels",
    bg: "bg-slate-950",
    text: "text-white",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBtX1gK7ViHrxtzjLH_jzBsn8o-05rtGu-V9wn8OIWLZcojI28LmultNL-A3tbw9hYK04RBmE8DZ9hjhNlJNl32XlyPz-bHVjRc78HCxe9Mgr9PeLTwp_goHN3K9TD_KYChO9xRJ0NDidkn3KGrC7kfAAq8lGb8oX37T9NBiQMhZmOQatMbcZDvBBZVWzWDPot48cCltDB3yEFTxAAElCh1jlos1dwOOppBRROaAJr_ZqGirAi9QxAIXQ"
  },
  {
    id: "the-digital-nomad",
    name: "The Digital Nomad",
    category: "Modern",
    desc: "50/50 split sidebar",
    bg: "bg-white",
    text: "text-slate-900"
  },
  {
    id: "the-social-media-pro",
    name: "The Social Media Pro",
    category: "Creative",
    desc: "Gradient banner, modern",
    bg: "bg-white",
    text: "text-slate-900"
  },
  {
    id: "the-creative-director",
    name: "The Creative Director",
    category: "Creative",
    desc: "Teal sidebar, timeline",
    bg: "bg-white",
    text: "text-slate-900",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA7BD4IWVRWQilqUtPsb8RcRcpM9mhsIwURhO37OU0djfkZbBfnPMnZqqxruthEkwu05dHJMpYvaVWZxKrXqiDBpfrQD1-ELMRRm8LWmcSJ0i_Y7NmnCedHcI8mlp-moQktTZUUucJPEeE1bWgwiFf3UlG4SXuskgkrZ80XayHgRHFehQmFK86nrShOn45mj8bk2nw7JWuJYVy_OfGcXXAVkG3xheGMi6NzjsxCvc7VIyW0j4UYIlb7Sw"
  },
  {
    id: "the-brand-architect",
    name: "The Brand Architect",
    category: "Creative",
    desc: "Monogram, asymmetric",
    bg: "bg-white",
    text: "text-slate-900"
  },
  {
    id: "the-typographer",
    name: "The Typographer",
    category: "Minimalist",
    desc: "Editorial typography",
    bg: "bg-white",
    text: "text-slate-900",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDeOT4dcxhBI6UNg4ysM6sOWdYlsyarXg0fNC8YTpL8yDshBHofCpRkFWKrk2WW_3AD_E7nveuOcCfnrfDOIHLWU9R0h_EgC-ocQ-Pj4EMUK_f91rwdK82J0brfviukm_1PcQCQFjZ01UGby_RmFuCKgo6OVzcYu3vIDpmw1kk1XF2ThSkn6gfseuWFjg8HD4lzXKpP8CcVnXM6DFnshOTPoOeX9wEk1-61iF_qBCzxKHa03Pcajg_a8Q"
  },
  {
    id: "the-strategist",
    name: "The Strategist",
    category: "Minimalist",
    desc: "Left profile sidebar",
    bg: "bg-white",
    text: "text-slate-900"
  },
  {
    id: "the-engineer",
    name: "The Engineer",
    category: "Technical",
    desc: "Tech stack sidebar",
    bg: "bg-white",
    text: "text-slate-900",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAXqSv3_04KMB6m_ar3_4EyE9OA5FZ8c9l486zLIZeKMjVjg24QNNugH4YPZC65r-2JAKCFXIES-woeqPjg371YxElFqxLLVawP6BXjN_BWnw2Ku7UvyIK21lTnIKhtWdKpP1iaQa2YzPdhRlpiuY08mymzT3-yspqofd7l198J2TRZgnyB9Qch1tKUYubIJmVcI_FCrQi0orWKlsYdHymzq8YY40SHULp6FVfi6FW4JsgivGxauHlNrw"
  },
  {
    id: "the-researcher",
    name: "The Researcher",
    category: "Technical",
    desc: "Academic appointments",
    bg: "bg-white",
    text: "text-slate-900"
  },
  {
    id: "the-researcher-updated",
    name: "The Researcher+",
    category: "Technical",
    desc: "Refined academic grid",
    bg: "bg-white",
    text: "text-slate-900"
  }
];
const coverLetterTemplates = [
  {
    id: "cl-standard",
    name: "Standard Letter",
    category: "Professional",
    desc: "Centered classic letterhead"
  },
  {
    id: "cl-creative",
    name: "Creative Pitch",
    category: "Creative",
    desc: "Bold accent bar intro"
  },
  {
    id: "cl-executive",
    name: "Executive Memo",
    category: "Professional",
    desc: "Direct memo header"
  },
  {
    id: "cl-tech",
    name: "Tech Introduction",
    category: "Technical",
    desc: "Left-rail stack letter"
  }
];
const LEGACY_RESUME_TEMPLATE_MAP = {
  scholar: "the-distinguished",
  standard: "the-corporate",
  executive: "the-executive",
  diplomat: "the-partner",
  innovator: "the-innovator",
  maverick: "the-digital-nomad",
  freelancer: "the-social-media-pro",
  zen: "the-typographer",
  graduate: "the-strategist",
  vanguard: "the-creative-director",
  designer: "the-brand-architect",
  architect: "the-engineer",
  analyst: "the-researcher",
  specialist: "the-researcher-updated"
};
const STITCH_RESUME_IDS = new Set(resumeTemplates.map((t) => t.id));
function resolveResumeTemplateId(id) {
  if (STITCH_RESUME_IDS.has(id)) return id;
  return LEGACY_RESUME_TEMPLATE_MAP[id] || resumeTemplates[0].id;
}

export { resumeTemplates as a, coverLetterTemplates as c, resolveResumeTemplateId as r };
//# sourceMappingURL=templates-CJ0hEBg_.mjs.map
