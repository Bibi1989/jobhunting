import { _ as __nuxt_component_0 } from './nuxt-link-Cuf_TjgJ.mjs';
import { s as sanitizeRichTextHtml, _ as __nuxt_component_3$1 } from './RichTextEditor-BGtrDWMw.mjs';
import { defineComponent, ref, computed, mergeProps, withCtx, createTextVNode, unref, createVNode, watch, nextTick, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderAttr, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderStyle, ssrRenderSlot } from 'vue/server-renderer';
import { _ as _export_sfc, u as useAppToast, a as useSaaS } from './server.mjs';
import { useRoute, useRouter } from 'vue-router';
import { c as coverLetterTemplates } from './templates-CJ0hEBg_.mjs';
import '../nitro/nitro.mjs';
import '@google/genai';
import 'node:fs/promises';
import 'node:path';
import 'mammoth';
import 'cheerio';
import '@react-pdf/primitives';
import 'buffer';
import '@react-pdf/font';
import '@react-pdf/render';
import '@react-pdf/pdfkit';
import '@react-pdf/layout';
import '@react-pdf/fns';
import '@react-pdf/reconciler';
import 'node:stream';
import 'stripe';
import 'pg';
import 'node:crypto';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'unhead';
import '@unhead/shared';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_HEIGHT_RATIO = A4_HEIGHT_MM / A4_WIDTH_MM;
const MINOR_OVERFLOW_THRESHOLD = 0.05;
const HTML2PDF_LIKE_OPTIONS = {
  pagebreak: {
    mode: ["avoid-all", "css"],
    // Keep this list tight — avoiding `ul`/`section`/`li` leaves huge empty page bottoms.
    avoid: [".pdf-avoid-break", "h1", "h2", "h3", "tr"]
  }
};
const AVOID_BREAK_SELECTORS = HTML2PDF_LIKE_OPTIONS.pagebreak.avoid.join(", ");
function measureContentHeightPx(root) {
  const rootRect = root.getBoundingClientRect();
  let bottom = 0;
  const nodes = root.querySelectorAll("*:not(.no-print):not(.no-print *)");
  for (const node of nodes) {
    const text = (node.innerText || "").replace(/\u00a0/g, " ").trim();
    const hasMedia = Boolean(node.querySelector("img, svg, canvas"));
    if (!text && !hasMedia && node.children.length === 0) continue;
    const rect = node.getBoundingClientRect();
    if (rect.height < 1 && rect.width < 1) continue;
    bottom = Math.max(bottom, rect.bottom - rootRect.top);
  }
  if (bottom < 1) {
    for (const child of Array.from(root.children)) {
      if (child.classList.contains("no-print")) continue;
      bottom = Math.max(bottom, child.offsetTop + child.offsetHeight);
    }
  }
  return Math.max(bottom, 0);
}
function pageEdgeMarginPx(pageHeightPx) {
  return 0;
}
function pageContentBandPx(pageHeightPx) {
  const margin = pageEdgeMarginPx();
  return Math.max(1, pageHeightPx - 2 * margin);
}
function a4PageHeightPx(widthPx) {
  return Math.max(1, widthPx * A4_HEIGHT_RATIO);
}
function collectAvoidBreakBlocks(root, selector) {
  const rootRect = root.getBoundingClientRect();
  const nodes = Array.from(root.querySelectorAll(selector));
  const boxes = [];
  for (const el of nodes) {
    if (el.closest(".no-print")) continue;
    if (nodes.some((other) => other !== el && other.contains(el))) continue;
    const rect = el.getBoundingClientRect();
    if (rect.height < 2) continue;
    boxes.push({
      top: rect.top - rootRect.top,
      bottom: rect.bottom - rootRect.top
    });
  }
  boxes.sort((a, b) => a.top - b.top);
  return boxes;
}
const SAFE_BREAK_SELECTOR = [
  "li",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "tr",
  "header",
  "section",
  "article",
  ".pdf-avoid-break"
].join(", ");
function collectFlowBlocks(root) {
  const rootRect = root.getBoundingClientRect();
  const nodes = Array.from(root.querySelectorAll(SAFE_BREAK_SELECTOR));
  const boxes = [];
  for (const el of nodes) {
    if (el.closest(".no-print")) continue;
    if (nodes.some((other) => other !== el && el.contains(other))) continue;
    const rect = el.getBoundingClientRect();
    if (rect.height < 2) continue;
    boxes.push({
      top: rect.top - rootRect.top,
      bottom: rect.bottom - rootRect.top
    });
  }
  boxes.sort((a, b) => a.top - b.top || a.bottom - b.bottom);
  return boxes;
}
function snapBreakToBlockBoundary(pageStart, idealEnd, band, blocks, contentHeightPx) {
  const minFill = pageStart + Math.floor(band * 0.42);
  const straddling = blocks.find(
    (b) => b.top < idealEnd - 0.5 && b.bottom > idealEnd + 0.5
  );
  if (straddling) {
    const blockH = straddling.bottom - straddling.top;
    if (blockH > band * 0.95) {
      return Math.min(idealEnd, contentHeightPx);
    }
    if (straddling.top >= pageStart - 0.5) {
      if (straddling.top > pageStart + 8) {
        return Math.min(Math.max(straddling.top, pageStart + 1), contentHeightPx);
      }
    } else {
      if (straddling.bottom <= pageStart + band + 1 && straddling.bottom - pageStart >= Math.floor(band * 0.35)) {
        return Math.min(straddling.bottom, contentHeightPx);
      }
      return Math.min(idealEnd, contentHeightPx);
    }
  }
  let best = idealEnd;
  for (const b of blocks) {
    if (b.bottom <= pageStart + 1) continue;
    if (b.top > idealEnd) break;
    if (b.bottom <= idealEnd && b.bottom >= minFill) best = b.bottom;
    else if (b.top <= idealEnd && b.top >= minFill) best = b.top;
  }
  return Math.min(Math.max(best, pageStart + Math.floor(band * 0.35)), contentHeightPx);
}
function planPageBreaks(root, options = {}) {
  var _a, _b, _c, _d;
  const width = Math.max(root.offsetWidth, root.clientWidth, 1);
  const pageHeightPx = (_a = options.pageHeightPx) != null ? _a : a4PageHeightPx(width);
  const threshold = (_b = options.minorOverflowThreshold) != null ? _b : MINOR_OVERFLOW_THRESHOLD;
  const modes = (_c = options.pagebreakMode) != null ? _c : HTML2PDF_LIKE_OPTIONS.pagebreak.mode;
  const useAvoid = modes.includes("avoid-all") || modes.includes("css");
  const selector = (_d = options.avoidBreakSelector) != null ? _d : AVOID_BREAK_SELECTORS;
  const contentHeightPx = measureContentHeightPx(root);
  const band = pageContentBandPx(pageHeightPx);
  const breakYs = [0];
  if (contentHeightPx <= band + Math.max(24, band * threshold)) {
    return { breakYs, pageCount: 1, pageHeightPx, contentHeightPx };
  }
  const flowBlocks = collectFlowBlocks(root);
  const avoidBlocks = useAvoid ? collectAvoidBreakBlocks(root, selector) : [];
  let pageStart = 0;
  while (pageStart + band < contentHeightPx - Math.max(24, band * threshold)) {
    let boundary = snapBreakToBlockBoundary(
      pageStart,
      pageStart + band,
      band,
      flowBlocks,
      contentHeightPx
    );
    if (useAvoid) {
      const straddling = avoidBlocks.find(
        (b) => b.top < boundary - 1 && b.bottom > boundary + 1
      );
      if (straddling) {
        const blockH = straddling.bottom - straddling.top;
        if (blockH <= band * 0.22 && straddling.top > pageStart + band * 0.55 && boundary - straddling.top <= band * 0.18) {
          boundary = straddling.top;
        }
      }
    }
    const nextStart = Math.min(
      Math.max(boundary, pageStart + Math.floor(band * 0.35)),
      contentHeightPx
    );
    if (nextStart <= pageStart + 1) break;
    breakYs.push(nextStart);
    pageStart = nextStart;
  }
  return {
    breakYs,
    pageCount: Math.max(1, breakYs.length),
    pageHeightPx,
    contentHeightPx
  };
}
function resolveElement(value) {
  if (value instanceof HTMLElement) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      if (item instanceof HTMLElement) return item;
    }
  }
  return null;
}
function useA4PageCount(elementRef) {
  const pageCount = ref(1);
  const pageHeightPx = ref(1123);
  const contentHeightPx = ref(0);
  const breakYs = ref([0]);
  let raf = 0;
  function measure() {
    const el = resolveElement(elementRef.value);
    if (!el) return;
    const plan = planPageBreaks(el, {
      minorOverflowThreshold: MINOR_OVERFLOW_THRESHOLD
    });
    pageHeightPx.value = plan.pageHeightPx;
    contentHeightPx.value = plan.contentHeightPx;
    pageCount.value = plan.pageCount;
    breakYs.value = plan.breakYs.length ? plan.breakYs : [0];
  }
  function scheduleMeasure() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(measure);
  }
  function observeEl(el) {
    return;
  }
  watch(elementRef, () => {
    observeEl(resolveElement(elementRef.value));
    scheduleMeasure();
  });
  return { pageCount, pageHeightPx, contentHeightPx, breakYs, measure: scheduleMeasure };
}
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "PagedDocumentPreview",
  __ssrInlineRender: true,
  props: {
    watchKey: {},
    paperFill: { type: Boolean },
    pageGap: {}
  },
  setup(__props, { expose: __expose }) {
    const props = __props;
    const contentRef = ref(null);
    const pageSheetRefs = ref([]);
    const mirrorHtml = ref("");
    const sidebarChrome = ref(null);
    const { pageCount, pageHeightPx, contentHeightPx, breakYs, measure } = useA4PageCount(contentRef);
    const gap = computed(() => {
      var _a;
      return (_a = props.pageGap) != null ? _a : 28;
    });
    const edgeMargin = computed(() => pageEdgeMarginPx(pageHeightPx.value));
    const contentBand = computed(() => pageContentBandPx(pageHeightPx.value));
    const mirrorPages = computed(
      () => Array.from({ length: Math.max(0, pageCount.value - 1) }, (_, i) => i + 1)
    );
    function pageSlice(pageIndex) {
      var _a;
      const ys = breakYs.value;
      const start = (_a = ys[pageIndex]) != null ? _a : pageIndex * contentBand.value;
      const next = ys[pageIndex + 1];
      const end = next != null ? next : Math.max(
        start + 1,
        contentHeightPx.value || start + contentBand.value
      );
      const height = Math.max(1, Math.min(contentBand.value, end - start));
      return { offset: start, height };
    }
    function getPageSheets() {
      var _a;
      const root = (_a = contentRef.value) == null ? void 0 : _a.closest(".pdf-preview-stack");
      if (root) {
        return Array.from(root.querySelectorAll("[data-pdf-page]"));
      }
      return pageSheetRefs.value.filter(Boolean);
    }
    function findSplitTheme(root) {
      var _a;
      if ((_a = root.matches) == null ? void 0 : _a.call(
        root,
        ".theme-creative-director, .theme-digital-nomad, .theme-engineer, .theme-strategist"
      )) {
        return root;
      }
      return root.querySelector(
        ".theme-creative-director, .theme-digital-nomad, .theme-engineer, .theme-strategist"
      );
    }
    function syncSidebarChrome() {
      const root = contentRef.value;
      const side = root == null ? void 0 : root.querySelector(".theme-sidebar");
      if (!root || !side) {
        sidebarChrome.value = null;
        return;
      }
      const fullH = Math.max(root.scrollHeight, root.offsetHeight, contentHeightPx.value || 0);
      const theme = findSplitTheme(root);
      const sideW = Math.max(1, side.offsetWidth);
      const widthPct = Math.min(48, Math.max(8, sideW / Math.max(1, root.offsetWidth) * 100));
      let background = side.style.backgroundColor || getComputedStyle(side).backgroundColor || "";
      const m = background.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (m) {
        const lum = (0.2126 * Number(m[1]) + 0.7152 * Number(m[2]) + 0.0722 * Number(m[3])) / 255;
        if (lum > 0.85) {
          sidebarChrome.value = null;
          if (theme) {
            theme.style.backgroundImage = "";
            theme.style.backgroundSize = "";
          }
          return;
        }
        background = `rgb(${m[1]}, ${m[2]}, ${m[3]})`;
      } else if (theme == null ? void 0 : theme.classList.contains("theme-creative-director")) {
        background = "#006a61";
      } else {
        sidebarChrome.value = null;
        return;
      }
      if (fullH > 0) {
        root.style.minHeight = `${fullH}px`;
        side.style.minHeight = `${fullH}px`;
        side.style.height = `${fullH}px`;
        side.style.alignSelf = "stretch";
        side.style.flexShrink = "0";
        side.style.backgroundColor = background;
        if (theme) {
          theme.style.minHeight = `${fullH}px`;
          theme.style.alignItems = "stretch";
          theme.style.display = "flex";
          theme.style.flexDirection = "row";
          theme.style.backgroundColor = "#ffffff";
          theme.style.backgroundImage = `linear-gradient(to right, ${background} 0, ${background} ${sideW}px, #ffffff ${sideW}px, #ffffff 100%)`;
          theme.style.backgroundRepeat = "no-repeat";
          theme.style.backgroundSize = "100% 100%";
          const main = theme.querySelector(":scope > .flex-1, :scope > main, :scope > div:not(.theme-sidebar)");
          if (main && !main.classList.contains("theme-sidebar")) {
            main.style.backgroundColor = "#ffffff";
          }
        }
      }
      sidebarChrome.value = { widthPct, background };
    }
    function syncMirrors() {
      const el = contentRef.value;
      syncSidebarChrome();
      if (!el || pageCount.value <= 1) {
        mirrorHtml.value = "";
        return;
      }
      mirrorHtml.value = el.innerHTML;
    }
    async function remasure() {
      await nextTick();
      measure();
      await nextTick();
      syncMirrors();
      await nextTick();
      measure();
      syncMirrors();
    }
    __expose({
      contentEl: contentRef,
      getPageSheets,
      pageCount,
      pageHeightPx,
      breakYs,
      measure: remasure
    });
    watch(
      () => props.watchKey,
      () => {
        void remasure();
      },
      { deep: true }
    );
    watch(pageCount, () => {
      void nextTick().then(syncMirrors);
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "pdf-preview-stack w-full max-w-[210mm] flex flex-col items-stretch" }, _attrs))}>`);
      if (unref(pageCount) > 1) {
        _push(`<div class="mb-3 flex items-center justify-between gap-3 text-xs text-slate-300 no-print"><span class="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-900/70 px-3 py-1 font-semibold tracking-wide"><span class="material-symbols-outlined text-[14px] text-blue-400">layers</span> ${ssrInterpolate(unref(pageCount))} pages in preview </span></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex flex-col items-stretch" style="${ssrRenderStyle({ gap: `${gap.value}px` })}"><div data-pdf-page="1" class="relative w-full overflow-hidden rounded-sm shadow-2xl bg-white" style="${ssrRenderStyle({ height: `${unref(pageHeightPx)}px` })}">`);
      if (sidebarChrome.value) {
        _push(`<div class="absolute left-0 top-0 bottom-0 z-[1] pointer-events-none" style="${ssrRenderStyle({ width: `${sidebarChrome.value.widthPct}%`, background: sidebarChrome.value.background })}" aria-hidden="true"></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="absolute left-0 right-0 overflow-hidden z-[2]" style="${ssrRenderStyle({
        top: `${edgeMargin.value}px`,
        height: `${pageSlice(0).height}px`
      })}"><div class="preview-content relative z-10 w-full bg-transparent" style="${ssrRenderStyle(__props.paperFill === false ? void 0 : { minHeight: `${contentBand.value}px` })}">`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</div></div></div><!--[-->`);
      ssrRenderList(mirrorPages.value, (page) => {
        var _a;
        _push(`<div${ssrRenderAttr("data-pdf-page", page + 1)} class="relative w-full overflow-hidden rounded-sm shadow-2xl bg-white" style="${ssrRenderStyle({ height: `${unref(pageHeightPx)}px` })}">`);
        if (sidebarChrome.value) {
          _push(`<div class="absolute left-0 top-0 bottom-0 z-[1] pointer-events-none" style="${ssrRenderStyle({ width: `${sidebarChrome.value.widthPct}%`, background: sidebarChrome.value.background })}" aria-hidden="true"></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="absolute left-0 right-0 overflow-hidden z-[2]" style="${ssrRenderStyle({
          top: `${edgeMargin.value}px`,
          height: `${pageSlice(page).height}px`
        })}"><div class="absolute left-0 top-0 w-full preview-content pointer-events-none bg-transparent" style="${ssrRenderStyle({ marginTop: `-${pageSlice(page).offset}px`, transform: "none" })}" aria-hidden="true">${(_a = mirrorHtml.value) != null ? _a : ""}</div></div></div>`);
      });
      _push(`<!--]--></div></div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/builder/PagedDocumentPreview.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "CoverLetterThemeRenderer",
  __ssrInlineRender: true,
  props: {
    templateId: {},
    fullName: {},
    jobTitle: {},
    location: {},
    email: {},
    phone: {},
    companyName: {},
    hiringManager: {},
    letterDate: {},
    bodyHtml: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d;
      if (__props.templateId === "cl-standard" || !__props.templateId.startsWith("cl-")) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "bg-white text-slate-900 w-full p-10 flex flex-col font-serif" }, _attrs))} data-v-2087a709><header class="text-center mb-6 border-b-2 border-slate-900 pb-4" data-v-2087a709><h1 class="text-3xl font-bold tracking-tight mb-1 uppercase" data-v-2087a709>${ssrInterpolate(__props.fullName || "Your Name")}</h1>`);
        if (__props.jobTitle) {
          _push(`<h2 class="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wider" data-v-2087a709>${ssrInterpolate(__props.jobTitle)}</h2>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="flex justify-center flex-wrap gap-x-3 gap-y-1 text-slate-600 text-[11px] uppercase tracking-widest font-sans" data-v-2087a709>`);
        if (__props.location) {
          _push(`<span data-v-2087a709>${ssrInterpolate(__props.location)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.email) {
          _push(`<span data-v-2087a709>| ${ssrInterpolate(__props.email)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.phone) {
          _push(`<span data-v-2087a709>| ${ssrInterpolate(__props.phone)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></header>`);
        if (__props.companyName || __props.hiringManager) {
          _push(`<div class="mb-5 text-[13px] font-sans" data-v-2087a709><p data-v-2087a709>${ssrInterpolate(__props.letterDate)}</p><p class="mt-3 font-bold" data-v-2087a709>${ssrInterpolate(__props.hiringManager || "Hiring Manager")}</p><p data-v-2087a709>${ssrInterpolate(__props.companyName)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="rich-text-content cover-letter-body text-[13px] leading-relaxed" data-v-2087a709>${(_a = __props.bodyHtml) != null ? _a : ""}</div></div>`);
      } else if (__props.templateId === "cl-creative") {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "bg-white text-slate-900 w-full flex font-sans overflow-hidden" }, _attrs))} data-v-2087a709><div class="w-3 bg-[#006a61] shrink-0" data-v-2087a709></div><div class="flex-1 p-10 flex flex-col" data-v-2087a709><header class="mb-8" data-v-2087a709><p class="text-[10px] uppercase tracking-[0.25em] text-[#006a61] font-bold mb-2" data-v-2087a709>Cover Letter</p><h1 class="text-4xl font-black tracking-tight text-slate-900 leading-none" data-v-2087a709>${ssrInterpolate(__props.fullName || "Your Name")}</h1>`);
        if (__props.jobTitle) {
          _push(`<p class="mt-2 text-sm text-slate-500 font-semibold" data-v-2087a709>${ssrInterpolate(__props.jobTitle)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="mt-3 flex flex-wrap gap-x-4 text-[11px] text-slate-500" data-v-2087a709>`);
        if (__props.email) {
          _push(`<span data-v-2087a709>${ssrInterpolate(__props.email)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.phone) {
          _push(`<span data-v-2087a709>${ssrInterpolate(__props.phone)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.location) {
          _push(`<span data-v-2087a709>${ssrInterpolate(__props.location)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></header>`);
        if (__props.companyName || __props.hiringManager) {
          _push(`<div class="mb-5 text-[13px]" data-v-2087a709><p class="text-slate-400 text-[11px] uppercase tracking-wider" data-v-2087a709>${ssrInterpolate(__props.letterDate)}</p><p class="mt-2 font-bold text-[#006a61]" data-v-2087a709>${ssrInterpolate(__props.hiringManager || "Hiring Manager")}</p><p class="text-slate-700" data-v-2087a709>${ssrInterpolate(__props.companyName)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="rich-text-content cover-letter-body text-[13px] leading-relaxed text-slate-700" data-v-2087a709>${(_b = __props.bodyHtml) != null ? _b : ""}</div></div></div>`);
      } else if (__props.templateId === "cl-executive") {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "bg-[#fafaf8] text-slate-900 w-full p-10 flex flex-col font-serif" }, _attrs))} data-v-2087a709><div class="h-1.5 bg-[#091426] mb-6" data-v-2087a709></div><header class="mb-8 border-b border-slate-300 pb-4" data-v-2087a709><div class="flex justify-between items-start gap-4" data-v-2087a709><div data-v-2087a709><h1 class="text-2xl font-bold tracking-tight text-[#091426]" data-v-2087a709>${ssrInterpolate(__props.fullName || "Your Name")}</h1>`);
        if (__props.jobTitle) {
          _push(`<p class="text-[11px] uppercase tracking-[0.15em] text-[#006a61] font-bold mt-1" data-v-2087a709>${ssrInterpolate(__props.jobTitle)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="text-right text-[11px] text-slate-500 font-sans space-y-0.5" data-v-2087a709>`);
        if (__props.email) {
          _push(`<div data-v-2087a709>${ssrInterpolate(__props.email)}</div>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.phone) {
          _push(`<div data-v-2087a709>${ssrInterpolate(__props.phone)}</div>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.location) {
          _push(`<div data-v-2087a709>${ssrInterpolate(__props.location)}</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><div class="mt-5 grid grid-cols-[72px_1fr] gap-y-1.5 text-[12px] font-sans" data-v-2087a709><span class="font-bold text-slate-500 uppercase text-[10px] tracking-wider" data-v-2087a709>Date</span><span data-v-2087a709>${ssrInterpolate(__props.letterDate)}</span><span class="font-bold text-slate-500 uppercase text-[10px] tracking-wider" data-v-2087a709>To</span><span data-v-2087a709>${ssrInterpolate(__props.hiringManager || "Hiring Manager")}${ssrInterpolate(__props.companyName ? `, ${__props.companyName}` : "")}</span><span class="font-bold text-slate-500 uppercase text-[10px] tracking-wider" data-v-2087a709>Re</span><span data-v-2087a709>Application \u2014 ${ssrInterpolate(__props.jobTitle || "Open Role")}</span></div></header><div class="rich-text-content cover-letter-body text-[13px] leading-relaxed" data-v-2087a709>${(_c = __props.bodyHtml) != null ? _c : ""}</div></div>`);
      } else {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "bg-white text-slate-900 w-full flex font-sans overflow-hidden" }, _attrs))} data-v-2087a709><aside class="w-[180px] bg-slate-900 text-slate-100 p-6 flex flex-col gap-6 shrink-0" data-v-2087a709><div data-v-2087a709><h1 class="text-lg font-bold leading-tight" data-v-2087a709>${ssrInterpolate(__props.fullName || "Your Name")}</h1>`);
        if (__props.jobTitle) {
          _push(`<p class="text-[10px] text-cyan-300 mt-1 font-mono uppercase tracking-wider" data-v-2087a709>${ssrInterpolate(__props.jobTitle)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="space-y-3 text-[10px] text-slate-300 font-mono" data-v-2087a709>`);
        if (__props.email) {
          _push(`<div data-v-2087a709><p class="text-slate-500 uppercase tracking-wider text-[8px] mb-0.5" data-v-2087a709>Email</p><p class="break-all" data-v-2087a709>${ssrInterpolate(__props.email)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.phone) {
          _push(`<div data-v-2087a709><p class="text-slate-500 uppercase tracking-wider text-[8px] mb-0.5" data-v-2087a709>Phone</p><p data-v-2087a709>${ssrInterpolate(__props.phone)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.location) {
          _push(`<div data-v-2087a709><p class="text-slate-500 uppercase tracking-wider text-[8px] mb-0.5" data-v-2087a709>Location</p><p data-v-2087a709>${ssrInterpolate(__props.location)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="mt-auto text-[8px] text-slate-500 font-mono border-t border-white/10 pt-3" data-v-2087a709> TECH INTRO </div></aside><div class="flex-1 p-8 flex flex-col" data-v-2087a709>`);
        if (__props.companyName || __props.hiringManager) {
          _push(`<div class="mb-6 text-[12px]" data-v-2087a709><p class="font-mono text-[10px] text-slate-400" data-v-2087a709>${ssrInterpolate(__props.letterDate)}</p><p class="mt-3 font-bold" data-v-2087a709>${ssrInterpolate(__props.hiringManager || "Hiring Manager")}</p><p class="text-slate-600" data-v-2087a709>${ssrInterpolate(__props.companyName)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="rich-text-content cover-letter-body text-[13px] leading-relaxed text-slate-800" data-v-2087a709>${(_d = __props.bodyHtml) != null ? _d : ""}</div></div></div>`);
      }
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/builder/CoverLetterThemeRenderer.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_3 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-2087a709"]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    useAppToast();
    useSaaS();
    const route = useRoute();
    useRouter();
    route.params.id;
    const previewRef = ref(null);
    const pagedPreview = ref(null);
    const exporting = ref(false);
    const activeTab = ref("details");
    const translating = ref(false);
    const resumeData = ref({
      name: "My Cover Letter",
      templateId: "cl-standard",
      themeColor: "#3b82f6",
      language: "en",
      personalInfo: {
        fullName: "",
        jobTitle: "",
        location: "",
        email: "",
        phone: "",
        linkedin: "",
        portfolio: "",
        github: "",
        summary: ""
      },
      experience: [],
      education: [],
      projects: [],
      skills: [],
      achievements: [],
      customSections: []
    });
    ref(false);
    const saving = ref(false);
    const enhancing = ref(false);
    const coverLetter = ref({
      jobDescription: "",
      companyName: "",
      hiringManager: "",
      tone: "professional",
      additionalInstructions: "",
      content: "<p>Start typing your cover letter here...</p>"
    });
    const previewContentHtml = computed(() => sanitizeRichTextHtml(coverLetter.value.content));
    const letterDate = computed(
      () => (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    );
    const previewWatchKey = computed(() => [
      coverLetter.value,
      resumeData.value.personalInfo,
      resumeData.value.templateId
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_BuilderRichTextEditor = __nuxt_component_3$1;
      const _component_BuilderPagedDocumentPreview = _sfc_main$2;
      const _component_BuilderCoverLetterThemeRenderer = __nuxt_component_3;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-100 font-sans selection:bg-blue-500/30 h-screen flex flex-col" }, _attrs))} data-v-37d6af93><header class="flex justify-between items-center px-6 h-16 shrink-0 bg-slate-900/40 backdrop-blur-md border-b border-white/10" data-v-37d6af93><div class="flex items-center gap-8" data-v-37d6af93>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "font-serif text-2xl text-white font-bold hover:text-blue-300 transition-colors"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`ScrapeEngine`);
          } else {
            return [
              createTextVNode("ScrapeEngine")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<nav class="hidden md:flex gap-6 items-center" data-v-37d6af93>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/builder",
        class: "font-semibold text-slate-300 hover:text-white transition-colors duration-200"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`My Projects`);
          } else {
            return [
              createTextVNode("My Projects")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</nav></div><div class="flex items-center gap-4" data-v-37d6af93><div class="flex items-center gap-2" data-v-37d6af93><span class="text-white text-sm font-semibold opacity-80 mr-4 border-r border-white/20 pr-4" data-v-37d6af93>Cover Letter</span><select class="bg-white/5 border border-white/10 rounded px-3 py-1 text-sm focus:border-blue-400 focus:bg-white/10 outline-none text-white transition-all cursor-pointer" data-v-37d6af93><option value="en" class="bg-slate-800 text-white" data-v-37d6af93${ssrIncludeBooleanAttr(Array.isArray(resumeData.value.language) ? ssrLooseContain(resumeData.value.language, "en") : ssrLooseEqual(resumeData.value.language, "en")) ? " selected" : ""}>EN</option><option value="de" class="bg-slate-800 text-white" data-v-37d6af93${ssrIncludeBooleanAttr(Array.isArray(resumeData.value.language) ? ssrLooseContain(resumeData.value.language, "de") : ssrLooseEqual(resumeData.value.language, "de")) ? " selected" : ""}>DE</option><option value="fr" class="bg-slate-800 text-white" data-v-37d6af93${ssrIncludeBooleanAttr(Array.isArray(resumeData.value.language) ? ssrLooseContain(resumeData.value.language, "fr") : ssrLooseEqual(resumeData.value.language, "fr")) ? " selected" : ""}>FR</option><option value="es" class="bg-slate-800 text-white" data-v-37d6af93${ssrIncludeBooleanAttr(Array.isArray(resumeData.value.language) ? ssrLooseContain(resumeData.value.language, "es") : ssrLooseEqual(resumeData.value.language, "es")) ? " selected" : ""}>ES</option></select>`);
      if (translating.value) {
        _push(`<span class="material-symbols-outlined text-blue-400 animate-spin text-sm" data-v-37d6af93>refresh</span>`);
      } else {
        _push(`<!---->`);
      }
      if (resumeData.value) {
        _push(`<input${ssrRenderAttr("value", resumeData.value.name)} type="text" class="bg-white/5 border border-white/10 rounded px-3 py-1 text-sm focus:border-blue-400 focus:bg-white/10 outline-none text-white transition-all" placeholder="Document Name" data-v-37d6af93>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><button${ssrIncludeBooleanAttr(saving.value) ? " disabled" : ""} class="px-4 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/50 rounded hover:bg-blue-500 hover:text-white transition-colors font-semibold text-sm disabled:opacity-50 cursor-pointer" data-v-37d6af93>${ssrInterpolate(saving.value ? "Saving..." : "Save Draft")}</button><button${ssrIncludeBooleanAttr(exporting.value) ? " disabled" : ""} class="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors font-semibold text-sm shadow-[0_0_15px_rgba(59,130,246,0.5)] cursor-pointer disabled:opacity-50" data-v-37d6af93>${ssrInterpolate(exporting.value ? "Exporting..." : "Export PDF")}</button></div></header><div class="flex flex-1 overflow-hidden" data-v-37d6af93><aside class="w-64 shrink-0 flex flex-col py-6 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 overflow-y-auto" data-v-37d6af93><nav class="flex-1" data-v-37d6af93><ul class="space-y-1" data-v-37d6af93><!--[-->`);
      ssrRenderList([
        { id: "template", label: "Template", icon: "view_quilt" },
        { id: "contact", label: "Contact Info", icon: "person" },
        { id: "details", label: "Target Role", icon: "work" },
        { id: "content", label: "Letter Content", icon: "edit_note" }
      ], (tab) => {
        _push(`<li data-v-37d6af93><button type="button" class="${ssrRenderClass([
          "w-full flex items-center gap-4 px-6 py-3 text-sm transition-all cursor-pointer",
          activeTab.value === tab.id ? "text-blue-400 font-bold border-r-2 border-blue-400 bg-blue-500/10" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
        ])}" data-v-37d6af93><span class="material-symbols-outlined" data-v-37d6af93>${ssrInterpolate(tab.icon)}</span> ${ssrInterpolate(tab.label)}</button></li>`);
      });
      _push(`<!--]--></ul></nav></aside><main class="flex-1 flex overflow-hidden" data-v-37d6af93><section class="w-1/2 h-full flex flex-col bg-slate-900/40 backdrop-blur-md border-r border-white/10 overflow-y-auto p-8 custom-scrollbar relative" data-v-37d6af93>`);
      if (activeTab.value === "template") {
        _push(`<div data-v-37d6af93><div class="mb-8" data-v-37d6af93><h1 class="font-bold text-2xl text-white mb-1" data-v-37d6af93>Choose Template</h1><p class="text-blue-200/60 text-sm" data-v-37d6af93>Switch cover letter layouts without losing your draft.</p></div><div class="grid grid-cols-2 gap-4" data-v-37d6af93><!--[-->`);
        ssrRenderList(unref(coverLetterTemplates), (tpl) => {
          _push(`<button type="button" class="${ssrRenderClass([resumeData.value.templateId === tpl.id ? "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.35)]" : "border-white/10 hover:border-blue-400/50", "cursor-pointer border-2 rounded-xl overflow-hidden text-left transition-all"])}" data-v-37d6af93><div class="aspect-[3/4] bg-white relative overflow-hidden border-b border-white/5" data-v-37d6af93>`);
          if (tpl.id === "cl-standard") {
            _push(`<div class="h-full p-3 flex flex-col text-slate-800" data-v-37d6af93><div class="text-center border-b-2 border-slate-900 pb-2 mb-2" data-v-37d6af93><div class="h-2 w-2/3 mx-auto bg-slate-900 rounded mb-1" data-v-37d6af93></div><div class="h-1 w-1/2 mx-auto bg-slate-400 rounded" data-v-37d6af93></div></div><div class="space-y-1 flex-1" data-v-37d6af93><div class="h-1 w-full bg-slate-300 rounded" data-v-37d6af93></div><div class="h-1 w-11/12 bg-slate-300 rounded" data-v-37d6af93></div><div class="h-1 w-full bg-slate-300 rounded" data-v-37d6af93></div></div></div>`);
          } else if (tpl.id === "cl-creative") {
            _push(`<div class="h-full flex text-slate-800" data-v-37d6af93><div class="w-1.5 bg-teal-700 shrink-0" data-v-37d6af93></div><div class="flex-1 p-3 space-y-1" data-v-37d6af93><div class="h-1.5 w-12 bg-teal-600/40 rounded" data-v-37d6af93></div><div class="h-2 w-3/4 bg-slate-900 rounded mb-2" data-v-37d6af93></div><div class="h-1 w-full bg-slate-300 rounded" data-v-37d6af93></div><div class="h-1 w-11/12 bg-slate-300 rounded" data-v-37d6af93></div></div></div>`);
          } else if (tpl.id === "cl-executive") {
            _push(`<div class="h-full p-3 bg-[#fafaf8] text-slate-800" data-v-37d6af93><div class="h-1 bg-slate-900 mb-2" data-v-37d6af93></div><div class="h-2 w-1/2 bg-slate-900 rounded mb-2" data-v-37d6af93></div><div class="space-y-1 border-t border-slate-300 pt-2" data-v-37d6af93><div class="h-1 w-full bg-slate-300 rounded" data-v-37d6af93></div><div class="h-1 w-11/12 bg-slate-300 rounded" data-v-37d6af93></div></div></div>`);
          } else {
            _push(`<div class="h-full flex text-slate-800" data-v-37d6af93><div class="w-[28%] bg-slate-900 p-2 space-y-1" data-v-37d6af93><div class="h-1.5 w-full bg-white/30 rounded" data-v-37d6af93></div><div class="h-1 w-2/3 bg-cyan-400/50 rounded" data-v-37d6af93></div></div><div class="flex-1 p-2 space-y-1" data-v-37d6af93><div class="h-1 w-full bg-slate-300 rounded" data-v-37d6af93></div><div class="h-1 w-11/12 bg-slate-300 rounded" data-v-37d6af93></div></div></div>`);
          }
          if (resumeData.value.templateId === tpl.id) {
            _push(`<div class="absolute top-2 right-2 bg-blue-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" data-v-37d6af93> Selected </div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="p-3 bg-white/5" data-v-37d6af93><h3 class="font-bold text-white text-sm mb-0.5" data-v-37d6af93>${ssrInterpolate(tpl.name)}</h3><p class="text-[11px] text-slate-400" data-v-37d6af93>${ssrInterpolate(tpl.desc)}</p></div></button>`);
        });
        _push(`<!--]--></div></div>`);
      } else if (activeTab.value === "contact") {
        _push(`<div data-v-37d6af93><div class="mb-8" data-v-37d6af93><h1 class="font-bold text-2xl text-white mb-1" data-v-37d6af93>Contact Info</h1><p class="text-blue-200/60 text-sm" data-v-37d6af93>Shown in the letter header, matching your resume.</p></div><div class="space-y-4" data-v-37d6af93><div class="grid grid-cols-2 gap-4" data-v-37d6af93><div class="flex flex-col" data-v-37d6af93><label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-37d6af93>Full Name</label><input${ssrRenderAttr("value", resumeData.value.personalInfo.fullName)} type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" data-v-37d6af93></div><div class="flex flex-col" data-v-37d6af93><label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-37d6af93>Job Title</label><input${ssrRenderAttr("value", resumeData.value.personalInfo.jobTitle)} type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" data-v-37d6af93></div><div class="flex flex-col" data-v-37d6af93><label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-37d6af93>Email</label><input${ssrRenderAttr("value", resumeData.value.personalInfo.email)} type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" data-v-37d6af93></div><div class="flex flex-col" data-v-37d6af93><label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-37d6af93>Phone</label><input${ssrRenderAttr("value", resumeData.value.personalInfo.phone)} type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" data-v-37d6af93></div><div class="flex flex-col col-span-2" data-v-37d6af93><label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-37d6af93>Location</label><input${ssrRenderAttr("value", resumeData.value.personalInfo.location)} type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" data-v-37d6af93></div></div></div></div>`);
      } else if (activeTab.value === "details") {
        _push(`<div data-v-37d6af93><div class="mb-8" data-v-37d6af93><h1 class="font-bold text-2xl text-white mb-1" data-v-37d6af93>Target Role</h1><p class="text-blue-200/60 text-sm" data-v-37d6af93>Company and job details used by AI Enhance.</p></div><div class="space-y-5" data-v-37d6af93><div class="flex flex-col" data-v-37d6af93><label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-37d6af93> Target Company <span class="text-blue-400 ml-2" data-v-37d6af93>*Required</span></label><input${ssrRenderAttr("value", coverLetter.value.companyName)} type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" placeholder="e.g. Google, Stripe" data-v-37d6af93></div><div class="flex flex-col" data-v-37d6af93><label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-37d6af93>Hiring Manager</label><input${ssrRenderAttr("value", coverLetter.value.hiringManager)} type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" placeholder="e.g. John Doe, Hiring Manager" data-v-37d6af93></div><div class="flex flex-col" data-v-37d6af93><label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-37d6af93> Job Description <span class="text-blue-400 ml-2" data-v-37d6af93>*Required</span></label><textarea class="w-full h-48 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all resize-none custom-scrollbar" placeholder="Paste the job requirements here..." data-v-37d6af93>${ssrInterpolate(coverLetter.value.jobDescription)}</textarea></div><div class="flex flex-col" data-v-37d6af93><label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-37d6af93> Additional AI instructions </label><textarea class="w-full h-28 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all resize-none custom-scrollbar" placeholder="Optional. Example: Keep the cover letter to one page. Emphasize leadership and German language skills." data-v-37d6af93>${ssrInterpolate(coverLetter.value.additionalInstructions)}</textarea><p class="mt-1.5 text-[11px] text-slate-500" data-v-37d6af93>Passed to AI Enhance as extra tasks or constraints.</p></div><div class="flex flex-col" data-v-37d6af93><label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-2" data-v-37d6af93>Tone</label><div class="grid grid-cols-3 gap-2" data-v-37d6af93><button type="button" class="${ssrRenderClass([coverLetter.value.tone === "professional" ? "border-blue-500 bg-blue-500/20 text-blue-300" : "border-white/10 bg-white/5 hover:border-blue-400/50 text-slate-300", "flex flex-col items-center justify-center p-3 rounded-lg border transition-all cursor-pointer"])}" data-v-37d6af93><span class="material-symbols-outlined text-lg mb-1" data-v-37d6af93>work</span><span class="text-[10px] font-bold" data-v-37d6af93>Professional</span></button><button type="button" class="${ssrRenderClass([coverLetter.value.tone === "enthusiastic" ? "border-blue-500 bg-blue-500/20 text-blue-300" : "border-white/10 bg-white/5 hover:border-blue-400/50 text-slate-300", "flex flex-col items-center justify-center p-3 rounded-lg border transition-all cursor-pointer"])}" data-v-37d6af93><span class="material-symbols-outlined text-lg mb-1" data-v-37d6af93>bolt</span><span class="text-[10px] font-bold" data-v-37d6af93>Enthusiastic</span></button><button type="button" class="${ssrRenderClass([coverLetter.value.tone === "confident" ? "border-blue-500 bg-blue-500/20 text-blue-300" : "border-white/10 bg-white/5 hover:border-blue-400/50 text-slate-300", "flex flex-col items-center justify-center p-3 rounded-lg border transition-all cursor-pointer"])}" data-v-37d6af93><span class="material-symbols-outlined text-lg mb-1" data-v-37d6af93>verified_user</span><span class="text-[10px] font-bold" data-v-37d6af93>Confident</span></button></div></div></div></div>`);
      } else {
        _push(`<div data-v-37d6af93><div class="mb-6 flex items-start justify-between gap-3" data-v-37d6af93><div data-v-37d6af93><h1 class="font-bold text-2xl text-white mb-1" data-v-37d6af93>Letter Content</h1><p class="text-blue-200/60 text-sm" data-v-37d6af93>Edit your draft, then enhance it with AI.</p></div><button type="button"${ssrIncludeBooleanAttr(enhancing.value) ? " disabled" : ""} class="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white px-2 py-1 rounded border border-indigo-500/30 transition-colors disabled:opacity-50 shrink-0" data-v-37d6af93><span class="${ssrRenderClass([{ "animate-spin": enhancing.value }, "material-symbols-outlined text-[12px]"])}" data-v-37d6af93>${ssrInterpolate(enhancing.value ? "refresh" : "auto_awesome")}</span> ${ssrInterpolate(enhancing.value ? "Enhancing..." : "AI Enhance")}</button></div>`);
        _push(ssrRenderComponent(_component_BuilderRichTextEditor, {
          modelValue: coverLetter.value.content,
          "onUpdate:modelValue": ($event) => coverLetter.value.content = $event,
          "editor-class": "min-h-[420px] text-slate-100"
        }, null, _parent));
        _push(`</div>`);
      }
      _push(`</section><section class="w-1/2 h-full bg-slate-800/80 overflow-y-auto p-12 flex justify-center items-start shadow-inner" data-v-37d6af93>`);
      _push(ssrRenderComponent(_component_BuilderPagedDocumentPreview, {
        ref_key: "pagedPreview",
        ref: pagedPreview,
        "watch-key": previewWatchKey.value
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="w-full overflow-hidden" data-v-37d6af93${_scopeId}>`);
            _push2(ssrRenderComponent(_component_BuilderCoverLetterThemeRenderer, {
              "template-id": resumeData.value.templateId,
              "full-name": resumeData.value.personalInfo.fullName,
              "job-title": resumeData.value.personalInfo.jobTitle,
              location: resumeData.value.personalInfo.location,
              email: resumeData.value.personalInfo.email,
              phone: resumeData.value.personalInfo.phone,
              "company-name": coverLetter.value.companyName,
              "hiring-manager": coverLetter.value.hiringManager,
              "letter-date": letterDate.value,
              "body-html": previewContentHtml.value
            }, null, _parent2, _scopeId));
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", {
                ref_key: "previewRef",
                ref: previewRef,
                class: "w-full overflow-hidden"
              }, [
                createVNode(_component_BuilderCoverLetterThemeRenderer, {
                  "template-id": resumeData.value.templateId,
                  "full-name": resumeData.value.personalInfo.fullName,
                  "job-title": resumeData.value.personalInfo.jobTitle,
                  location: resumeData.value.personalInfo.location,
                  email: resumeData.value.personalInfo.email,
                  phone: resumeData.value.personalInfo.phone,
                  "company-name": coverLetter.value.companyName,
                  "hiring-manager": coverLetter.value.hiringManager,
                  "letter-date": letterDate.value,
                  "body-html": previewContentHtml.value
                }, null, 8, ["template-id", "full-name", "job-title", "location", "email", "phone", "company-name", "hiring-manager", "letter-date", "body-html"])
              ], 512)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</section></main></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/builder/cover-letter/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _id_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-37d6af93"]]);

export { _id_ as default };
//# sourceMappingURL=_id_-Pq-0woRD.mjs.map
