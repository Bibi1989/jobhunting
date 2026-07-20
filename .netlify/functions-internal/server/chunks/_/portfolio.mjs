const PORTFOLIO_TEMPLATES = [
  {
    slug: "the-visionary",
    name: "The Visionary",
    persona: "Modern",
    description: "Bright product-led hero with floating UI cards and a bold closing CTA.",
    dark: false,
    accentClass: "bg-indigo-500"
  },
  {
    slug: "the-minimalist",
    name: "The Minimalist",
    persona: "Mono",
    description: "Stark dark canvas, oversized serif statements, and generous whitespace.",
    dark: true,
    accentClass: "bg-slate-200"
  },
  {
    slug: "the-architect",
    name: "The Architect",
    persona: "Tech",
    description: "Dense engineering layout for distributed systems and infrastructure work.",
    dark: true,
    accentClass: "bg-sky-500"
  },
  {
    slug: "the-director",
    name: "The Director",
    persona: "Creative",
    description: "Editorial magazine styling with serif headlines and a portrait feature.",
    dark: false,
    accentClass: "bg-amber-500"
  },
  {
    slug: "the-leader",
    name: "The Leader",
    persona: "Executive",
    description: "Refined dark profile with a portrait medallion and gilded accents.",
    dark: true,
    accentClass: "bg-yellow-500"
  },
  {
    slug: "the-strategist",
    name: "The Strategist",
    persona: "Product",
    description: "Metric-driven product narrative with clean KPI tiles and growth framing.",
    dark: true,
    accentClass: "bg-teal-500"
  },
  {
    slug: "the-creator",
    name: "The Creator",
    persona: "Digital",
    description: "Vibrant, immersive gradients for motion, light, and interactive work.",
    dark: true,
    accentClass: "bg-fuchsia-500"
  },
  {
    slug: "the-investigator",
    name: "The Investigator",
    persona: "Research",
    description: "Academic light theme with serif body and a publications-style project list.",
    dark: false,
    accentClass: "bg-blue-800"
  },
  {
    slug: "the-builder",
    name: "The Builder",
    persona: "Freelance",
    description: "Precise engineering grid with monospace detailing and emerald accents.",
    dark: true,
    accentClass: "bg-emerald-500"
  },
  {
    slug: "the-catalyst",
    name: "The Catalyst",
    persona: "Marketing",
    description: "Data-driven growth layout with CSS bar charts and a dominant CTA.",
    dark: false,
    accentClass: "bg-green-500"
  }
];
const DEFAULT_TEMPLATE_SLUG = PORTFOLIO_TEMPLATES[0].slug;
const PORTFOLIO_COLORS = [
  { id: "emerald", hex: "#10b981", name: "Emerald" },
  { id: "indigo", hex: "#6366f1", name: "Indigo" },
  { id: "rose", hex: "#f43f5e", name: "Rose" },
  { id: "amber", hex: "#f59e0b", name: "Amber" },
  { id: "slate", hex: "#64748b", name: "Slate" },
  { id: "sky", hex: "#0ea5e9", name: "Sky" },
  { id: "fuchsia", hex: "#d946ef", name: "Fuchsia" },
  { id: "white", hex: "#ffffff", name: "White" },
  { id: "black", hex: "#000000", name: "Black" }
];
PORTFOLIO_COLORS[0].id;
function isPortfolioTemplateSlug(slug) {
  return typeof slug === "string" && PORTFOLIO_TEMPLATES.some((template) => template.slug === slug);
}
function getPortfolioTemplate(slug) {
  var _a;
  return (_a = PORTFOLIO_TEMPLATES.find((t) => t.slug === slug)) != null ? _a : PORTFOLIO_TEMPLATES[0];
}
function absoluteUrl(value) {
  const raw = (value || "").trim();
  if (!raw) return null;
  if (/^(mailto:|tel:|https?:\/\/)/i.test(raw)) return raw;
  if (raw.includes("@") && !raw.includes(" ")) return `mailto:${raw}`;
  if (/^[\d\s+().-]{7,}$/.test(raw)) return `tel:${raw.replace(/[^\d+]/g, "")}`;
  if (/linkedin\.com/i.test(raw) || raw.startsWith("in/")) {
    const path = raw.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
    return `https://${path.startsWith("linkedin") ? path : `www.linkedin.com/${path}`}`;
  }
  if (/github\.com/i.test(raw) || raw.startsWith("gh/")) {
    const path = raw.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/^gh\//, "");
    return `https://${path.startsWith("github") ? path : `github.com/${path}`}`;
  }
  return `https://${raw.replace(/^\/\//, "")}`;
}
const DEFAULT_SECTION_ORDER = ["projects", "skills"];
function orderedBodySections(data, titles = {}) {
  var _a, _b, _c, _d;
  const customs = Array.isArray(data.custom_sections) ? data.custom_sections : [];
  const customTitles = data.section_titles || {};
  const available = /* @__PURE__ */ new Map();
  if ((_a = data.formatted_projects) == null ? void 0 : _a.length) {
    available.set("projects", {
      key: "projects",
      kind: "projects",
      title: customTitles.projects || titles.projects || "Selected Work"
    });
  }
  if ((_b = data.core_skills) == null ? void 0 : _b.length) {
    available.set("skills", {
      key: "skills",
      kind: "skills",
      title: customTitles.skills || titles.skills || "Skills"
    });
  }
  for (const c of customs) {
    if (c.id && (((_c = c.title) == null ? void 0 : _c.trim()) || ((_d = c.content) == null ? void 0 : _d.trim()))) {
      available.set(c.id, { key: c.id, kind: "custom", title: c.title || "Section", custom: c });
    }
  }
  const requested = Array.isArray(data.section_order) ? data.section_order : [...DEFAULT_SECTION_ORDER];
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const key of requested) {
    const s = available.get(key);
    if (s && !seen.has(key)) {
      out.push(s);
      seen.add(key);
    }
  }
  for (const [key, s] of available) {
    if (!seen.has(key)) out.push(s);
  }
  return out;
}
function mailtoHref(email) {
  const value = (email || "").trim();
  if (!value || !value.includes("@")) return null;
  return `mailto:${value}`;
}
function telHref(phone) {
  const value = (phone || "").trim();
  if (!value) return null;
  return `tel:${value.replace(/[^\d+]/g, "")}`;
}
const SAMPLE_PROFILE = {
  full_name: "Jordan Avery",
  professional_bio: "Product-minded engineer and designer crafting digital experiences that bridge human needs and business goals. Ten years turning ambiguous problems into shipped, measurable products.",
  email: "jordan.avery@example.com",
  phone: "+1 (415) 555-0142",
  location: "San Francisco, CA",
  website: "jordanavery.dev",
  linkedin: "linkedin.com/in/jordanavery",
  github: "github.com/jordanavery",
  formatted_projects: [
    {
      title: "Atlas Analytics Platform",
      description: "Led design and build of a real-time analytics suite adopted by 40+ enterprise teams, cutting reporting time by 70 percent.",
      tech_stack: ["TypeScript", "Nuxt", "PostgreSQL", "D3"],
      url: "https://example.com/atlas"
    },
    {
      title: "Nimbus Design System",
      description: "Created a cross-platform component library and token pipeline that unified five product surfaces.",
      tech_stack: ["Vue", "Figma", "Storybook"],
      url: "https://example.com/nimbus"
    },
    {
      title: "Signal Growth Engine",
      description: "Built an experimentation framework that lifted activation 18 percent across onboarding funnels.",
      tech_stack: ["Node", "Redis", "Python"],
      url: "https://example.com/signal"
    }
  ],
  core_skills: [
    "Product Strategy",
    "Full-Stack Engineering",
    "UX Design",
    "Data Visualization",
    "Team Leadership",
    "Systems Architecture"
  ]
};

export { DEFAULT_TEMPLATE_SLUG as D, PORTFOLIO_TEMPLATES as P, SAMPLE_PROFILE as S, absoluteUrl as a, PORTFOLIO_COLORS as b, getPortfolioTemplate as g, isPortfolioTemplateSlug as i, mailtoHref as m, orderedBodySections as o, telHref as t };
//# sourceMappingURL=portfolio.mjs.map
