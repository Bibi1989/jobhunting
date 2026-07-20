import { withCredits } from '~/server/utils/withCredits'
import { assertAllowedUpload, extractTextFromUpload } from '~/server/utils/documents'
import { generatePortfolioFromText } from '~/server/utils/portfolioAi'

/**
 * POST /api/portfolio/generate
 *
 * Accepts a multipart CV / cover-letter upload, extracts its text, and returns a
 * structured portfolio JSON payload from the LLM.
 *
 * Gating is handled by `withCredits`:
 *   - requirePro: true  -> 403 for non-Pro accounts
 *   - cost: 20          -> 403 if the user has < 20 credits, and an ATOMIC
 *                          decrement of exactly 20 credits AFTER a successful
 *                          AI response (admins bypass and are never charged).
 */
export default withCredits(
  async (event) => {
    const form = await readMultipartFormData(event)
    if (!form?.length) {
      throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
    }

    const filePart = form.find((p) => p.name === 'file' && p.filename)
    const jobDescriptionPart = form.find((p) => p.name === 'jobDescription')
    const jobDescription = jobDescriptionPart?.data
      ? Buffer.from(jobDescriptionPart.data).toString('utf8').trim()
      : ''

    if (!filePart?.data || !filePart.filename) {
      throw createError({ statusCode: 400, statusMessage: 'A CV or cover letter file is required' })
    }

    const mimeType = filePart.type || 'application/octet-stream'
    assertAllowedUpload(mimeType, filePart.filename)

    const buffer = Buffer.from(filePart.data)
    const documentText = await extractTextFromUpload(buffer, mimeType, filePart.filename)

    if (!documentText || documentText.length < 40) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Could not extract enough text from the uploaded document',
      })
    }

    const profileData = await generatePortfolioFromText(documentText, jobDescription || undefined)

    // Returning here signals success to withCredits, which then charges 20 credits.
    return { profileData }
  },
  {
    cost: 20,
    reason: 'portfolio_generate',
    requirePro: true,
    proMessage: 'Portfolio generation requires a Pro subscription',
    insufficientCreditsMessage: 'Insufficient credits. 20 credits required.',
  },
)
