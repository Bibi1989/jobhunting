import type { PdfTemplateTheme } from '~/shared/pdf/templates'
import type {
  BuilderAccentTargets,
  BuilderDesignSettings,
  BuilderResumeData,
} from '~/shared/types/builder'
import { DEFAULT_ACCENT_TARGETS, DEFAULT_DESIGN_SETTINGS } from '~/shared/types/builder'
import { fontFacesForFamily, type PdfFontFaces } from '~/shared/pdf/googleFonts'

export type { PdfFontFaces }
export { fontFacesForFamily }

export function normalizeDesign(design?: BuilderDesignSettings | null): BuilderDesignSettings {
  const accentTargets: BuilderAccentTargets = {
    ...DEFAULT_ACCENT_TARGETS,
    ...(design?.accentTargets || {}),
  }
  return {
    ...DEFAULT_DESIGN_SETTINGS,
    ...(design || {}),
    accentTargets,
  }
}

export function resolveDesign(data: Pick<BuilderResumeData, 'design' | 'themeColor' | 'fontSize'>): BuilderDesignSettings {
  const design = normalizeDesign(data.design)
  if (!design.accentColor && data.themeColor) {
    design.accentColor = data.themeColor
  }
  if (design.bodyFontSize == null && data.fontSize != null) {
    design.bodyFontSize = data.fontSize
  }
  // Migrate older headerBackgroundColor into headerColor when unset
  if (!design.headerColor && design.headerBackgroundColor) {
    design.headerColor = design.headerBackgroundColor
  }
  return design
}

export function pickAccent(
  design: BuilderDesignSettings,
  target: keyof BuilderAccentTargets,
  fallback: string,
): string {
  const color = (design.accentColor || '').trim()
  if (!color) return fallback
  const enabled = design.accentTargets?.[target] ?? DEFAULT_ACCENT_TARGETS[target]
  return enabled ? color : fallback
}

/** Effective header band color: explicit header color, or accent when headerBackground target is on. */
export function resolveHeaderBandColor(design: BuilderDesignSettings, fallback: string): string {
  const explicit = (design.headerColor || design.headerBackgroundColor || '').trim()
  if (explicit) return explicit
  return pickAccent(design, 'headerBackground', fallback)
}

/** Merge user design colors onto a template theme. */
export function applyDesignToTheme(
  base: PdfTemplateTheme,
  design: BuilderDesignSettings,
): PdfTemplateTheme {
  const paper = (design.backgroundColor || '').trim() || base.paper
  const ink = (design.bodyTextColor || '').trim() || base.ink
  const brandFromSection = (design.sectionTitleColor || '').trim()
  const brand = brandFromSection || pickAccent(design, 'headings', base.brand)
  const accent = pickAccent(design, 'headings', base.accent || base.brand)

  return {
    ...base,
    paper,
    ink,
    muted: ink === base.ink ? base.muted : ink,
    brand,
    accent,
  }
}

export function photoBorderRadiusPx(
  size: number,
  design: BuilderDesignSettings,
): number {
  const shape = design.photoShape || 'circle'
  if (shape === 'circle') return size / 2
  if (shape === 'square') return 0
  const pct = Math.min(100, Math.max(0, Number(design.photoBorderRadius ?? 25)))
  return (pct / 100) * (size / 2)
}

export function resolvePhotoSize(design: BuilderDesignSettings): number {
  const n = Number(design.photoSize ?? 56)
  return Math.min(120, Math.max(32, Number.isFinite(n) ? n : 56))
}

export function detailsSeparatorChar(design: BuilderDesignSettings): string {
  const sep = design.detailsSeparator || 'bullet'
  if (sep === 'bar') return '|'
  if (sep === 'icon') return '•'
  return '·'
}
