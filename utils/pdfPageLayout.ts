/**
 * PDF Page Layout Engine — Word / Google Docs style multi-page A4 flow
 *
 * - Content taller than one A4 spills onto page 2, 3, … (never force-scaled to 1 page)
 * - Page breaks respect CSS / .pdf-avoid-break atomic blocks (html2pdf "avoid-all" + "css")
 * - Each PDF page is exactly A4; split-theme sidebars are painted full-height per page
 */

import type { jsPDF } from 'jspdf'

// ─── Page geometry ───────────────────────────────────────────────────────────

export const A4_WIDTH_MM = 210
export const A4_HEIGHT_MM = 297
export const A4_HEIGHT_RATIO = A4_HEIGHT_MM / A4_WIDTH_MM

/** Tiny trailing overflow absorbed onto the last page instead of spawning a blank. */
export const MINOR_OVERFLOW_THRESHOLD = 0.05

export const TRAILING_BLANK_INK_MAX = 0.012

/** html2pdf.js-compatible defaults (we implement pagebreak natively). */
export const HTML2PDF_LIKE_OPTIONS = {
  margin: 0,
  image: { type: 'jpeg' as const, quality: 0.98 },
  html2canvas: { scale: 2, useCORS: true },
  jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
  pagebreak: {
    mode: ['avoid-all', 'css'] as const,
    // Keep this list tight — avoiding `ul`/`section`/`li` leaves huge empty page bottoms.
    avoid: ['.pdf-avoid-break', 'h1', 'h2', 'h3', 'tr'],
  },
}

export const AVOID_BREAK_SELECTORS = HTML2PDF_LIKE_OPTIONS.pagebreak.avoid.join(', ')

export interface PageLayoutOptions {
  pageHeightPx?: number
  minorOverflowThreshold?: number
  avoidBreakSelector?: string
  /** html2pdf pagebreak modes we honor: avoid-all, css */
  pagebreakMode?: ReadonlyArray<'avoid-all' | 'css' | string>
}

export interface PageBreakPlan {
  /** Y offsets (CSS px relative to root) where each page starts. Always includes 0. */
  breakYs: number[]
  pageCount: number
  pageHeightPx: number
  contentHeightPx: number
}

export interface SidebarOverlay {
  /** Column width in CANVAS pixels. */
  widthPx: number
  /** CSS color string, e.g. "rgb(0,106,97)". */
  color: string
}

export interface MultiPageComposeOptions {
  pageHeightPx: number
  /** DOM-planned breaks already mapped into canvas pixel space */
  plannedBreakYs?: number[]
  trailingAbsorbThreshold?: number
  searchRadius?: number
  /**
   * Explicit full-height brand column geometry (from the live `.theme-sidebar`).
   * When provided it is used verbatim instead of fragile pixel detection, so the
   * painted overlay always matches the captured sidebar width (no step/gap).
   */
  sidebarOverlay?: SidebarOverlay | null
}

// ─── Measurement ─────────────────────────────────────────────────────────────

export function measureContentHeightPx(root: HTMLElement): number {
  const rootRect = root.getBoundingClientRect()
  let bottom = 0

  const nodes = root.querySelectorAll<HTMLElement>('*:not(.no-print):not(.no-print *)')
  for (const node of nodes) {
    const text = (node.innerText || '').replace(/\u00a0/g, ' ').trim()
    const hasMedia = Boolean(node.querySelector('img, svg, canvas'))
    if (!text && !hasMedia && node.children.length === 0) continue

    const rect = node.getBoundingClientRect()
    if (rect.height < 1 && rect.width < 1) continue
    bottom = Math.max(bottom, rect.bottom - rootRect.top)
  }

  if (bottom < 1) {
    for (const child of Array.from(root.children) as HTMLElement[]) {
      if (child.classList.contains('no-print')) continue
      bottom = Math.max(bottom, child.offsetTop + child.offsetHeight)
    }
  }

  return Math.max(bottom, 0)
}

/**
 * Preview/PDF sheets are full-bleed A4. Themes already pad their own content;
 * extra edge margins left white strips in split sidebars and worsened clipping.
 */
export const PAGE_EDGE_MARGIN_RATIO = 0

