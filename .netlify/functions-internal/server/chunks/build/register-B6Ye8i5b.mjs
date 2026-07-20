import { _ as __nuxt_component_0 } from './nuxt-link-Cuf_TjgJ.mjs';
import { defineComponent, ref, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrInterpolate, ssrIncludeBooleanAttr, ssrRenderComponent } from 'vue/server-renderer';
import { a as useSaaS } from './server.mjs';
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
  __name: "register",
  __ssrInlineRender: true,
  setup(__props) {
    const email = ref("");
    const password = ref("");
    const loading = ref(false);
    const error = ref(null);
    useSaaS();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-slate-100 flex items-center justify-center p-6" }, _attrs))}><div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-xl p-8 shadow-2xl"><h1 class="text-2xl font-bold text-white mb-1">Create your account</h1><p class="text-sm text-slate-400 mb-6">Free tier includes 10 AI/scrape credits to get started.</p><form class="space-y-4"><div><label class="text-xs uppercase tracking-wider text-slate-400 font-semibold">Email</label><input${ssrRenderAttr("value", unref(email))} type="email" required class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-white outline-none focus:border-indigo-400"></div><div><label class="text-xs uppercase tracking-wider text-slate-400 font-semibold">Password</label><input${ssrRenderAttr("value", unref(password))} type="password" required minlength="8" class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-white outline-none focus:border-indigo-400"><p class="mt-1 text-[11px] text-slate-500">At least 8 characters.</p></div>`);
      if (unref(error)) {
        _push(`<p class="text-sm text-red-400">${ssrInterpolate(unref(error))}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<button type="submit"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} class="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 font-bold text-sm disabled:opacity-50">${ssrInterpolate(unref(loading) ? "Creating\u2026" : "Create account")}</button></form><p class="mt-6 text-sm text-slate-400 text-center"> Already have an account? `);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/login",
        class: "text-indigo-300 hover:text-indigo-200 font-semibold"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Sign in`);
          } else {
            return [
              createTextVNode("Sign in")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</p></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/register.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=register-B6Ye8i5b.mjs.map
