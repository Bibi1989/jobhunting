import { renderToBuffer, renderToStream } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import { Readable } from 'node:stream'

/**
 * Compile a react-pdf Document into a Node Buffer of PDF bytes.
 * Prefer this in Nitro handlers for reliable Content-Length responses.
 */
export async function renderPdfToBuffer(document: ReactElement<any>): Promise<Buffer> {
  const result = await renderToBuffer(document)
  if (Buffer.isBuffer(result)) return result
  if ((result as any) instanceof Uint8Array) return Buffer.from(result as any)
  // Fallback: some environments return an ArrayBuffer
  if ((result as any) instanceof ArrayBuffer) return Buffer.from(result as any)
  return Buffer.from(result as ArrayBuffer)
}

/**
 * Compile a react-pdf Document into a Node.js Readable stream (user-requested path).
 */
export async function renderPdfToNodeStream(document: ReactElement<any>): Promise<Readable> {
  const webStream = await renderToStream(document)
  if (typeof (webStream as any)?.pipe === 'function') {
    return webStream as unknown as Readable
  }
  return Readable.fromWeb(webStream as any)
}