/** Usable content height inside one A4 page (excludes edge margins). */
export function pageEdgeMarginPx(pageHeightPx: number): number {
  if (PAGE_EDGE_MARGIN_RATIO <= 0) return 0
  return Math.max(0, Math.round(pageHeightPx * PAGE_EDGE_MARGIN_RATIO))
}

export function pageContentBandPx(pageHeightPx: number): number {
  const margin = pageEdgeMarginPx(pageHeightPx)
  return Math.max(1, pageHeightPx - 2 * margin)
}

export function a4PageHeightPx(widthPx: number): number {
  return Math.max(1, widthPx * A4_HEIGHT_RATIO)
}

export function computePageCount(
  contentHeightPx: number,
  pageHeightPx: number,
  threshold = MINOR_OVERFLOW_THRESHOLD,
): number {
  if (contentHeightPx <= 0 || pageHeightPx <= 0) return 1
  // Count pages using the usable content band (margins don't hold text)
  const band = pageContentBandPx(pageHeightPx)
  const slack = Math.max(24, band * threshold)
  return Math.max(1, Math.ceil((contentHeightPx - slack) / band))
}

// ─── Avoid-break planning (html2pdf avoid-all + css) ─────────────────────────

interface BlockBox {
  top: number
  bottom: number
}

function collectAvoidBreakBlocks(root: HTMLElement, selector: string): BlockBox[] {
  const rootRect = root.getBoundingClientRect()
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(selector))
  const boxes: BlockBox[] = []

  for (const el of nodes) {
    if (el.closest('.no-print')) continue
    // Prefer outermost avoid blocks
    if (nodes.some((other) => other !== el && other.contains(el))) continue

    const rect = el.getBoundingClientRect()
    if (rect.height < 2) continue
    boxes.push({
      top: rect.top - rootRect.top,
      bottom: rect.bottom - rootRect.top,
    })
  }

  boxes.sort((a, b) => a.top - b.top)
  return boxes
}

/** Block tops that are safe places to start a new page (never mid-line). */
const SAFE_BREAK_SELECTOR = [
  'li',
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'tr',
  'header',
  'section',
  'article',
  '.pdf-avoid-break',
].join(', ')

function collectFlowBlocks(root: HTMLElement): BlockBox[] {
  const rootRect = root.getBoundingClientRect()
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(SAFE_BREAK_SELECTOR))
  const boxes: BlockBox[] = []

  for (const el of nodes) {
    if (el.closest('.no-print')) continue
    // Prefer innermost blocks (li/p) so breaks land between bullets, not whole sections
    if (nodes.some((other) => other !== el && el.contains(other))) continue

    const rect = el.getBoundingClientRect()
    if (rect.height < 2) continue
    boxes.push({
      top: rect.top - rootRect.top,
      bottom: rect.bottom - rootRect.top,
    })
  }

  boxes.sort((a, b) => a.top - b.top || a.bottom - b.bottom)
  return boxes
}

/**
 * Snap an ideal page end to a block boundary so overflow:hidden never slices
 * mid-word / mid-bullet. Prefers breaking BEFORE a straddling block when the
 * page already has enough content.
 */
function snapBreakToBlockBoundary(
  pageStart: number,
  idealEnd: number,
  band: number,
  blocks: BlockBox[],
  contentHeightPx: number,
): number {
  const minFill = pageStart + Math.floor(band * 0.42)
  const straddling = blocks.find(
    (b) => b.top < idealEnd - 0.5 && b.bottom > idealEnd + 0.5,
  )

  if (straddling) {
    const blockH = straddling.bottom - straddling.top
    // Block taller than a page must hard-split.
    if (blockH > band * 0.95) {
      return Math.min(idealEnd, contentHeightPx)
    }

    // Block starts on this page — always break before it (never clip mid-line).
    if (straddling.top >= pageStart - 0.5) {
      if (straddling.top > pageStart + 8) {
        return Math.min(Math.max(straddling.top, pageStart + 1), contentHeightPx)
      }
    } else {
      // Continuation from a previous page: finish the block on this page when
      // it ends soon; otherwise hard-split at the band (unavoidable).
      if (
        straddling.bottom <= pageStart + band + 1 &&
        straddling.bottom - pageStart >= Math.floor(band * 0.35)
      ) {
        return Math.min(straddling.bottom, contentHeightPx)
      }
      return Math.min(idealEnd, contentHeightPx)
    }
  }

  // No straddler: end after the last fully visible block in the band.
  let best = idealEnd
  for (const b of blocks) {
    if (b.bottom <= pageStart + 1) continue
    if (b.top > idealEnd) break
    if (b.bottom <= idealEnd && b.bottom >= minFill) best = b.bottom
    else if (b.top <= idealEnd && b.top >= minFill) best = b.top
  }

  return Math.min(Math.max(best, pageStart + Math.floor(band * 0.35)), contentHeightPx)
}

