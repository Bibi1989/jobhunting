/**
 * Server react-pdf resume document.
 * Uses per-slug profiles from shared/pdf/templates (aligned with ResumeThemeRenderer)
 * plus sectionsOrder for draw order.
 */
import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { BuilderResumeData } from '~/shared/types/builder'
import {
  normalizeSectionsOrder,
  parseCustomSectionId,
  resolveTemplateSlug,
  type ResumeSectionId,
  withLayoutState,
} from '~/shared/pdf/schema'
import { getPdfTemplateProfile, type PdfTemplateProfile, type PdfTemplateTheme } from '~/shared/pdf/templates'
import { styles as tokenStyles } from '~/shared/pdf/tokens'
import { cleanDescriptionHtml, formatDateRange, htmlToBlocks, htmlToInlineRuns, stripHtmlToPlain } from '~/shared/pdf/text'

function sx(...parts: Array<object | false | null | undefined>): any {
  return parts.filter(Boolean)
}

const S = StyleSheet.create(tokenStyles as any)

function themed(theme: PdfTemplateTheme, spacingPreset?: 'ats-stable' | 'compact' | 'balanced') {
  let baseFontSize = 9.5
  let baseLineHeight = 1.35
  let atomMargin = 10
  let sectionMargin = 14
  let pagePaddingValue = 32

  if (spacingPreset === 'compact') {
    baseFontSize = 8.5
    baseLineHeight = 1.25
    atomMargin = 6
    sectionMargin = 10
    pagePaddingValue = 24
  } else if (spacingPreset === 'ats-stable') {
    baseFontSize = 10
    baseLineHeight = 1.4
    atomMargin = 12
    sectionMargin = 16
    pagePaddingValue = 36
  }

  const dynamicStyles = StyleSheet.create({
    page: {
      ...tokenStyles.page,
      paddingTop: pagePaddingValue,
      paddingBottom: pagePaddingValue,
      paddingLeft: pagePaddingValue,
      paddingRight: pagePaddingValue,
      color: theme.ink,
      backgroundColor: theme.paper
    },
    h1: { ...tokenStyles.h1, color: theme.ink },
    h2: {
      ...tokenStyles.h2,
      color: theme.brand,
      borderBottomColor: `${theme.accent}33`,
      marginTop: sectionMargin,
      marginBottom: atomMargin / 2
    },
    subtitle: { ...tokenStyles.subtitle, color: theme.brand },
    body: { ...tokenStyles.body, color: theme.ink, fontSize: baseFontSize, lineHeight: baseLineHeight },
    muted: { ...tokenStyles.muted, color: theme.muted },
    itemTitle: { ...tokenStyles.itemTitle, color: theme.ink, fontSize: baseFontSize + 1 },
    itemMeta: { ...tokenStyles.itemMeta, color: theme.brand },
    contactLine: { ...tokenStyles.contactLine, color: theme.muted },
    techPage: { ...tokenStyles.techPage, color: theme.ink, backgroundColor: theme.paper, paddingTop: pagePaddingValue, paddingBottom: pagePaddingValue },
    techSidebar: { ...tokenStyles.techSidebar, backgroundColor: theme.sidebar, color: theme.sidebarText },
    techMain: { ...tokenStyles.techMain, backgroundColor: theme.paper },
    techName: { ...tokenStyles.techName, color: theme.sidebarText },
    techRole: { ...tokenStyles.techRole, color: theme.sidebarMuted },
    techHeading: {
      ...tokenStyles.techHeading,
      color: theme.sidebarMuted,
      borderBottomColor: `${theme.sidebarMuted}55`,
    },
    techText: { ...tokenStyles.techText, color: theme.sidebarText },
    modernRight: { ...tokenStyles.modernRight, borderLeftColor: `${theme.accent}44` },
    // Dynamic layout/atom properties
    atom: { ...tokenStyles.atom, marginBottom: atomMargin },
    section: { ...tokenStyles.section },
    rowBetween: { ...tokenStyles.rowBetween },
    bulletRow: { ...tokenStyles.bulletRow },
    bulletGlyph: { ...tokenStyles.bulletGlyph, fontSize: baseFontSize },
    bulletText: { ...tokenStyles.bulletText, fontSize: baseFontSize, lineHeight: baseLineHeight },
    chipRow: { ...tokenStyles.chipRow },
    chip: { ...tokenStyles.chip },
    techChip: { ...tokenStyles.techChip },
    techChipText: { ...tokenStyles.techChipText },
    modernLeft: { ...tokenStyles.modernLeft }
  } as any)

  return dynamicStyles as any
}

