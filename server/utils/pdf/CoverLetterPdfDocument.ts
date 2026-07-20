import React from 'react'
import { Document, Page, View, Text } from '@react-pdf/renderer'
import type { BuilderCoverLetter, BuilderResumeData } from '~/shared/types/builder'
import { htmlToBlocks, stripHtmlToPlain } from './types'
import { baseStyles, colors } from './styles'

export function createCoverLetterPdfDocument(
  data: BuilderResumeData,
  coverLetter?: BuilderCoverLetter,
) {
  const letter = coverLetter || data.coverLetter
  const p = data.personalInfo
  const content = letter?.content || ''
  const blocks = htmlToBlocks(content)
  const plainFallback = stripHtmlToPlain(content)

  const bodyChildren =
    blocks.length > 0
      ? blocks.map((block, index) => {
          if (block.type === 'bullet') {
            return React.createElement(
              View,
              { key: `lb-${index}`, style: baseStyles.bulletRow, wrap: false },
              React.createElement(Text, { style: baseStyles.bulletGlyph }, '•'),
              React.createElement(Text, { style: baseStyles.bulletText }, block.text),
            )
          }
          return React.createElement(
            Text,
            {
              key: `lp-${index}`,
              style: [baseStyles.body, { marginBottom: 8 }],
              wrap: false,
            },
            block.text,
          )
        })
      : [
          React.createElement(
            Text,
            { key: 'plain', style: [baseStyles.body, { lineHeight: 1.55 }] },
            plainFallback || ' ',
          ),
        ]

  const page = React.createElement(
    Page,
    { size: 'A4', style: baseStyles.page, wrap: true },
    React.createElement(
      View,
      { wrap: false, style: { marginBottom: 24 } },
      React.createElement(Text, { style: baseStyles.h1 }, p.fullName || data.name || 'Cover Letter'),
      p.jobTitle
        ? React.createElement(Text, { style: baseStyles.subtitle }, p.jobTitle)
        : null,
      React.createElement(
        Text,
        { style: baseStyles.contactLine },
        [p.email, p.phone, p.location].filter(Boolean).join('  ·  '),
      ),
    ),
    letter?.companyName || letter?.hiringManager
      ? React.createElement(
          View,
          { wrap: false, style: { marginBottom: 16 } },
          letter?.hiringManager
            ? React.createElement(Text, { style: baseStyles.body }, letter.hiringManager)
            : null,
          letter?.companyName
            ? React.createElement(Text, {
                style: [baseStyles.body, { color: colors.brand, marginBottom: 8 }],
              }, letter.companyName)
            : null,
        )
      : null,
    React.createElement(View, { style: { marginTop: 4 } }, ...bodyChildren),
  )

  return React.createElement(
    Document,
    {
      title: `${p.fullName || 'Cover'} Cover Letter`,
      author: p.fullName || 'Candidate',
    },
    page,
  )
}