/**
 * Plan page-start Y offsets so content flows page 1 → 2 → 3 like Word.
 * Breaks snap to element boundaries (li/p/headings) so preview sheets never
 * clip mid-line. Short avoid-break chips can still pull a break slightly early.
 */
export function planPageBreaks(
  root: HTMLElement,
  options: PageLayoutOptions = {},
): PageBreakPlan {
  const width = Math.max(root.offsetWidth, root.clientWidth, 1)
  const pageHeightPx = options.pageHeightPx ?? a4PageHeightPx(width)
  const threshold = options.minorOverflowThreshold ?? MINOR_OVERFLOW_THRESHOLD
  const modes = options.pagebreakMode ?? HTML2PDF_LIKE_OPTIONS.pagebreak.mode
  const useAvoid = modes.includes('avoid-all') || modes.includes('css')
  const selector = options.avoidBreakSelector ?? AVOID_BREAK_SELECTORS

  const contentHeightPx = measureContentHeightPx(root)
  const band = pageContentBandPx(pageHeightPx)
  const breakYs: number[] = [0]

  if (contentHeightPx <= band + Math.max(24, band * threshold)) {
    return { breakYs, pageCount: 1, pageHeightPx, contentHeightPx }
  }

  const flowBlocks = collectFlowBlocks(root)
  const avoidBlocks = useAvoid ? collectAvoidBreakBlocks(root, selector) : []
  let pageStart = 0

  while (pageStart + band < contentHeightPx - Math.max(24, band * threshold)) {
    let boundary = snapBreakToBlockBoundary(
      pageStart,
      pageStart + band,
      band,
      flowBlocks,
      contentHeightPx,
    )

    if (useAvoid) {
      const straddling = avoidBlocks.find(
        (b) => b.top < boundary - 1 && b.bottom > boundary + 1,
      )
      if (straddling) {
        const blockH = straddling.bottom - straddling.top
        if (
          blockH <= band * 0.22 &&
          straddling.top > pageStart + band * 0.55 &&
          boundary - straddling.top <= band * 0.18
        ) {
          boundary = straddling.top
        }
      }
    }

    const nextStart = Math.min(
      Math.max(boundary, pageStart + Math.floor(band * 0.35)),
      contentHeightPx,
    )
    if (nextStart <= pageStart + 1) break
    breakYs.push(nextStart)
    pageStart = nextStart
  }

  return {
    breakYs,
    pageCount: Math.max(1, breakYs.length),
    pageHeightPx,
    contentHeightPx,
  }
}

export function mapBreakYsToCanvas(
  breakYs: number[],
  cssWidthPx: number,
  canvasWidthPx: number,
): number[] {
  const scale = canvasWidthPx / Math.max(1, cssWidthPx)
  return breakYs.map((y) => Math.round(y * scale))
}

// ─── Canvas helpers ──────────────────────────────────────────────────────────

export function trimTrailingBlankRows(
  canvas: HTMLCanvasElement,
  inkMax = TRAILING_BLANK_INK_MAX,
  ignoreLeftPx = 0,
): number {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return canvas.height

  const { width, height } = canvas
  const step = Math.max(1, Math.floor(width / 400))
  // Skip the solid brand sidebar column: it is never "blank", so counting it as
  // ink would prevent trailing empty content rows from ever being trimmed.
  const xMin = Math.max(0, Math.min(width - 1, Math.round(ignoreLeftPx) + 4))

  for (let y = height - 1; y >= 0; y--) {
    const row = ctx.getImageData(0, y, width, 1).data
    let ink = 0
    let samples = 0
    for (let x = xMin; x < width; x += step) {
      const i = x * 4
      const r = row[i] ?? 255
      const g = row[i + 1] ?? 255
      const b = row[i + 2] ?? 255
      const a = row[i + 3] ?? 255
      samples += 1
      if (a < 8) continue
      if (!(r > 248 && g > 248 && b > 248)) ink += 1
    }
    if (samples && ink / samples > inkMax) return Math.min(height, y + 4)
  }
  return 1
}