type T = ReturnType<typeof themed>

function fontForRun(bold?: boolean, italic?: boolean): string {
  if (bold && italic) return 'Helvetica-BoldOblique'
  if (bold) return 'Helvetica-Bold'
  if (italic) return 'Helvetica-Oblique'
  return 'Helvetica'
}

function RichText({
  html,
  plain,
  style,
}: {
  html?: string
  plain: string
  style: any
}) {
  const runs = htmlToInlineRuns(html || plain)
  if (!runs.length) {
    return React.createElement(Text, { style }, plain)
  }
  const hasMarks = runs.some((r) => r.bold || r.italic || r.underline)
  if (!hasMarks) {
    return React.createElement(Text, { style }, plain)
  }
  return React.createElement(
    Text,
    { style },
    ...runs.map((run, index) =>
      React.createElement(
        Text,
        {
          key: `r-${index}`,
          style: {
            fontFamily: fontForRun(run.bold, run.italic),
            textDecoration: run.underline ? 'underline' : undefined,
          },
        },
        run.text,
      ),
    ),
  )
}

function Blocks({ html, light = false, theme, t }: { html?: string; light?: boolean; theme: PdfTemplateTheme; t: T }) {
  const blocks = htmlToBlocks(html)
  if (!blocks.length) return null

  // CRITICAL: never put bare <Text> as a sibling of a header <View>.
  // In react-pdf that collapses vertical layout and stacks every line on the same Y.
  return React.createElement(
    View,
    { style: { flexDirection: 'column', width: '100%', marginTop: 2 } },
    ...blocks.map((block, index) => {
      const color = light ? theme.sidebarText : theme.ink
      if (block.type === 'bullet') {
        return React.createElement(
          View,
          { key: `b-${index}`, style: t.bulletRow, wrap: false },
          React.createElement(Text, {
            style: sx(t.bulletGlyph, light && { color: theme.sidebarMuted }),
          }, '•'),
          React.createElement(RichText, {
            html: block.html,
            plain: block.text,
            style: sx(t.bulletText, { color }),
          }),
        )
      }
      return React.createElement(
        View,
        { key: `p-${index}`, style: { width: '100%', marginBottom: 4 } },
        React.createElement(RichText, {
          html: block.html,
          plain: block.text,
          style: sx(t.body, { color }),
        }),
      )
    }),
  )
}

function ExperienceList({ data, theme, t }: { data: BuilderResumeData; theme: PdfTemplateTheme; t: T }) {
  if (!data.experience?.length) return null
  return React.createElement(
    View,
    { style: { flexDirection: 'column', width: '100%' } },
    ...data.experience.map((job) =>
      React.createElement(
        View,
        { key: job.id, style: t.atom },
        React.createElement(
          View,
          { style: { flexDirection: 'column', width: '100%', marginBottom: 2 } },
          React.createElement(
            View,
            { style: t.rowBetween },
            React.createElement(Text, { style: t.itemTitle }, job.title || 'Role'),
            React.createElement(Text, { style: t.muted }, formatDateRange(job.startDate, job.endDate, job.isCurrent)),
          ),
          React.createElement(Text, { style: t.itemMeta }, [job.company, job.location].filter(Boolean).join(' · ')),
        ),
        React.createElement(Blocks, { html: cleanDescriptionHtml(job.description), theme, t }),
      ),
    ),
  )
}

function EducationList({
  data,
  theme,
  t,
  light = false,
}: {
  data: BuilderResumeData
  theme: PdfTemplateTheme
  t: T
  light?: boolean
}) {
  if (!data.education?.length) return null
  return React.createElement(
    View,
    null,
    ...data.education.map((edu) =>
      React.createElement(
        View,
        { key: edu.id, style: t.atom },
        React.createElement(Text, {
          style: sx(t.itemTitle, light && { color: theme.sidebarText, fontSize: 9 }),
        }, edu.degree || 'Degree'),
        React.createElement(Text, {
          style: sx(t.muted, light && { color: theme.sidebarMuted }),
        }, [edu.school, edu.graduationDate].filter(Boolean).join(', ')),
        edu.description
          ? React.createElement(Text, {
              style: sx(t.body, light && { color: theme.sidebarText }),
            }, stripHtmlToPlain(edu.description))
          : null,
      ),
    ),
  )
}

