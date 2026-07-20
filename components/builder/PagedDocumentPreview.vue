<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted } from 'vue'
import { pageContentBandPx, pageEdgeMarginPx } from '~/utils/pdfPageLayout'

const props = defineProps<{
  watchKey?: unknown
  /** When false, skip forcing a white min-height paper fill. */
  paperFill?: boolean
  /** Gap between discrete preview pages (px). */
  pageGap?: number
}>()

const contentRef = ref<HTMLElement | null>(null)
const pageSheetRefs = ref<HTMLElement[]>([])
const mirrorHtml = ref('')
const sidebarChrome = ref<{ widthPct: number; background: string } | null>(null)
const { pageCount, pageHeightPx, contentHeightPx, breakYs, measure } = useA4PageCount(contentRef)

const gap = computed(() => props.pageGap ?? 28)
const edgeMargin = computed(() => pageEdgeMarginPx(pageHeightPx.value))
const contentBand = computed(() => pageContentBandPx(pageHeightPx.value))
/** Extra sheets after page 1 (mirrors only). */
const mirrorPages = computed(() =>
  Array.from({ length: Math.max(0, pageCount.value - 1) }, (_, i) => i + 1),
)

/**
 * Each sheet shows exactly [breakYs[i], breakYs[i+1]) so early snaps never
 * duplicate content and late clips never slice mid-line.
 */
function pageSlice(pageIndex: number): { offset: number; height: number } {
  const ys = breakYs.value
  const start = ys[pageIndex] ?? pageIndex * contentBand.value
  const next = ys[pageIndex + 1]
  const end =
    next ??
    Math.max(
      start + 1,
      contentHeightPx.value || start + contentBand.value,
    )
  let height = Math.max(1, Math.min(contentBand.value, end - start))
  // Full A4 content band on page 1 so paper background isn't clipped to text height.
  if (pageIndex === 0 && props.paperFill !== false) {
    height = contentBand.value
  }
  return { offset: start, height }
}

function setPageSheetRef(el: unknown, index: number) {
  const node = el as HTMLElement | null
  if (!node) return
  pageSheetRefs.value[index] = node
}

function getPageSheets(): HTMLElement[] {
  const root = contentRef.value?.closest('.pdf-preview-stack') as HTMLElement | null
  if (root) {
    return Array.from(root.querySelectorAll<HTMLElement>('[data-pdf-page]'))
  }
  return pageSheetRefs.value.filter(Boolean)
}

function findSplitTheme(root: HTMLElement): HTMLElement | null {
  if (
    root.matches?.(
      '.theme-creative-director, .theme-digital-nomad, .theme-engineer, .theme-strategist',
    )
  ) {
    return root
  }
  return root.querySelector<HTMLElement>(
    '.theme-creative-director, .theme-digital-nomad, .theme-engineer, .theme-strategist',
  )
}

/**
 * Stretch brand sidebars to full document height and paint a continuous column
 * background on the theme root so page 2+ slices keep the same two-column look.
 * Scoped to split themes only — single-column templates are untouched.
 */
function syncSidebarChrome() {
  const root = contentRef.value
  const side = root?.querySelector('.theme-sidebar') as HTMLElement | null
  if (!root || !side) {
    sidebarChrome.value = null
    return
  }

  const fullH = Math.max(root.scrollHeight, root.offsetHeight, contentHeightPx.value || 0)
  const theme = findSplitTheme(root)
  const sideW = Math.max(1, side.offsetWidth)
  const widthPct = Math.min(48, Math.max(8, (sideW / Math.max(1, root.offsetWidth)) * 100))

  let background = side.style.backgroundColor || getComputedStyle(side).backgroundColor || ''
  const m = background.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (m) {
    const lum = (0.2126 * Number(m[1]) + 0.7152 * Number(m[2]) + 0.0722 * Number(m[3])) / 255
    if (lum > 0.85) {
      // Light sidebars (e.g. corporate left rail) — do not invent brand chrome.
      sidebarChrome.value = null
      if (theme) {
        theme.style.backgroundImage = ''
        theme.style.backgroundSize = ''
      }
      return
    }
    background = `rgb(${m[1]}, ${m[2]}, ${m[3]})`
  } else if (theme?.classList.contains('theme-creative-director')) {
    background = '#006a61'
  } else {
    sidebarChrome.value = null
    return
  }

  if (fullH > 0) {
    root.style.minHeight = `${fullH}px`
    side.style.minHeight = `${fullH}px`
    side.style.height = `${fullH}px`
    side.style.alignSelf = 'stretch'
    side.style.flexShrink = '0'
    side.style.backgroundColor = background

    if (theme) {
      theme.style.minHeight = `${fullH}px`
      theme.style.alignItems = 'stretch'
      theme.style.display = 'flex'
      theme.style.flexDirection = 'row'
      // Continuous brand column under/alongside content (same trick as PDF export).
      theme.style.backgroundColor = '#ffffff'
      theme.style.backgroundImage = `linear-gradient(to right, ${background} 0, ${background} ${sideW}px, #ffffff ${sideW}px, #ffffff 100%)`
      theme.style.backgroundRepeat = 'no-repeat'
      theme.style.backgroundSize = '100% 100%'
      // Keep the white paper on the main column only so chrome isn't covered.
      const main = theme.querySelector(':scope > .flex-1, :scope > main, :scope > div:not(.theme-sidebar)') as HTMLElement | null
      if (main && !main.classList.contains('theme-sidebar')) {
        main.style.backgroundColor = '#ffffff'
      }
    }
  }

  sidebarChrome.value = { widthPct, background }
}

