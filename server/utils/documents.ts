import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import mammoth from 'mammoth'
import { query } from './db'

export type DocumentType = 'resume' | 'cover_letter'

export interface UserDocument {
  id: string
  userId?: string
  docType: DocumentType
  originalName: string
  mimeType: string
  contentText: string
  storagePath?: string
  createdAt: string
  updatedAt: string
}

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
])

const MAX_CONTENT_CHARS = 200_000

/** Netlify / Lambda: only /tmp is writable; app dirs under /var/task are read-only. */
function isServerlessReadonlyFs(): boolean {
  return Boolean(
    process.env.NETLIFY ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT ||
      process.cwd().startsWith('/var/task'),
  )
}

function localDataDir(): string | null {
  if (isServerlessReadonlyFs()) return null
  return path.join(process.cwd(), '.data')
}

function docsMetaPath(): string | null {
  const dir = localDataDir()
  return dir ? path.join(dir, 'documents.json') : null
}

export async function extractTextFromUpload(
  buffer: Buffer,
  mimeType: string,
  filename: string,
): Promise<string> {
  const lower = filename.toLowerCase()

  if (mimeType === 'application/pdf' || lower.endsWith('.pdf')) {
    const pdfParse = await loadPdfParse()
    const parsed = await pdfParse(buffer)
    return cleanExtractedText(parsed.text || '')
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lower.endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ buffer })
    return cleanExtractedText(result.value)
  }

  if (
    mimeType.startsWith('text/') ||
    lower.endsWith('.txt') ||
    lower.endsWith('.md')
  ) {
    return cleanExtractedText(buffer.toString('utf8'))
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'Unsupported file type. Upload PDF, DOCX, or TXT.',
  })
}

export function assertAllowedUpload(mimeType: string, filename: string) {
  const lower = filename.toLowerCase()
  const ok =
    ALLOWED_MIME.has(mimeType) ||
    lower.endsWith('.pdf') ||
    lower.endsWith('.docx') ||
    lower.endsWith('.txt') ||
    lower.endsWith('.md')

  if (!ok) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unsupported file type. Upload PDF, DOCX, or TXT.',
    })
  }
}

/**
 * Save uploaded resume/cover-letter text for a user.
 * Replaces any previous *upload* of the same type (builder JSON docs are untouched).
 * Binary files are not kept on Netlify; text lives in Postgres only.
 */
export async function saveUserDocument(input: {
  userId: string
  docType: DocumentType
  originalName: string
  mimeType: string
  contentText: string
  buffer: Buffer
}) {
  const contentText = input.contentText.slice(0, MAX_CONTENT_CHARS)
  // Never treat builder JSON as an "upload" replace target.
  const mimeType =
    input.mimeType === 'application/json' ? 'text/plain' : input.mimeType

  const now = new Date().toISOString()
  const localDoc: UserDocument = {
    id: crypto.randomUUID(),
    userId: input.userId,
    docType: input.docType,
    originalName: input.originalName,
    mimeType,
    contentText,
    createdAt: now,
    updatedAt: now,
  }

  if (!isServerlessReadonlyFs()) {
    await saveLocalDocument(localDoc).catch((error) => {
      console.warn(
        '[documents] Local meta write skipped:',
        error instanceof Error ? error.message : error,
      )
    })
  }

  try {
    // Replace previous upload for this user + type (builder JSON docs untouched).
    await query(
      `DELETE FROM user_documents
       WHERE user_id = $1
         AND doc_type = $2
         AND mime_type IS DISTINCT FROM 'application/json'`,
      [input.userId, input.docType],
    )

    const result = await query<{
      id: string
      user_id: string | null
      doc_type: DocumentType
      original_name: string
      mime_type: string
      content_text: string
      storage_path: string | null
      created_at: Date
      updated_at: Date
    }>(
      `INSERT INTO user_documents (user_id, doc_type, original_name, mime_type, content_text, storage_path)
       VALUES ($1, $2, $3, $4, $5, NULL)
       RETURNING *`,
      [input.userId, input.docType, input.originalName, mimeType, contentText],
    )

    return mapDocument(result.rows[0])
  } catch (error) {
    return failSave(error, localDoc)
  }
}

function failSave(error: unknown, localDoc: UserDocument): UserDocument {
  if (isServerlessReadonlyFs()) {
    console.error('[documents] Postgres required on serverless:', error)
    throw createError({
      statusCode: 503,
      statusMessage:
        'Could not save document to the database. Check DATABASE_URL on Netlify.',
    })
  }
  console.warn(
    'Postgres unavailable — document saved locally only:',
    error instanceof Error ? error.message : error,
  )
  return localDoc
}

