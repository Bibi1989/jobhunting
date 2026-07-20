import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetFile = path.resolve(__dirname, '../shared/samples/cvFormats.ts');

let code = fs.readFileSync(targetFile, 'utf-8');

// 1. Replace CV_FORMATS array
const cvFormatsStart = code.indexOf('export const CV_FORMATS: CvFormat[] = [');
const cvFormatsEnd = code.indexOf(']', cvFormatsStart) + 1;

if (cvFormatsStart === -1 || cvFormatsEnd === -1) {
  console.error("Could not find CV_FORMATS array boundaries!");
  process.exit(1);
}

const newCvFormats = `export const CV_FORMATS: CvFormat[] = [
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
    description: 'Centered header with dual horizontal line accents and a traditional elegant serif layout.',
    bestFor: 'Legal, consulting partners, and advisory roles',
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
    description: 'Vibrant geometric gradient top banner, rounded profile picture overlap, and modern social accents.',
    bestFor: 'Social media, digital marketing, content creators, and PR pros',
  },
  {
    id: 'the-brand-architect',
    name: 'The Brand Architect',
    description: 'Architectural monogram background layout with asymmetric layout details.',
    bestFor: 'Brand strategists, art directors, and luxury market designers',
  },
  {
    id: 'the-typographer',
    name: 'The Typographer',
    description: 'Typography-first editorial layout with bold black lines and large tight headings.',
    bestFor: 'Editorial designers, copywriters, and print journalists',
  },
  {
    id: 'the-researcher',
    name: 'The Researcher',
    description: 'Traditional academic CV prioritizing academic appointments, publication lists, and methods.',
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
    description: 'Traditional serif design with top color line accent and custom bibliography notes.',
    bestFor: 'Distinguished specialists, executives, and senior advisors',
  },
  {
    id: 'the-researcher-updated',
    name: 'The Researcher (Updated)',
    description: 'Cleaned-up version of the traditional academic CV layout with improved grid spacing.',
    bestFor: 'Medical researchers, scientists, and senior academic staff',
  },
]`;

code = code.substring(0, cvFormatsStart) + newCvFormats + code.substring(cvFormatsEnd);

// 2. Replace builders block in buildCvByFormat
const buildersStart = code.indexOf('  const builders: Record<string, () => string> = {');
const buildersEnd = code.indexOf('  }', buildersStart) + 3;

if (buildersStart === -1 || buildersEnd === -1) {
  console.error("Could not find builders object boundaries!");
  process.exit(1);
}

