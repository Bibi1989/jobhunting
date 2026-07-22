/**
 * Server react-pdf resume document.
 * Uses per-slug profiles from shared/pdf/templates (aligned with ResumeThemeRenderer)
 * plus sectionsOrder for draw order.
 */
import React from 'react'
import { Document, Page, View, Text, StyleSheet, Link, Image } from '@react-pdf/renderer'
import type { BuilderResumeData } from '~/shared/types/builder'
import {
  normalizeSectionsOrder,
  parseCustomSectionId,
  resolveTemplateSlug,
  type ResumeSectionId,
  withLayoutState,
} from '~/shared/pdf/schema'
import {
  getPdfTemplateProfile,
  type PdfHeaderChrome,
  type PdfSkillsStyle,
  type PdfTemplateProfile,
  type PdfTemplateTheme,
} from '~/shared/pdf/templates'
import { styles as tokenStyles } from '~/shared/pdf/tokens'
import { cleanDescriptionHtml, formatDateRange, htmlToBlocks, htmlToInlineRuns, stripHtmlToPlain } from '~/shared/pdf/text'
import { buildContactEntries, type ContactEntry } from '~/shared/pdf/contact'
import {
  applyDesignToTheme,
  detailsSeparatorChar,
  fontFacesForFamily,
  photoBorderRadiusPx,
  resolveDesign,
  resolveHeaderBandColor,
  resolvePhotoSize,
  type PdfFontFaces,
} from '~/shared/pdf/designOverrides'
import { ensureFontRegistered } from '~/shared/pdf/googleFonts'
import type { BuilderDesignSettings } from '~/shared/types/builder'

function sx(...parts: Array<object | false | null | undefined>): any {
  return parts.filter(Boolean)
}

const S = StyleSheet.create(tokenStyles as any)

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function resolveLayoutMetrics(data: Pick<
  BuilderResumeData,
  'spacingPreset' | 'fontSize' | 'lineHeight' | 'marginHorizontal' | 'marginVertical' | 'design'
>) {
  let baseFontSize = 9.5
  let baseLineHeight = 1.35
  let atomMargin = 10
  let sectionMargin = 14
  let pagePadX = 32
  let pagePadY = 32

  if (data.spacingPreset === 'compact') {
    baseFontSize = 8.5
    baseLineHeight = 1.25
    atomMargin = 6
    sectionMargin = 10
    pagePadX = 24
    pagePadY = 24
  } else if (data.spacingPreset === 'ats-stable') {
    baseFontSize = 10
    baseLineHeight = 1.4
    atomMargin = 12
    sectionMargin = 16
    pagePadX = 36
    pagePadY = 36
  }

  const design = resolveDesign(data)
  const bodyFromDesign = design.bodyFontSize
  const fontSize = clamp(
    Number(bodyFromDesign ?? data.fontSize ?? baseFontSize) || baseFontSize,
    8,
    12,
  )
  const lineHeight = clamp(Number(data.lineHeight ?? baseLineHeight) || baseLineHeight, 1.15, 1.7)
  const marginHorizontal = clamp(Number(data.marginHorizontal ?? pagePadX) || pagePadX, 16, 56)
  const marginVertical = clamp(Number(data.marginVertical ?? pagePadY) || pagePadY, 16, 56)

  return {
    baseFontSize: fontSize,
    baseLineHeight: lineHeight,
    atomMargin,
    sectionMargin,
    pagePadX: marginHorizontal,
    pagePadY: marginVertical,
    design,
  }
}

