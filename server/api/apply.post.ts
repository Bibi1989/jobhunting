import {
  createDocumentAiClient,
  generateFromJobDescriptionOnly,
  generateFromPdfResume,
} from '../utils/documentEngine'
import { withCredits } from '../utils/withCredits'

function partText(part?: { data?: Buffer | Uint8Array }): string {
  if (!part?.data) return ''
  return Buffer.from(part.data).toString('utf8').trim()
}

function partBuffer(part?: { data?: Buffer | Uint8Array }): Buffer | null {
  if (!part?.data) return null
  return Buffer.from(part.data)
}

function isPdfPart(
  part: { filename?: string; type?: string; data?: Buffer | Uint8Array } | undefined,
  buffer: Buffer | null,
): boolean {
  if (!buffer?.length) return false
  const filename = part?.filename?.toLowerCase() || ''
  return (
    filename.endsWith('.pdf') ||
    part?.type === 'application/pdf' ||
    buffer.subarray(0, 4).toString('utf8') === '%PDF'
  )
}

export default withCredits(async (event) => {
  try {
    const form = await readMultipartFormData(event)
    if (!form?.length) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Expected multipart/form-data with jobDescription',
      })
    }

    const jobDescriptionPart = form.find((part) => part.name === 'jobDescription')
    const resumePart =
      form.find((part) => part.name === 'userResume' && part.filename) ||
      form.find((part) => part.name === 'resume' && part.filename)
    const coverLetterPart =
      form.find((part) => part.name === 'userCoverLetter' && part.filename) ||
      form.find((part) => part.name === 'coverLetter' && part.filename)

    const jobDescription = partText(jobDescriptionPart)
    if (!jobDescription || jobDescription.length < 40) {
      throw createError({
        statusCode: 400,
        statusMessage: 'jobDescription is required (paste a full job posting)',
      })
    }

    const apiKey = process.env.GEMINI_API_KEY || useRuntimeConfig().geminiApiKey
    const ai = createDocumentAiClient(String(apiKey || ''))

    const resumeBuffer = partBuffer(resumePart || undefined)
    const coverBuffer = partBuffer(coverLetterPart || undefined)

    if (resumeBuffer && resumeBuffer.length > 0 && !isPdfPart(resumePart, resumeBuffer)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'userResume must be a PDF file',
      })
    }
    if (coverBuffer && coverBuffer.length > 0 && !isPdfPart(coverLetterPart, coverBuffer)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cover letter upload must be a PDF file',
      })
    }

    if (resumeBuffer && isPdfPart(resumePart, resumeBuffer)) {
      if (resumeBuffer.length > 45 * 1024 * 1024) {
        throw createError({
          statusCode: 400,
          statusMessage: 'PDF is too large (max ~45MB for inline Gemini upload)',
        })
      }

      const docs = await generateFromPdfResume({
        ai,
        jobDescription,
        pdfBuffer: resumeBuffer,
        coverLetterPdfBuffer:
          coverBuffer && isPdfPart(coverLetterPart, coverBuffer) ? coverBuffer : null,
      })

      return {
        resume: docs.resume,
        coverLetter: docs.coverLetter,
        mode: 'pdf' as const,
        model: 'gemini-3.1-pro-preview',
      }
    }

    const docs = await generateFromJobDescriptionOnly({
      ai,
      jobDescription,
    })

    return {
      resume: docs.resume,
      coverLetter: docs.coverLetter,
      mode: 'template' as const,
      model: 'gemini-3.1-pro-preview',
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    const message =
      error instanceof Error ? error.message : 'Document generation failed unexpectedly'
    console.error('apply.post failed:', error)
    throw createError({
      statusCode: 500,
      statusMessage: message,
    })
  }
}, { reason: 'ai_apply', requirePro: true })