/** Latest uploaded (non-builder) resume + cover letter for this user. */
export async function getLatestDocuments(userId: string) {
  try {
    const result = await query<{
      id: string
      user_id: string | null
      doc_type: DocumentType
      original_name: string
      mime_type: string
      content_text: string
      storage_path: string | null
      created_at: Date
      updated_at: Date
    }>(
      `SELECT DISTINCT ON (doc_type) *
       FROM user_documents
       WHERE user_id = $1
         AND mime_type IS DISTINCT FROM 'application/json'
       ORDER BY doc_type, updated_at DESC`,
      [userId],
    )

    const docs = result.rows.map(mapDocument)
    return {
      resume: docs.find((d) => d.docType === 'resume') || null,
      coverLetter: docs.find((d) => d.docType === 'cover_letter') || null,
    }
  } catch (error) {
    if (isServerlessReadonlyFs()) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Could not load documents from the database.',
      })
    }
    console.warn(
      'Postgres unavailable — loading documents from local store:',
      error instanceof Error ? error.message : error,
    )
    return loadLocalDocuments()
  }
}

async function saveLocalDocument(doc: UserDocument) {
  const metaPath = docsMetaPath()
  const dataDir = localDataDir()
  if (!metaPath || !dataDir) return

  const current = await loadLocalDocuments()
  const next = {
    resume: doc.docType === 'resume' ? doc : current.resume,
    coverLetter: doc.docType === 'cover_letter' ? doc : current.coverLetter,
  }
  await mkdir(dataDir, { recursive: true })
  await writeFile(metaPath, JSON.stringify(next, null, 2), 'utf8')
}

export async function deleteUserDocument(userId: string, docType: DocumentType) {
  const current = await loadLocalDocuments()
  const existing = docType === 'resume' ? current.resume : current.coverLetter

  if (!isServerlessReadonlyFs()) {
    const metaPath = docsMetaPath()
    const dataDir = localDataDir()
    if (metaPath && dataDir) {
      const next = {
        resume: docType === 'resume' ? null : current.resume,
        coverLetter: docType === 'cover_letter' ? null : current.coverLetter,
      }
      await mkdir(dataDir, { recursive: true })
      await writeFile(metaPath, JSON.stringify(next, null, 2), 'utf8')
    }
  }

  try {
    const result = await query(
      `DELETE FROM user_documents
       WHERE user_id = $1
         AND doc_type = $2
         AND mime_type IS DISTINCT FROM 'application/json'
       RETURNING id`,
      [userId, docType],
    )
    return { removed: (result.rowCount || 0) > 0 || Boolean(existing), docType }
  } catch (error) {
    if (isServerlessReadonlyFs()) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Could not delete document from the database.',
      })
    }
    console.warn(
      'Postgres unavailable — document removed from local store only:',
      error instanceof Error ? error.message : error,
    )
  }

  return { removed: Boolean(existing), docType }
}

async function loadLocalDocuments(): Promise<{
  resume: UserDocument | null
  coverLetter: UserDocument | null
}> {
  const metaPath = docsMetaPath()
  if (!metaPath) return { resume: null, coverLetter: null }

  try {
    const raw = await readFile(metaPath, 'utf8')
    const parsed = JSON.parse(raw) as {
      resume?: UserDocument | null
      coverLetter?: UserDocument | null
    }
    return {
      resume: parsed.resume || null,
      coverLetter: parsed.coverLetter || null,
    }
  } catch {
    return { resume: null, coverLetter: null }
  }
}

async function loadPdfParse() {
  const mod = await import('pdf-parse')
  const pdfParse = (mod as { default?: (buf: Buffer) => Promise<{ text: string }> }).default || mod
  return pdfParse as (buf: Buffer) => Promise<{ text: string }>
}

function mapDocument(row: {
  id: string
  user_id?: string | null
  doc_type: DocumentType
  original_name: string
  mime_type: string
  content_text: string
  storage_path: string | null
  created_at: Date
  updated_at: Date
}): UserDocument {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    docType: row.doc_type,
    originalName: row.original_name,
    mimeType: row.mime_type,
    contentText: row.content_text,
    storagePath: row.storage_path || undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

function cleanExtractedText(text: string) {
  return text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim()
}
