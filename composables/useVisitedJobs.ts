import { useLocalStorage } from '@vueuse/core'

const STORAGE_KEY = 'scrape-engine-visited'

export function useVisitedJobs() {
  const visitedJobs = useLocalStorage<Record<string, number>>(STORAGE_KEY, {})

  function markVisited(url: string) {
    visitedJobs.value = { ...visitedJobs.value, [url]: Date.now() }
  }

  return { visitedJobs, markVisited }
}
