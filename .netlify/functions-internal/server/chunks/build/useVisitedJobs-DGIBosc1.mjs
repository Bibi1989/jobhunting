import { useLocalStorage } from '@vueuse/core';

const STORAGE_KEY$2 = "scrape-engine-job-materials";
function useJobMaterials() {
  const materialsByUrl = useLocalStorage(STORAGE_KEY$2, {});
  function jobKey(job) {
    return job.url || job.id || "";
  }
  function getMaterials(job) {
    const key = jobKey(job);
    if (!key) return null;
    return materialsByUrl.value[key] || null;
  }
  function hasMaterials(job) {
    const saved = getMaterials(job);
    return Boolean((saved == null ? void 0 : saved.resume) || (saved == null ? void 0 : saved.coverLetter));
  }
  function saveMaterials(job, input) {
    const key = jobKey(job);
    if (!key) return null;
    const resume = (input.resume || "").trim();
    const coverLetter = (input.coverLetter || "").trim();
    if (!resume && !coverLetter) return null;
    const next = {
      resume,
      coverLetter,
      cvFormat: input.cvFormat || "classic-professional",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    materialsByUrl.value = {
      ...materialsByUrl.value,
      [key]: next
    };
    return next;
  }
  function removeMaterials(job) {
    const key = jobKey(job);
    if (!key || !materialsByUrl.value[key]) return;
    const next = { ...materialsByUrl.value };
    delete next[key];
    materialsByUrl.value = next;
  }
  return {
    materialsByUrl,
    getMaterials,
    hasMaterials,
    saveMaterials,
    removeMaterials
  };
}
const STORAGE_KEY$1 = "scrape-engine-favorites";
function useFavorites() {
  const favorites = useLocalStorage(STORAGE_KEY$1, []);
  const { saveMaterials, getMaterials, removeMaterials } = useJobMaterials();
  function isFavorite(job) {
    return favorites.value.some((f) => f.url === job.url);
  }
  function toggleFavorite(job, tailored) {
    if (isFavorite(job)) {
      favorites.value = favorites.value.filter((f) => f.url !== job.url);
      return;
    }
    if (!favorites.value.some((f) => f.url === job.url)) {
      favorites.value = [...favorites.value, job];
    }
    if ((tailored == null ? void 0 : tailored.resume) || (tailored == null ? void 0 : tailored.coverLetter)) {
      saveMaterials(job, tailored);
    }
  }
  function saveJobWithMaterials(job, tailored) {
    if (!isFavorite(job)) {
      favorites.value = [...favorites.value, job];
    }
    return saveMaterials(job, tailored);
  }
  function removeFavorite(job, removeTailored = false) {
    favorites.value = favorites.value.filter((f) => f.url !== job.url);
    if (removeTailored) removeMaterials(job);
  }
  return {
    favorites,
    isFavorite,
    toggleFavorite,
    saveJobWithMaterials,
    removeFavorite,
    getMaterials
  };
}
const STORAGE_KEY = "scrape-engine-visited";
function useVisitedJobs() {
  const visitedJobs = useLocalStorage(STORAGE_KEY, {});
  function markVisited(url) {
    visitedJobs.value = { ...visitedJobs.value, [url]: Date.now() };
  }
  return { visitedJobs, markVisited };
}

export { useJobMaterials as a, useVisitedJobs as b, useFavorites as u };
//# sourceMappingURL=useVisitedJobs-DGIBosc1.mjs.map
