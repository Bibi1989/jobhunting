import { _ as __nuxt_component_0 } from './nuxt-link-Cuf_TjgJ.mjs';
import { defineComponent, withAsyncContext, computed, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrRenderStyle, ssrRenderComponent, ssrRenderAttr } from 'vue/server-renderer';
import { P as PORTFOLIO_TEMPLATES } from '../_/portfolio.mjs';
import { a as useSaaS } from './server.mjs';
import { u as useFetch } from './fetch-C81_PrUB.mjs';
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
  __name: "analytics",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { planTier, creditsRemaining, isPro } = useSaaS();
    const { data: portfolioData } = ([__temp, __restore] = withAsyncContext(() => useFetch("/api/portfolio", {
      default: () => ({ portfolios: [] })
    }, "$TWH0vZrBlZ")), __temp = await __temp, __restore(), __temp);
    const { data: documents } = ([__temp, __restore] = withAsyncContext(() => useFetch("/api/builder/documents", {
      default: () => []
    }, "$8IQvtFidsJ")), __temp = await __temp, __restore(), __temp);
    const portfolios = computed(() => {
      var _a2;
      var _a;
      return (_a2 = (_a = portfolioData.value) == null ? void 0 : _a.portfolios) != null ? _a2 : [];
    });
    const resumeCount = computed(
      () => {
        var _a;
        return ((_a = documents.value) != null ? _a : []).filter((d) => d.type !== "cover_letter").length;
      }
    );
    const coverLetterCount = computed(
      () => {
        var _a;
        return ((_a = documents.value) != null ? _a : []).filter((d) => d.type === "cover_letter").length;
      }
    );
    const stats = computed(() => {
      var _a;
      return [
        { label: "Published Portfolios", value: portfolios.value.length, icon: "stars", accent: "text-blue-300" },
        { label: "Documents", value: ((_a = documents.value) != null ? _a : []).length, icon: "description", accent: "text-indigo-300" },
        { label: "Credits Remaining", value: creditsRemaining.value, icon: "toll", accent: "text-emerald-300" },
        { label: "Plan", value: planTier.value.toUpperCase(), icon: "workspace_premium", accent: "text-amber-300" }
      ];
    });
    const templateUsage = computed(() => {
      var _a;
      const counts = /* @__PURE__ */ new Map();
      for (const p of portfolios.value) {
        counts.set(p.templateSlug, ((_a = counts.get(p.templateSlug)) != null ? _a : 0) + 1);
      }
      const max = Math.max(1, ...counts.values());
      return PORTFOLIO_TEMPLATES.map((t) => {
        var _a2, _b;
        return {
          name: t.name,
          slug: t.slug,
          accent: t.accentClass,
          count: (_a2 = counts.get(t.slug)) != null ? _a2 : 0,
          pct: Math.round(((_b = counts.get(t.slug)) != null ? _b : 0) / max * 100)
        };
      });
    });
    const hasUsage = computed(() => portfolios.value.length > 0);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "px-6 py-10 max-w-7xl mx-auto" }, _attrs))}><header class="mb-8"><h1 class="font-serif text-4xl text-white mb-2">Analytics</h1><p class="text-blue-200/60">A snapshot of your workspace, documents, and published portfolios.</p><div class="w-full h-px bg-white/10 mt-6"></div></header><section class="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10"><!--[-->`);
      ssrRenderList(unref(stats), (s) => {
        _push(`<div class="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><span class="${ssrRenderClass([s.accent, "material-symbols-outlined"])}">${ssrInterpolate(s.icon)}</span><p class="font-serif text-3xl text-white mt-2">${ssrInterpolate(s.value)}</p><p class="text-xs uppercase tracking-widest text-blue-200/50 mt-1">${ssrInterpolate(s.label)}</p></div>`);
      });
      _push(`<!--]--></section><div class="grid gap-6 lg:grid-cols-2"><section class="rounded-2xl border border-white/10 bg-white/[0.03] p-6"><h2 class="font-semibold text-white mb-4">Documents by type</h2><div class="space-y-4"><div><div class="flex justify-between text-sm mb-1"><span class="text-blue-100">Resumes</span><span class="text-blue-200/60">${ssrInterpolate(unref(resumeCount))}</span></div><div class="h-2 rounded-full bg-white/10 overflow-hidden"><div class="h-full bg-blue-500 rounded-full transition-all" style="${ssrRenderStyle({ width: `${Math.min(100, unref(resumeCount) * 20)}%` })}"></div></div></div><div><div class="flex justify-between text-sm mb-1"><span class="text-blue-100">Cover Letters</span><span class="text-blue-200/60">${ssrInterpolate(unref(coverLetterCount))}</span></div><div class="h-2 rounded-full bg-white/10 overflow-hidden"><div class="h-full bg-indigo-500 rounded-full transition-all" style="${ssrRenderStyle({ width: `${Math.min(100, unref(coverLetterCount) * 20)}%` })}"></div></div></div></div></section><section class="rounded-2xl border border-white/10 bg-white/[0.03] p-6"><h2 class="font-semibold text-white mb-4">Portfolio template usage</h2>`);
      if (!unref(hasUsage)) {
        _push(`<p class="text-blue-200/50 italic text-sm"> No portfolios published yet. `);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/dashboard/portfolio",
          class: "text-blue-300 hover:underline"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Build one \u2192`);
            } else {
              return [
                createTextVNode("Build one \u2192")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</p>`);
      } else {
        _push(`<div class="space-y-2.5 max-h-64 overflow-y-auto pr-1"><!--[-->`);
        ssrRenderList(unref(templateUsage), (t) => {
          _push(`<div class="flex items-center gap-3"><span class="${ssrRenderClass([t.accent, "w-2 h-2 rounded-full shrink-0"])}"></span><span class="text-sm text-blue-100 w-32 truncate">${ssrInterpolate(t.name)}</span><div class="flex-1 h-2 rounded-full bg-white/10 overflow-hidden"><div class="${ssrRenderClass([t.accent, "h-full rounded-full transition-all"])}" style="${ssrRenderStyle({ width: `${t.pct}%` })}"></div></div><span class="text-xs text-blue-200/60 w-6 text-right">${ssrInterpolate(t.count)}</span></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</section></div><section class="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6"><div class="flex items-center justify-between mb-4"><h2 class="font-semibold text-white">Published portfolios</h2>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/dashboard/portfolio",
        class: "text-sm text-blue-300 hover:text-white transition"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Open Portfolio \u2192 `);
          } else {
            return [
              createTextVNode(" Open Portfolio \u2192 ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      if (!unref(portfolios).length) {
        _push(`<p class="text-blue-200/50 italic text-sm"> No live portfolios yet. `);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/dashboard/portfolio",
          class: "text-blue-300 hover:underline"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Create one`);
            } else {
              return [
                createTextVNode("Create one")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</p>`);
      } else {
        _push(`<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><!--[-->`);
        ssrRenderList(unref(portfolios).slice(0, 6), (p) => {
          _push(`<a${ssrRenderAttr("href", `/p/${p.id}`)} target="_blank" rel="noopener" class="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 hover:border-blue-400/40 transition"><p class="font-semibold text-white truncate">${ssrInterpolate(p.profileData.full_name)}</p><p class="text-xs text-blue-200/60 mt-1 truncate">/p/${ssrInterpolate(p.id)}</p></a>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</section>`);
      if (!unref(isPro)) {
        _push(`<section class="mt-8 rounded-2xl border border-blue-500/30 bg-blue-600/10 p-6 flex items-center justify-between gap-4"><div><p class="font-semibold text-white">Unlock AI Portfolios and premium tools</p><p class="text-sm text-blue-200/70">Upgrade to Pro to generate portfolios and publish them to your domain.</p></div>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/pricing",
          class: "shrink-0 rounded-xl bg-blue-500 hover:bg-blue-400 px-5 py-2.5 font-semibold text-white transition"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Upgrade `);
            } else {
              return [
                createTextVNode(" Upgrade ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</section>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/dashboard/analytics.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=analytics-BRfin1uh.mjs.map
