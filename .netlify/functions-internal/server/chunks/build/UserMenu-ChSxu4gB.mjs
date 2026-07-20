import { _ as __nuxt_component_0 } from './nuxt-link-Cuf_TjgJ.mjs';
import { defineComponent, unref, mergeProps, withCtx, openBlock, createBlock, toDisplayString, ref, computed, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrInterpolate, ssrRenderAttrs, ssrRenderAttr } from 'vue/server-renderer';
import { a as useSaaS } from './server.mjs';

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "CreditBadge",
  __ssrInlineRender: true,
  setup(__props) {
    const { creditsRemaining, planTier, loggedIn, pending } = useSaaS();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      if (unref(loggedIn)) {
        _push(ssrRenderComponent(_component_NuxtLink, mergeProps({
          to: "/pricing",
          class: [
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
            unref(creditsRemaining) > 0 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20" : "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
          ],
          title: "Credits & billing"
        }, _attrs), {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              if (unref(pending)) {
                _push2(`<span class="opacity-70"${_scopeId}>\u2026</span>`);
              } else {
                _push2(`<span${_scopeId}>${ssrInterpolate(unref(creditsRemaining))} cr \xB7 ${ssrInterpolate(unref(planTier))}</span>`);
              }
            } else {
              return [
                unref(pending) ? (openBlock(), createBlock("span", {
                  key: 0,
                  class: "opacity-70"
                }, "\u2026")) : (openBlock(), createBlock("span", { key: 1 }, toDisplayString(unref(creditsRemaining)) + " cr \xB7 " + toDisplayString(unref(planTier)), 1))
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/CreditBadge.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "UserMenu",
  __ssrInlineRender: true,
  setup(__props) {
    const { loggedIn, sessionUser, creditsRemaining, planTier, isPro, isAdmin } = useSaaS();
    const open = ref(false);
    const initials = computed(() => {
      var _a;
      const email = ((_a = sessionUser.value) == null ? void 0 : _a.email) || "";
      const local = email.split("@")[0] || "?";
      const parts = local.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
      }
      return local.slice(0, 2).toUpperCase() || "?";
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b;
      const _component_NuxtLink = __nuxt_component_0;
      if (unref(loggedIn)) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "relative shrink-0" }, _attrs))}><button type="button" class="w-10 h-10 rounded-full border border-indigo-400/40 bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-xs font-bold flex items-center justify-center cursor-pointer shadow-md shadow-indigo-500/20 hover:scale-105 transition-transform"${ssrRenderAttr("title", ((_a = unref(sessionUser)) == null ? void 0 : _a.email) || "Account")} aria-haspopup="menu"${ssrRenderAttr("aria-expanded", unref(open))}>${ssrInterpolate(unref(initials))}</button>`);
        if (unref(open)) {
          _push(`<div class="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-700 bg-slate-950 shadow-2xl z-50 overflow-hidden" role="menu"><div class="px-3 py-2 border-b border-slate-800"><p class="text-xs text-slate-400 truncate">${ssrInterpolate((_b = unref(sessionUser)) == null ? void 0 : _b.email)}</p><p class="text-[11px] text-indigo-300 mt-0.5">${ssrInterpolate(unref(planTier))} \xB7 ${ssrInterpolate(unref(creditsRemaining))} cr `);
          if (unref(isPro)) {
            _push(`<span class="text-emerald-400">\xB7 pro</span>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(isAdmin)) {
            _push(`<span class="text-amber-300">\xB7 admin</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</p></div>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/pricing",
            class: "block px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-900 cursor-pointer",
            role: "menuitem",
            onClick: ($event) => open.value = false
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Billing &amp; credits `);
              } else {
                return [
                  createTextVNode(" Billing & credits ")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`<button type="button" class="w-full text-left px-3 py-2.5 text-sm text-red-300 hover:bg-slate-900 cursor-pointer" role="menuitem"> Log out </button></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/UserMenu.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main$1 as _, _sfc_main as a };
//# sourceMappingURL=UserMenu-ChSxu4gB.mjs.map