function ProjectsList({ data, theme, t }: { data: BuilderResumeData; theme: PdfTemplateTheme; t: T }) {
  if (!data.projects?.length) return null
  return React.createElement(
    View,
    { style: { flexDirection: 'column', width: '100%' } },
    ...data.projects.map((project) => {
      const range = formatDateRange(project.startDate, project.endDate, project.isCurrent)
      return React.createElement(
        View,
        { key: project.id, style: t.atom },
        React.createElement(
          View,
          { style: { flexDirection: 'column', width: '100%', marginBottom: 2 } },
          React.createElement(
            View,
            { style: t.rowBetween },
            React.createElement(Text, { style: t.itemTitle }, project.title || 'Project'),
            range ? React.createElement(Text, { style: t.muted }, range) : null,
          ),
          project.organization
            ? React.createElement(Text, { style: t.itemMeta }, project.organization)
            : null,
        ),
        project.projectDescription
          ? React.createElement(
              View,
              { style: { width: '100%', marginTop: 2, marginBottom: 4 } },
              React.createElement(
                Text,
                { style: { ...t.body, fontFamily: 'Helvetica-Oblique' } },
                project.projectDescription
              )
            )
          : null,
        React.createElement(Blocks, { html: cleanDescriptionHtml(project.description), theme, t }),
      )
    }),
  )
}

function AchievementsList({ data, theme, t }: { data: BuilderResumeData; theme: PdfTemplateTheme; t: T }) {
  if (!data.achievements?.length) return null
  return React.createElement(
    View,
    null,
    ...data.achievements.map((item) =>
      React.createElement(
        View,
        { key: item.id, style: t.atom },
        React.createElement(Text, { style: t.itemTitle }, item.title || 'Achievement'),
        item.issuer || item.date
          ? React.createElement(Text, { style: t.itemMeta }, [item.issuer, item.date].filter(Boolean).join(' · '))
          : null,
        React.createElement(Blocks, { html: cleanDescriptionHtml(item.description), theme, t }),
      ),
    ),
  )
}

function SkillsChips({ data, theme, t, tech = false }: { data: BuilderResumeData; theme: PdfTemplateTheme; t: T; tech?: boolean }) {
  if (!data.skills?.length) return null
  if (tech) {
    return React.createElement(
      View,
      { style: { flexDirection: 'row', flexWrap: 'wrap' } },
      ...data.skills.map((skill) =>
        React.createElement(
          View,
          {
            key: skill.id,
            wrap: false,
            style: {
              ...t.techChip,
              borderColor: theme.sidebarMuted,
              backgroundColor: theme.sidebar,
            },
          },
          React.createElement(Text, { style: { ...t.techChipText, color: theme.sidebarText } }, skill.name),
        ),
      ),
    )
  }
  return React.createElement(
    View,
    { style: t.chipRow },
    ...data.skills.map((skill) =>
      React.createElement(
        Text,
        {
          key: skill.id,
          wrap: false,
          style: { ...t.chip, color: theme.ink, borderColor: `${theme.accent}55` },
        },
        skill.name,
      ),
    ),
  )
}

function hasSectionContent(data: BuilderResumeData, id: ResumeSectionId): boolean {
  switch (id) {
    case 'summary':
      return Boolean(stripHtmlToPlain(data.personalInfo?.summary))
    case 'experience':
      return Boolean(data.experience?.length)
    case 'projects':
      return Boolean(data.projects?.length)
    case 'education':
      return Boolean(data.education?.length)
    case 'skills':
      return Boolean(data.skills?.length)
    case 'achievements':
      return Boolean(data.achievements?.length)
    default: {
      const customId = parseCustomSectionId(id)
      const section = (data.customSections || []).find((s) => s.id === customId)
      return Boolean(section && (section.items?.length || section.title))
    }
  }
}

