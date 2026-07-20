import { useLocalStorage } from '@vueuse/core'
import type { Job } from '~/shared/types/job'
import { useJobMaterials } from './useJobMaterials'

const STORAGE_KEY = 'scrape-engine-favorites'

export function useFavorites() {
  const favorites = useLocalStorage<Job[]>(STORAGE_KEY, [])
  const { saveMaterials, getMaterials, removeMaterials } = useJobMaterials()

  function isFavorite(job: Job) {
    return favorites.value.some((f) => f.url === job.url)
  }

  function toggleFavorite(
    job: Job,
    tailored?: { resume?: string | null; coverLetter?: string | null; cvFormat?: string },
  ) {
    if (isFavorite(job)) {
      favorites.value = favorites.value.filter((f) => f.url !== job.url)
      return
    }

    if (!favorites.value.some((f) => f.url === job.url)) {
      favorites.value = [...favorites.value, job]
    }

    if (tailored?.resume || tailored?.coverLetter) {
      saveMaterials(job, tailored)
    }
  }

  function saveJobWithMaterials(
    job: Job,
    tailored: { resume?: string | null; coverLetter?: string | null; cvFormat?: string },
  ) {
    if (!isFavorite(job)) {
      favorites.value = [...favorites.value, job]
    }
    return saveMaterials(job, tailored)
  }

  function removeFavorite(job: Job, removeTailored = false) {
    favorites.value = favorites.value.filter((f) => f.url !== job.url)
    if (removeTailored) removeMaterials(job)
  }

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    saveJobWithMaterials,
    removeFavorite,
    getMaterials,
  }
}
