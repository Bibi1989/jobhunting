import { _ as __nuxt_component_0 } from './nuxt-link-Cuf_TjgJ.mjs';
import { _ as _sfc_main$1, a as _sfc_main$2 } from './UserMenu-ChSxu4gB.mjs';
import { defineComponent, ref, watch, mergeProps, unref, withCtx, createTextVNode, toDisplayString, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderList, ssrRenderSlot } from 'vue/server-renderer';
import { a as useSaaS, c as useRoute } from './server.mjs';
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
  __name: "dashboard",
  __ssrInlineRender: true,
  setup(__props) {
    const { loggedIn } = useSaaS();
    const route = useRoute();
    const mobileOpen = ref(false);
    const topNav = [
      { label: "My Projects", to: "/builder" },
      { label: "Templates", to: "/builder/templates" },
      { label: "Portfolio", to: "/dashboard/portfolio" },
      { label: "Analytics", to: "/dashboard/analytics" }
    ];
    const sideNav = [
      { label: "All Projects", to: "/builder", icon: "folder" },
      { label: "Templates", to: "/builder/templates", icon: "grid_view" },
      { label: "AI Portfolio", to: "/dashboard/portfolio", icon: "stars" },
      { label: "Analytics", to: "/dashboard/analytics", icon: "monitoring" }
    ];
    watch(
      () => route.fullPath,
      () => {
        mobileOpen.value = false;
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_CreditBadge = _sfc_main$1;
      const _component_UserMenu = _sfc_main$2;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-100 min-h-screen selection:bg-blue-500/30" }, _attrs))}><header class="flex justify-between items-center px-4 sm:px-6 h-16 w-full fixed top-0 z-50 bg-slate-900/40 backdrop-blur-md border-b border-white/10"><div class="flex items-center gap-3 sm:gap-8"><button type="button" class="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 text-slate-200 hover:bg-white/5" aria-label="Open menu"><span class="material-symbols-outlined">${ssrInterpolate(unref(mobileOpen) ? "close" : "menu")}</span></button>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "font-serif text-xl sm:text-2xl text-white font-bold tracking-wide hover:text-blue-300 transition-colors"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` ScrapeEngine `);
          } else {
            return [
              createTextVNode(" ScrapeEngine ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<nav class="hidden md:flex gap-6 items-center h-full"><!--[-->`);
      ssrRenderList(topNav, (item) => {
        _push(ssrRenderComponent(_component_NuxtLink, {
          key: item.to,
          to: item.to,
          class: "font-semibold text-slate-300 hover:text-white transition-colors duration-200",
          "active-class": "!text-blue-400 border-b-2 border-blue-400 pb-1"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(item.label)}`);
            } else {
              return [
                createTextVNode(toDisplayString(item.label), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
      });
      _push(`<!--]--></nav></div><div class="flex items-center gap-3">`);
      _push(ssrRenderComponent(_component_CreditBadge, null, null, _parent));
      if (!unref(loggedIn)) {
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/login",
          class: "text-sm text-slate-300 hover:text-white cursor-pointer"
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
      _push(`</div></header><aside class="fixed left-0 top-16 h-[calc(100vh-4rem)] flex flex-col py-6 bg-slate-900/50 backdrop-blur-xl w-64 border-r border-white/10 hidden lg:flex z-40"><div class="px-6 mb-8"><div class="flex items-center gap-3 mb-6"><div class="w-10 h-12 bg-white/5 rounded border border-white/10 flex items-center justify-center"><span class="material-symbols-outlined text-blue-400">description</span></div><div><p class="font-semibold text-white uppercase tracking-widest text-sm">Dashboard</p><p class="text-xs text-blue-200/60">Manage Workspace</p></div></div></div><nav class="flex-1 flex flex-col gap-1"><!--[-->`);
      ssrRenderList(sideNav, (item) => {
        _push(ssrRenderComponent(_component_NuxtLink, {
          key: item.to,
          to: item.to,
          class: "flex items-center gap-4 px-6 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-150",
          "active-class": "!text-blue-400 font-bold border-r-2 border-blue-400 bg-blue-500/10"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="material-symbols-outlined"${_scopeId}>${ssrInterpolate(item.icon)}</span><span class="font-semibold text-sm"${_scopeId}>${ssrInterpolate(item.label)}</span>`);
            } else {
              return [
                createVNode("span", { class: "material-symbols-outlined" }, toDisplayString(item.icon), 1),
                createVNode("span", { class: "font-semibold text-sm" }, toDisplayString(item.label), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
      });
      _push(`<!--]--></nav></aside>`);
      if (unref(mobileOpen)) {
        _push(`<div class="fixed inset-0 z-40 lg:hidden"><button type="button" class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" aria-label="Close menu"></button><aside class="absolute left-0 top-16 bottom-0 w-72 max-w-[85vw] bg-slate-900 border-r border-white/10 py-6 flex flex-col shadow-2xl"><p class="px-6 mb-4 text-xs uppercase tracking-widest text-blue-200/60 font-semibold">Navigate</p><nav class="flex flex-col gap-1"><!--[-->`);
        ssrRenderList(sideNav, (item) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: item.to,
            to: item.to,
            class: "flex items-center gap-4 px-6 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all",
            "active-class": "!text-blue-400 font-bold bg-blue-500/10"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<span class="material-symbols-outlined"${_scopeId}>${ssrInterpolate(item.icon)}</span><span class="font-semibold text-sm"${_scopeId}>${ssrInterpolate(item.label)}</span>`);
              } else {
                return [
                  createVNode("span", { class: "material-symbols-outlined" }, toDisplayString(item.icon), 1),
                  createVNode("span", { class: "font-semibold text-sm" }, toDisplayString(item.label), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></nav></aside></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<main class="pt-16 lg:ml-64 min-h-screen">`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</main></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/dashboard.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=dashboard-BLhW-Af1.mjs.map