/** Prefer low-ink rows near the ideal break so text isn't cut mid-glyph.
 * Skips the left sidebar column when scoring so solid teal doesn't hide text cuts.
 */
export function findQuietRowBreak(
  canvas: HTMLCanvasElement,
  startY: number,
  idealY: number,
  searchRadius: number,
): number {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return idealY

  const width = canvas.width
  // Ignore left brand column (up to ~40%) when measuring text ink
  const sidebar = detectSidebarColumn(canvas, Math.min(48, canvas.height - 1))
  const xStart = sidebar ? Math.min(width - 8, sidebar.widthPx + 4) : Math.floor(width * 0.08)
  const minY = Math.max(startY + 8, idealY - searchRadius)
  let bestY = idealY
  let bestScore = Number.POSITIVE_INFINITY

  for (let y = idealY; y >= minY; y -= 1) {
    const row = ctx.getImageData(0, y, width, 1).data
    let ink = 0
    let samples = 0
    for (let x = xStart; x < width; x += 2) {
      const i = x * 4
      const r = row[i] ?? 255
      const g = row[i + 1] ?? 255
      const b = row[i + 2] ?? 255
      samples += 1
      const nearWhite = r > 248 && g > 248 && b > 248
      // Main column: ink = dark text (not flat white)
      if (!nearWhite && (r < 235 || g < 235 || b < 235)) {
        const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
        if (lum < 0.75) ink += 1
      }
    }
    const density = samples ? ink / samples : 1
    const distancePenalty = (idealY - y) / Math.max(1, searchRadius)
    const score = density * 5 + distancePenalty
    if (score < bestScore) {
      bestScore = score
      bestY = y
    }
    // Strong quiet gap between lines
    if (density < 0.015) return y
  }

  return bestY
}

function sampleCornerFill(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return '#ffffff'
  const d = ctx.getImageData(Math.min(4, canvas.width - 1), Math.min(4, canvas.height - 1), 1, 1).data
  const nearWhite = d[0] > 245 && d[1] > 245 && d[2] > 245
  return nearWhite ? '#ffffff' : `rgb(${d[0]},${d[1]},${d[2]})`
}

/**
 * Detect a solid left sidebar column (Creative Director teal, etc.) and return
 * its pixel width + fill color so every PDF page can paint it full-height.
 */
function detectSidebarColumn(
  canvas: HTMLCanvasElement,
  sampleY: number,
): { widthPx: number; color: string } | null {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  const y = Math.max(0, Math.min(canvas.height - 1, Math.floor(sampleY)))
  const row = ctx.getImageData(0, y, canvas.width, 1).data
  const x0 = 4
  const i0 = x0 * 4
  const r0 = row[i0] ?? 255
  const g0 = row[i0 + 1] ?? 255
  const b0 = row[i0 + 2] ?? 255

  // Sidebar must be a clearly non-white brand color
  const lum0 = (0.2126 * r0 + 0.7152 * g0 + 0.0722 * b0) / 255
  if (lum0 > 0.85 || (r0 > 240 && g0 > 240 && b0 > 240)) return null

  let widthPx = 0
  const maxScan = Math.floor(canvas.width * 0.45)
  for (let x = 0; x < maxScan; x++) {
    const i = x * 4
    const r = row[i] ?? 255
    const g = row[i + 1] ?? 255
    const b = row[i + 2] ?? 255
    const dr = Math.abs(r - r0)
    const dg = Math.abs(g - g0)
    const db = Math.abs(b - b0)
    if (dr + dg + db > 48) break
    widthPx = x + 1
  }

  // Require a meaningful column (≈80px+ at export scale), but never >38% width
  if (widthPx < Math.max(40, canvas.width * 0.08)) return null
  widthPx = Math.min(widthPx, Math.floor(canvas.width * 0.38))
  return { widthPx, color: `rgb(${r0},${g0},${b0})` }
}

