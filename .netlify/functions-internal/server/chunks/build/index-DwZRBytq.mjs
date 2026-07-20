import { _ as _sfc_main$1 } from './PortfolioRenderer-KMW0Hdx0.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-Cuf_TjgJ.mjs';
import { defineComponent, computed, ref, withAsyncContext, watch, mergeProps, unref, withCtx, createVNode, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderClass, ssrRenderList, ssrRenderStyle, ssrRenderComponent, ssrRenderAttr, ssrIncludeBooleanAttr, ssrRenderTeleport } from 'vue/server-renderer';
import { D as DEFAULT_TEMPLATE_SLUG, S as SAMPLE_PROFILE, P as PORTFOLIO_TEMPLATES, m as mailtoHref, a as absoluteUrl } from '../_/portfolio.mjs';
import { a as useSaaS, u as useAppToast, c as useRoute } from './server.mjs';
import { u as useFetch } from './fetch-C81_PrUB.mjs';
import { u as useRequestURL } from './url-DT_ouQ3Z.mjs';
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
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { isPro, isAdmin, creditsRemaining, aiBlockedMessage } = useSaaS();
    useAppToast();
    const unlocked = computed(() => isPro.value || isAdmin.value);
    const selectedFile = ref(null);
    const dragging = ref(false);
    const selectedTemplate = ref(DEFAULT_TEMPLATE_SLUG);
    ref(null);
    const generating = ref(false);
    const saving = ref(false);
    const result = ref(null);
    const previewSlug = ref(null);
    const activeTab = ref("saved");
    const previewData = computed(() => {
      var _a;
      return (_a = result.value) != null ? _a : SAMPLE_PROFILE;
    });
    const { data: saved, refresh: refreshSaved } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/portfolio",
      { default: () => ({ portfolios: [] }) },
      "$HIl8oZOuid"
    )), __temp = await __temp, __restore(), __temp);
    const route = useRoute();
    watch(
      () => {
        var _a2;
        var _a, _b;
        return [route.query.template, (_a2 = (_b = (_a = saved.value) == null ? void 0 : _a.portfolios) == null ? void 0 : _b.length) != null ? _a2 : 0, unlocked.value];
      },
      ([slug, count]) => {
        if (typeof slug === "string" && PORTFOLIO_TEMPLATES.some((t) => t.slug === slug)) {
          selectedTemplate.value = slug;
          activeTab.value = "create";
          return;
        }
        if (count === 0 && unlocked.value) activeTab.value = "create";
      },
      { immediate: true }
    );
    const requestUrl = useRequestURL();
    const origin = computed(() => requestUrl.origin);
    const formatDate = (s) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
      new Date(s)
    );
    function templateName(slug) {
      var _a2;
      var _a;
      return (_a2 = (_a = PORTFOLIO_TEMPLATES.find((t) => t.slug === slug)) == null ? void 0 : _a.name) != null ? _a2 : slug;
    }
    function primaryContactHref(data) {
      const getUrl = (val) => typeof val === "string" ? val : val == null ? void 0 : val.url;
      return mailtoHref(data.email) || absoluteUrl(getUrl(data.linkedin)) || absoluteUrl(getUrl(data.website)) || absoluteUrl(getUrl(data.github)) || "#contact";
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d;
      const _component_PortfolioRenderer = _sfc_main$1;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "px-6 py-10 max-w-7xl mx-auto" }, _attrs))}><header class="mb-8"><h1 class="font-serif text-4xl text-white mb-2">AI Portfolio Builder</h1><p class="text-blue-200/60 max-w-3xl"> Generate a live portfolio from your CV, publish it, and host it on your own domain. Saved portfolios stay here so you can open or share them anytime. </p><div class="w-full h-px bg-white/10 mt-6"></div></header><section id="my-portfolios" class="scroll-mt-24 mb-10"><div class="flex flex-wrap items-end justify-between gap-4 mb-4"><div><h2 class="text-sm font-semibold uppercase tracking-widest text-blue-200/60 mb-1"> My published portfolios </h2><p class="text-sm text-blue-200/50">${ssrInterpolate(((_b = (_a = unref(saved)) == null ? void 0 : _a.portfolios) == null ? void 0 : _b.length) || 0)} published \xB7 open live or copy a share link </p></div><div class="flex items-center gap-2"><button type="button" class="${ssrRenderClass([unref(activeTab) === "saved" ? "bg-blue-500 text-white" : "border border-white/15 text-blue-100 hover:bg-white/5", "rounded-lg px-3 py-2 text-sm font-semibold transition"])}"> Saved </button><button type="button" class="${ssrRenderClass([unref(activeTab) === "create" ? "bg-blue-500 text-white" : "border border-white/15 text-blue-100 hover:bg-white/5", "rounded-lg px-3 py-2 text-sm font-semibold transition"])}"> Create new </button></div></div>`);
      if (!((_d = (_c = unref(saved)) == null ? void 0 : _c.portfolios) == null ? void 0 : _d.length)) {
        _push(`<p class="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-8 text-blue-200/60"> Nothing published yet. <button type="button" class="text-blue-300 hover:text-white underline underline-offset-4 ml-1"> Create your first portfolio </button></p>`);
      } else {
        _push(`<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><!--[-->`);
        ssrRenderList(unref(saved).portfolios, (p) => {
          _push(`<article class="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-3 hover:border-blue-400/40 transition"><div class="rounded-xl overflow-hidden border border-white/10 bg-slate-900 h-36 relative"><div class="absolute top-0 left-0 origin-top-left pointer-events-none" style="${ssrRenderStyle({ "width": "400%", "height": "400%", "transform": "scale(0.25)" })}">`);
          _push(ssrRenderComponent(_component_PortfolioRenderer, {
            slug: p.templateSlug,
            data: p.profileData
          }, null, _parent));
          _push(`</div></div><div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-blue-400"></span><h3 class="font-semibold text-white truncate">${ssrInterpolate(p.profileData.full_name)}</h3></div><p class="text-xs text-blue-200/60">${ssrInterpolate(templateName(p.templateSlug))} \xB7 ${ssrInterpolate(formatDate(p.createdAt))}</p><code class="text-xs text-blue-200/70 bg-slate-900/60 rounded px-2 py-1 truncate">${ssrInterpolate(unref(origin))}/p/${ssrInterpolate(p.id)}</code><div class="flex flex-wrap items-center gap-2 mt-auto">`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/dashboard/portfolio/${p.id}`,
            class: "flex-1 min-w-[6rem] inline-flex items-center justify-center gap-1 rounded-lg bg-blue-500 hover:bg-blue-400 px-3 py-2 text-sm font-semibold text-white transition"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<span class="material-symbols-outlined text-[16px]"${_scopeId}>edit</span> Edit `);
              } else {
                return [
                  createVNode("span", { class: "material-symbols-outlined text-[16px]" }, "edit"),
                  createTextVNode(" Edit ")
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`<a${ssrRenderAttr("href", `/p/${p.id}`)} target="_blank" rel="noopener" class="rounded-lg border border-white/15 hover:bg-white/5 px-3 py-2 text-sm font-semibold text-blue-100 transition"> View live </a><button type="button" class="rounded-lg border border-white/15 hover:bg-white/5 px-3 py-2 text-sm font-semibold text-blue-100 transition"> Copy link </button><button type="button" class="rounded-lg border border-white/15 hover:bg-white/5 px-3 py-2 text-sm font-semibold text-blue-100 transition" title="Copy domain hosting instructions"> Domain </button></div></article>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`<div class="mt-6 rounded-2xl border border-white/10 bg-blue-500/5 p-5 text-sm text-blue-100/80"><p class="font-semibold text-white mb-1 flex items-center gap-2"><span class="material-symbols-outlined text-blue-300">public</span> Host on your own domain </p><p> Every published portfolio is live at <code class="text-blue-200">${ssrInterpolate(unref(origin) || "https://your-app")}/p/&lt;id&gt;</code> with no dashboard chrome. Point your domain at this app (CNAME or reverse proxy) and share <code class="text-blue-200">yourdomain.com/p/&lt;id&gt;</code>. Use the Domain button on any card to copy step-by-step instructions. </p></div></section><div class="relative" style="${ssrRenderStyle(unref(activeTab) === "create" ? null : { display: "none" })}"><div class="${ssrRenderClass(["space-y-12 transition", unref(unlocked) ? "" : "pointer-events-none select-none blur-sm opacity-60"])}"${ssrRenderAttr("aria-hidden", !unref(unlocked))}><section><h2 class="text-sm font-semibold uppercase tracking-widest text-blue-200/60 mb-3"> 1 \xB7 Upload your document </h2><div class="${ssrRenderClass([unref(dragging) ? "border-blue-400 bg-blue-500/10" : "border-white/15 hover:border-white/30", "rounded-2xl border-2 border-dashed p-10 text-center transition"])}" role="button" tabindex="0"><input type="file" accept=".pdf,.docx,.txt,.md" class="hidden"><span class="material-symbols-outlined text-4xl text-blue-300">upload_file</span>`);
      if (unref(selectedFile)) {
        _push(`<p class="text-white font-medium mt-2">${ssrInterpolate(unref(selectedFile).name)}</p>`);
      } else {
        _push(`<!--[--><p class="text-white font-medium mt-2">Drop your CV or cover letter here</p><p class="text-blue-200/50 text-sm mt-1">or click to browse \u2014 PDF, DOCX, or TXT</p><!--]-->`);
      }
      _push(`</div></section><section><div class="flex items-center justify-between mb-3"><h2 class="text-sm font-semibold uppercase tracking-widest text-blue-200/60"> 2 \xB7 Choose a template </h2><span class="text-xs text-blue-200/50">${ssrInterpolate(unref(PORTFOLIO_TEMPLATES).length)} designs \xB7 click to select or open full preview</span></div><div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"><!--[-->`);
      ssrRenderList(unref(PORTFOLIO_TEMPLATES), (template) => {
        _push(`<div class="${ssrRenderClass([unref(selectedTemplate) === template.slug ? "border-blue-400 ring-2 ring-blue-400/40" : "border-white/10 hover:border-white/25", "group rounded-2xl border overflow-hidden bg-white/[0.02] transition text-left cursor-pointer"])}" role="button" tabindex="0"><div class="relative h-40 overflow-hidden border-b border-white/10 bg-slate-900"><div class="absolute top-0 left-0 origin-top-left pointer-events-none" style="${ssrRenderStyle({ "width": "400%", "height": "400%", "transform": "scale(0.25)" })}">`);
        _push(ssrRenderComponent(_component_PortfolioRenderer, {
          slug: template.slug,
          data: unref(previewData)
        }, null, _parent));
        _push(`</div><div class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-2 bg-gradient-to-t from-slate-950/90 to-transparent"><button type="button" class="text-[11px] font-semibold rounded-md px-2 py-1 bg-white/90 text-slate-900 hover:bg-white"> Full preview </button>`);
        if (unref(selectedTemplate) === template.slug) {
          _push(`<span class="material-symbols-outlined text-blue-400 text-xl">check_circle</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><div class="p-3"><div class="flex items-center gap-2"><span class="${ssrRenderClass([template.accentClass, "w-2 h-2 rounded-full"])}"></span><h3 class="font-semibold text-white text-sm">${ssrInterpolate(template.name)}</h3></div><p class="text-[11px] uppercase tracking-wider text-blue-200/50 mt-1">${ssrInterpolate(template.persona)}</p></div></div>`);
      });
      _push(`<!--]--></div></section><section class="flex flex-wrap items-center gap-4"><button type="button" class="rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 font-semibold text-white transition shadow-[0_0_20px_rgba(59,130,246,0.4)]"${ssrIncludeBooleanAttr(unref(generating) || !unref(selectedFile)) ? " disabled" : ""}>${ssrInterpolate(unref(generating) ? "Generating\u2026" : "Generate Portfolio (Costs 20 Credits)")}</button><p class="text-sm text-blue-200/60">You have ${ssrInterpolate(unref(creditsRemaining))} credits.</p></section>`);
      if (unref(result)) {
        _push(`<section id="preview" class="scroll-mt-24"><div class="flex flex-wrap items-center justify-between gap-3 mb-3"><h2 class="text-sm font-semibold uppercase tracking-widest text-blue-200/60"> 3 \xB7 Preview &amp; publish \u2014 ${ssrInterpolate(templateName(unref(selectedTemplate)))}</h2><div class="flex flex-wrap items-center gap-2"><a${ssrRenderAttr("href", primaryContactHref(unref(result)))} class="rounded-xl border border-white/15 hover:bg-white/5 px-4 py-2.5 text-sm font-semibold text-blue-100 transition"${ssrRenderAttr("target", primaryContactHref(unref(result)).startsWith("http") ? "_blank" : void 0)} rel="noopener"> Test contact CTA </a><button type="button" class="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 font-semibold text-white transition disabled:opacity-50"${ssrIncludeBooleanAttr(unref(saving)) ? " disabled" : ""}>${ssrInterpolate(unref(saving) ? "Publishing\u2026" : "Save & Publish")}</button></div></div><div class="rounded-2xl border border-white/10 overflow-hidden bg-white h-[640px] overflow-y-auto">`);
        _push(ssrRenderComponent(_component_PortfolioRenderer, {
          slug: unref(selectedTemplate),
          data: unref(result)
        }, null, _parent));
        _push(`</div></section>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (!unref(unlocked)) {
        _push(`<div class="absolute inset-0 flex items-start justify-center pt-16"><div class="text-center rounded-2xl border border-white/10 bg-slate-950/85 backdrop-blur px-8 py-10 max-w-md"><span class="material-symbols-outlined text-4xl text-blue-300 mb-3">stars</span><h3 class="text-xl font-bold text-white">Upgrade to Pro to create AI Portfolios</h3><p class="mt-2 text-sm text-blue-200/60">${ssrInterpolate(unref(aiBlockedMessage)() || "Pro members can generate template-ready portfolios from any CV.")}</p><p class="mt-3 text-xs text-blue-200/50"> You can still open any portfolios you already published above. </p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/pricing",
          class: "mt-5 inline-block rounded-xl bg-blue-500 hover:bg-blue-400 px-6 py-3 font-semibold text-white transition"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Upgrade to Pro `);
            } else {
              return [
                createTextVNode(" Upgrade to Pro ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      ssrRenderTeleport(_push, (_push2) => {
        if (unref(previewSlug)) {
          _push2(`<div class="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex flex-col"><div class="flex items-center justify-between px-6 h-14 bg-slate-900 border-b border-white/10 shrink-0"><p class="font-semibold text-white">${ssrInterpolate(templateName(unref(previewSlug)))} \u2014 interactive preview</p><div class="flex items-center gap-2"><button type="button" class="rounded-lg bg-blue-500 hover:bg-blue-400 px-4 py-1.5 text-sm font-semibold text-white"> Use this template </button><button type="button" class="rounded-lg border border-white/15 hover:bg-white/5 px-3 py-1.5 text-sm text-blue-100"> Close </button></div></div><div class="flex-1 overflow-y-auto bg-white">`);
          _push2(ssrRenderComponent(_component_PortfolioRenderer, {
            slug: unref(previewSlug),
            data: unref(previewData)
          }, null, _parent));
          _push2(`</div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/dashboard/portfolio/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-DwZRBytq.mjs.map
