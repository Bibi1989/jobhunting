import { _ as _sfc_main$1 } from './TemplateThumbnail-By8xlz0M.mjs';
import { _ as _sfc_main$2 } from './PortfolioRenderer-KMW0Hdx0.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-Cuf_TjgJ.mjs';
import { defineComponent, ref, computed, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrRenderComponent, ssrRenderStyle, ssrRenderTeleport } from 'vue/server-renderer';
import { a as resumeTemplates, c as coverLetterTemplates } from './templates-CJ0hEBg_.mjs';
import { P as PORTFOLIO_TEMPLATES, S as SAMPLE_PROFILE } from '../_/portfolio.mjs';
import './server.mjs';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "templates",
  __ssrInlineRender: true,
  setup(__props) {
    const activeFilter = ref("All");
    const filters = ["All", "Professional", "Modern", "Minimalist", "Technical", "Creative"];
    const portfolioPreviewSlug = ref(null);
    const filteredTemplates = computed(() => {
      if (activeFilter.value === "All") return resumeTemplates;
      return resumeTemplates.filter((t) => t.category === activeFilter.value);
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_BuilderTemplateThumbnail = _sfc_main$1;
      const _component_PortfolioRenderer = _sfc_main$2;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "pt-8 min-h-screen pb-20" }, _attrs))}><div class="max-w-[1200px] mx-auto px-6"><div class="mb-12"><h1 class="font-serif text-4xl text-white mb-3">Template Gallery</h1><p class="text-blue-200/80 max-w-xl text-lg">Choose from our curated Stitch resume layouts and cover letter styles. Switch templates instantly while preserving your data.</p></div><div class="sticky top-16 z-30 bg-slate-900/60 backdrop-blur-md py-4 mb-10 border-b border-white/10"><div class="flex flex-wrap items-center gap-6"><!--[-->`);
      ssrRenderList(filters, (filter) => {
        _push(`<button class="${ssrRenderClass(["font-semibold text-sm pb-1 border-b-2 transition-colors", activeFilter.value === filter ? "text-blue-400 border-blue-400" : "text-slate-400 border-transparent hover:text-slate-200"])}">${ssrInterpolate(filter)}</button>`);
      });
      _push(`<!--]--></div></div><div class="mb-8 flex items-center justify-between"><h2 class="font-serif text-2xl text-white">Resume Templates</h2><span class="text-blue-300/60 text-sm font-semibold uppercase tracking-wider">${ssrInterpolate(unref(filteredTemplates).length)} Results</span></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16"><!--[-->`);
      ssrRenderList(unref(filteredTemplates), (tpl) => {
        _push(`<div class="group relative flex flex-col cursor-pointer"><div class="relative aspect-[3/4] bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 mb-4 hover:border-blue-400/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300">`);
        _push(ssrRenderComponent(_component_BuilderTemplateThumbnail, {
          "template-id": tpl.id,
          name: tpl.name
        }, null, _parent));
        _push(`<div class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4"><button type="button" class="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:bg-blue-400 transition-colors">Use Template</button></div></div><div><h4 class="font-semibold text-lg text-white group-hover:text-blue-400 transition-colors">${ssrInterpolate(tpl.name)}</h4><p class="text-xs font-semibold text-blue-200/60 uppercase tracking-widest mt-1">${ssrInterpolate(tpl.category)} \u2022 ${ssrInterpolate(tpl.desc)}</p></div></div>`);
      });
      _push(`<!--]--></div><div class="mb-8 flex items-center justify-between border-t border-white/10 pt-16"><h2 class="font-serif text-2xl text-white">Cover Letter Templates</h2><span class="text-blue-300/60 text-sm font-semibold uppercase tracking-wider">4 Results</span></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"><!--[-->`);
      ssrRenderList(unref(coverLetterTemplates), (tpl) => {
        _push(`<div class="group relative flex flex-col cursor-pointer"><div class="relative aspect-[3/4] bg-white rounded-xl overflow-hidden border border-white/10 mb-4 hover:border-blue-400/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300">`);
        if (tpl.id === "cl-standard") {
          _push(`<div class="h-full p-5 flex flex-col text-slate-800 font-serif"><div class="text-center border-b-2 border-slate-900 pb-3 mb-4"><div class="h-3 w-2/3 mx-auto bg-slate-900 rounded mb-2"></div><div class="h-1.5 w-1/2 mx-auto bg-slate-400 rounded"></div></div><div class="space-y-2 flex-1"><div class="h-1.5 w-full bg-slate-300 rounded"></div><div class="h-1.5 w-11/12 bg-slate-300 rounded"></div><div class="h-1.5 w-full bg-slate-300 rounded"></div><div class="h-1.5 w-4/5 bg-slate-300 rounded"></div></div></div>`);
        } else if (tpl.id === "cl-creative") {
          _push(`<div class="h-full flex text-slate-800"><div class="w-2 bg-teal-700 shrink-0"></div><div class="flex-1 p-5"><div class="h-2 w-16 bg-teal-600/40 rounded mb-2"></div><div class="h-5 w-3/4 bg-slate-900 rounded mb-4"></div><div class="space-y-2"><div class="h-1.5 w-full bg-slate-300 rounded"></div><div class="h-1.5 w-11/12 bg-slate-300 rounded"></div><div class="h-1.5 w-full bg-slate-300 rounded"></div></div></div></div>`);
        } else if (tpl.id === "cl-executive") {
          _push(`<div class="h-full p-5 bg-[#fafaf8] text-slate-800"><div class="h-1.5 bg-slate-900 mb-4"></div><div class="flex justify-between mb-4"><div class="h-3 w-1/2 bg-slate-900 rounded"></div><div class="space-y-1 w-1/4"><div class="h-1 bg-slate-300 rounded"></div><div class="h-1 bg-slate-300 rounded"></div></div></div><div class="space-y-2 border-t border-slate-300 pt-3"><div class="h-1.5 w-full bg-slate-300 rounded"></div><div class="h-1.5 w-11/12 bg-slate-300 rounded"></div><div class="h-1.5 w-4/5 bg-slate-300 rounded"></div></div></div>`);
        } else {
          _push(`<div class="h-full flex text-slate-800"><div class="w-[28%] bg-slate-900 p-3 space-y-2"><div class="h-2 w-full bg-white/30 rounded"></div><div class="h-1 w-2/3 bg-cyan-400/50 rounded"></div><div class="h-1 w-full bg-white/20 rounded mt-4"></div><div class="h-1 w-full bg-white/20 rounded"></div></div><div class="flex-1 p-4 space-y-2"><div class="h-1.5 w-full bg-slate-300 rounded"></div><div class="h-1.5 w-11/12 bg-slate-300 rounded"></div><div class="h-1.5 w-full bg-slate-300 rounded"></div><div class="h-1.5 w-3/4 bg-slate-300 rounded"></div></div></div>`);
        }
        _push(`<div class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4"><button type="button" class="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:bg-blue-400 transition-colors">Use Template</button></div></div><div><h4 class="font-semibold text-lg text-white group-hover:text-blue-400 transition-colors">${ssrInterpolate(tpl.name)}</h4><p class="text-xs font-semibold text-blue-200/60 uppercase tracking-widest mt-1">${ssrInterpolate(tpl.category)} \u2022 ${ssrInterpolate(tpl.desc)}</p></div></div>`);
      });
      _push(`<!--]--></div><div class="mb-8 flex items-center justify-between border-t border-white/10 pt-16"><div><h2 class="font-serif text-2xl text-white">Portfolio Templates</h2><p class="text-blue-200/60 text-sm mt-1">Ten live site themes for AI Portfolio \u2014 preview interactively, then publish.</p></div><span class="text-blue-300/60 text-sm font-semibold uppercase tracking-wider">${ssrInterpolate(unref(PORTFOLIO_TEMPLATES).length)} Designs</span></div><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8"><!--[-->`);
      ssrRenderList(unref(PORTFOLIO_TEMPLATES), (tpl) => {
        _push(`<div class="group relative flex flex-col rounded-xl border border-white/10 overflow-hidden bg-white/[0.02] hover:border-blue-400/50 transition"><div class="relative h-44 overflow-hidden bg-slate-900 border-b border-white/10"><div class="absolute top-0 left-0 origin-top-left pointer-events-none" style="${ssrRenderStyle({ "width": "400%", "height": "400%", "transform": "scale(0.25)" })}">`);
        _push(ssrRenderComponent(_component_PortfolioRenderer, {
          slug: tpl.slug,
          data: unref(SAMPLE_PROFILE)
        }, null, _parent));
        _push(`</div></div><div class="p-4 flex flex-col gap-3 flex-1"><div><div class="flex items-center gap-2"><span class="${ssrRenderClass([tpl.accentClass, "w-2.5 h-2.5 rounded-full"])}"></span><h4 class="font-semibold text-white">${ssrInterpolate(tpl.name)}</h4></div><p class="text-xs text-blue-200/60 uppercase tracking-wider mt-1">${ssrInterpolate(tpl.persona)}</p><p class="text-sm text-blue-200/50 mt-2 line-clamp-2">${ssrInterpolate(tpl.description)}</p></div><div class="mt-auto flex gap-2"><button type="button" class="flex-1 rounded-lg border border-white/15 hover:bg-white/5 px-3 py-2 text-sm font-semibold text-blue-100"> Preview </button>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/dashboard/portfolio?template=${tpl.slug}`,
          class: "flex-1 text-center rounded-lg bg-blue-500 hover:bg-blue-400 px-3 py-2 text-sm font-semibold text-white"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Use `);
            } else {
              return [
                createTextVNode(" Use ")
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</div></div></div>`);
      });
      _push(`<!--]--></div>`);
      ssrRenderTeleport(_push, (_push2) => {
        var _a;
        if (portfolioPreviewSlug.value) {
          _push2(`<div class="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex flex-col"><div class="flex items-center justify-between px-6 h-14 bg-slate-900 border-b border-white/10 shrink-0"><p class="font-semibold text-white">${ssrInterpolate((_a = unref(PORTFOLIO_TEMPLATES).find((t) => t.slug === portfolioPreviewSlug.value)) == null ? void 0 : _a.name)} \u2014 interactive preview </p><div class="flex items-center gap-2">`);
          _push2(ssrRenderComponent(_component_NuxtLink, {
            to: `/dashboard/portfolio?template=${portfolioPreviewSlug.value}`,
            class: "rounded-lg bg-blue-500 hover:bg-blue-400 px-4 py-1.5 text-sm font-semibold text-white",
            onClick: ($event) => portfolioPreviewSlug.value = null
          }, {
            default: withCtx((_, _push3, _parent2, _scopeId) => {
              if (_push3) {
                _push3(` Use this template `);
              } else {
                return [
                  createTextVNode(" Use this template ")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push2(`<button type="button" class="rounded-lg border border-white/15 hover:bg-white/5 px-3 py-1.5 text-sm text-blue-100"> Close </button></div></div><div class="flex-1 overflow-y-auto bg-white">`);
          _push2(ssrRenderComponent(_component_PortfolioRenderer, {
            slug: portfolioPreviewSlug.value,
            data: unref(SAMPLE_PROFILE)
          }, null, _parent));
          _push2(`</div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/builder/templates.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=templates-DqTYPowM.mjs.map
