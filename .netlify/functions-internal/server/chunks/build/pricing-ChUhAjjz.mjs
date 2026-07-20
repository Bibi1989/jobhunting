import { _ as __nuxt_component_0 } from './nuxt-link-Cuf_TjgJ.mjs';
import { _ as _sfc_main$1, a as _sfc_main$2 } from './UserMenu-ChSxu4gB.mjs';
import { defineComponent, ref, mergeProps, withCtx, createTextVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { c as useRoute, a as useSaaS } from './server.mjs';
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
  __name: "pricing",
  __ssrInlineRender: true,
  setup(__props) {
    useRoute();
    const {
      loggedIn,
      creditsRemaining,
      planTier
    } = useSaaS();
    const loadingCheckout = ref(false);
    const loadingPortal = ref(false);
    const message = ref(null);
    const error = ref(null);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_CreditBadge = _sfc_main$1;
      const _component_UserMenu = _sfc_main$2;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-slate-100" }, _attrs))}><header class="flex items-center justify-between px-6 h-16 border-b border-white/10">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "font-bold text-lg text-white"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`JobFlow AI`);
          } else {
            return [
              createTextVNode("JobFlow AI")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="flex items-center gap-3 text-sm">`);
      _push(ssrRenderComponent(_component_CreditBadge, null, null, _parent));
      if (!unref(loggedIn)) {
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/login",
          class: "text-slate-300 hover:text-white cursor-pointer"
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
      _push(`</div></header><main class="max-w-5xl mx-auto px-6 py-16"><div class="text-center mb-12"><h1 class="text-4xl font-bold text-white mb-3">Simple pricing</h1><p class="text-slate-400">Credit-based AI scraping and document tools. Upgrade anytime.</p>`);
      if (unref(loggedIn)) {
        _push(`<p class="mt-3 text-sm text-indigo-300"> Current plan: <span class="font-semibold uppercase">${ssrInterpolate(unref(planTier))}</span> \xB7 ${ssrInterpolate(unref(creditsRemaining))} credits remaining </p>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(message)) {
        _push(`<p class="mt-3 text-sm text-emerald-300">${ssrInterpolate(unref(message))}</p>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(error)) {
        _push(`<p class="mt-3 text-sm text-red-400">${ssrInterpolate(unref(error))}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="grid md:grid-cols-2 gap-6"><div class="rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col"><h2 class="text-xl font-bold text-white">Free</h2><p class="text-3xl font-extrabold text-white mt-4">\u20AC0</p><p class="text-sm text-slate-400 mt-1">10 starter credits</p><ul class="mt-6 space-y-2 text-sm text-slate-300 flex-1"><li>Job scraping with starter credits</li><li>Resume &amp; cover letter builder (manual edit)</li><li>No AI features (Pro required)</li></ul>`);
      if (!unref(loggedIn)) {
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/register",
          class: "mt-8 block text-center rounded-xl border border-white/20 py-3 font-bold text-sm hover:bg-white/5"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Get started `);
            } else {
              return [
                createTextVNode(" Get started ")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<div class="mt-8 text-center rounded-xl border border-white/10 py-3 text-sm text-slate-400">${ssrInterpolate(unref(planTier) === "free" ? "Your current plan" : "Included free tier")}</div>`);
      }
      _push(`</div><div class="rounded-2xl border border-indigo-400/40 bg-indigo-500/10 p-8 flex flex-col shadow-[0_0_40px_rgba(99,102,241,0.15)]"><h2 class="text-xl font-bold text-white">Pro</h2><p class="text-3xl font-extrabold text-white mt-4"> \u20AC29<span class="text-base font-semibold text-slate-400">/mo</span></p><p class="text-sm text-indigo-200 mt-1">150 credits replenished each billing cycle</p><ul class="mt-6 space-y-2 text-sm text-slate-200 flex-1"><li>Everything in Free</li><li>AI tailor, translate, enhance, cover letters</li><li>Application form AI assistant</li><li>150 credits each billing cycle</li></ul><button type="button"${ssrIncludeBooleanAttr(unref(loadingCheckout)) ? " disabled" : ""} class="mt-8 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 font-bold text-sm disabled:opacity-50">${ssrInterpolate(unref(loadingCheckout) ? "Redirecting\u2026" : unref(planTier) === "pro" ? "Renew / manage via Checkout" : "Upgrade to Pro")}</button>`);
      if (unref(loggedIn) && unref(planTier) === "pro") {
        _push(`<button type="button"${ssrIncludeBooleanAttr(unref(loadingPortal)) ? " disabled" : ""} class="mt-3 w-full rounded-xl border border-white/15 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5 disabled:opacity-50">${ssrInterpolate(unref(loadingPortal) ? "Opening\u2026" : "Open billing portal")}</button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></main></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/pricing.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=pricing-ChUhAjjz.mjs.map