/**
 * Paint sidebar + main fills for the full A4 page so split themes never leave
 * orphaned horizontal strips or white gaps under the green column.
 * Always sample sidebar from near the top of the capture so page 2+ still get teal.
 */
function paintPageChrome(
  ctx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  pageHeightPx: number,
  sidebar: { widthPx: number; color: string } | null,
) {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, source.width, pageHeightPx)
  if (sidebar) {
    ctx.fillStyle = sidebar.color
    ctx.fillRect(0, 0, sidebar.widthPx, pageHeightPx)
  }
}

/**
 * After drawing the content slice, fill brand-column gaps in the margins /
 * undrawn region so a short sidebar never leaves white strips under the teal.
 */
function fillSidebarGaps(
  ctx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  pageHeightPx: number,
  marginPx: number,
  drawH: number,
  sidebar: { widthPx: number; color: string } | null,
) {
  if (!sidebar) return
  const sideW = Math.min(sidebar.widthPx, Math.floor(source.width * 0.55))
  ctx.fillStyle = sidebar.color
  if (marginPx > 0) ctx.fillRect(0, 0, sideW, marginPx)
  const below = marginPx + Math.max(0, drawH)
  if (below < pageHeightPx) {
    ctx.fillRect(0, below, sideW, pageHeightPx - below)
  }
}

/** Resolve the brand column: prefer the explicit overlay, else pixel-detect. */
function resolveSidebar(
  source: HTMLCanvasElement,
  overlay?: SidebarOverlay | null,
): { widthPx: number; color: string } | null {
  if (overlay && overlay.widthPx > 0) {
    // Safety cap (allows up to ~half-width sidebars like digital-nomad).
    return { widthPx: Math.min(overlay.widthPx, Math.floor(source.width * 0.55)), color: overlay.color }
  }
  return (
    detectSidebarColumn(source, Math.min(24, source.height - 1)) ||
    detectSidebarColumn(source, Math.min(80, source.height - 1)) ||
    detectSidebarColumn(source, Math.floor(source.height * 0.15))
  )
}

// ─── Multi-page compose (native html2pdf-style pagination) ───────────────────

/**
 * Build inclusive page boundaries [0, y1, y2, …, contentHeight] in canvas px.
 * Steps by the usable content band (page minus top/bottom margins).
 */
function resolvePageBoundaries(
  canvas: HTMLCanvasElement,
  contentHeight: number,
  pageHeightPx: number,
  plannedBreakYs: number[],
  searchRadius: number,
  threshold: number,
): number[] {
  const band = pageContentBandPx(pageHeightPx)
  const boundaries: number[] = [0]
  const planned = plannedBreakYs
    .map((y) => Math.round(y))
    .filter((y) => y > 0 && y < contentHeight)
    .sort((a, b) => a - b)

  // Preview-locked mode: use planned band steps as-is (no quiet-row shortening)
  if (searchRadius <= 0 && planned.length) {
    for (const p of planned) {
      const prev = boundaries[boundaries.length - 1]!
      if (p <= prev + 1) continue
      const leftover = contentHeight - p
      if (leftover / band <= threshold) break
      boundaries.push(p)
    }
    boundaries.push(contentHeight)
    return boundaries
  }

  let y = 0
  while (y + band < contentHeight - Math.max(24, band * threshold)) {
    const ideal = y + band

    const plannedNear = planned.find(
      (p) => p > y + band * 0.35 && p <= y + band + searchRadius,
    )

    let breakAt =
      plannedNear ?? findQuietRowBreak(canvas, y, ideal, searchRadius)

    // Keep break within this page's content window
    breakAt = Math.min(ideal, Math.max(y + Math.floor(band * 0.45), breakAt))

    const leftover = contentHeight - breakAt
    if (leftover / band <= threshold) break

    if (breakAt <= y + 1) break
    boundaries.push(breakAt)
    y = breakAt
  }

  boundaries.push(contentHeight)
  return boundaries
}

