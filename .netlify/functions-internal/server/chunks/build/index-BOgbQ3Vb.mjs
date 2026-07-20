import { _ as __nuxt_component_0 } from './nuxt-link-Cuf_TjgJ.mjs';
import { _ as _sfc_main$1$1, a as _sfc_main$5 } from './UserMenu-ChSxu4gB.mjs';
import { defineComponent, ref, computed, watch, mergeProps, withCtx, createTextVNode, unref, createVNode, isRef, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderClass, ssrInterpolate, ssrRenderTeleport, ssrRenderAttr, ssrIncludeBooleanAttr, ssrRenderList, ssrLooseContain, ssrLooseEqual } from 'vue/server-renderer';
import { _ as _export_sfc, a as useSaaS, e as useRuntimeConfig, b as useAppConfirm, n as navigateTo } from './server.mjs';
import { Sparkles, Bookmark, X, Globe, Loader2, AlertCircle, CheckCircle, Search, MapPin, DollarSign, Upload, FileText, Trash2, ExternalLink } from 'lucide-vue-next';
import { u as useFavorites, a as useJobMaterials, b as useVisitedJobs } from './useVisitedJobs-DGIBosc1.mjs';
import { useLocalStorage } from '@vueuse/core';
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
import 'vue-router';

const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "ScraperPaywall",
  __ssrInlineRender: true,
  setup(__props) {
    const { canAccessScraper, loggedIn, creditsRemaining, scraperBlockedMessage, pending } = useSaaS();
    const message = computed(() => scraperBlockedMessage());
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      if (!unref(canAccessScraper) && !unref(pending)) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "w-full rounded-2xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3" }, _attrs))}><div class="flex items-start gap-3 flex-1 min-w-0"><span class="material-symbols-outlined text-amber-400 shrink-0 text-[22px]">info</span><div class="min-w-0"><p class="text-sm font-semibold text-amber-100">${ssrInterpolate(unref(loggedIn) ? "Scraping disabled" : "Sign in required")}</p><p class="text-xs text-slate-400 mt-0.5">${ssrInterpolate(unref(message))} `);
        if (unref(loggedIn)) {
          _push(`<span class="text-slate-500"> (${ssrInterpolate(unref(creditsRemaining))} credits left)</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</p></div></div><div class="flex flex-wrap items-center gap-2 shrink-0">`);
        if (!unref(loggedIn)) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/login",
            class: "px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 cursor-pointer"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Sign in `);
              } else {
                return [
                  createTextVNode(" Sign in ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        if (!unref(loggedIn)) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/register",
            class: "px-3 py-1.5 rounded-xl border border-white/15 text-slate-200 text-xs font-bold hover:bg-white/5 cursor-pointer"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Register `);
              } else {
                return [
                  createTextVNode(" Register ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/pricing",
          class: "px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold cursor-pointer"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(loggedIn) ? "Get credits" : "View pricing")}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(loggedIn) ? "Get credits" : "View pricing"), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ScraperPaywall.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "FilterBar",
  __ssrInlineRender: true,
  props: {
    searchQuery: {},
    locationFilter: {},
    minSalaryFilter: {}
  },
  emits: ["update:searchQuery", "update:locationFilter", "update:minSalaryFilter", "clear"],
  setup(__props, { emit: __emit }) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col h-full" }, _attrs))}><div><h3 class="text-xs font-bold uppercase text-indigo-400 tracking-widest mb-5 select-none">Search Filters</h3><div class="space-y-5"><div><label class="block text-[11px] text-slate-400 mb-2 font-bold select-none">Search Roles</label><div class="relative flex items-center">`);
      _push(ssrRenderComponent(unref(Search), {
        class: "absolute left-3.5 text-slate-500 pointer-events-none",
        size: 13
      }, null, _parent));
      _push(`<input type="text" placeholder="e.g. Engineer"${ssrRenderAttr("value", __props.searchQuery)} class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-xl py-2.5 pl-9 pr-3 text-slate-200 text-xs outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 transition-all duration-300 placeholder:text-slate-600"></div></div><div><label class="block text-[11px] text-slate-400 mb-2 font-bold select-none">Location Preference</label><div class="relative flex items-center">`);
      _push(ssrRenderComponent(unref(MapPin), {
        class: "absolute left-3.5 text-slate-500 pointer-events-none",
        size: 13
      }, null, _parent));
      _push(`<input type="text" placeholder="e.g. Remote, NY"${ssrRenderAttr("value", __props.locationFilter)} class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-xl py-2.5 pl-9 pr-3 text-slate-200 text-xs outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 transition-all duration-300 placeholder:text-slate-600"></div></div><div><label class="block text-[11px] text-slate-400 mb-2 font-bold select-none">Min Salary Range</label><div class="relative flex items-center">`);
      _push(ssrRenderComponent(unref(DollarSign), {
        class: "absolute left-3.5 text-slate-500 pointer-events-none",
        size: 13
      }, null, _parent));
      _push(`<input type="number" placeholder="e.g. 120000"${ssrRenderAttr("value", __props.minSalaryFilter)} class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-xl py-2.5 pl-9 pr-3 text-slate-200 text-xs outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 transition-all duration-300 placeholder:text-slate-600"></div></div></div></div><div class="mt-8 pt-5 border-t border-slate-850"><button type="button" class="w-full py-2.5 bg-slate-950/60 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-all duration-300 active:scale-[0.98]"> Clear Filters </button></div></div>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/FilterBar.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "DocumentsPanel",
  __ssrInlineRender: true,
  props: {
    resume: {},
    coverLetter: {}
  },
  emits: ["uploaded", "removed"],
  setup(__props, { emit: __emit }) {
    const uploading = ref(null);
    const removing = ref(null);
    const error = ref(null);
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-5" }, _attrs))}><h3 class="text-xs font-bold uppercase text-indigo-400 tracking-widest select-none">Your Documents</h3><p class="text-[11px] text-slate-500 leading-relaxed select-none"> Upload a CV and cover letter (PDF, DOCX, or TXT) to auto-fill details and customize materials. </p><div class="space-y-4"><div><span class="text-[11px] text-slate-400 font-bold mb-2 block select-none">Resume / CV</span><div class="flex items-center gap-2"><label class="${ssrRenderClass([{ "opacity-65 pointer-events-none": unref(uploading) === "resume" || unref(removing) === "resume" }, "flex-1 flex items-center justify-between gap-3 px-4 py-3 bg-slate-950/40 border border-slate-800/80 rounded-2xl text-xs text-slate-300 cursor-pointer hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all duration-300 select-none group"])}"><div class="flex items-center gap-2.5 min-w-0">`);
      _push(ssrRenderComponent(unref(Upload), {
        size: 14,
        class: "text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0"
      }, null, _parent));
      _push(`<span class="truncate font-medium group-hover:text-slate-200 transition-colors">${ssrInterpolate(unref(uploading) === "resume" ? "Uploading..." : ((_a = __props.resume) == null ? void 0 : _a.originalName) || "Upload PDF, DOCX or TXT")}</span></div>`);
      if (!__props.resume && unref(uploading) !== "resume") {
        _push(`<span class="text-[10px] text-indigo-400 font-bold uppercase tracking-wider group-hover:text-indigo-300 shrink-0">Browse</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</label>`);
      if (unref(uploading) === "resume" || unref(removing) === "resume") {
        _push(ssrRenderComponent(unref(Loader2), {
          class: "animate-spin text-indigo-400 shrink-0",
          size: 16
        }, null, _parent));
      } else if (__props.resume) {
        _push(ssrRenderComponent(unref(FileText), {
          class: "text-emerald-400 shrink-0",
          size: 16
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (__props.resume) {
        _push(`<button type="button" title="Remove CV" class="p-3 rounded-2xl border border-slate-850 text-slate-400 hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 disabled:opacity-50 shrink-0"${ssrIncludeBooleanAttr(!!unref(uploading) || !!unref(removing)) ? " disabled" : ""}>`);
        _push(ssrRenderComponent(unref(Trash2), { size: 14 }, null, _parent));
        _push(`</button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div><span class="text-[11px] text-slate-400 font-bold mb-2 block select-none">Cover Letter</span><div class="flex items-center gap-2"><label class="${ssrRenderClass([{ "opacity-65 pointer-events-none": unref(uploading) === "cover_letter" || unref(removing) === "cover_letter" }, "flex-1 flex items-center justify-between gap-3 px-4 py-3 bg-slate-950/40 border border-slate-800/80 rounded-2xl text-xs text-slate-300 cursor-pointer hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all duration-300 select-none group"])}"><div class="flex items-center gap-2.5 min-w-0">`);
      _push(ssrRenderComponent(unref(Upload), {
        size: 14,
        class: "text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0"
      }, null, _parent));
      _push(`<span class="truncate font-medium group-hover:text-slate-200 transition-colors">${ssrInterpolate(unref(uploading) === "cover_letter" ? "Uploading..." : ((_b = __props.coverLetter) == null ? void 0 : _b.originalName) || "Upload PDF, DOCX or TXT")}</span></div>`);
      if (!__props.coverLetter && unref(uploading) !== "cover_letter") {
        _push(`<span class="text-[10px] text-indigo-400 font-bold uppercase tracking-wider group-hover:text-indigo-300 shrink-0">Browse</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</label>`);
      if (unref(uploading) === "cover_letter" || unref(removing) === "cover_letter") {
        _push(ssrRenderComponent(unref(Loader2), {
          class: "animate-spin text-indigo-400 shrink-0",
          size: 16
        }, null, _parent));
      } else if (__props.coverLetter) {
        _push(ssrRenderComponent(unref(FileText), {
          class: "text-emerald-400 shrink-0",
          size: 16
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (__props.coverLetter) {
        _push(`<button type="button" title="Remove cover letter" class="p-3 rounded-2xl border border-slate-850 text-slate-400 hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 disabled:opacity-50 shrink-0"${ssrIncludeBooleanAttr(!!unref(uploading) || !!unref(removing)) ? " disabled" : ""}>`);
        _push(ssrRenderComponent(unref(Trash2), { size: 14 }, null, _parent));
        _push(`</button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div>`);
      if (unref(error)) {
        _push(`<p class="text-xs text-red-400 mt-2 bg-red-950/20 border border-red-500/20 rounded-xl px-3 py-2">${ssrInterpolate(unref(error))}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/DocumentsPanel.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "JobCard",
  __ssrInlineRender: true,
  props: {
    job: {},
    isFavorite: { type: Boolean },
    hasTailored: { type: Boolean },
    visitedAt: {}
  },
  emits: ["toggleFavorite", "visit", "select", "remove", "apply"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const logoText = computed(() => {
      const source = props.job.company || props.job.title;
      return source.substring(0, 2).toUpperCase();
    });
    const logoGradient = computed(() => {
      const company = props.job.company || props.job.title || "Unknown";
      let hash = 0;
      for (let i = 0; i < company.length; i++) {
        hash = company.charCodeAt(i) + ((hash << 5) - hash);
      }
      const gradients = [
        "from-indigo-500 to-purple-500 text-white",
        "from-blue-500 to-indigo-500 text-white",
        "from-violet-600 to-fuchsia-600 text-white",
        "from-pink-500 to-rose-500 text-white",
        "from-teal-500 to-emerald-500 text-white",
        "from-emerald-500 to-teal-600 text-white",
        "from-cyan-500 to-blue-500 text-white",
        "from-amber-500 to-orange-500 text-slate-950"
      ];
      const idx = Math.abs(hash) % gradients.length;
      return gradients[idx];
    });
    const salary = computed(() => formatSalary(props.job.salaryMin, props.job.salaryMax, props.job.currency));
    function formatSalary(min, max, currency = "\u20AC") {
      const raw = (currency || "\u20AC").trim();
      const upper = raw.toUpperCase();
      const symbol = !raw || raw === "$" || upper === "USD" || upper === "US$" || upper === "EUR" || upper === "EURO" ? "\u20AC" : raw;
      if (!min && !max) return "";
      if (min && !max) return `${symbol}${min.toLocaleString("de-DE")}+`;
      if (!min && max) return `Up to ${symbol}${max.toLocaleString("de-DE")}`;
      return `${symbol}${min.toLocaleString("de-DE")} \u2013 ${max.toLocaleString("de-DE")}`;
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-5 bg-slate-900/30 backdrop-blur-sm border border-slate-800/80 rounded-2xl flex flex-col justify-between hover:border-slate-700/80 hover:bg-slate-900/60 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-[2px] transition-all duration-300 group relative cursor-pointer" }, _attrs))}><div><div class="flex items-start gap-4 mb-4"><div class="${ssrRenderClass([unref(logoGradient), "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 bg-gradient-to-tr shadow-md"])}">${ssrInterpolate(unref(logoText))}</div><div class="flex-grow min-w-0 pr-10"><div class="flex justify-between items-start gap-2"><a${ssrRenderAttr("href", __props.job.url)} target="_blank" rel="noopener noreferrer" class="font-bold text-sm text-slate-100 group-hover:text-indigo-400 truncate transition-colors"${ssrRenderAttr("title", __props.job.title)}>${ssrInterpolate(__props.job.title)}</a></div><p class="text-xs text-slate-400 mt-1 truncate"${ssrRenderAttr("title", __props.job.location)}>${ssrInterpolate(__props.job.company ? `${__props.job.company} \u2022 ` : "")}${ssrInterpolate(__props.job.location)}</p></div><div class="flex items-center shrink-0 gap-1 absolute right-3 top-3 opacity-60 group-hover:opacity-100 transition-opacity"><button type="button" title="Remove job" class="text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg p-1.5 transition-colors">`);
      _push(ssrRenderComponent(unref(Trash2), { size: 14 }, null, _parent));
      _push(`</button><button type="button" class="text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg p-1.5 transition-colors">`);
      _push(ssrRenderComponent(unref(Bookmark), {
        size: 15,
        class: __props.isFavorite ? "fill-indigo-400 text-indigo-400" : ""
      }, null, _parent));
      _push(`</button></div></div><div class="flex flex-wrap gap-1.5 mb-4">`);
      if (__props.hasTailored) {
        _push(`<span class="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-400"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Tailored Saved </span>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.visitedAt) {
        _push(`<span class="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-400"> Visited </span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="flex justify-between items-center gap-2 pt-3 border-t border-slate-905/30 mt-auto"><div class="flex flex-wrap gap-2"><a${ssrRenderAttr("href", __props.job.url)} target="_blank" rel="noopener noreferrer" class="text-[9px] px-3 py-1.5 font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/15 hover:bg-emerald-500 hover:text-slate-950 transition-colors flex items-center gap-1 shadow-sm"> Apply `);
      _push(ssrRenderComponent(unref(ExternalLink), { size: 11 }, null, _parent));
      _push(`</a><button type="button" class="text-[9px] px-3 py-1.5 font-bold tracking-wider uppercase bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/15 hover:bg-indigo-500 hover:text-white transition-colors"> Details </button></div>`);
      if (unref(salary)) {
        _push(`<span class="text-emerald-400 font-mono text-xs font-semibold whitespace-nowrap">${ssrInterpolate(unref(salary))}</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/JobCard.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const STORAGE_KEY = "scrape-engine-history";
const MAX_HISTORY = 10;
function useScrapeHistory() {
  const history = useLocalStorage(STORAGE_KEY, []);
  const showDropdown = ref(false);
  function addToHistory(url) {
    history.value = [url, ...history.value.filter((h) => h !== url)].slice(0, MAX_HISTORY);
  }
  return { history, showDropdown, addToHistory };
}
function useJobFilters(jobs, favorites, showFavorites) {
  const searchQuery = ref("");
  const locationFilter = ref("");
  const minSalaryFilter = ref("");
  const sortOption = ref("default");
  const sourceJobs = computed(() => showFavorites.value ? favorites.value : jobs.value);
  const filteredJobs = computed(() => {
    let filtered = sourceJobs.value.filter((job) => {
      var _a2;
      var _a;
      const matchSearch = !searchQuery.value || job.title.toLowerCase().includes(searchQuery.value.toLowerCase()) || ((_a2 = (_a = job.company) == null ? void 0 : _a.toLowerCase().includes(searchQuery.value.toLowerCase())) != null ? _a2 : false);
      const matchLocation = !locationFilter.value || job.location.toLowerCase().includes(locationFilter.value.toLowerCase());
      let matchSalary = true;
      if (minSalaryFilter.value !== "") {
        const target = Number(minSalaryFilter.value);
        if (!job.salaryMax && !job.salaryMin) {
          matchSalary = false;
        } else {
          const maxPossible = job.salaryMax || job.salaryMin || 0;
          matchSalary = maxPossible >= target;
        }
      }
      return matchSearch && matchLocation && matchSalary;
    });
    if (sortOption.value === "salary-high") {
      filtered = [...filtered].sort((a, b) => {
        const maxA = Math.max(a.salaryMax || 0, a.salaryMin || 0);
        const maxB = Math.max(b.salaryMax || 0, b.salaryMin || 0);
        return maxB - maxA;
      });
    } else if (sortOption.value === "salary-low") {
      filtered = [...filtered].sort((a, b) => {
        const getMin = (job) => {
          if (job.salaryMin && job.salaryMax) return job.salaryMin;
          if (job.salaryMin) return job.salaryMin;
          if (job.salaryMax) return job.salaryMax;
          return Infinity;
        };
        return getMin(a) - getMin(b);
      });
    }
    return filtered;
  });
  function clearFilters() {
    searchQuery.value = "";
    locationFilter.value = "";
    minSalaryFilter.value = "";
  }
  return {
    searchQuery,
    locationFilter,
    minSalaryFilter,
    sortOption,
    sourceJobs,
    filteredJobs,
    clearFilters
  };
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const url = ref("");
    const useResumeForScrape = ref(false);
    const useCoverLetterForScrape = ref(false);
    const scrapeJobTitle = ref("");
    const loading = ref(false);
    const error = ref(null);
    const jobs = ref([]);
    const hasScraped = ref(false);
    const showFavorites = ref(false);
    const toastMessage = ref(null);
    const resumeDoc = ref(null);
    const coverLetterDoc = ref(null);
    const { favorites, isFavorite, toggleFavorite, removeFavorite } = useFavorites();
    const { hasMaterials } = useJobMaterials();
    const { history, showDropdown } = useScrapeHistory();
    const { visitedJobs, markVisited } = useVisitedJobs();
    const mobileMenuOpen = ref(false);
    const { canAccessScraper, loggedIn, scraperBlockedMessage, pending } = useSaaS();
    const runtimeConfig = useRuntimeConfig();
    const apiBackendLabel = computed(
      () => runtimeConfig.public.apiBackend === "fastapi" ? "FastAPI" : "Nuxt Nitro"
    );
    const apiHealthBackend = ref(null);
    const apiStatusLabel = computed(() => {
      if (apiHealthBackend.value === "fastapi") return "Healthy \xB7 FastAPI";
      if (apiHealthBackend.value === "nuxt") return "Healthy \xB7 Nitro";
      return "Healthy";
    });
    const scrapeInputDisabled = computed(
      () => loading.value || !pending.value && !canAccessScraper.value
    );
    watch(mobileMenuOpen, (open) => {
    });
    const {
      searchQuery,
      locationFilter,
      minSalaryFilter,
      sortOption,
      sourceJobs,
      filteredJobs,
      clearFilters
    } = useJobFilters(jobs, favorites, showFavorites);
    async function loadDocuments() {
      try {
        const data = await $fetch("/api/documents");
        resumeDoc.value = data.resume;
        coverLetterDoc.value = data.coverLetter;
      } catch {
      }
    }
    function onVisit(job) {
      markVisited(job.url);
    }
    async function removeJob(job) {
      const { confirm } = useAppConfirm();
      const confirmed = await confirm({
        title: "Remove job",
        message: `Remove \u201C${job.title}\u201D from your list?`,
        confirmLabel: "Remove",
        danger: true
      });
      if (!confirmed) return;
      try {
        const id = job.id || "by-url";
        await $fetch(`/api/jobs/${id}`, {
          method: "DELETE",
          query: job.id ? void 0 : { url: job.url }
        });
      } catch {
      }
      jobs.value = jobs.value.filter((j) => j.url !== job.url && j.id !== job.id);
      removeFavorite(job);
      toastMessage.value = "Job removed.";
      setTimeout(() => {
        toastMessage.value = null;
      }, 2500);
    }
    function applyToJob(job) {
      markVisited(job.url);
      (void 0).open(job.url, "_blank", "noopener,noreferrer");
    }
    async function handleSelectJob(job) {
      if (job.id) {
        await navigateTo(`/jobs/${job.id}`);
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_CreditBadge = _sfc_main$1$1;
      const _component_UserMenu = _sfc_main$5;
      const _component_ScraperPaywall = _sfc_main$4;
      const _component_FilterBar = _sfc_main$3;
      const _component_DocumentsPanel = _sfc_main$2;
      const _component_JobCard = _sfc_main$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 flex flex-col p-4 md:p-6 overflow-hidden" }, _attrs))} data-v-ca069328><div class="max-w-[1400px] mx-auto w-full grow flex flex-col h-full overflow-hidden" data-v-ca069328><header class="shrink-0 border-b border-slate-900 pb-4 mb-4 md:mb-6" data-v-ca069328><div class="flex items-center justify-between gap-3" data-v-ca069328><div class="flex items-center gap-3 min-w-0" data-v-ca069328><div class="w-10 h-10 shrink-0 bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center font-bold text-xl glowing-logo text-white select-none" data-v-ca069328> S </div><div class="min-w-0" data-v-ca069328><h1 class="text-xl md:text-2xl font-extrabold tracking-tight truncate" data-v-ca069328> Scrape<span class="text-gradient" data-v-ca069328>Engine</span></h1><p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest -mt-1 hidden sm:block" data-v-ca069328> Intelligent Job Hub v5.0 </p></div></div><div class="hidden lg:flex flex-wrap gap-2 items-center justify-end" data-v-ca069328>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/pricing",
        class: "flex items-center gap-2 px-3 py-2 border border-violet-500/20 bg-violet-500/10 text-violet-300 hover:bg-violet-500 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Pricing `);
          } else {
            return [
              createTextVNode(" Pricing ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/apply",
        class: "flex items-center gap-2 px-3 py-2 border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 rounded-xl text-xs font-bold transition-all cursor-pointer"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(unref(Sparkles), { size: 14 }, null, _parent2, _scopeId));
            _push2(` Docs Gen `);
          } else {
            return [
              createVNode(unref(Sparkles), { size: 14 }),
              createTextVNode(" Docs Gen ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/builder",
        class: "flex items-center gap-2 px-3 py-2 border border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(unref(Sparkles), { size: 14 }, null, _parent2, _scopeId));
            _push2(` Builder `);
          } else {
            return [
              createVNode(unref(Sparkles), { size: 14 }),
              createTextVNode(" Builder ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<button type="button" class="${ssrRenderClass([
        unref(showFavorites) ? "bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-500 text-white" : "bg-slate-900/80 border-slate-800/80 text-slate-400 hover:text-slate-200",
        "flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer"
      ])}" data-v-ca069328>`);
      _push(ssrRenderComponent(unref(Bookmark), {
        size: 14,
        class: unref(showFavorites) ? "fill-current" : ""
      }, null, _parent));
      _push(` Favorites </button><div class="flex items-center gap-2 px-3 py-2 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs" data-v-ca069328><span class="${ssrRenderClass([unref(loading) ? "bg-amber-500 animate-pulse" : "bg-emerald-500", "w-2.5 h-2.5 rounded-full"])}" data-v-ca069328></span><span class="text-slate-400 font-semibold" data-v-ca069328>${ssrInterpolate(unref(loading) ? "Scraping..." : "Ready")}</span></div>`);
      _push(ssrRenderComponent(_component_CreditBadge, null, null, _parent));
      if (!unref(loggedIn)) {
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/login",
          class: "flex items-center gap-2 px-3 py-2 border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Sign in `);
            } else {
              return [
                createTextVNode(" Sign in ")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_UserMenu, null, null, _parent));
      _push(`</div><div class="flex lg:hidden items-center gap-2" data-v-ca069328>`);
      _push(ssrRenderComponent(_component_CreditBadge, null, null, _parent));
      _push(ssrRenderComponent(_component_UserMenu, null, null, _parent));
      _push(`<button type="button" class="p-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-slate-200 cursor-pointer" aria-label="Open menu" data-v-ca069328><span class="material-symbols-outlined text-[22px]" data-v-ca069328>menu</span></button></div></div>`);
      ssrRenderTeleport(_push, (_push2) => {
        if (unref(mobileMenuOpen)) {
          _push2(`<div class="fixed inset-0 z-[100] lg:hidden" data-v-ca069328><button type="button" class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" aria-label="Close menu" data-v-ca069328></button><nav class="absolute right-0 top-0 h-full w-[min(20rem,88vw)] bg-slate-950 border-l border-slate-800 p-5 flex flex-col gap-2 shadow-2xl" data-v-ca069328><div class="flex items-center justify-between mb-4" data-v-ca069328><p class="text-sm font-bold text-white" data-v-ca069328>Menu</p><button type="button" class="p-2 rounded-lg text-slate-400 hover:text-white" aria-label="Close" data-v-ca069328>`);
          _push2(ssrRenderComponent(unref(X), { size: 18 }, null, _parent));
          _push2(`</button></div>`);
          _push2(ssrRenderComponent(_component_NuxtLink, {
            to: "/pricing",
            class: "mobile-nav-link",
            onClick: ($event) => mobileMenuOpen.value = false
          }, {
            default: withCtx((_, _push3, _parent2, _scopeId) => {
              if (_push3) {
                _push3(`Pricing`);
              } else {
                return [
                  createTextVNode("Pricing")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push2(ssrRenderComponent(_component_NuxtLink, {
            to: "/apply",
            class: "mobile-nav-link",
            onClick: ($event) => mobileMenuOpen.value = false
          }, {
            default: withCtx((_, _push3, _parent2, _scopeId) => {
              if (_push3) {
                _push3(`Docs Gen`);
              } else {
                return [
                  createTextVNode("Docs Gen")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push2(ssrRenderComponent(_component_NuxtLink, {
            to: "/builder",
            class: "mobile-nav-link",
            onClick: ($event) => mobileMenuOpen.value = false
          }, {
            default: withCtx((_, _push3, _parent2, _scopeId) => {
              if (_push3) {
                _push3(`Resume Builder`);
              } else {
                return [
                  createTextVNode("Resume Builder")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push2(`<button type="button" class="mobile-nav-link text-left cursor-pointer" data-v-ca069328>${ssrInterpolate(unref(showFavorites) ? "Show all jobs" : "View favorites")}</button>`);
          if (!unref(loggedIn)) {
            _push2(ssrRenderComponent(_component_NuxtLink, {
              to: "/login",
              class: "mobile-nav-link",
              onClick: ($event) => mobileMenuOpen.value = false
            }, {
              default: withCtx((_, _push3, _parent2, _scopeId) => {
                if (_push3) {
                  _push3(` Sign in `);
                } else {
                  return [
                    createTextVNode(" Sign in ")
                  ];
                }
              }),
              _: 1
            }, _parent));
          } else {
            _push2(`<!---->`);
          }
          _push2(`<div class="mt-auto pt-4 text-xs text-slate-500" data-v-ca069328> Status: ${ssrInterpolate(unref(loading) ? "Scraping\u2026" : "Ready")}</div></nav></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      _push(`</header><div class="flex flex-col gap-4 flex-grow min-h-0 pb-4 md:pb-0" data-v-ca069328><div class="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0" data-v-ca069328><div class="md:col-span-3 glass-panel rounded-3xl p-5 flex flex-col justify-center relative overflow-hidden group min-h-[7.5rem] gap-3" data-v-ca069328><div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-500" data-v-ca069328></div>`);
      _push(ssrRenderComponent(_component_ScraperPaywall, null, null, _parent));
      _push(`<form class="w-full flex flex-col gap-3 relative z-10" data-v-ca069328><div class="flex flex-col sm:flex-row items-end gap-4" data-v-ca069328><div class="flex-grow w-full relative" data-v-ca069328><label class="block text-[10px] uppercase tracking-wider text-indigo-400 mb-2 font-bold select-none" data-v-ca069328> Source URL / Careers Page </label><div class="relative flex items-center" data-v-ca069328><input${ssrRenderAttr("value", unref(url))} type="url" placeholder="https://boards.greenhouse.io/openai" class="w-full bg-slate-950/30 border border-slate-800/80 focus:border-indigo-500/80 rounded-2xl px-4 py-3 pr-10 text-slate-100 text-sm font-medium outline-none transition-all duration-300 focus:ring-4 focus:ring-indigo-500/10 focus:bg-slate-950/60 disabled:opacity-50 disabled:cursor-not-allowed"${ssrIncludeBooleanAttr(unref(canAccessScraper) && !unref(showFavorites)) ? " required" : ""}${ssrIncludeBooleanAttr(unref(scrapeInputDisabled)) ? " disabled" : ""} data-v-ca069328>`);
      _push(ssrRenderComponent(unref(Globe), {
        class: "absolute right-4 text-slate-500 pointer-events-none",
        size: 16
      }, null, _parent));
      _push(`</div>`);
      if (unref(canAccessScraper) && unref(showDropdown) && unref(history).length > 0) {
        _push(`<div class="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-20 overflow-hidden" data-v-ca069328><!--[-->`);
        ssrRenderList(unref(history), (item, index2) => {
          _push(`<div class="px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer border-b border-slate-800/50 last:border-0 truncate transition-colors" data-v-ca069328>${ssrInterpolate(item)}</div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><button type="submit"${ssrIncludeBooleanAttr(unref(scrapeInputDisabled) || !unref(url).trim() && !unref(showFavorites)) ? " disabled" : ""}${ssrRenderAttr("title", !unref(canAccessScraper) && !unref(pending) ? unref(scraperBlockedMessage)() : void 0)} class="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-8 rounded-2xl flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-300 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] shrink-0 cursor-pointer" data-v-ca069328>`);
      if (unref(loading)) {
        _push(ssrRenderComponent(unref(Loader2), {
          class: "animate-spin",
          size: 18
        }, null, _parent));
      } else {
        _push(ssrRenderComponent(unref(Sparkles), { size: 18 }, null, _parent));
      }
      _push(` Execute Scrape </button></div><div class="${ssrRenderClass([unref(scrapeInputDisabled) ? "opacity-50 pointer-events-none" : "", "flex flex-col gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/25 px-3 py-2.5"])}" data-v-ca069328><p class="text-[10px] uppercase tracking-wider text-slate-500 font-bold" data-v-ca069328> Optional \u2014 find related roles </p><div class="flex flex-col lg:flex-row lg:items-center gap-3" data-v-ca069328><label class="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none" data-v-ca069328><input${ssrIncludeBooleanAttr(Array.isArray(unref(useResumeForScrape)) ? ssrLooseContain(unref(useResumeForScrape), null) : unref(useResumeForScrape)) ? " checked" : ""} type="checkbox" class="rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500/40 cursor-pointer"${ssrIncludeBooleanAttr(unref(scrapeInputDisabled) || !unref(resumeDoc)) ? " disabled" : ""} data-v-ca069328><span data-v-ca069328> Use resume `);
      if (!unref(resumeDoc)) {
        _push(`<span class="text-slate-500" data-v-ca069328>(upload first)</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</span></label><label class="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none" data-v-ca069328><input${ssrIncludeBooleanAttr(Array.isArray(unref(useCoverLetterForScrape)) ? ssrLooseContain(unref(useCoverLetterForScrape), null) : unref(useCoverLetterForScrape)) ? " checked" : ""} type="checkbox" class="rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500/40 cursor-pointer"${ssrIncludeBooleanAttr(unref(scrapeInputDisabled) || !unref(coverLetterDoc)) ? " disabled" : ""} data-v-ca069328><span data-v-ca069328> Use cover letter `);
      if (!unref(coverLetterDoc)) {
        _push(`<span class="text-slate-500" data-v-ca069328>(upload first)</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</span></label><div class="flex-1 min-w-0" data-v-ca069328><input${ssrRenderAttr("value", unref(scrapeJobTitle))} type="text" placeholder="Or target job title (e.g. Senior Backend Engineer)" class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/60 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none transition-all disabled:cursor-not-allowed"${ssrIncludeBooleanAttr(unref(scrapeInputDisabled)) ? " disabled" : ""} data-v-ca069328></div></div></div></form></div><div class="md:col-span-1 bg-gradient-to-br from-emerald-950/20 to-teal-950/15 border border-emerald-500/15 rounded-3xl p-5 flex flex-col justify-center relative overflow-hidden group" data-v-ca069328><div class="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500" data-v-ca069328></div><span class="text-emerald-400/80 text-[10px] uppercase font-bold tracking-widest select-none" data-v-ca069328>${ssrInterpolate(unref(showFavorites) ? "Saved Favorites" : "Total Jobs Found")}</span><span class="text-4xl font-extrabold text-gradient-emerald mt-1 tracking-tight" data-v-ca069328>${ssrInterpolate(unref(sourceJobs).length)}</span></div></div><div class="grid grid-cols-1 md:grid-cols-4 gap-4 flex-grow min-h-0" data-v-ca069328><div class="md:col-span-1 flex flex-col gap-4 min-h-0" data-v-ca069328><div class="flex-grow glass-panel rounded-3xl p-6 flex flex-col gap-6 overflow-y-auto relative min-h-0" data-v-ca069328>`);
      _push(ssrRenderComponent(_component_FilterBar, {
        "search-query": unref(searchQuery),
        "onUpdate:searchQuery": ($event) => isRef(searchQuery) ? searchQuery.value = $event : null,
        "location-filter": unref(locationFilter),
        "onUpdate:locationFilter": ($event) => isRef(locationFilter) ? locationFilter.value = $event : null,
        "min-salary-filter": unref(minSalaryFilter),
        "onUpdate:minSalaryFilter": ($event) => isRef(minSalaryFilter) ? minSalaryFilter.value = $event : null,
        onClear: unref(clearFilters)
      }, null, _parent));
      _push(`<div class="border-t border-slate-850 pt-6" data-v-ca069328>`);
      _push(ssrRenderComponent(_component_DocumentsPanel, {
        resume: unref(resumeDoc),
        "cover-letter": unref(coverLetterDoc),
        onUploaded: loadDocuments,
        onRemoved: loadDocuments
      }, null, _parent));
      _push(`</div></div><div class="shrink-0 bg-slate-900/40 backdrop-blur-sm border border-slate-800/85 rounded-3xl flex items-center px-6 py-4 gap-4 relative overflow-hidden group" data-v-ca069328><div class="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" data-v-ca069328>`);
      _push(ssrRenderComponent(unref(Globe), { size: 18 }, null, _parent));
      _push(`</div><div class="flex flex-col" data-v-ca069328><span class="text-[10px] text-slate-500 uppercase font-bold tracking-widest select-none" data-v-ca069328>API Status</span><span class="${ssrRenderClass([unref(loading) ? "text-amber-400" : "text-emerald-400", "text-xs font-semibold"])}" data-v-ca069328>${ssrInterpolate(unref(loading) ? "Processing..." : unref(apiStatusLabel))}</span><span class="text-[10px] text-slate-500 mt-0.5" data-v-ca069328>Backend: ${ssrInterpolate(unref(apiBackendLabel))}</span></div></div></div><div class="md:col-span-3 flex flex-col min-h-0" data-v-ca069328><div class="glass-panel rounded-3xl flex flex-col h-full overflow-hidden relative" data-v-ca069328><div class="p-6 border-b border-slate-800/60 flex justify-between items-center shrink-0 bg-slate-900/40 backdrop-blur-md z-10 flex-wrap gap-4" data-v-ca069328><h3 class="font-bold text-sm tracking-tight text-slate-200 flex items-center gap-2" data-v-ca069328>`);
      if (!unref(showFavorites) && !unref(loading)) {
        _push(`<span class="relative flex h-2 w-2" data-v-ca069328><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" data-v-ca069328></span><span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" data-v-ca069328></span></span>`);
      } else {
        _push(`<!---->`);
      }
      _push(` ${ssrInterpolate(unref(showFavorites) ? "Saved Roles" : "Live Stream")}</h3><div class="flex items-center gap-4" data-v-ca069328><span class="text-xs text-slate-400 font-medium" data-v-ca069328> Showing <span class="text-indigo-400 font-bold" data-v-ca069328>${ssrInterpolate(unref(filteredJobs).length)}</span> matches </span><select class="bg-slate-950 border border-slate-800/80 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all duration-300 cursor-pointer" data-v-ca069328><option value="default" data-v-ca069328${ssrIncludeBooleanAttr(Array.isArray(unref(sortOption)) ? ssrLooseContain(unref(sortOption), "default") : ssrLooseEqual(unref(sortOption), "default")) ? " selected" : ""}>Sort: Newest</option><option value="salary-high" data-v-ca069328${ssrIncludeBooleanAttr(Array.isArray(unref(sortOption)) ? ssrLooseContain(unref(sortOption), "salary-high") : ssrLooseEqual(unref(sortOption), "salary-high")) ? " selected" : ""}>Highest Salary</option><option value="salary-low" data-v-ca069328${ssrIncludeBooleanAttr(Array.isArray(unref(sortOption)) ? ssrLooseContain(unref(sortOption), "salary-low") : ssrLooseEqual(unref(sortOption), "salary-low")) ? " selected" : ""}>Lowest Salary</option></select></div></div><div class="flex-grow p-4 md:p-6 overflow-y-auto" data-v-ca069328>`);
      if (!unref(loading) && unref(sourceJobs).length === 0 && !unref(hasScraped) && !unref(showFavorites)) {
        _push(`<div class="h-full flex flex-col items-center justify-center text-center opacity-50" data-v-ca069328><div class="w-16 h-16 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center mb-4" data-v-ca069328>`);
        _push(ssrRenderComponent(unref(Globe), {
          class: "text-slate-500",
          size: 24
        }, null, _parent));
        _push(`</div><p class="text-slate-400 font-bold text-sm" data-v-ca069328>System Idle</p><p class="text-slate-500 text-xs mt-1" data-v-ca069328> Awaiting target URL input to commence scraping. </p></div>`);
      } else if (!unref(loading) && unref(hasScraped) && unref(sourceJobs).length === 0 && !unref(showFavorites)) {
        _push(`<div class="h-full flex flex-col items-center justify-center text-center opacity-50" data-v-ca069328><p class="text-slate-400 font-bold text-sm" data-v-ca069328>No Jobs Found</p><p class="text-slate-500 text-xs mt-1 max-w-sm" data-v-ca069328> The page may be JavaScript-rendered, blocked, or Gemini may be temporarily overloaded. Try again or use another careers URL. </p></div>`);
      } else if (!unref(loading) && unref(showFavorites) && unref(sourceJobs).length === 0) {
        _push(`<div class="h-full flex flex-col items-center justify-center text-center opacity-50" data-v-ca069328><p class="text-slate-400 font-bold text-sm" data-v-ca069328>No Favorites Yet</p><p class="text-slate-500 text-xs mt-1" data-v-ca069328>Save some jobs to view them here.</p></div>`);
      } else if (unref(filteredJobs).length === 0 && unref(sourceJobs).length > 0) {
        _push(`<div class="h-full flex flex-col items-center justify-center text-center opacity-50" data-v-ca069328><p class="text-slate-400 font-bold text-sm" data-v-ca069328>No matches found</p><p class="text-slate-550 text-xs mt-1" data-v-ca069328>Try relaxing your filter parameters.</p></div>`);
      } else {
        _push(`<div data-v-ca069328><div${ssrRenderAttrs({
          name: "job-list",
          class: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4"
        })} data-v-ca069328>`);
        ssrRenderList(unref(filteredJobs), (job, idx) => {
          _push(ssrRenderComponent(_component_JobCard, {
            key: `${job.url}-${idx}`,
            job,
            "is-favorite": unref(isFavorite)(job),
            "has-tailored": unref(hasMaterials)(job),
            "visited-at": unref(visitedJobs)[job.url],
            onToggleFavorite: unref(toggleFavorite),
            onVisit,
            onSelect: handleSelectJob,
            onRemove: removeJob,
            onApply: applyToJob
          }, null, _parent));
        });
        _push(`</div></div>`);
      }
      _push(`</div></div></div></div></div></div><div class="fixed bottom-6 right-6 z-50 flex flex-col gap-2" data-v-ca069328>`);
      if (unref(error)) {
        _push(`<div class="bg-red-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-medium text-sm max-w-sm" data-v-ca069328>`);
        _push(ssrRenderComponent(unref(AlertCircle), {
          size: 18,
          class: "shrink-0"
        }, null, _parent));
        _push(`<div class="flex-grow max-h-32 overflow-y-auto pr-2" data-v-ca069328>${ssrInterpolate(unref(error))}</div><button type="button" class="p-1 hover:bg-white/20 rounded-full shrink-0" data-v-ca069328>`);
        _push(ssrRenderComponent(unref(X), { size: 14 }, null, _parent));
        _push(`</button></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(toastMessage)) {
        _push(`<div class="bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-medium text-sm" data-v-ca069328>`);
        _push(ssrRenderComponent(unref(CheckCircle), {
          size: 18,
          class: "shrink-0"
        }, null, _parent));
        _push(` ${ssrInterpolate(unref(toastMessage))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-ca069328"]]);

export { index as default };
//# sourceMappingURL=index-BOgbQ3Vb.mjs.map
