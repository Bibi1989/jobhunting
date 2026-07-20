import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { BuilderCoverLetter, BuilderResumeData } from '~/shared/types/builder'
import { htmlToBlocks, stripHtmlToPlain } from './types'

const TEAL = '#006a61'
const NAVY = '#091426'
const CREAM = '#fafaf8'
const SLATE = '#0f172a'
const MUTED = '#64748b'

type TextStyle = Record<string, string | number>

function formatLetterDate() {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function resolveTemplateId(data: BuilderResumeData) {
  const id = String(data.templateId || data.templateSlug || 'cl-standard')
  if (id.startsWith('cl-')) return id
  return 'cl-standard'
}

function buildBodyChildren(content: string, textStyle: TextStyle) {
  const blocks = htmlToBlocks(content)
  const plainFallback = stripHtmlToPlain(content)

  if (blocks.length === 0) {
    return [
      React.createElement(
        Text,
        { key: 'plain', style: [textStyle, { lineHeight: 1.55 }] },
        plainFallback || ' ',
      ),
    ]
  }

  return blocks.map((block, index) => {
    if (block.type === 'bullet') {
      return React.createElement(
        View,
        {
          key: `lb-${index}`,
          style: { flexDirection: 'row', marginBottom: 6, paddingLeft: 2 },
          wrap: false,
        },
        React.createElement(Text, { style: [textStyle, { width: 12 }] }, '•'),
        React.createElement(Text, { style: [textStyle, { flex: 1 }] }, block.text),
      )
    }
    return React.createElement(
      Text,
      { key: `lp-${index}`, style: [textStyle, { marginBottom: 10 }] },
      block.text,
    )
  })
}

function renderStandard(
  p: BuilderResumeData['personalInfo'],
  letter: BuilderCoverLetter | undefined,
  letterDate: string,
  content: string,
) {
  const styles = StyleSheet.create({
    page: {
      paddingTop: 40,
      paddingBottom: 40,
      paddingHorizontal: 44,
      fontFamily: 'Times-Roman',
      fontSize: 11,
      color: SLATE,
      backgroundColor: '#ffffff',
    },
    header: {
      alignItems: 'center',
      marginBottom: 22,
      paddingBottom: 14,
      borderBottomWidth: 2,
      borderBottomColor: SLATE,
    },
    name: {
      fontSize: 22,
      fontFamily: 'Times-Bold',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      textAlign: 'center',
      marginBottom: 4,
    },
    title: {
      fontSize: 10,
      fontFamily: 'Helvetica',
      letterSpacing: 1.6,
      textTransform: 'uppercase',
      color: MUTED,
      textAlign: 'center',
      marginBottom: 6,
    },
    contact: {
      fontSize: 8,
      fontFamily: 'Helvetica',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: MUTED,
      textAlign: 'center',
    },
    recipient: { marginBottom: 18, fontFamily: 'Helvetica', fontSize: 11 },
  })

  const contact = [p.location, p.email, p.phone].filter(Boolean).join('  |  ')
  const body = buildBodyChildren(content, {
    fontSize: 11,
    lineHeight: 1.5,
    fontFamily: 'Times-Roman',
    color: SLATE,
  })

  return React.createElement(
    Page,
    { size: 'A4', style: styles.page, wrap: true },
    React.createElement(
      View,
      { style: styles.header, wrap: false },
      React.createElement(Text, { style: styles.name }, p.fullName || 'Your Name'),
      p.jobTitle ? React.createElement(Text, { style: styles.title }, p.jobTitle) : null,
      contact ? React.createElement(Text, { style: styles.contact }, contact) : null,
    ),
    letter?.companyName || letter?.hiringManager
      ? React.createElement(
          View,
          { style: styles.recipient, wrap: false },
          React.createElement(Text, null, letterDate),
          React.createElement(
            Text,
            { style: { marginTop: 10, fontFamily: 'Helvetica-Bold' } },
            letter?.hiringManager || 'Hiring Manager',
          ),
          letter?.companyName ? React.createElement(Text, null, letter.companyName) : null,
        )
      : null,
    React.createElement(View, null, ...body),
  )
}

function renderCreative(
  p: BuilderResumeData['personalInfo'],
  letter: BuilderCoverLetter | undefined,
  letterDate: string,
  content: string,
) {
  const styles = StyleSheet.create({
    page: {
      flexDirection: 'row',
      fontFamily: 'Helvetica',
      fontSize: 11,
      color: SLATE,
      backgroundColor: '#ffffff',
    },
    accent: { width: 12, backgroundColor: TEAL },
    main: { flex: 1, paddingTop: 40, paddingBottom: 40, paddingHorizontal: 36 },
    eyebrow: {
      fontSize: 8,
      letterSpacing: 2.5,
      textTransform: 'uppercase',
      color: TEAL,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 8,
    },
    name: {
      fontSize: 28,
      fontFamily: 'Helvetica-Bold',
      color: SLATE,
      lineHeight: 1.05,
      marginBottom: 6,
    },
    title: { fontSize: 11, color: MUTED, fontFamily: 'Helvetica-Bold', marginBottom: 8 },
    contact: { fontSize: 9, color: MUTED, marginBottom: 22 },
    date: {
      fontSize: 9,
      color: '#94a3b8',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 6,
    },
    manager: { fontSize: 11, color: TEAL, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
    company: { fontSize: 11, color: '#334155', marginBottom: 16 },
  })

  const contact = [p.email, p.phone, p.location].filter(Boolean).join('   ')
  const body = buildBodyChildren(content, {
    fontSize: 10.5,
    lineHeight: 1.5,
    color: '#334155',
    fontFamily: 'Helvetica',
  })

  return React.createElement(
    Page,
    { size: 'A4', style: styles.page, wrap: true },
    React.createElement(View, { style: styles.accent }),
    React.createElement(
      View,
      { style: styles.main },
      React.createElement(
        View,
        { wrap: false, style: { marginBottom: 8 } },
        React.createElement(Text, { style: styles.eyebrow }, 'Cover Letter'),
        React.createElement(Text, { style: styles.name }, p.fullName || 'Your Name'),
        p.jobTitle ? React.createElement(Text, { style: styles.title }, p.jobTitle) : null,
        contact ? React.createElement(Text, { style: styles.contact }, contact) : null,
      ),
      letter?.companyName || letter?.hiringManager
        ? React.createElement(
            View,
            { wrap: false, style: { marginBottom: 8 } },
            React.createElement(Text, { style: styles.date }, letterDate),
            React.createElement(
              Text,
              { style: styles.manager },
              letter?.hiringManager || 'Hiring Manager',
            ),
            letter?.companyName
              ? React.createElement(Text, { style: styles.company }, letter.companyName)
              : null,
          )
        : null,
      React.createElement(View, null, ...body),
    ),
  )
}

function renderExecutive(
  p: BuilderResumeData['personalInfo'],
  letter: BuilderCoverLetter | undefined,
  letterDate: string,
  content: string,
) {
  const styles = StyleSheet.create({
    page: {
      paddingTop: 36,
      paddingBottom: 40,
      paddingHorizontal: 40,
      fontFamily: 'Times-Roman',
      fontSize: 11,
      color: SLATE,
      backgroundColor: CREAM,
    },
    topRule: { height: 6, backgroundColor: NAVY, marginBottom: 22 },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 18,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: '#cbd5e1',
    },
    name: { fontSize: 18, fontFamily: 'Times-Bold', color: NAVY, marginBottom: 4 },
    title: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      color: TEAL,
    },
    contactBlock: { alignItems: 'flex-end' },
    contact: {
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: MUTED,
      marginBottom: 2,
      textAlign: 'right',
    },
    metaRow: { flexDirection: 'row', marginBottom: 5 },
    metaLabel: {
      width: 52,
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: MUTED,
    },
    metaValue: { flex: 1, fontSize: 11, fontFamily: 'Times-Roman', color: SLATE },
  })

  const toLine = [letter?.hiringManager || 'Hiring Manager', letter?.companyName]
    .filter(Boolean)
    .join(', ')

  const body = buildBodyChildren(content, {
    fontSize: 11,
    lineHeight: 1.5,
    fontFamily: 'Times-Roman',
    color: SLATE,
  })

  const meta = (label: string, value: string) =>
    React.createElement(
      View,
      { key: label, style: styles.metaRow, wrap: false },
      React.createElement(Text, { style: styles.metaLabel }, label),
      React.createElement(Text, { style: styles.metaValue }, value),
    )

  return React.createElement(
    Page,
    { size: 'A4', style: styles.page, wrap: true },
    React.createElement(View, { style: styles.topRule, wrap: false }),
    React.createElement(
      View,
      { style: styles.headerRow, wrap: false },
      React.createElement(
        View,
        { style: { flex: 1 } },
        React.createElement(Text, { style: styles.name }, p.fullName || 'Your Name'),
        p.jobTitle ? React.createElement(Text, { style: styles.title }, p.jobTitle) : null,
      ),
      React.createElement(
        View,
        { style: styles.contactBlock },
        p.email ? React.createElement(Text, { style: styles.contact }, p.email) : null,
        p.phone ? React.createElement(Text, { style: styles.contact }, p.phone) : null,
        p.location ? React.createElement(Text, { style: styles.contact }, p.location) : null,
      ),
    ),
    React.createElement(
      View,
      { wrap: false, style: { marginBottom: 12 } },
      meta('Date', letterDate),
      meta('To', toLine),
      meta('Re', `Application — ${p.jobTitle || 'Open Role'}`),
    ),
    React.createElement(View, null, ...body),
  )
}