/**
 * Slice a tall capture into exact A4 PDF pages with edge margins + full-height sidebar.
 */
export function addCanvasPagesFullBleed(
  pdf: InstanceType<typeof jsPDF>,
  sourceCanvas: HTMLCanvasElement,
  options: MultiPageComposeOptions,
): void {
  const pageWidthMm = pdf.internal.pageSize.getWidth()
  const pageHeightMm = pdf.internal.pageSize.getHeight()
  const pageHeightPx = Math.max(1, Math.floor(options.pageHeightPx))
  const band = pageContentBandPx(pageHeightPx)
  const margin = pageEdgeMarginPx(pageHeightPx)
  const threshold = options.trailingAbsorbThreshold ?? MINOR_OVERFLOW_THRESHOLD
  const searchRadius =
    options.searchRadius ?? Math.min(320, Math.floor(band * 0.35))

  const sidebar = resolveSidebar(sourceCanvas, options.sidebarOverlay)

  // Ignore the solid brand column when trimming so trailing blank content rows
  // (which sit next to a full-height sidebar) are correctly removed.
  const contentHeight = trimTrailingBlankRows(
    sourceCanvas,
    TRAILING_BLANK_INK_MAX,
    sidebar?.widthPx ?? 0,
  )
  if (contentHeight <= 1) {
    throw new Error('Preview capture returned an empty image.')
  }

  const boundaries = resolvePageBoundaries(
    sourceCanvas,
    contentHeight,
    pageHeightPx,
    options.plannedBreakYs || [],
    searchRadius,
    threshold,
  )

  for (let i = 0; i < boundaries.length - 1; i++) {
    const srcY = boundaries[i]!
    const endY = boundaries[i + 1]!
    let sliceHeight = endY - srcY

    if (sliceHeight > band) sliceHeight = band
    if (sliceHeight < 2 && i > 0) continue

    drawFullA4Page(
      pdf,
      sourceCanvas,
      srcY,
      sliceHeight,
      pageHeightPx,
      margin,
      band,
      pageWidthMm,
      pageHeightMm,
      i,
      sidebar,
    )
  }
}

function drawFullA4Page(
  pdf: InstanceType<typeof jsPDF>,
  source: HTMLCanvasElement,
  srcY: number,
  sliceHeight: number,
  pageHeightPx: number,
  marginPx: number,
  bandPx: number,
  pageWidthMm: number,
  pageHeightMm: number,
  pageIndex: number,
  sidebar: { widthPx: number; color: string } | null,
): void {
  const pageCanvas = document.createElement('canvas')
  pageCanvas.width = source.width
  pageCanvas.height = pageHeightPx
  const ctx = pageCanvas.getContext('2d')
  if (!ctx) throw new Error('Could not prepare PDF page canvas.')

  ctx.imageSmoothingEnabled = false

  // Full-page white + sidebar chrome, then content in the padded band.
  paintPageChrome(ctx, source, pageHeightPx, sidebar)

  const drawH = Math.min(sliceHeight, source.height - srcY, bandPx)
  if (drawH > 0) {
    ctx.drawImage(
      source,
      0,
      srcY,
      source.width,
      drawH,
      0,
      marginPx,
      source.width,
      drawH,
    )
  }

  // Restore brand fill in top/bottom margins (and any undrawn band)
  fillSidebarGaps(ctx, source, pageHeightPx, marginPx, drawH, sidebar)

  const imgData = pageCanvas.toDataURL('image/jpeg', HTML2PDF_LIKE_OPTIONS.image.quality)
  if (!imgData || imgData === 'data:,') {
    throw new Error('Preview capture returned an empty image.')
  }

  if (pageIndex > 0) pdf.addPage()
  pdf.addImage(imgData, 'JPEG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'NONE')
}

/** @deprecated Prefer addCanvasPagesFullBleed — kept for callers that expected single-page. */
export function addCanvasAsSingleA4Page(
  pdf: InstanceType<typeof jsPDF>,
  sourceCanvas: HTMLCanvasElement,
): void {
  const pageHeightPx = Math.max(1, Math.round(sourceCanvas.width * A4_HEIGHT_RATIO))
  addCanvasPagesFullBleed(pdf, sourceCanvas, { pageHeightPx })
}
