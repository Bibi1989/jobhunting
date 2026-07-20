import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import mammoth from 'mammoth'
import { query } from './db'

export type DocumentType = 'resume' | 'cover_letter'

export interface UserDocument {
  id: string
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

const DATA_DIR = path.join(process.cwd(), '.data')
const DOCS_META_PATH = path.join(DATA_DIR, 'documents.json')

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

export async function saveUserDocument(input: {
  docType: DocumentType
  originalName: string
  mimeType: string
  contentText: string
  buffer: Buffer
}) {
  const uploadsDir = path.join(process.cwd(), 'uploads', input.docType)
  await mkdir(uploadsDir, { recursive: true })
  await mkdir(DATA_DIR, { recursive: true })

  const safeName = input.originalName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = path.join(uploadsDir, `${Date.now()}-${safeName}`)
  await writeFile(storagePath, input.buffer)

  const now = new Date().toISOString()
  const localDoc: UserDocument = {
    id: crypto.randomUUID(),
    docType: input.docType,
    originalName: input.originalName,
    mimeType: input.mimeType,
    contentText: input.contentText,
    storagePath,
    createdAt: now,
    updatedAt: now,
  }

  await saveLocalDocument(localDoc)

  try {
    const result = await query<{
      id: string
      doc_type: DocumentType
      original_name: string
      mime_type: string
      content_text: string
      storage_path: string | null
      created_at: Date
      updated_at: Date
    }>(
      `INSERT INTO user_documents (doc_type, original_name, mime_type, content_text, storage_path)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        input.docType,
        input.originalName,
        input.mimeType,
        input.contentText,
        storagePath,
      ],
    )

    return mapDocument(result.rows[0])
  } catch (error) {
    console.warn(
      'Postgres unavailable — document saved locally only:',
      error instanceof Error ? error.message : error,
    )
    return localDoc
  }
}

export async function getLatestDocuments() {
  try {
    const result = await query<{
      id: string
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
       ORDER BY doc_type, updated_at DESC`,
    )

    const docs = result.rows.map(mapDocument)
    return {
      resume: docs.find((d) => d.docType === 'resume') || null,
      coverLetter: docs.find((d) => d.docType === 'cover_letter') || null,
    }
  } catch (error) {
    console.warn(
      'Postgres unavailable — loading documents from local store:',
      error instanceof Error ? error.message : error,
    )
    return loadLocalDocuments()
  }
}

async function saveLocalDocument(doc: UserDocument) {
  const current = await loadLocalDocuments()
  const next = {
    resume: doc.docType === 'resume' ? doc : current.resume,
    coverLetter: doc.docType === 'cover_letter' ? doc : current.coverLetter,
  }
  await writeFile(DOCS_META_PATH, JSON.stringify(next, null, 2), 'utf8')
}

export async function deleteUserDocument(docType: DocumentType) {
  const current = await loadLocalDocuments()
  const existing = docType === 'resume' ? current.resume : current.coverLetter

  const next = {
    resume: docType === 'resume' ? null : current.resume,
    coverLetter: docType === 'cover_letter' ? null : current.coverLetter,
  }
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(DOCS_META_PATH, JSON.stringify(next, null, 2), 'utf8')

  try {
    await query(`DELETE FROM user_documents WHERE doc_type = $1`, [docType])
  } catch (error) {
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
  try {
    const raw = await readFile(DOCS_META_PATH, 'utf8')
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
  // pdf-parse is CJS; default import can break under Nitro ESM.
  const mod = await import('pdf-parse')
  const pdfParse = (mod as { default?: (buf: Buffer) => Promise<{ text: string }> }).default || mod
  return pdfParse as (buf: Buffer) => Promise<{ text: string }>
}

function mapDocument(row: {
  id: string
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