const newBuilders = `  const builders: Record<string, () => string> = {
    'classic-professional': () => \`# \${name}
\${title}
\${contact} · github.com/jordanellis

## Professional Summary
\${cap(analysis.seniority)} professional focused on \${title.toLowerCase()} work. Clear communicator seeking to contribute to **\${company}**.

## Core Competencies
\${skillLine}

## Professional Experience
### Northline Systems, \${title}
*San Francisco, CA · Jan 2022 – Present*
\${bullets}

## Education
### B.S., Computer Science, University of California, Santa Cruz
*Santa Cruz, CA*
\`,
    'modern-compact': () => \`# \${name} | \${title}
\${contact}

**Summary:** \${summaryText}

**Skills:** \${skillLine}

**Experience**
### Northline Systems, \${title} (\${bullets.split('\\n')[0]})
\`,
    'executive-leadership': () => \`# \${name}
\${title} | Leadership Profile
\${contact}

## Executive Summary
\${summaryText}

## Leadership Competencies
\${skillLine}

## Selected Leadership Experience
### Northline Systems, \${title}
\${bullets}
\`,
    'technical-engineer': () => \`# \${name}
\${title}
\${contact}

## Technical Summary
\${summaryText}

## Technical Skills
\${skillLine}

## Engineering Experience
### Northline Systems, \${title}
\${bullets}
\`,
    'product-strategy': () => \`# \${name}
\${title}
\${contact}

## Product Summary
\${summaryText}

## Core Experience
### Northline Systems, \${title}
\${bullets}
\`,
    'data-insights': () => \`# \${name}
\${title}
\${contact}

## Data Summary
\${summaryText}

## Analytical Experience
### Northline Systems, \${title}
\${bullets}
\`,
    'design-craft': () => \`# \${name}
\${title}
\${contact}

## Design Philosophy
\${summaryText}

## Craft Experience
### Northline Systems, \${title}
\${bullets}
\`,
    'research-academic': () => \`# \${name}
\${title}
\${contact}

## Research Profile
\${summaryText}

## Academic Experience
### Northline Systems, \${title}
\${bullets}
\`,
    'startup-generalist': () => \`# \${name}
\${title}
\${contact}

## Startup Narrative
\${summaryText}

## Execution Experience
### Northline Systems, \${title}
\${bullets}
\`,
    'impact-first': () => \`# \${name}
\${title}
\${contact}

## Selected Impact
- Quantified win based on \${skills[0] || 'core engineering'} deliverables

## Experience Timeline
### Northline Systems, \${title}
\${bullets}
\`,
    'federal-plain': () => \`# \${name}
\${title}
\${contact}

## Summary
\${summaryText}

## Skills
\${skills.map((s) => \`- \${s}\`).join('\\n')}

## Work Experience
### Northline Systems, \${title}
\${bullets}
\`,
    'hybrid-skills-left': () => \`# \${name}
\${title}
\${contact}

## Skills Spotlight
\${skills.map((s) => \`- \${s}\`).join('\\n')}

## Professional Experience
### Northline Systems, \${title}
\${bullets}
\`,
    'the-corporate': () => \`# \${name}
\${title}
\${contact}

## Professional Profile
\${summaryText}

## Core Competencies & Education
### Core Competencies
\${skillLine}

### Education
\${educationText}

## Professional Experience
### Northline Systems, \${title}
*San Francisco, CA · Jan 2022 – Present*
\${bullets}
\`,
    'the-executive': () => \`# \${name}
\${title} | Executive Profile
\${contact}

## Core Expertise
\${skillLine}

## Education & Credentials
\${educationText}

- Credentials: CFA Charterholder · Six Sigma Black Belt

## Professional Experience
### Northline Systems, \${title}
*San Francisco, CA · Jan 2022 – Present*
\${bullets}

## Leadership & Impact
Served as a board member and mentor, delivering financial literacy programs.
\`,
    'the-strategist': () => \`# \${name}
\${title} | Strategic Profile
\${contact}

## Core Expertise
\${skillLine}

## Education & Credentials
\${educationText}

- Credentials: PMP · CSM

## Strategist Profile
\${summaryText}

## Professional Experience
### Northline Systems, \${title}
*San Francisco, CA · Jan 2022 – Present*
\${bullets}
\`,
    'the-creative-director': () => \`# \${name}
\${title} | Creative Director Profile
\${contact}

## Creative Director Profile
\${summaryText}

## Recognition
- Red Dot Design Award 2022
- Awwwards Site of the Year 2021

## Professional Experience
### Northline Systems, \dots
*2022 — PRESENT*
\${bullets}
\`,
    'the-partner': () => \`# \${name}
\${title}
\${contact}

## Executive Profile
\${summaryText}

## Professional Experience
### Northline Systems, \${title}
*2022 — PRESENT*
\${bullets}

## Education
\${educationText}

## Core Expertise
\${skillLine}
\`,
    'the-innovator': () => \`# \${name}
\${title}
\${contact}

## Innovator Profile
\${summaryText}

## Professional Experience
### Northline Systems, \${title}
\${bullets}

## Skills & Technologies
\${skillLine}
\`,
    'the-digital-nomad': () => \`# \${name}
\${title}
\${contact}

## Nomad Profile
\${summaryText}

## Skills
\${skillLine}

## Experience
### Northline Systems, \${title}
\${bullets}
\`,
    'the-social-media-pro': () => \`# \${name}
\${title}
\${contact}

## Social Media Profile
\${summaryText}

## Core Competencies
\${skillLine}

## Professional Experience
### Northline Systems, \${title}
\${bullets}
\`,
    'the-brand-architect': () => \`# \${name}
\${title}
\${contact}

## Brand Profile
\${summaryText}

## Experience
### Northline Systems, \${title}
\${bullets}
\`,
    'the-typographer': () => \`# \${name}
\${title}
\${contact}

## Editorial Profile
\${summaryText}

## Professional Experience
### Northline Systems, \${title}
\${bullets}
\`,
    'the-researcher': () => \`# \${name}
\${title}
\${contact}

## Research Profile
\${summaryText}

## Academic Appointments
### Northline Systems, \${title}
\${bullets}
\`,
    'the-engineer': () => \`# \${name}
\${title}
\${contact}

## System Profile
\${summaryText}

## Stack & Tools
\${skillLine}

## Engineering Experience
### Northline Systems, \${title}
\${bullets}
\`,
    'the-distinguished': () => \`# \${name}
\${title}
\${contact}

## Distinguished Profile
\${summaryText}

## Experience
### Northline Systems, \${title}
\${bullets}
\`,
    'the-researcher-updated': () => \`# \${name}
\${title}
\${contact}

## Research Profile
\${summaryText}

## Academic Appointments
### Northline Systems, \${title}
\${bullets}
\`,
  }`;

