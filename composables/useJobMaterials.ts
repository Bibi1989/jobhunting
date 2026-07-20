import { useLocalStorage } from '@vueuse/core'
import type { Job } from '~/shared/types/job'

export interface JobTailoredMaterials {
  resume: string
  coverLetter: string
  cvFormat: string
  updatedAt: string
}

const STORAGE_KEY = 'scrape-engine-job-materials'

export function useJobMaterials() {
  const materialsByUrl = useLocalStorage<Record<string, JobTailoredMaterials>>(STORAGE_KEY, {})

  function jobKey(job: Pick<Job, 'url' | 'id'>) {
    return job.url || job.id || ''
  }

  function getMaterials(job: Pick<Job, 'url' | 'id'>): JobTailoredMaterials | null {
    const key = jobKey(job)
    if (!key) return null
    return materialsByUrl.value[key] || null
  }

  function hasMaterials(job: Pick<Job, 'url' | 'id'>) {
    const saved = getMaterials(job)
    return Boolean(saved?.resume || saved?.coverLetter)
  }

  function saveMaterials(
    job: Pick<Job, 'url' | 'id'>,
    input: { resume?: string | null; coverLetter?: string | null; cvFormat?: string },
  ) {
    const key = jobKey(job)
    if (!key) return null

    const resume = (input.resume || '').trim()
    const coverLetter = (input.coverLetter || '').trim()
    if (!resume && !coverLetter) return null

    const next: JobTailoredMaterials = {
      resume,
      coverLetter,
      cvFormat: input.cvFormat || 'classic-professional',
      updatedAt: new Date().toISOString(),
    }

    materialsByUrl.value = {
      ...materialsByUrl.value,
      [key]: next,
    }

    return next
  }

  function removeMaterials(job: Pick<Job, 'url' | 'id'>) {
    const key = jobKey(job)
    if (!key || !materialsByUrl.value[key]) return
    const next = { ...materialsByUrl.value }
    delete next[key]
    materialsByUrl.value = next
  }

  return {
    materialsByUrl,
    getMaterials,
    hasMaterials,
    saveMaterials,
    removeMaterials,
  }
}
