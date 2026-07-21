/**
 * Dynamic client-side technical keyword and skill extractor.
 * Pre-populates target keywords from raw job descriptions before ATS audits are run.
 */
export function extractKeywordsFromText(text?: string | null): string[] {
  if (!text || typeof text !== 'string') return []

  // Broad catalog of common software engineering, product, design, and data keywords
  const techKeywords = [
    // Languages
    'TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Golang', 'Rust', 'C++', 'C#', 'Ruby', 'PHP',
    'Kotlin', 'Swift', 'Objective-C', 'Scala', 'Haskell', 'SQL', 'NoSQL', 'HTML', 'CSS', 'Bash',
    // Frameworks & Libraries
    'Vue', 'VueJS', 'React', 'ReactJS', 'Angular', 'Next.js', 'Nuxt', 'Svelte', 'Node.js', 'Node',
    'Express', 'NestJS', 'Koa', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Spring', 'Hibernate',
    'Laravel', 'Rails', 'Ruby on Rails', 'jQuery', 'Bootstrap', 'Tailwind', 'Sass', 'Webpack', 'Vite',
    // Databases & Caching
    'PostgreSQL', 'Postgres', 'MySQL', 'SQLite', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB',
    'Cassandra', 'MariaDB', 'Supabase', 'Firebase', 'Prisma', 'Sequelize', 'Mongoose',
    // Architecture & APIs
    'GraphQL', 'REST', 'RESTful', 'gRPC', 'WebSockets', 'Microservices', 'SOA', 'Serverless',
    'Design Patterns', 'OOP', 'MVC', 'System Design', 'CI/CD', 'Web3',
    // DevOps & Cloud
    'AWS', 'Amazon Web Services', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'K8s',
    'Terraform', 'Ansible', 'Puppet', 'Chef', 'Jenkins', 'GitHub Actions', 'GitLab CI', 'Linux',
    'Unix', 'Nginx', 'Apache', 'Serverless Framework',
    // Testing & Quality
    'Jest', 'Vitest', 'Cypress', 'Playwright', 'Selenium', 'Mocha', 'Chai', 'TDD', 'BDD', 'Unit Testing',
    'Integration Testing', 'E2E Testing',
    // Management & Practices
    'Agile', 'Scrum', 'Kanban', 'SDLC', 'Product Management', 'Project Management', 'DevOps', 'SRE',
    'Jira', 'Confluence', 'Git', 'GitHub', 'GitLab', 'Bitbucket',
    // Miscellaneous concepts
    'Auth0', 'OAuth', 'JWT', 'Cognito', 'Stripe', 'Web Security', 'OWASP', 'Web Performance',
    'SEO', 'UX', 'UI', 'Responsive Design', 'Accessibility', 'a11y', 'Figma'
  ]

  const found = new Set<string>()
  const textLower = text.toLowerCase()

  // 1. Check exact match for predefined technology terms
  for (const kw of techKeywords) {
    const escaped = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
    // Support matching with boundaries, special handling for symbols like C++, .NET, C#
    let regex: RegExp
    if (/[+#.a-zA-Z0-9]+/.test(kw)) {
      regex = new RegExp(`(?:\\b|\\s|^)${escaped}(?:\\b|\\s|$|\\.)`, 'i')
    } else {
      regex = new RegExp(escaped, 'i')
    }

    if (regex.test(text)) {
      found.add(kw)
    }
  }

  // 2. Extract sequences of 2-3 capitalized words (e.g. "Software Architecture", "Relational Database")
  const phraseRegex = /\b([A-Z][a-zA-Z0-9+#.]+)(?:\s+[A-Z][a-zA-Z0-9+#.]+){1,2}\b/g
  let match: RegExpExecArray | null
  while ((match = phraseRegex.exec(text)) !== null) {
    const phrase = match[0].trim()
    const phraseLower = phrase.toLowerCase()
    
    // Ignore noise, standard template words, and pronouns
    if (
      phrase.length > 4 &&
      phrase.length < 30 &&
      !phraseLower.includes('job description') &&
      !phraseLower.includes('we are') &&
      !phraseLower.includes('you will') &&
      !phraseLower.includes('the company') &&
      !phraseLower.includes('equal opportunity') &&
      !phraseLower.includes('years of') &&
      !phraseLower.includes('about the') &&
      !phraseLower.includes('working hours') &&
      !phraseLower.includes('our team')
    ) {
      // Find clean presentation (first match capitalization)
      const existingMatches = Array.from(found).map(f => f.toLowerCase())
      if (!existingMatches.includes(phraseLower)) {
        found.add(phrase)
      }
    }
  }

  return Array.from(found).slice(0, 24) // Cap at 24 keywords for visual density and performance
}