function renderOrderedSection(
  data: BuilderResumeData,
  id: ResumeSectionId,
  theme: PdfTemplateTheme,
  t: T,
  options: { heading?: string; techLight?: boolean; listSkills?: boolean } = {},
): React.ReactElement | null {
  if (!hasSectionContent(data, id)) return null

  switch (id) {
    case 'summary':
      return React.createElement(
        View,
        { key: id, wrap: false, style: t.section },
        React.createElement(Text, { style: t.h2 }, options.heading || 'Summary'),
        React.createElement(Text, { style: t.body }, stripHtmlToPlain(data.personalInfo.summary)),
      )
    case 'experience':
      return React.createElement(
        View,
        { key: id, style: t.section },
        React.createElement(Text, { style: t.h2 }, options.heading || 'Experience'),
        React.createElement(ExperienceList, { data, theme, t }),
      )
    case 'projects':
      return React.createElement(
        View,
        { key: id, style: t.section },
        React.createElement(Text, { style: t.h2 }, options.heading || 'Projects'),
        React.createElement(ProjectsList, { data, theme, t }),
      )
    case 'education':
      return React.createElement(
        View,
        { key: id, style: t.section },
        React.createElement(Text, { style: options.techLight ? t.techHeading : t.h2 }, options.heading || 'Education'),
        React.createElement(EducationList, { data, theme, t, light: options.techLight }),
      )
    case 'skills':
      return React.createElement(
        View,
        { key: id, wrap: false, style: t.section },
        React.createElement(Text, { style: options.techLight ? t.techHeading : t.h2 }, options.heading || 'Skills'),
        options.listSkills
          ? React.createElement(
              View,
              null,
              ...data.skills.map((skill) =>
                React.createElement(
                  Text,
                  { key: skill.id, style: sx(t.body, { marginBottom: 3 }), wrap: false },
                  `• ${skill.name}`,
                ),
              ),
            )
          : React.createElement(SkillsChips, { data, theme, t, tech: options.techLight }),
      )
    case 'achievements':
      return React.createElement(
        View,
        { key: id, style: t.section },
        React.createElement(Text, { style: t.h2 }, options.heading || 'Achievements'),
        React.createElement(AchievementsList, { data, theme, t }),
      )
    default: {
      const customId = parseCustomSectionId(id)
      const section = (data.customSections || []).find((s) => s.id === customId)
      if (!section) return null
      return React.createElement(
        View,
        { key: id, style: t.section },
        React.createElement(Text, { style: t.h2 }, section.title || 'Custom'),
        ...section.items.map((item) =>
          React.createElement(
            View,
            { key: item.id, style: t.atom },
            React.createElement(Text, { style: t.itemTitle }, item.title),
            item.subtitle ? React.createElement(Text, { style: t.itemMeta }, item.subtitle) : null,
            React.createElement(Blocks, { html: cleanDescriptionHtml(item.description), theme, t }),
          ),
        ),
      )
    }
  }
}

function HeaderBlock({
  data,
  t,
  centered = false,
}: {
  data: BuilderResumeData
  t: T
  centered?: boolean
}) {
  const p = data.personalInfo
  return React.createElement(
    View,
    {
      wrap: false,
      style: centered ? { marginBottom: 10, alignItems: 'center' } : { marginBottom: 8 },
    },
    React.createElement(Text, { style: sx(t.h1, centered && { textAlign: 'center' }) }, p.fullName || data.name || 'Resume'),
    p.jobTitle
      ? React.createElement(Text, { style: sx(t.subtitle, centered && { textAlign: 'center' }) }, p.jobTitle)
      : null,
    centered
      ? React.createElement(
          Text,
          { style: sx(t.contactLine, { textAlign: 'center' }) },
          [p.email, p.phone, p.location, p.linkedin].filter(Boolean).join('  |  '),
        )
      : React.createElement(
          View,
          null,
          ...[p.email, p.phone, p.location, p.linkedin || p.portfolio || p.github]
            .filter(Boolean)
            .map((line, i) => React.createElement(Text, { key: `c-${i}`, style: t.contactLine }, String(line))),
        ),
  )
}

function MinimalResume({
  data,
  order,
  theme,
  t,
}: {
  data: BuilderResumeData
  order: ResumeSectionId[]
  theme: PdfTemplateTheme
  t: T
}) {
  return React.createElement(
    Page,
    { size: 'A4', style: t.page, wrap: true },
    React.createElement(HeaderBlock, { data, t }),
    ...order.map((id) => renderOrderedSection(data, id, theme, t)).filter(Boolean),
  )
}

