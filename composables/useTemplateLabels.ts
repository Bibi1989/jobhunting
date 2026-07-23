/**
 * Localized labels for builder template catalog entries.
 * Falls back to English catalog strings when a key is missing.
 */
export function useTemplateLabels() {
  const { t, te } = useI18n()

  function coverLetterLabel(id: string, field: 'name' | 'desc', fallback: string) {
    const key = `builderTemplates.coverLetter.${id}.${field}`
    return te(key) ? t(key) : fallback
  }

  function resumeDesc(id: string, fallback: string) {
    const key = `builderTemplates.resumeDesc.${id}`
    return te(key) ? t(key) : fallback
  }

  return { coverLetterLabel, resumeDesc }
}
