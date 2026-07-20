import { ref, watch, onMounted, onBeforeUnmount, type Ref } from 'vue'
import {
  MINOR_OVERFLOW_THRESHOLD,
  planPageBreaks,
} from '~/utils/pdfPageLayout'

/** Normalize Vue ref values (including accidental v-for arrays) to a single Element. */
function resolveElement(value: unknown): HTMLElement | null {
  if (value instanceof HTMLElement) return value
  if (Array.isArray(value)) {
    for (const item of value) {
      if (item instanceof HTMLElement) return item
    }
  }
  return null
}

/**
 * Measure how many A4 pages a preview element spans.
 * Breaks snap to block boundaries so sheets never clip mid-line.
 */
export function useA4PageCount(elementRef: Ref<HTMLElement | null>) {
  const pageCount = ref(1)
  const pageHeightPx = ref(1123)
  const contentHeightPx = ref(0)
  /** Page-start Y offsets in content px. */
  const breakYs = ref<number[]>([0])

  let observer: ResizeObserver | null = null
  let raf = 0
  let observed: Element | null = null

  function measure() {
    const el = resolveElement(elementRef.value)
    if (!el) return
    const plan = planPageBreaks(el, {
      minorOverflowThreshold: MINOR_OVERFLOW_THRESHOLD,
    })
    pageHeightPx.value = plan.pageHeightPx
    contentHeightPx.value = plan.contentHeightPx
    pageCount.value = plan.pageCount
    breakYs.value = plan.breakYs.length ? plan.breakYs : [0]
  }

  function scheduleMeasure() {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(measure)
  }

  function observeEl(el: HTMLElement | null) {
    if (!observer) return
    if (observed && observed !== el) {
      try {
        observer.unobserve(observed)
      } catch {
        /* element may already be detached */
      }
      observed = null
    }
    if (el && el !== observed) {
      observer.observe(el)
      observed = el
    }
  }

  onMounted(() => {
    scheduleMeasure()
    observer = new ResizeObserver(scheduleMeasure)
    observeEl(resolveElement(elementRef.value))
    window.addEventListener('resize', scheduleMeasure)
  })

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf)
    observer?.disconnect()
    observer = null
    observed = null
    window.removeEventListener('resize', scheduleMeasure)
  })

  watch(elementRef, () => {
    observeEl(resolveElement(elementRef.value))
    scheduleMeasure()
  })

  return { pageCount, pageHeightPx, contentHeightPx, breakYs, measure: scheduleMeasure }
}
