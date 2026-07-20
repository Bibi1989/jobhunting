/**
 * @deprecated Client html2canvas/jspdf export is deprecated.
 * Use server `/api/pdf/download` via `utils/downloadServerPdf.ts` instead.
 * Kept temporarily for smoke scripts that still import this module.
 */
import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'
import {
  HTML2PDF_LIKE_OPTIONS,
  a4PageHeightPx,
  addCanvasPagesFullBleed,
  measureContentHeightPx,
  type SidebarOverlay,
} from '~/utils/pdfPageLayout'

export interface ExportPreviewPdfOptions {
  /** Live preview content root (theme / document inside .preview-content) */
  element: HTMLElement
  /** Download filename, e.g. my-resume.pdf */
  filename: string
  /** Optional: hide these selectors during capture (toolbars, buttons) */
  hideSelectors?: string[]
}

/**
 * Capture the full resume once (no overflow:hidden — avoids html2canvas fade at clip edges),
 * then hard-slice into A4 pages using the same contentBand geometry as the preview.
 */
export async function exportPreviewToPdf(options: ExportPreviewPdfOptions): Promise<void> {
  const { element, filename, hideSelectors = ['.ql-toolbar'] } = options

  if (!element || !(element instanceof HTMLElement)) {
    throw new Error('Preview element is not ready yet.')
  }

  const hidden: Array<{ el: HTMLElement; display: string }> = []
  for (const selector of hideSelectors) {
    element.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      hidden.push({ el, display: el.style.display })
      el.style.display = 'none'
    })
  }

  const width = Math.max(element.offsetWidth, element.clientWidth, 1)
  const pageHeight = a4PageHeightPx(width)
  const contentHeight = Math.max(
    measureContentHeightPx(element),
    element.scrollHeight,
    element.offsetHeight,
  )

  // Off-screen full-height clone — never overflow:hidden (that causes faded edges)
  const host = document.createElement('div')
  host.setAttribute('data-pdf-export-host', '1')
  host.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    `width:${width}px`,
    'height:auto',
    'max-height:none',
    'overflow:visible',
    'background:#ffffff',
    'z-index:-1',
    'pointer-events:none',
  ].join(';')

  const clone = element.cloneNode(true) as HTMLElement
  clone.querySelectorAll('.ql-toolbar, .ql-ui, .no-print').forEach((n) => {
    ;(n as HTMLElement).style.display = 'none'
  })

  // Measure live content, then give the clone an explicit pixel height so html2canvas
  // never tiles/clips against a short viewport (that caused faded text at band edges).
  const captureHeight = Math.max(contentHeight, pageHeight, element.scrollHeight)

  clone.style.cssText = [
    'position:relative',
    `width:${width}px`,
    'margin:0',
    'padding:0',
    'transform:none',
    'box-shadow:none',
    'overflow:visible',
    `height:${captureHeight}px`,
    'max-height:none',
    `min-height:${captureHeight}px`,
    'background:#ffffff',
    'opacity:1',
  ].join(';')

  forceDesktopSplitLayout(clone)
  stretchThemeToContent(clone, captureHeight)
  solidifyChipStyles(clone)

  host.appendChild(clone)
  document.body.appendChild(host)

  try {
    await nextFrame()
    await nextFrame()

    // Re-measure after layout in the off-screen host
    const laidOutHeight = Math.max(
      captureHeight,
      clone.scrollHeight,
      clone.offsetHeight,
      measureContentHeightPx(clone),
    )
    if (laidOutHeight > captureHeight) {
      clone.style.height = `${laidOutHeight}px`
      clone.style.minHeight = `${laidOutHeight}px`
      stretchThemeToContent(clone, laidOutHeight)
      await nextFrame()
    }

    // Measure the brand sidebar from the CLONE (already forced to desktop split),
    // never the live element — which may be mobile-stacked (sidebar = full width).
    const capturedSidebar = measureSidebarGeometry(clone)

    const finalHeight = Math.max(laidOutHeight, clone.scrollHeight)
    const exportScale = Math.max(3, HTML2PDF_LIKE_OPTIONS.html2canvas.scale)
    const canvas = await html2canvas(clone, {
      scale: exportScale,
      useCORS: HTML2PDF_LIKE_OPTIONS.html2canvas.useCORS,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 20000,
      foreignObjectRendering: false,
      width,
      height: finalHeight,
      windowWidth: width,
      windowHeight: finalHeight,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      onclone: (_doc, cloned) => {
        cloned.style.width = `${width}px`
        cloned.style.height = `${finalHeight}px`
        cloned.style.minHeight = `${finalHeight}px`
        cloned.style.overflow = 'visible'
        cloned.style.opacity = '1'
        cloned.style.maxHeight = 'none'
        forceDesktopSplitLayout(cloned)
        stretchThemeToContent(cloned, finalHeight)
        solidifyChipStyles(cloned)
      },
    })

    if (!canvas.width || !canvas.height) {
      throw new Error('Could not capture the preview canvas.')
    }

    const pdf = new jsPDF({
      orientation: HTML2PDF_LIKE_OPTIONS.jsPDF.orientation,
      unit: HTML2PDF_LIKE_OPTIONS.jsPDF.unit,
      format: HTML2PDF_LIKE_OPTIONS.jsPDF.format,
      compress: true,
      hotfixes: ['px_scaling'],
    })

    // Derive page geometry from the same CSS A4 values the preview uses (scaled to canvas)
    const scale = canvas.width / Math.max(1, width)
    const pageHeightPx = Math.max(1, Math.round(pageHeight * scale))

    // Full-height brand column geometry from the live sidebar, scaled to canvas px.
    // Deterministic → the painted overlay always matches the captured sidebar width.
    const sidebarOverlay: SidebarOverlay | null = capturedSidebar
      ? { widthPx: Math.round(capturedSidebar.widthPx * scale), color: capturedSidebar.color }
      : null

    // No fixed plannedBreakYs + searchRadius:0: instead let the composer snap each
    // page break to a quiet row between text lines, so the next page never opens
    // with a sliced half-line remnant.
    addCanvasPagesFullBleed(pdf, canvas, {
      pageHeightPx,
      sidebarOverlay,
    })

    const safeName = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`
    pdf.save(safeName)
  } finally {
    host.remove()
    hidden.forEach(({ el, display }) => {
      el.style.display = display
    })
  }
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

/**
 * Read the brand sidebar column geometry (width in CSS px + solid color) from the
 * live theme so the PDF composer can paint it full-height on every page. Returns
 * null for themes with no `.theme-sidebar` or a near-white (non-brand) sidebar.
 */
function measureSidebarGeometry(root: HTMLElement): { widthPx: number; color: string } | null {
  const el = (
    root.matches?.('.theme-sidebar') ? root : root.querySelector<HTMLElement>('.theme-sidebar')
  ) as HTMLElement | null
  if (!el) return null
  const widthPx = el.offsetWidth
  if (!widthPx) return null
  const bg = getComputedStyle(el).backgroundColor || ''
  const m = bg.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (!m) return null
  const r = Number(m[1]), g = Number(m[2]), b = Number(m[3])
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  if (lum > 0.85) return null // near-white sidebar: no full-height fill needed
  return { widthPx, color: `rgb(${r}, ${g}, ${b})` }
}

/**
 * Skill chips / pills often render faded or empty in html2canvas when they use
 * translucent borders, low-contrast colors, or sit on a clip edge.
 */
function solidifyChipStyles(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('span, div, a, li, p, h1, h2, h3, h4').forEach((el) => {
    el.style.opacity = '1'
    el.style.filter = 'none'
    el.style.webkitTextFillColor = ''
    el.style.mixBlendMode = 'normal'

    const cs = getComputedStyle(el)
    // Force readable text — never near-white on white chips
    const color = cs.color || ''
    const bg = cs.backgroundColor || ''
    if (/rgba?\(\s*255\s*,\s*255\s*,\s*255/i.test(color) && !isDarkBg(bg)) {
      // keep white text only on dark surfaces
    }
    if (isNearWhite(color) && isNearWhite(bg)) {
      el.style.color = '#0f172a'
    }

    // Opaque chip backgrounds (kill /80 /60 translucent borders that wash out)
    if (el.className && /rounded|border|px-2|py-/.test(String(el.className))) {
      if (isNearWhite(bg) || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
        // leave transparent; ensure text is dark
        if (isNearWhite(color) || !color) el.style.color = '#0f172a'
      } else if (/rgba?\([^)]+,\s*0?\.\d+\s*\)/.test(bg)) {
        // translucent bg → solidify
        const rgb = bg.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
        if (rgb) el.style.backgroundColor = `rgb(${rgb[1]}, ${rgb[2]}, ${rgb[3]})`
      }
      el.style.borderColor = el.style.borderColor || '#cbd5e1'
      if (/rgba?\([^)]+,\s*0?\.\d+\s*\)/.test(cs.borderColor || '')) {
        el.style.borderColor = '#94a3b8'
      }
    }
  })
}

function isNearWhite(css: string): boolean {
  const m = css.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (!m) return false
  return Number(m[1]) > 240 && Number(m[2]) > 240 && Number(m[3]) > 240
}

function isDarkBg(css: string): boolean {
  const m = css.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (!m) return false
  const lum = (0.2126 * Number(m[1]) + 0.7152 * Number(m[2]) + 0.0722 * Number(m[3])) / 255
  return lum < 0.45
}

function stretchThemeToContent(root: HTMLElement, targetHeight: number) {
  const theme =
    root.matches?.(
      '.theme-creative-director, .theme-digital-nomad, .theme-engineer, .theme-strategist',
    )
      ? root
      : root.querySelector<HTMLElement>(
          '.theme-creative-director, .theme-digital-nomad, .theme-engineer, .theme-strategist',
        )
  if (!theme) {
    root.style.height = `${targetHeight}px`
    root.style.minHeight = `${targetHeight}px`
    return
  }
  // Explicit height (not only min-height) so %/stretch children fill the column
  theme.style.minHeight = `${targetHeight}px`
  theme.style.height = `${targetHeight}px`
  theme.style.alignItems = 'stretch'
  theme.style.opacity = '1'
  theme.style.overflow = 'visible'

  const sidebar = theme.querySelector<HTMLElement>('.theme-sidebar')
  if (sidebar) {
    const bg = sidebar.style.backgroundColor || getComputedStyle(sidebar).backgroundColor || '#006a61'
    let sideW = 280
    if (theme.classList.contains('theme-creative-director')) sideW = 280
    else if (theme.classList.contains('theme-strategist')) sideW = Math.round((theme.offsetWidth || 794) / 3)
    else if (theme.classList.contains('theme-digital-nomad')) sideW = Math.round((theme.offsetWidth || 794) / 2)
    else sideW = Math.max(sidebar.offsetWidth, 280)

    // CSS gradient strip survives html2canvas better than flex-stretch alone
    theme.style.backgroundColor = '#ffffff'
    theme.style.backgroundImage = `linear-gradient(to right, ${bg} 0, ${bg} ${sideW}px, #ffffff ${sideW}px, #ffffff 100%)`
    theme.style.backgroundRepeat = 'no-repeat'
    theme.style.backgroundSize = '100% 100%'

    sidebar.style.alignSelf = 'stretch'
    sidebar.style.minHeight = `${targetHeight}px`
    sidebar.style.height = `${targetHeight}px`
    sidebar.style.maxHeight = 'none'
    sidebar.style.opacity = '1'
    sidebar.style.width = `${sideW}px`
    sidebar.style.maxWidth = `${sideW}px`
    sidebar.style.flexShrink = '0'
    sidebar.style.backgroundColor = bg
  }
}