function themed(
  theme: PdfTemplateTheme,
  data: Pick<
    BuilderResumeData,
    'spacingPreset' | 'fontSize' | 'lineHeight' | 'marginHorizontal' | 'marginVertical' | 'design' | 'themeColor'
  >,
) {
  const {
    baseFontSize,
    baseLineHeight,
    atomMargin,
    sectionMargin,
    pagePadX,
    pagePadY,
    design,
  } = resolveLayoutMetrics(data)

  const faces = fontFacesForFamily(design.fontFamily || 'Inter')
  const accent = (design.accentColor || '').trim()
  const headingsLineAccent = Boolean(accent && (design.accentTargets?.headingsLine ?? true))
  const lineBorder =
    (design.lineBorderColor || '').trim() ||
    (headingsLineAccent ? accent : '#000000')
  const nameSize = clamp(Number(design.nameFontSize ?? 22) || 22, 14, 32)
  const jobTitleSize = clamp(Number(design.jobTitleFontSize ?? 11) || 11, 8, 18)
  const sectionSize = clamp(Number(design.sectionTitleFontSize ?? 11) || 11, 8, 16)

  const entrySubtitleColor =
    accent && (design.accentTargets?.entrySubtitle ?? false) ? accent : theme.brand
  const datesColor =
    accent && (design.accentTargets?.dates ?? false) ? accent : theme.muted
  const bulletColor =
    accent && (design.accentTargets?.dotsBarsBubbles ?? false) ? accent : theme.ink

  const weightBold = faces.useWeight ? 700 : undefined
  const weightRegular = faces.useWeight ? 400 : undefined

  const dynamicStyles = StyleSheet.create({
    page: {
      ...tokenStyles.page,
      paddingTop: pagePadY,
      paddingBottom: pagePadY,
      paddingLeft: pagePadX,
      paddingRight: pagePadX,
      color: theme.ink,
      backgroundColor: theme.paper,
      fontFamily: faces.regular,
      fontWeight: weightRegular,
    },
    h1: {
      ...tokenStyles.h1,
      color: theme.ink,
      fontFamily: faces.bold,
      fontWeight: weightBold,
      fontSize: nameSize,
    },
    h2: {
      ...tokenStyles.h2,
      color: theme.brand,
      fontFamily: faces.bold,
      fontWeight: weightBold,
      fontSize: sectionSize,
      borderBottomColor: lineBorder,
      marginTop: sectionMargin,
      marginBottom: atomMargin / 2,
      textAlign: (design.sectionTitleAlign || 'left') as 'left' | 'center' | 'right',
      alignSelf:
        design.sectionTitleAlign === 'center'
          ? 'center'
          : design.sectionTitleAlign === 'right'
            ? 'flex-end'
            : 'stretch',
      width: design.sectionTitleAlign && design.sectionTitleAlign !== 'left' ? '100%' : undefined,
    },
    subtitle: {
      ...tokenStyles.subtitle,
      color: theme.brand,
      fontFamily: faces.regular,
      fontWeight: weightRegular,
      fontSize: jobTitleSize,
    },
    body: {
      ...tokenStyles.body,
      color: theme.ink,
      fontSize: baseFontSize,
      lineHeight: baseLineHeight,
      fontFamily: faces.regular,
      fontWeight: weightRegular,
    },
    muted: { ...tokenStyles.muted, color: theme.muted, fontFamily: faces.regular, fontWeight: weightRegular },
    itemTitle: {
      ...tokenStyles.itemTitle,
      color: theme.ink,
      fontSize: baseFontSize + 1,
      fontFamily: faces.bold,
      fontWeight: weightBold,
    },
    itemMeta: { ...tokenStyles.itemMeta, color: entrySubtitleColor, fontFamily: faces.regular, fontWeight: weightRegular },
    contactLine: { ...tokenStyles.contactLine, color: theme.muted, fontFamily: faces.regular, fontWeight: weightRegular },
    dateText: { ...tokenStyles.muted, color: datesColor, fontFamily: faces.regular, fontSize: baseFontSize, fontWeight: weightRegular },
    techPage: {
      ...tokenStyles.techPage,
      color: theme.ink,
      backgroundColor: theme.paper,
      paddingTop: pagePadY,
      paddingBottom: pagePadY,
      fontFamily: faces.regular,
      fontWeight: weightRegular,
    },
    techSidebar: { ...tokenStyles.techSidebar, backgroundColor: theme.sidebar, color: theme.sidebarText },
    techMain: { ...tokenStyles.techMain, backgroundColor: theme.paper },
    techName: { ...tokenStyles.techName, color: theme.sidebarText, fontFamily: faces.bold, fontWeight: weightBold, fontSize: nameSize },
    techRole: { ...tokenStyles.techRole, color: theme.sidebarMuted, fontFamily: faces.regular, fontWeight: weightRegular, fontSize: jobTitleSize },
    techHeading: {
      ...tokenStyles.techHeading,
      color: theme.sidebarMuted,
      borderBottomColor: `${theme.sidebarMuted}55`,
      fontFamily: faces.bold,
      fontWeight: weightBold,
      fontSize: sectionSize,
      textAlign: (design.sectionTitleAlign || 'left') as 'left' | 'center' | 'right',
    },
    techText: { ...tokenStyles.techText, color: theme.sidebarText, fontFamily: faces.regular, fontWeight: weightRegular },
    modernRight: { ...tokenStyles.modernRight, borderLeftColor: lineBorder === '#000000' ? '#cbd5e1' : lineBorder },
    atom: { ...tokenStyles.atom, marginBottom: atomMargin },
    section: { ...tokenStyles.section },
    rowBetween: { ...tokenStyles.rowBetween },
    bulletRow: { ...tokenStyles.bulletRow },
    bulletGlyph: { ...tokenStyles.bulletGlyph, fontSize: baseFontSize, color: bulletColor },
    bulletText: { ...tokenStyles.bulletText, fontSize: baseFontSize, lineHeight: baseLineHeight, fontFamily: faces.regular, fontWeight: weightRegular },
    chipRow: { ...tokenStyles.chipRow },
    chip: { ...tokenStyles.chip },
    techChip: { ...tokenStyles.techChip },
    techChipText: { ...tokenStyles.techChipText },
    modernLeft: { ...tokenStyles.modernLeft },
  } as any)

  return dynamicStyles as any
}

