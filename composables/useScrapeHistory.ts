import { useLocalStorage } from '@vueuse/core'

const STORAGE_KEY = 'scrape-engine-history'
const MAX_HISTORY = 10

export function useScrapeHistory() {
  const history = useLocalStorage<string[]>(STORAGE_KEY, [])
  const showDropdown = ref(false)

  function addToHistory(url: string) {
    history.value = [url, ...history.value.filter((h) => h !== url)].slice(0, MAX_HISTORY)
  }

  return { history, showDropdown, addToHistory }
}