function renderTech(
  p: BuilderResumeData['personalInfo'],
  letter: BuilderCoverLetter | undefined,
  letterDate: string,
  content: string,
) {
  const styles = StyleSheet.create({
    page: {
      flexDirection: 'row',
      fontFamily: 'Helvetica',
      fontSize: 11,
      color: SLATE,
      backgroundColor: '#ffffff',
    },
    sidebar: {
      width: 150,
      backgroundColor: '#0f172a',
      paddingTop: 28,
      paddingBottom: 28,
      paddingHorizontal: 16,
    },
    sideName: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#f8fafc', marginBottom: 4 },
    sideTitle: {
      fontSize: 8,
      color: '#67e8f9',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: 18,
    },
    sideLabel: {
      fontSize: 7,
      color: '#64748b',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    sideValue: { fontSize: 8, color: '#cbd5e1', marginBottom: 10 },
    sideFoot: {
      marginTop: 24,
      fontSize: 7,
      color: '#64748b',
      letterSpacing: 1,
      borderTopWidth: 1,
      borderTopColor: '#334155',
      paddingTop: 10,
    },
    main: { flex: 1, paddingTop: 32, paddingBottom: 36, paddingHorizontal: 28 },
    date: { fontSize: 9, color: MUTED, fontFamily: 'Courier', marginBottom: 10 },
    manager: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
    company: { fontSize: 11, color: '#475569', marginBottom: 18 },
  })

  const body = buildBodyChildren(content, {
    fontSize: 10.5,
    lineHeight: 1.5,
    color: '#1e293b',
    fontFamily: 'Helvetica',
  })

  return React.createElement(
    Page,
    { size: 'A4', style: styles.page, wrap: true },
    React.createElement(
      View,
      { style: styles.sidebar },
      React.createElement(Text, { style: styles.sideName }, p.fullName || 'Your Name'),
      p.jobTitle ? React.createElement(Text, { style: styles.sideTitle }, p.jobTitle) : null,
      p.email
        ? React.createElement(
            View,
            null,
            React.createElement(Text, { style: styles.sideLabel }, 'Email'),
            React.createElement(Text, { style: styles.sideValue }, p.email),
          )
        : null,
      p.phone
        ? React.createElement(
            View,
            null,
            React.createElement(Text, { style: styles.sideLabel }, 'Phone'),
            React.createElement(Text, { style: styles.sideValue }, p.phone),
          )
        : null,
      p.location
        ? React.createElement(
            View,
            null,
            React.createElement(Text, { style: styles.sideLabel }, 'Location'),
            React.createElement(Text, { style: styles.sideValue }, p.location),
          )
        : null,
      React.createElement(Text, { style: styles.sideFoot }, 'TECH INTRO'),
    ),
    React.createElement(
      View,
      { style: styles.main },
      letter?.companyName || letter?.hiringManager
        ? React.createElement(
            View,
            { wrap: false },
            React.createElement(Text, { style: styles.date }, letterDate),
            React.createElement(
              Text,
              { style: styles.manager },
              letter?.hiringManager || 'Hiring Manager',
            ),
            letter?.companyName
              ? React.createElement(Text, { style: styles.company }, letter.companyName)
              : null,
          )
        : null,
      React.createElement(View, null, ...body),
    ),
  )
}

/**
 * Cover-letter PDF layouts mirrored from CoverLetterThemeRenderer.vue
 * so Export matches the on-screen preview for each template.
 */
export function createCoverLetterPdfDocument(
  data: BuilderResumeData,
  coverLetter?: BuilderCoverLetter,
) {
  const letter = coverLetter || data.coverLetter
  const p = data.personalInfo || ({} as BuilderResumeData['personalInfo'])
  const content = letter?.content || ''
  const letterDate = formatLetterDate()
  const templateId = resolveTemplateId(data)

  let page: React.ReactElement
  if (templateId === 'cl-creative') {
    page = renderCreative(p, letter, letterDate, content)
  } else if (templateId === 'cl-executive') {
    page = renderExecutive(p, letter, letterDate, content)
  } else if (templateId === 'cl-tech') {
    page = renderTech(p, letter, letterDate, content)
  } else {
    page = renderStandard(p, letter, letterDate, content)
  }

  return React.createElement(
    Document,
    {
      title: `${p.fullName || 'Cover'} Cover Letter`,
      author: p.fullName || 'Candidate',
    },
    page,
  )
}