type T = any

let activeFaces: PdfFontFaces & { useWeight?: boolean } = fontFacesForFamily('Inter')
let activeDesign: BuilderDesignSettings = resolveDesign({})

function fontForRun(bold?: boolean, italic?: boolean): Record<string, string | number> {
  if (activeFaces.useWeight) {
    return {
      fontFamily: activeFaces.regular,
      fontWeight: bold ? 700 : 400,
      fontStyle: italic ? 'italic' : 'normal',
    }
  }
  if (bold && italic) return { fontFamily: activeFaces.boldItalic }
  if (bold) return { fontFamily: activeFaces.bold }
  if (italic) return { fontFamily: activeFaces.italic }
  return { fontFamily: activeFaces.regular }
}

function fontForRunFaces(_faces: PdfFontFaces, bold?: boolean, italic?: boolean): string {
  // kept for any legacy callers
  const run = fontForRun(bold, italic)
  return String(run.fontFamily)
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
            ...fontForRun(run.bold, run.italic),
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
            React.createElement(Text, { style: t.dateText || t.muted }, formatDateRange(job.startDate, job.endDate, job.isCurrent)),
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
            range ? React.createElement(Text, { style: t.dateText || t.muted }, range) : null,
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

function SkillsBlock({
  data,
  theme,
  t,
  style = 'chips',
  tech = false,
}: {
  data: BuilderResumeData
  theme: PdfTemplateTheme
  t: T
  style?: PdfSkillsStyle
  tech?: boolean
}) {
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

  if (style === 'inline') {
    return React.createElement(
      Text,
      { style: sx(t.body, { lineHeight: 1.45 }) },
      data.skills.map((s) => s.name).filter(Boolean).join('  ·  '),
    )
  }

  if (style === 'list') {
    return React.createElement(
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
  }

  // chips — solid black border (avoid 8-digit hex alphas that render as red in react-pdf)
  return React.createElement(
    View,
    { style: t.chipRow },
    ...data.skills.map((skill) =>
      React.createElement(
        Text,
        {
          key: skill.id,
          wrap: false,
          style: {
            ...t.chip,
            color: theme.ink,
            borderColor: '#0f172a',
            borderWidth: 1,
            backgroundColor: '#f8fafc',
          },
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
  options: {
    heading?: string
    techLight?: boolean
    skillsStyle?: PdfSkillsStyle
  } = {},
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
        React.createElement(SkillsBlock, {
          data,
          theme,
          t,
          tech: options.techLight,
          style: options.skillsStyle || 'chips',
        }),
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

function ContactItem({
  entry,
  style,
  linkColor,
}: {
  entry: ContactEntry
  style: any
  linkColor?: string
}) {
  const linkStyle = entry.href
    ? sx(style, {
        color: linkColor || style?.color,
        textDecoration: 'none',
      })
    : style

  if (entry.href) {
    return React.createElement(Link, { src: entry.href, style: linkStyle }, entry.display)
  }
  return React.createElement(Text, { style }, entry.display)
}

function flexAlign(align: 'left' | 'center' | 'right') {
  if (align === 'center') return 'center'
  if (align === 'right') return 'flex-end'
  return 'flex-start'
}

function justifyAlign(align: 'left' | 'center' | 'right') {
  if (align === 'center') return 'center'
  if (align === 'right') return 'flex-end'
  return 'flex-start'
}

function ContactRow({
  entries,
  t,
  align = 'left',
  centered = false,
  separator = '·',
  linkColor,
  textColor,
  layout = 'inline',
  design,
}: {
  entries: ContactEntry[]
  t: T
  align?: 'left' | 'center' | 'right'
  /** @deprecated use align */
  centered?: boolean
  separator?: string
  linkColor?: string
  textColor?: string
  layout?: 'stacked' | 'inline' | 'columns'
  design?: BuilderDesignSettings
}) {
  if (!entries.length) return null

  const textAlign: 'left' | 'center' | 'right' = centered ? 'center' : align
  const lineStyle = sx(t.contactLine, {
    textAlign,
    marginBottom: layout === 'stacked' ? 2 : 0,
    ...(textColor ? { color: textColor } : {}),
  })
  const sepStyle = sx(lineStyle, {
    marginHorizontal: 5,
    color: textColor || t.muted?.color || t.contactLine?.color,
  })

  const accentIcons = design?.accentTargets?.headerIcons || design?.accentTargets?.linkIcons
  const accent = (design?.accentColor || '').trim()
  const iconTint = accentIcons && accent ? accent : linkColor

  if (layout === 'stacked') {
    return React.createElement(
      View,
      {
        style: {
          flexDirection: 'column',
          alignItems: flexAlign(textAlign),
          marginTop: 2,
          marginBottom: 2,
          width: '100%',
        },
      },
      ...entries.map((entry, i) =>
        React.createElement(ContactItem, {
          key: `c-${entry.kind}-${i}`,
          entry,
          style: lineStyle,
          linkColor: iconTint,
        }),
      ),
    )
  }

  if (layout === 'columns') {
    const mid = Math.ceil(entries.length / 2)
    const left = entries.slice(0, mid)
    const right = entries.slice(mid)
    return React.createElement(
      View,
      {
        style: {
          flexDirection: 'row',
          justifyContent: justifyAlign(textAlign),
          gap: 16,
          marginTop: 2,
          marginBottom: 2,
          width: '100%',
        },
      },
      React.createElement(
        View,
        { style: { flex: 1, flexDirection: 'column', alignItems: flexAlign(textAlign) } },
        ...left.map((entry, i) =>
          React.createElement(ContactItem, {
            key: `cl-${i}`,
            entry,
            style: lineStyle,
            linkColor: iconTint,
          }),
        ),
      ),
      React.createElement(
        View,
        { style: { flex: 1, flexDirection: 'column', alignItems: flexAlign(textAlign) } },
        ...right.map((entry, i) =>
          React.createElement(ContactItem, {
            key: `cr-${i}`,
            entry,
            style: lineStyle,
            linkColor: iconTint,
          }),
        ),
      ),
    )
  }

  return React.createElement(
    View,
    {
      style: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: justifyAlign(textAlign),
        alignItems: 'center',
        marginTop: 2,
        marginBottom: 2,
        width: '100%',
      },
    },
    ...entries.flatMap((entry, i) => {
      const els: React.ReactElement[] = [
        React.createElement(ContactItem, {
          key: `c-${entry.kind}-${i}`,
          entry,
          style: lineStyle,
          linkColor: iconTint,
        }),
      ]
      if (i < entries.length - 1) {
        els.push(
          React.createElement(Text, { key: `s-${i}`, style: sepStyle }, separator),
        )
      }
      return els
    }),
  )
}

function ProfilePhoto({
  dataUrl,
  design,
  size,
}: {
  dataUrl: string
  design: BuilderDesignSettings
  size?: number
}) {
  const dim = size ?? resolvePhotoSize(design)
  const radius = photoBorderRadiusPx(dim, design)
  return React.createElement(Image, {
    src: dataUrl,
    style: {
      width: dim,
      height: dim,
      borderRadius: radius,
      objectFit: 'cover',
    },
  })
}

function HeaderBlock({
  data,
  t,
  theme,
  chrome = 'plain',
  displayName = false,
}: {
  data: BuilderResumeData
  t: T
  theme: PdfTemplateTheme
  chrome?: PdfHeaderChrome
  displayName?: boolean
}) {
  const p = data.personalInfo
  const design = activeDesign
  const entries = buildContactEntries(p)
  const linkColor = t.subtitle?.color || t.h2?.color
  const name = p.fullName || data.name || 'Resume'
  const align: 'left' | 'center' | 'right' =
    design.headerAlign ||
    (chrome === 'centered' || chrome === 'rules' || chrome === 'banner' ? 'center' : 'left')
  const isCentered = align === 'center'
  const headerBg = resolveHeaderBandColor(design, '')
  const inBand = chrome === 'band' || Boolean(headerBg)
  const showPhoto = Boolean(design.showPhoto && p.photoDataUrl)
  const photoSize = resolvePhotoSize(design)
  const sep = detailsSeparatorChar(design)
  const detailsLayout = design.detailsLayout || 'inline'

  const headerText = (design.headerTextColor || '').trim()
  const accent = (design.accentColor || '').trim()
  const onDarkBand = inBand && !headerText
  const nameColor = onDarkBand
    ? '#ffffff'
    : headerText ||
      (accent && (design.accentTargets?.name ?? true) ? accent : theme.ink)
  const titleColor = onDarkBand
    ? '#e2e8f0'
    : headerText ||
      (accent && (design.accentTargets?.jobTitle ?? true) ? accent : theme.brand)
  const contactColor = onDarkBand ? '#e2e8f0' : headerText || undefined

  const textBlock = React.createElement(
    View,
    {
      wrap: false,
      style: {
        // flex:1 in a centered column breaks band height in react-pdf
        flex: showPhoto && !isCentered ? 1 : undefined,
        width: '100%',
        alignItems: flexAlign(align),
        gap: 4,
      },
    },
    React.createElement(
      Text,
      {
        style: sx(t.h1, {
          textAlign: align,
          fontSize: displayName ? Math.max(t.h1.fontSize || 22, 26) : t.h1.fontSize,
          letterSpacing: displayName ? -0.4 : t.h1.letterSpacing,
          color: nameColor,
          width: '100%',
          marginBottom: 2,
        }),
      },
      name,
    ),
    p.jobTitle
      ? React.createElement(
          Text,
          {
            style: sx(t.subtitle, {
              textAlign: align,
              marginBottom: 4,
              color: titleColor,
              width: '100%',
            }),
          },
          p.jobTitle,
        )
      : null,
    React.createElement(ContactRow, {
      entries,
      t,
      align,
      separator: sep,
      linkColor: contactColor || (inBand ? '#e2e8f0' : linkColor),
      textColor: contactColor || (inBand ? '#e2e8f0' : undefined),
      layout: detailsLayout,
      design,
    }),
  )

  const photoEl = showPhoto
    ? React.createElement(ProfilePhoto, {
        dataUrl: p.photoDataUrl!,
        design,
        size: photoSize,
      })
    : null

  let nameBlock: React.ReactElement
  if (showPhoto && isCentered) {
    nameBlock = React.createElement(
      View,
      {
        wrap: false,
        style: {
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          gap: 12,
        },
      },
      photoEl,
      textBlock,
    )
  } else if (showPhoto) {
    nameBlock = React.createElement(
      View,
      {
        wrap: false,
        style: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: justifyAlign(align),
          gap: 12,
          width: '100%',
        },
      },
      align === 'right' ? textBlock : null,
      photoEl,
      align !== 'right' ? textBlock : null,
    )
  } else {
    nameBlock = textBlock
  }

  if (inBand) {
    const padX = (t.page.paddingLeft as number) || 36
    const padY = (t.page.paddingTop as number) || 28
    const bg = headerBg || theme.ink
    // A4 width in pt — avoid width:'100%' + negative margins (leaves a right gap in react-pdf)
    const pageWidth = 595.28
    return React.createElement(
      View,
      {
        wrap: false,
        style: {
          width: pageWidth,
          marginLeft: -padX,
          marginTop: -padY,
          marginBottom: 16,
          paddingLeft: padX,
          paddingRight: padX,
          paddingTop: Math.max(padY, 20),
          paddingBottom: showPhoto && isCentered ? 28 : 22,
          backgroundColor: bg,
          flexDirection: 'column',
          alignItems: isCentered ? 'center' : 'stretch',
          alignSelf: 'flex-start',
        },
      },
      nameBlock,
    )
  }

  if (chrome === 'rules') {
    const line = (design.lineBorderColor || '').trim() || '#0f172a'
    return React.createElement(
      View,
      { wrap: false, style: { marginBottom: 12 } },
      React.createElement(View, {
        style: { height: 2, backgroundColor: line, marginBottom: 10 },
      }),
      nameBlock,
      React.createElement(View, {
        style: { height: 2, backgroundColor: line, marginTop: 8 },
      }),
    )
  }

  if (chrome === 'banner') {
    const padX = (t.page.paddingLeft as number) || 36
    const padY = (t.page.paddingTop as number) || 28
    return React.createElement(
      View,
      { wrap: false, style: { marginBottom: 12 } },
      React.createElement(View, {
        style: {
          height: 18 + padY,
          backgroundColor: headerBg || theme.ink,
          marginTop: -padY,
          marginHorizontal: -padX,
          marginBottom: 12,
        },
      }),
      nameBlock,
    )
  }

  if (chrome === 'accent-bar') {
    const padX = (t.page.paddingLeft as number) || 36
    const padY = (t.page.paddingTop as number) || 28
    return React.createElement(
      View,
      { wrap: false, style: { marginBottom: 12 } },
      React.createElement(View, {
        style: {
          height: 4 + padY,
          backgroundColor: headerBg || theme.brand,
          marginTop: -padY,
          marginHorizontal: -padX,
          marginBottom: 12,
        },
      }),
      nameBlock,
    )
  }

  return React.createElement(
    View,
    { wrap: false, style: { marginBottom: 12, width: '100%' } },
    nameBlock,
  )
}

function MinimalResume({
  data,
  order,
  theme,
  t,
  headerChrome = 'plain',
  skillsStyle = 'chips',
  displayName = false,
}: {
  data: BuilderResumeData
  order: ResumeSectionId[]
  theme: PdfTemplateTheme
  t: T
  headerChrome?: PdfHeaderChrome
  skillsStyle?: PdfSkillsStyle
  displayName?: boolean
}) {
  const pageStyle = t.page

  return React.createElement(
    Page,
    { size: 'A4', style: pageStyle, wrap: true },
    React.createElement(HeaderBlock, { data, t, theme, chrome: headerChrome, displayName }),
    ...order
      .map((id) =>
        renderOrderedSection(data, id, theme, t, {
          skillsStyle: id === 'skills' ? skillsStyle : undefined,
        }),
      )
      .filter(Boolean),
  )
}

function ModernResume({
  data,
  order,
  theme,
  t,
  headerChrome = 'centered',
  skillsStyle = 'list',
  displayName = false,
}: {
  data: BuilderResumeData
  order: ResumeSectionId[]
  theme: PdfTemplateTheme
  t: T
  headerChrome?: PdfHeaderChrome
  skillsStyle?: PdfSkillsStyle
  displayName?: boolean
}) {
  const leftIds = order.filter((id) => id === 'education' || id === 'skills')
  const rightIds = order.filter((id) => id !== 'education' && id !== 'skills')
  const pageStyle = t.page

  return React.createElement(
    Page,
    { size: 'A4', style: pageStyle, wrap: true },
    React.createElement(HeaderBlock, { data, t, theme, chrome: headerChrome, displayName }),
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
            },
          ],
        },
        ...leftIds
          .map((id) =>
            renderOrderedSection(data, id, theme, t, {
              skillsStyle: id === 'skills' ? skillsStyle : undefined,
            }),
          )
          .filter(Boolean),
      ),
      React.createElement(
        View,
        {
          style: [
            t.modernRight,
            {
              marginLeft: '34%',
              minHeight: 100,
            },
          ],
        },
        ...rightIds
          .map((id) =>
            renderOrderedSection(data, id, theme, t, {
              heading: id === 'summary' ? 'Executive Summary' : undefined,
            }),
          )
          .filter(Boolean),
      ),
    ),
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
  const contactEntries = buildContactEntries(p)

  const sidebarContact = contactEntries.map((entry, i) => {
    const valueNode = entry.href
      ? React.createElement(
          Link,
          {
            src: entry.href,
            style: sx(t.techText, { textDecoration: 'none', marginBottom: 8 }),
          },
          entry.display,
        )
      : React.createElement(Text, { style: sx(t.techText, { marginBottom: 8 }) }, entry.display)

    return React.createElement(
      View,
      { key: `sc-${entry.kind}-${i}`, style: { marginBottom: 2 } },
      React.createElement(
        Text,
        {
          style: sx(t.techHeading, {
            marginTop: i === 0 ? 0 : 6,
            marginBottom: 2,
            borderBottomWidth: 0,
            paddingBottom: 0,
            fontSize: 7,
            letterSpacing: 1.1,
          }),
        },
        entry.label,
      ),
      valueNode,
    )
  })

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
    activeDesign.showPhoto && p.photoDataUrl
      ? React.createElement(
          View,
          { style: { marginBottom: 12, alignItems: 'flex-start' } },
          React.createElement(ProfilePhoto, {
            dataUrl: p.photoDataUrl,
            design: activeDesign,
            size: resolvePhotoSize(activeDesign),
          }),
        )
      : null,
    React.createElement(Text, { style: t.techName }, p.fullName || data.name || 'Resume'),
    p.jobTitle ? React.createElement(Text, { style: t.techRole }, p.jobTitle) : null,
    React.createElement(Text, { style: t.techHeading }, 'Contact'),
    ...sidebarContact,
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
  const design = resolveDesign(data)
  activeDesign = design
  ensureFontRegistered(design.fontFamily || 'Inter')
  activeFaces = fontFacesForFamily(design.fontFamily || 'Inter')
  const theme = applyDesignToTheme(profile.theme, design)
  const t = themed(theme, data)

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
    page = React.createElement(ModernResume, {
      data,
      order,
      theme,
      t,
      headerChrome: profile.headerChrome || 'centered',
      skillsStyle: profile.skillsStyle || 'list',
      displayName: profile.displayName,
    })
  } else {
    page = React.createElement(MinimalResume, {
      data,
      order,
      theme,
      t,
      headerChrome: profile.headerChrome || 'plain',
      skillsStyle: profile.skillsStyle || 'chips',
      displayName: profile.displayName,
    })
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