function ModernResume({
  data,
  order,
  theme,
  t,
}: {
  data: BuilderResumeData
  order: ResumeSectionId[]
  theme: PdfTemplateTheme
  t: T
}) {
  const leftIds = order.filter((id) => id === 'education' || id === 'skills')
  const rightIds = order.filter((id) => id !== 'education' && id !== 'skills')

  return React.createElement(
    Page,
    { size: 'A4', style: t.page, wrap: true },
    React.createElement(HeaderBlock, { data, t, centered: true }),
    React.createElement(
      View,
      { style: { position: 'relative' } },
      React.createElement(
        View,
        { 
          style: [
            t.modernLeft, 
            { 
              position: 'absolute', 
              top: 0, 
              left: 0,
              paddingRight: 18,
            }
          ] 
        },
        ...leftIds
          .map((id) => renderOrderedSection(data, id, theme, t, { listSkills: id === 'skills' }))
          .filter(Boolean),
      ),
      React.createElement(
        View,
        { 
          style: [
            t.modernRight, 
            { 
              marginLeft: '34%', 
              minHeight: 100, // Ensure the right column takes up space even if empty on page 1
            }
          ] 
        },
        ...rightIds
          .map((id) =>
            renderOrderedSection(data, id, theme, t, {
              heading: id === 'summary' ? 'Executive Summary' : undefined,
            }),
          )
          .filter(Boolean),
      )
    )
  )
}

function TechResume({
  data,
  order,
  theme,
  t,
  sidebarSide = 'left',
}: {
  data: BuilderResumeData
  order: ResumeSectionId[]
  theme: PdfTemplateTheme
  t: T
  sidebarSide?: 'left' | 'right'
}) {
  const p = data.personalInfo
  const sideIds = order.filter((id) => id === 'skills' || id === 'education')
  const mainIds = order.filter((id) => id !== 'skills' && id !== 'education')

  const sidebar = React.createElement(
    View,
    { 
      style: [
        t.techSidebar,
        {
          position: 'absolute',
          top: t.techPage.paddingTop,
          left: sidebarSide === 'left' ? 0 : '68%',
        }
      ]
    },
    React.createElement(Text, { style: t.techName }, p.fullName || data.name || 'Resume'),
    p.jobTitle ? React.createElement(Text, { style: t.techRole }, p.jobTitle) : null,
    React.createElement(Text, { style: t.techHeading }, 'Contact'),
    ...[p.email, p.phone, p.location, p.linkedin || p.portfolio || p.github]
      .filter(Boolean)
      .map((line, i) => React.createElement(Text, { key: `sc-${i}`, style: t.techText }, String(line))),
    ...sideIds.map((id) => renderOrderedSection(data, id, theme, t, { techLight: true })).filter(Boolean),
  )

  const main = React.createElement(
    View,
    { 
      style: [
        t.techMain,
        {
          marginLeft: sidebarSide === 'left' ? '32%' : 0,
          marginRight: sidebarSide === 'right' ? '32%' : 0,
        }
      ]
    },
    ...mainIds
      .map((id) =>
        renderOrderedSection(data, id, theme, t, {
          heading: id === 'summary' ? 'Profile' : undefined,
        }),
      )
      .filter(Boolean),
  )

  return React.createElement(
    Page,
    { size: 'A4', style: t.techPage, wrap: true },
    React.createElement(View, {
      fixed: true,
      style: {
        position: 'absolute',
        top: -(t.techPage.paddingTop as number),
        bottom: -(t.techPage.paddingBottom as number),
        left: sidebarSide === 'left' ? 0 : '68%',
        width: '32%',
        backgroundColor: t.techSidebar.backgroundColor,
        zIndex: -1,
      },
    }),
    React.createElement(View, {
      fixed: true,
      style: {
        position: 'absolute',
        top: -(t.techPage.paddingTop as number),
        bottom: -(t.techPage.paddingBottom as number),
        left: sidebarSide === 'left' ? '32%' : 0,
        width: '68%',
        backgroundColor: t.techMain.backgroundColor,
        zIndex: -1,
      },
    }),
    sidebar,
    main
  )
}

export function createResumePdfDocument(raw: BuilderResumeData) {
  const data = withLayoutState(raw)
  const templateSlug = resolveTemplateSlug(data)
  const profile: PdfTemplateProfile = getPdfTemplateProfile(templateSlug)
  const order = normalizeSectionsOrder(data.sectionsOrder, data.customSections || [])
  const t = themed(profile.theme, data.spacingPreset)
  const theme = profile.theme

  let page: React.ReactElement
  if (profile.variety === 'tech') {
    page = React.createElement(TechResume, {
      data,
      order,
      theme,
      t,
      sidebarSide: profile.sidebarSide || 'left',
    })
  } else if (profile.variety === 'modern') {
    page = React.createElement(ModernResume, { data, order, theme, t })
  } else {
    page = React.createElement(MinimalResume, { data, order, theme, t })
  }

  return React.createElement(
    Document,
    {
      title: `${data.personalInfo.fullName || data.name || 'Resume'}`,
      author: data.personalInfo.fullName || 'Candidate',
    },
    page,
  )
}
