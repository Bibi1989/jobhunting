import { Font } from '@react-pdf/renderer'

export type PdfFontFaces = {
  regular: string
  bold: string
  italic: string
  boldItalic: string
  useWeight?: boolean
}

export type GoogleFontOption = {
  id: string
  label: string
  /** fontsource package slug on jsDelivr */
  slug: string
  /** Built-in PDF standard font (no network). */
  builtin?: 'helvetica' | 'times' | 'courier'
}

/**
 * Curated Google Fonts + built-ins for the resume/cover design dropdown.
 * TTF files load from jsDelivr fontsource CDN when generating PDFs.
 */
export const GOOGLE_FONT_OPTIONS: GoogleFontOption[] = [
  { id: 'Inter', label: 'Inter', slug: 'inter' },
  { id: 'Roboto', label: 'Roboto', slug: 'roboto' },
  { id: 'Open Sans', label: 'Open Sans', slug: 'open-sans' },
  { id: 'Lato', label: 'Lato', slug: 'lato' },
  { id: 'Montserrat', label: 'Montserrat', slug: 'montserrat' },
  { id: 'Poppins', label: 'Poppins', slug: 'poppins' },
  { id: 'Nunito', label: 'Nunito', slug: 'nunito' },
  { id: 'Raleway', label: 'Raleway', slug: 'raleway' },
  { id: 'Source Sans 3', label: 'Source Sans 3', slug: 'source-sans-3' },
  { id: 'IBM Plex Sans', label: 'IBM Plex Sans', slug: 'ibm-plex-sans' },
  { id: 'Space Grotesk', label: 'Space Grotesk', slug: 'space-grotesk' },
  { id: 'Work Sans', label: 'Work Sans', slug: 'work-sans' },
  { id: 'DM Sans', label: 'DM Sans', slug: 'dm-sans' },
  { id: 'Merriweather', label: 'Merriweather', slug: 'merriweather' },
  { id: 'Lora', label: 'Lora', slug: 'lora' },
  { id: 'Playfair Display', label: 'Playfair Display', slug: 'playfair-display' },
  { id: 'PT Serif', label: 'PT Serif', slug: 'pt-serif' },
  { id: 'Libre Baskerville', label: 'Libre Baskerville', slug: 'libre-baskerville' },
  { id: 'helvetica', label: 'Helvetica (built-in)', slug: '', builtin: 'helvetica' },
  { id: 'times', label: 'Times (built-in)', slug: '', builtin: 'times' },
  { id: 'courier', label: 'Courier (built-in)', slug: '', builtin: 'courier' },
]

const registered = new Set<string>()

function fontUrl(slug: string, weight: 400 | 700, style: 'normal' | 'italic') {
  const styleKey = style === 'italic' ? 'italic' : 'normal'
  return `https://cdn.jsdelivr.net/fontsource/fonts/${slug}@latest/latin-${weight}-${styleKey}.ttf`
}

export function isBuiltinFont(family: string): family is 'helvetica' | 'times' | 'courier' {
  return family === 'helvetica' || family === 'times' || family === 'courier'
}

export function fontFacesForFamily(family = 'Inter'): PdfFontFaces {
  if (family === 'times') {
    return {
      regular: 'Times-Roman',
      bold: 'Times-Bold',
      italic: 'Times-Italic',
      boldItalic: 'Times-BoldItalic',
    }
  }
  if (family === 'courier') {
    return {
      regular: 'Courier',
      bold: 'Courier-Bold',
      italic: 'Courier-Oblique',
      boldItalic: 'Courier-BoldOblique',
    }
  }
  if (family === 'helvetica') {
    return {
      regular: 'Helvetica',
      bold: 'Helvetica-Bold',
      italic: 'Helvetica-Oblique',
      boldItalic: 'Helvetica-BoldOblique',
    }
  }
  return {
    regular: family,
    bold: family,
    italic: family,
    boldItalic: family,
    useWeight: true,
  }
}

/** Register a Google font family with @react-pdf (idempotent). */
export function ensureFontRegistered(family: string) {
  if (!family || isBuiltinFont(family) || registered.has(family)) return

  const opt = GOOGLE_FONT_OPTIONS.find((f) => f.id === family)
  const slug = opt?.slug
  if (!slug) {
    // Unknown family — fall back to Helvetica at call sites via faces
    return
  }

  try {
    Font.register({
      family,
      fonts: [
        { src: fontUrl(slug, 400, 'normal'), fontWeight: 400, fontStyle: 'normal' },
        { src: fontUrl(slug, 700, 'normal'), fontWeight: 700, fontStyle: 'normal' },
        { src: fontUrl(slug, 400, 'italic'), fontWeight: 400, fontStyle: 'italic' },
        { src: fontUrl(slug, 700, 'italic'), fontWeight: 700, fontStyle: 'italic' },
      ],
    })
    registered.add(family)
  } catch (err) {
    console.warn(`[pdf] Failed to register font ${family}`, err)
  }
}
