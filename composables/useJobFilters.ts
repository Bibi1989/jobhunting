import type { Job } from '~/shared/types/job'

export type SortOption = 'default' | 'salary-high' | 'salary-low'

export function useJobFilters(jobs: Ref<Job[]>, favorites: Ref<Job[]>, showFavorites: Ref<boolean>) {
  const searchQuery = ref('')
  const locationFilter = ref('')
  const minSalaryFilter = ref('')
  const sortOption = ref<SortOption>('default')

  const sourceJobs = computed(() => (showFavorites.value ? favorites.value : jobs.value))

  const filteredJobs = computed(() => {
    let filtered = sourceJobs.value.filter((job) => {
      const q = searchQuery.value.trim().toLowerCase()
      const matchPosition =
        !q ||
        job.title.toLowerCase().includes(q) ||
        (job.company?.toLowerCase().includes(q) ?? false) ||
        (job.description?.toLowerCase().includes(q) ?? false)

      const matchLocation =
        !locationFilter.value ||
        job.location.toLowerCase().includes(locationFilter.value.toLowerCase())

      let matchSalary = true
      if (minSalaryFilter.value !== '') {
        const target = Number(minSalaryFilter.value)
        if (!job.salaryMax && !job.salaryMin) {
          matchSalary = false
        } else {
          const maxPossible = job.salaryMax || job.salaryMin || 0
          matchSalary = maxPossible >= target
        }
      }

      return matchPosition && matchLocation && matchSalary
    })

    if (sortOption.value === 'salary-high') {
      filtered = [...filtered].sort((a, b) => {
        const maxA = Math.max(a.salaryMax || 0, a.salaryMin || 0)
        const maxB = Math.max(b.salaryMax || 0, b.salaryMin || 0)
        return maxB - maxA
      })
    } else if (sortOption.value === 'salary-low') {
      filtered = [...filtered].sort((a, b) => {
        const getMin = (job: Job) => {
          if (job.salaryMin && job.salaryMax) return job.salaryMin
          if (job.salaryMin) return job.salaryMin
          if (job.salaryMax) return job.salaryMax
          return Infinity
        }
        return getMin(a) - getMin(b)
      })
    }

    return filtered
  })

  function clearFilters() {
    searchQuery.value = ''
    locationFilter.value = ''
    minSalaryFilter.value = ''
  }

  return {
    searchQuery,
    locationFilter,
    minSalaryFilter,
    sortOption,
    sourceJobs,
    filteredJobs,
    clearFilters,
  }
}
