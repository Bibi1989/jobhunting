import { _ as __nuxt_component_0 } from './nuxt-link-Cuf_TjgJ.mjs';
import { defineComponent, ref, mergeProps, withCtx, createVNode, unref, createTextVNode, computed, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderStyle, ssrRenderList, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { u as useAppToast, b as useAppConfirm } from './server.mjs';
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

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "DocumentThumbnail",
  __ssrInlineRender: true,
  props: {
    preview: {},
    type: {}
  },
  setup(__props) {
    const props = __props;
    const isCover = computed(() => {
      var _a;
      return props.type === "cover_letter" || ((_a = props.preview) == null ? void 0 : _a.kind) === "cover_letter";
    });
    const contactLine = computed(() => {
      const p = props.preview;
      if (!p) return "";
      return [p.location, p.email, p.phone].filter(Boolean).join(" \xB7 ");
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "w-full h-full bg-white text-slate-800 shadow-sm rounded-sm overflow-hidden relative" }, _attrs))}><div class="absolute inset-0 origin-top-left scale-[0.92] p-3 pointer-events-none select-none">`);
      if (__props.preview && unref(isCover)) {
        _push(`<!--[--><p class="text-[9px] font-bold text-slate-900 leading-tight truncate">${ssrInterpolate(__props.preview.fullName)}</p>`);
        if (__props.preview.jobTitle) {
          _push(`<p class="text-[7px] text-slate-500 mt-0.5 truncate">${ssrInterpolate(__props.preview.jobTitle)}</p>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(contactLine)) {
          _push(`<p class="text-[6px] text-slate-400 mt-0.5 truncate">${ssrInterpolate(unref(contactLine))}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="mt-2 space-y-0.5 text-[6.5px] text-slate-600 leading-snug">`);
        if (__props.preview.hiringManager || __props.preview.companyName) {
          _push(`<p class="font-semibold text-slate-800">${ssrInterpolate(__props.preview.hiringManager || "Hiring Manager")} `);
          if (__props.preview.companyName) {
            _push(`<span> \xB7 ${ssrInterpolate(__props.preview.companyName)}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<p class="line-clamp-[14] whitespace-pre-wrap">${ssrInterpolate(__props.preview.contentPreview || "Cover letter draft\u2026")}</p></div><!--]-->`);
      } else if (__props.preview) {
        _push(`<!--[--><p class="text-[9px] font-bold uppercase tracking-wide text-slate-900 leading-tight truncate">${ssrInterpolate(__props.preview.fullName)}</p>`);
        if (__props.preview.jobTitle) {
          _push(`<p class="text-[7px] font-semibold text-slate-500 mt-0.5 truncate uppercase tracking-wider">${ssrInterpolate(__props.preview.jobTitle)}</p>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(contactLine)) {
          _push(`<p class="text-[6px] text-slate-400 mt-0.5 truncate">${ssrInterpolate(unref(contactLine))}</p>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.preview.summary) {
          _push(`<div class="mt-2"><p class="text-[6px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Summary</p><p class="text-[6.5px] text-slate-600 leading-snug line-clamp-3">${ssrInterpolate(__props.preview.summary)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.preview.experience.length) {
          _push(`<div class="mt-2"><p class="text-[6px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Experience</p><!--[-->`);
          ssrRenderList(__props.preview.experience, (exp, i) => {
            _push(`<div class="mb-1"><p class="text-[7px] font-semibold text-slate-800 truncate">${ssrInterpolate(exp.title || "Role")} `);
            if (exp.company) {
              _push(`<span class="font-normal text-slate-500"> \xB7 ${ssrInterpolate(exp.company)}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</p>`);
            if (exp.dates) {
              _push(`<p class="text-[6px] text-slate-400">${ssrInterpolate(exp.dates)}</p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.preview.skills.length) {
          _push(`<div class="mt-1.5"><p class="text-[6px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Skills</p><p class="text-[6.5px] text-slate-600 leading-snug line-clamp-2">${ssrInterpolate(__props.preview.skills.join(" \xB7 "))}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--]-->`);
      } else {
        _push(`<div class="h-full flex flex-col items-center justify-center text-slate-300 gap-1"><span class="material-symbols-outlined text-4xl">${ssrInterpolate(unref(isCover) ? "article" : "quick_reference")}</span><span class="text-[8px] uppercase tracking-wider">Empty draft</span></div>`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/builder/DocumentThumbnail.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    useAppToast();
    useAppConfirm();
    const { data: documents, pending, refresh } = useFetch("/api/builder/documents", "$LdhN7jpTrG");
    const deletingKey = ref(null);
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
    };
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_BuilderDocumentThumbnail = _sfc_main$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "pt-8 pb-12 px-6" }, _attrs))}><div class="max-w-7xl mx-auto"><header class="mb-8"><h1 class="font-serif text-4xl text-white mb-2">Workspace</h1><div class="w-full h-px bg-white/10 mb-8"></div></header><section class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/builder/resume/new",
        class: "group relative flex flex-col items-center justify-center h-64 bg-white/5 backdrop-blur-md border-2 border-dashed border-white/20 rounded-xl hover:border-blue-400 hover:bg-white/10 transition-all cursor-pointer"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.5)]"${_scopeId}><span class="material-symbols-outlined"${_scopeId}>add</span></div><span class="font-semibold text-white"${_scopeId}>New Resume</span><span class="text-sm text-blue-200/60 mt-1"${_scopeId}>Start from professional templates</span>`);
          } else {
            return [
              createVNode("div", { class: "w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.5)]" }, [
                createVNode("span", { class: "material-symbols-outlined" }, "add")
              ]),
              createVNode("span", { class: "font-semibold text-white" }, "New Resume"),
              createVNode("span", { class: "text-sm text-blue-200/60 mt-1" }, "Start from professional templates")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/builder/cover-letter/new",
        class: "group relative flex flex-col items-center justify-center h-64 bg-white/5 backdrop-blur-md border-2 border-dashed border-white/20 rounded-xl hover:border-indigo-400 hover:bg-white/10 transition-all cursor-pointer"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(99,102,241,0.5)]"${_scopeId}><span class="material-symbols-outlined"${_scopeId}>description</span></div><span class="font-semibold text-white"${_scopeId}>New Cover Letter</span><span class="text-sm text-blue-200/60 mt-1"${_scopeId}>AI-powered writing assistant</span>`);
          } else {
            return [
              createVNode("div", { class: "w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(99,102,241,0.5)]" }, [
                createVNode("span", { class: "material-symbols-outlined" }, "description")
              ]),
              createVNode("span", { class: "font-semibold text-white" }, "New Cover Letter"),
              createVNode("span", { class: "text-sm text-blue-200/60 mt-1" }, "AI-powered writing assistant")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="h-64 bg-blue-600/20 backdrop-blur-md border border-blue-500/30 text-white p-6 rounded-xl flex flex-col justify-between overflow-hidden relative shadow-[0_8px_32px_rgba(0,0,0,0.3)]"><div class="z-10"><p class="text-xs uppercase tracking-widest text-blue-300 mb-2 font-semibold">Total Documents</p><p class="font-serif text-4xl">${ssrInterpolate(((_a = unref(documents)) == null ? void 0 : _a.length) || 0)} Projects</p></div><div class="absolute inset-0 opacity-20 pointer-events-none" style="${ssrRenderStyle({ "background-image": "radial-gradient(#60a5fa 1px, transparent 1px)", "background-size": "20px 20px" })}"></div><div class="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl"></div></div></section><div class="flex items-center justify-between mb-6"><h2 class="font-semibold uppercase tracking-widest text-blue-200/60 text-sm">Recent Projects</h2></div>`);
      if (unref(pending)) {
        _push(`<section class="text-blue-200/60"><div class="animate-pulse flex gap-2 items-center"><span class="material-symbols-outlined animate-spin">refresh</span> Loading documents... </div></section>`);
      } else if (!((_b = unref(documents)) == null ? void 0 : _b.length)) {
        _push(`<section class="text-blue-200/60 italic"> No documents found. Create a new resume above. </section>`);
      } else {
        _push(`<section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"><!--[-->`);
        ssrRenderList(unref(documents), (doc) => {
          _push(`<div class="group bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden flex flex-col hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:border-blue-400/50 hover:-translate-y-1 transition-all duration-300"><div class="relative aspect-[3/4] bg-slate-800/40 p-3 overflow-hidden border-b border-white/5">`);
          _push(ssrRenderComponent(_component_BuilderDocumentThumbnail, {
            preview: doc.preview,
            type: doc.type
          }, null, _parent));
          _push(`<div class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/builder/${doc.type === "cover_letter" ? "cover-letter" : "resume"}/${doc.id}`,
            class: "bg-blue-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-400 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.5)] cursor-pointer"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Edit `);
              } else {
                return [
                  createTextVNode(" Edit ")
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`<button type="button" class="bg-red-600/90 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-500 transition-colors cursor-pointer disabled:opacity-50"${ssrIncludeBooleanAttr(unref(deletingKey) === `${doc.type}-${doc.id}`) ? " disabled" : ""}>${ssrInterpolate(unref(deletingKey) === `${doc.type}-${doc.id}` ? "Deleting\u2026" : "Delete")}</button></div></div><div class="p-4"><div class="flex justify-between items-start mb-2 gap-2"><h3 class="font-semibold text-white truncate pr-2 group-hover:text-blue-400 transition-colors">${ssrInterpolate(doc.name)}</h3><button type="button" class="shrink-0 text-slate-500 hover:text-red-400 material-symbols-outlined text-[18px] cursor-pointer disabled:opacity-40" title="Delete"${ssrIncludeBooleanAttr(unref(deletingKey) === `${doc.type}-${doc.id}`) ? " disabled" : ""}> delete </button></div><div class="flex items-center gap-2"><span class="text-[10px] bg-white/10 px-2 py-0.5 rounded text-blue-200 uppercase font-semibold tracking-wider">${ssrInterpolate(doc.type)}</span><span class="text-xs text-slate-400">Edited ${ssrInterpolate(formatDate(doc.updatedAt))}</span></div></div></div>`);
        });
        _push(`<!--]--></section>`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/builder/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-DKD2iynT.mjs.map