function forceDesktopSplitLayout(root: HTMLElement) {
  const themes = root.matches?.(
    '.theme-creative-director, .theme-digital-nomad, .theme-engineer, .theme-strategist',
  )
    ? [root]
    : Array.from(
        root.querySelectorAll<HTMLElement>(
          '.theme-creative-director, .theme-digital-nomad, .theme-engineer, .theme-strategist',
        ),
      )

  for (const theme of themes) {
    theme.style.display = 'flex'
    theme.style.flexDirection = 'row'
    theme.style.alignItems = 'stretch'
    theme.style.height = 'auto'
    theme.style.maxHeight = 'none'
    theme.style.overflow = 'visible'
    theme.style.width = '100%'
    theme.style.opacity = '1'

    const sidebar = theme.querySelector<HTMLElement>('.theme-sidebar')
    if (sidebar) {
      if (theme.classList.contains('theme-creative-director')) {
        sidebar.style.width = '280px'
        sidebar.style.maxWidth = '280px'
      } else if (theme.classList.contains('theme-digital-nomad')) {
        sidebar.style.width = '50%'
        sidebar.style.maxWidth = '50%'
      } else if (theme.classList.contains('theme-strategist')) {
        sidebar.style.width = '33.333%'
        sidebar.style.maxWidth = '33.333%'
      } else {
        sidebar.style.width = sidebar.style.width || '280px'
      }
      sidebar.style.flexShrink = '0'
      sidebar.style.alignSelf = 'stretch'
      sidebar.style.height = 'auto'
      sidebar.style.minHeight = '100%'
      sidebar.style.maxHeight = 'none'
      sidebar.style.opacity = '1'
    }

    const main = sidebar?.nextElementSibling as HTMLElement | null
    if (main) {
      main.style.flex = '1 1 auto'
      main.style.minWidth = '0'
      main.style.width = 'auto'
      main.style.opacity = '1'
    }
  }
}