/** Paint page sheet with theme paper color; do not stretch content past natural height. */
function syncPaperFill() {
  if (props.paperFill === false) return
  const root = contentRef.value
  if (!root) return

  // Cap fill to one A4 content band — never grow with scrollHeight (that caused
  // cover-letter backgrounds to expand endlessly).
  const band = contentBand.value
  if (band <= 0) return

  root.style.minHeight = `${band}px`

  const themeRoot = root.firstElementChild as HTMLElement | null
  let paperColor = '#ffffff'
  if (themeRoot) {
    const probe =
      (themeRoot.firstElementChild as HTMLElement | null) &&
      getComputedStyle(themeRoot.firstElementChild as HTMLElement).backgroundColor !== 'rgba(0, 0, 0, 0)'
        ? (themeRoot.firstElementChild as HTMLElement)
        : themeRoot
    const bg = getComputedStyle(probe).backgroundColor
    const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?/)
    if (m) {
      const alpha = m[4] !== undefined ? Number(m[4]) : 1
      if (alpha >= 0.2) paperColor = `rgb(${m[1]}, ${m[2]}, ${m[3]})`
    }
    // Fill only the theme root to the A4 band — not nested scrollHeights.
    themeRoot.style.minHeight = `${band}px`
    themeRoot.style.boxSizing = 'border-box'
  }

  for (const sheet of getPageSheets()) {
    sheet.style.backgroundColor = paperColor
  }
}

function syncMirrors() {
  const el = contentRef.value
  syncSidebarChrome()
  syncPaperFill()
  if (!el || pageCount.value <= 1) {
    mirrorHtml.value = ''
    return
  }
  // Re-clone after stretch so mirrored pages include full-height sidebar markup.
  mirrorHtml.value = el.innerHTML
}

async function remasure() {
  await nextTick()
  measure()
  await nextTick()
  syncMirrors()
  // Second pass: stretch may change height slightly
  await nextTick()
  measure()
  syncMirrors()
}

defineExpose({
  contentEl: contentRef,
  getPageSheets,
  pageCount,
  pageHeightPx,
  breakYs,
  measure: remasure,
})

watch(
  () => props.watchKey,
  () => {
    void remasure()
  },
  { deep: true },
)

watch(pageCount, () => {
  void nextTick().then(syncMirrors)
})

onMounted(() => {
  void remasure()
})
</script>

<template>
  <div class="pdf-preview-stack w-full max-w-[210mm] flex flex-col items-stretch">
    <div
      v-if="pageCount > 1"
      class="mb-3 flex items-center justify-between gap-3 text-xs text-slate-300 no-print"
    >
      <span class="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-900/70 px-3 py-1 font-semibold tracking-wide">
        <span class="material-symbols-outlined text-[14px] text-blue-400">layers</span>
        {{ pageCount }} pages in preview
      </span>
    </div>

    <div class="flex flex-col items-stretch" :style="{ gap: `${gap}px` }">
      <!-- Page 1 — live content, clipped to first planned slice -->
      <div
        :ref="(el) => setPageSheetRef(el, 0)"
        data-pdf-page="1"
        class="relative w-full overflow-hidden rounded-sm shadow-2xl bg-white"
        :style="{ height: `${pageHeightPx}px` }"
      >
        <!-- Full-bleed sidebar chrome under content (covers empty stretch on pages 2+) -->
        <div
          v-if="sidebarChrome"
          class="absolute left-0 top-0 bottom-0 z-[1] pointer-events-none"
          :style="{ width: `${sidebarChrome.widthPct}%`, background: sidebarChrome.background }"
          aria-hidden="true"
        />
        <div
          class="absolute left-0 right-0 overflow-hidden z-[2]"
          :style="{
            top: `${edgeMargin}px`,
            height: `${pageSlice(0).height}px`,
          }"
        >
          <div
            ref="contentRef"
            class="preview-content relative z-10 w-full bg-transparent flex flex-col"
            :style="paperFill === false ? undefined : { minHeight: `${contentBand}px` }"
          >
            <slot />
          </div>
        </div>
      </div>

      <!-- Pages 2+ — mirrored snapshots sliced to matching break offsets -->
      <div
        v-for="page in mirrorPages"
        :key="`sheet-${page + 1}`"
        :ref="(el) => setPageSheetRef(el, page)"
        :data-pdf-page="page + 1"
        class="relative w-full overflow-hidden rounded-sm shadow-2xl bg-white"
        :style="{ height: `${pageHeightPx}px` }"
      >
        <div
          v-if="sidebarChrome"
          class="absolute left-0 top-0 bottom-0 z-[1] pointer-events-none"
          :style="{ width: `${sidebarChrome.widthPct}%`, background: sidebarChrome.background }"
          aria-hidden="true"
        />
        <div
          class="absolute left-0 right-0 overflow-hidden z-[2]"
          :style="{
            top: `${edgeMargin}px`,
            height: `${pageSlice(page).height}px`,
          }"
        >
          <div
            class="absolute left-0 top-0 w-full preview-content pointer-events-none bg-transparent"
            :style="{ marginTop: `-${pageSlice(page).offset}px`, transform: 'none' }"
            aria-hidden="true"
            v-html="mirrorHtml"
          />
        </div>
      </div>
    </div>
  </div>
</template>