code = code.substring(0, buildersStart) + newBuilders + code.substring(buildersEnd);

// 3. Replace switch statements inside buildPersonalizedCv
const switchStart = code.indexOf('  switch (formatId) {');
const switchEnd = code.lastIndexOf('  }') + 3; // Find the outer closing bracket of switch

if (switchStart === -1 || switchEnd === -1) {
  console.error("Could not find switch boundaries!");
  process.exit(1);
}

// Find exactly the default: case or replace everything inside the switch block
const switchInnerStart = code.indexOf('{', switchStart) + 1;
const switchInnerEnd = code.lastIndexOf('}', switchEnd - 2);

const newSwitchCases = `
    case 'modern-compact':
      return \`# \${name} | \${title}
\${contact}

**Summary:** \${summaryText}

**Skills:** \${skillLine}

**Experience**
\${experienceWithProjects}

**Education:** \${educationText.replace(/^###\\s*/, '').split('\\n')[0]}
\`
    case 'executive-leadership':
      return \`# \${name}
\${title} | Leadership Profile
\${contact}

## Executive Summary
\${summaryText}

## Leadership Competencies
\${skillLine}

## Selected Leadership Experience
\${experienceWithProjects}

## Education
\${educationText}
\`
    case 'technical-engineer':
      return \`# \${name}
\${title}
\${contact}\${website ? \` · \${website}\` : ''}

## Technical Summary
\${summaryText}

## Technical Skills
**Core:** \${skillLine}

## Engineering Experience
\${experienceWithProjects}

## Education
\${educationText}
\`
    case 'impact-first':
      return \`# \${name}
\${title}
\${contact}

## Selected Impact
\${(ctx.analysis.responsibilities.slice(0, 3).length
  ? analysis.responsibilities.slice(0, 3)
  : skills.slice(0, 3)
)
  .map((r) => \`- \${toMetricBullet(r)}\`)
  .join('\\n')}

## Skills
\${skillLine}

## Experience Timeline
\${experienceWithProjects}

## Education
\${educationText}
\`
    case 'federal-plain':
      return \`# \${name}
\${title}
\${contact}

## Summary
\${summaryText}

## Skills
\${skills.map((s) => \`- \${s}\`).join('\\n') || '- Communication\\n- Analysis\\n- Documentation'}

## Work Experience
\${experienceWithProjects}

## Education
\${educationText}
\`
    case 'hybrid-skills-left':
      return \`# \${name}
\${title}
\${contact}

## Skills Spotlight
\${skills.map((s) => \`- \${s}\`).join('\\n') || '- Collaboration\\n- Delivery\\n- Communication'}

## Professional Experience
\${experienceWithProjects}

## Education
\${educationText}
\`
    case 'the-corporate':
      return \`# \${name}
\${title}
\${contact}

## Professional Profile
\${summaryText}

## Core Competencies & Education
### Core Competencies
\${skillLine}

### Education
\${educationText}

## Professional Experience
\${experienceWithProjects}
\`
    case 'the-executive':
      return \`# \${name}
\${title} | Executive Profile
\${contact}

## Core Expertise
\${skillLine}

## Education & Credentials
\${educationText}

- Credentials: CFA Charterholder · Six Sigma Black Belt

## Professional Experience
\${experienceWithProjects}

## Leadership & Impact
Served as a board member and mentor, delivering financial and technical literacy programs to underserved communities, and acting as a keynote speaker at national forums.
\`
    case 'the-strategist':
      return \`# \${name}
\${title} | Strategic Profile
\${contact}

## Core Expertise
\${skillLine}

## Education & Credentials
\${educationText}

- Credentials: Project Management Professional (PMP) · Certified Scrum Master (CSM)

## Strategist Profile
\${summaryText}

## Professional Experience
\${experienceWithProjects}

## Leadership & Impact
Recognized as a thought leader in SaaS business models. Frequently invited panelist at national technology conferences and board advisor to growth-stage startups.
\`
    case 'the-creative-director':
      return \`# \${name}
\${title} | Creative Director Profile
\${contact}

## Creative Director Profile
\${summaryText}

## Recognition
- Red Dot Design Award 2022
- Awwwards Site of the Year 2021

## Professional Experience
\${experienceWithProjects}
\`
    case 'the-partner':
      return \`# \${name}
\${title}
\${contact}

## Executive Profile
\${summaryText}

## Professional Experience
\${experienceWithProjects}

## Education
\${educationText}

## Core Expertise
\${skillLine}
\`
    case 'the-innovator':
      return \`# \${name}
\${title}
\${contact}

## Innovator Profile
\${summaryText}

## Professional Experience
\${experienceWithProjects}

## Skills & Technologies
\${skillLine}
\`
    case 'the-digital-nomad':
      return \`# \${name}
\${title}
\${contact}

## Nomad Profile
\${summaryText}

## Skills
\${skillLine}

## Experience
\${experienceWithProjects}
\`
    case 'the-social-media-pro':
      return \`# \${name}
\${title}
\${contact}

## Social Media Profile
\${summaryText}

## Core Competencies
\${skillLine}

## Professional Experience
\${experienceWithProjects}
\`
    case 'the-brand-architect':
      return \`# \${name}
\${title}
\${contact}

## Brand Profile
\${summaryText}

## Experience
\${experienceWithProjects}
\`
    case 'the-typographer':
      return \`# \${name}
\${title}
\${contact}

## Editorial Profile
\${summaryText}

## Professional Experience
\${experienceWithProjects}
\`
    case 'the-researcher':
      return \`# \${name}
\${title}
\${contact}

## Research Profile
\${summaryText}

## Academic Appointments
\${experienceWithProjects}
\`
    case 'the-engineer':
      return \`# \${name}
\${title}
\${contact}

## System Profile
\${summaryText}

## Stack & Tools
\${skillLine}

## Engineering Experience
\${experienceWithProjects}
\`
    case 'the-distinguished':
      return \`# \${name}
\${title}
\${contact}

## Distinguished Profile
\${summaryText}

## Experience
\${experienceWithProjects}
\`
    case 'the-researcher-updated':
      return \`# \${name}
\${title}
\${contact}

## Research Profile
\${summaryText}

## Academic Appointments
\${experienceWithProjects}
\`
    default:
      return \`# \${name}
\${title}
\${contact}\${website ? \` · \${website}\` : ''}

## Professional Summary
\${summaryText}

## Core Competencies
\${skillLine}

## Professional Experience
\${experienceWithProjects}

## Education
\${educationText}
\``;

code = code.substring(0, switchInnerStart) + newSwitchCases + code.substring(switchInnerEnd);

fs.writeFileSync(targetFile, code);
console.log("Successfully patched cvFormats.ts!");
