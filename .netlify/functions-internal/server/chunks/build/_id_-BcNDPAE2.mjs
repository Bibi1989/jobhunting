import { _ as _sfc_main$2, p as portfolioContactKey } from './PortfolioRenderer-KMW0Hdx0.mjs';
import { defineComponent, computed, withAsyncContext, unref, withCtx, createTextVNode, ref, reactive, provide, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderTeleport, ssrRenderAttr, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { _ as __nuxt_component_0 } from './nuxt-link-Cuf_TjgJ.mjs';
import { g as getPortfolioTemplate } from '../_/portfolio.mjs';
import { c as useRoute } from './server.mjs';
import { u as useFetch } from './fetch-C81_PrUB.mjs';
import { u as useHead } from './index-BabADJUJ.mjs';
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

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "PortfolioContactModal",
  __ssrInlineRender: true,
  props: {
    portfolioId: {},
    ownerName: {},
    ownerEmail: {},
    demo: { type: Boolean }
  },
  setup(__props, { expose: __expose }) {
    const open = ref(false);
    const sending = ref(false);
    const done = ref(false);
    const errorMsg = ref("");
    const form = reactive({ name: "", email: "", message: "" });
    function reset() {
      form.name = "";
      form.email = "";
      form.message = "";
      done.value = false;
      errorMsg.value = "";
    }
    function openModal() {
      reset();
      open.value = true;
    }
    provide(portfolioContactKey, openModal);
    __expose({ openModal });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(_attrs)}><button type="button" class="fixed bottom-6 right-6 z-[90] inline-flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-3 shadow-2xl shadow-indigo-900/40 transition"><span class="material-symbols-outlined text-[20px]">mail</span> Get in touch </button>`);
      ssrRenderTeleport(_push, (_push2) => {
        if (unref(open)) {
          _push2(`<div class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"><div class="w-full max-w-md rounded-2xl bg-white text-slate-900 shadow-2xl overflow-hidden"><div class="flex items-center justify-between px-6 h-14 border-b border-slate-100"><h2 class="font-semibold"> Contact ${ssrInterpolate(__props.ownerName || "")}</h2><button type="button" class="text-slate-400 hover:text-slate-700"><span class="material-symbols-outlined">close</span></button></div>`);
          if (unref(done)) {
            _push2(`<div class="p-8 text-center"><div class="mx-auto mb-3 w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center"><span class="material-symbols-outlined text-emerald-600">check</span></div><p class="font-semibold text-lg">Message sent</p><p class="text-slate-500 mt-1 text-sm"> Thanks for reaching out${ssrInterpolate(unref(form).name ? `, ${unref(form).name}` : "")}. You&#39;ll hear back soon. </p><button type="button" class="mt-5 rounded-lg bg-slate-900 text-white px-5 py-2.5 font-semibold hover:bg-slate-700"> Close </button></div>`);
          } else {
            _push2(`<form class="p-6 space-y-4"><p class="text-sm text-slate-500"> Send a note and it will be delivered to ${ssrInterpolate(__props.ownerName || "the portfolio owner")}&#39;s email inbox. </p><div><label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Your name</label><input${ssrRenderAttr("value", unref(form).name)} type="text" required class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:outline-none focus:border-indigo-500" placeholder="Jane Recruiter"></div><div><label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Your email</label><input${ssrRenderAttr("value", unref(form).email)} type="email" required class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:outline-none focus:border-indigo-500" placeholder="jane@company.com"></div><div><label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Message</label><textarea rows="4" required class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:outline-none focus:border-indigo-500 resize-none" placeholder="I&#39;d love to talk about a role\u2026">${ssrInterpolate(unref(form).message)}</textarea></div>`);
            if (unref(errorMsg)) {
              _push2(`<p class="text-sm text-red-600">${ssrInterpolate(unref(errorMsg))}</p>`);
            } else {
              _push2(`<!---->`);
            }
            if (__props.demo) {
              _push2(`<p class="text-xs text-amber-600">Preview only \u2014 messages aren&#39;t sent from the editor.</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<button type="submit" class="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 transition disabled:opacity-50"${ssrIncludeBooleanAttr(unref(sending)) ? " disabled" : ""}>${ssrInterpolate(unref(sending) ? "Sending\u2026" : "Send message")}</button></form>`);
          }
          _push2(`</div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      _push(`</div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/portfolio/PortfolioContactModal.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[id]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const id = computed(() => String(route.params.id));
    const { data, error } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      () => `/api/portfolio/public/${id.value}`,
      "$ezJc7Lp8kr"
    )), __temp = await __temp, __restore(), __temp);
    const portfolio = computed(() => {
      var _a2;
      var _a;
      return (_a2 = (_a = data.value) == null ? void 0 : _a.portfolio) != null ? _a2 : null;
    });
    useHead(() => {
      var _a;
      const p = portfolio.value;
      if (!p) return { title: "Portfolio" };
      const template = getPortfolioTemplate(p.templateSlug);
      return {
        title: `${p.profileData.full_name} \u2014 Portfolio`,
        meta: [
          {
            name: "description",
            content: ((_a = p.profileData.professional_bio) == null ? void 0 : _a.slice(0, 160)) || `Portfolio \xB7 ${template.name}`
          }
        ]
      };
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      const _component_PortfolioRenderer = _sfc_main$2;
      const _component_PortfolioContactModal = _sfc_main$1;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(_attrs)}>`);
      if (unref(portfolio)) {
        _push(`<!--[-->`);
        _push(ssrRenderComponent(_component_PortfolioRenderer, {
          slug: unref(portfolio).templateSlug,
          data: unref(portfolio).profileData
        }, null, _parent));
        _push(ssrRenderComponent(_component_PortfolioContactModal, {
          "portfolio-id": unref(portfolio).id,
          "owner-name": unref(portfolio).profileData.full_name,
          "owner-email": unref(portfolio).profileData.email
        }, null, _parent));
        _push(`<!--]-->`);
      } else {
        _push(`<div class="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 text-slate-200 px-6 text-center"><p class="text-2xl font-semibold">Portfolio not found</p><p class="text-slate-400">${ssrInterpolate(((_a = unref(error)) == null ? void 0 : _a.statusMessage) || "This portfolio may have been removed or the link is incorrect.")}</p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/",
          class: "mt-2 rounded-lg bg-indigo-500 px-5 py-2.5 font-semibold text-white hover:bg-indigo-400"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Go home `);
            } else {
              return [
                createTextVNode(" Go home ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/p/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-BcNDPAE2.mjs.map
