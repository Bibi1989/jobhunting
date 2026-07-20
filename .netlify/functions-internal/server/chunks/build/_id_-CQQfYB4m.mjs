import { _ as __nuxt_component_0 } from './nuxt-link-Cuf_TjgJ.mjs';
import { defineComponent, withAsyncContext, computed, ref, watch, mergeProps, withCtx, unref, createVNode, createTextVNode, isRef, openBlock, createBlock, useModel, mergeModels, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderClass, ssrInterpolate, ssrIncludeBooleanAttr, ssrLooseContain, ssrRenderList, ssrRenderAttr, ssrRenderSlot } from 'vue/server-renderer';
import { ArrowLeft, Loader2, AlertCircle, Building2, MapPin, DollarSign, FileText, ClipboardList, CheckCircle, Upload, Trash2, Bookmark, Save, Download, ExternalLink, RefreshCw, Sparkles, Check, Copy, Pencil, Eye } from 'lucide-vue-next';
import { _ as __nuxt_component_2 } from './CvFormatPicker-pXplRX-f.mjs';
import { aJ as CV_FORMATS, aP as EMPTY_CANDIDATE_PROFILE, aH as getCvFormat, ae as normalizeCandidateProfile } from '../nitro/nitro.mjs';
import { marked } from 'marked';
import { c as useRoute, f as useRouter, _ as _export_sfc } from './server.mjs';
import { u as useHead } from './index-BabADJUJ.mjs';
import { u as useFetch } from './fetch-C81_PrUB.mjs';
import { a as useJobMaterials, u as useFavorites, b as useVisitedJobs } from './useVisitedJobs-DGIBosc1.mjs';
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
import '@vueuse/core';

function slugifyFilename(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "document";
}
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "ApplicationFormPanel",
  __ssrInlineRender: true,
  props: {
    job: {},
    resume: {},
    coverLetter: {},
    resumeText: {},
    coverLetterText: {}
  },
  emits: ["apply"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const loading = ref(false);
    const answering = ref(false);
    const error = ref(null);
    const copiedId = ref(null);
    const copiedAll = ref(false);
    const form = ref(null);
    const answeredCount = computed(
      () => {
        var _a;
        return ((_a = form.value) == null ? void 0 : _a.questions.filter((q) => {
          var _a2;
          return (_a2 = q.answer) == null ? void 0 : _a2.trim();
        }).length) || 0;
      }
    );
    function isTechnicalQuestion(question) {
      const hay = `${question.label} ${question.section || ""} ${question.helpText || ""}`.toLowerCase();
      return /tech|stack|architect|system|design|coding|algorithm|cloud|kubernetes|api|database|experience|project|challenge|accomplish|skill|framework|language|devops|frontend|backend|full.?stack|debug|scale|performance|security|test/i.test(
        hay
      );
    }
    async function regenerateAnswers() {
      var _a, _b, _c, _d;
      if (!((_a = form.value) == null ? void 0 : _a.questions.length)) return;
      answering.value = true;
      error.value = null;
      try {
        const data = await $fetch("/api/application/answer", {
          method: "POST",
          body: {
            job: props.job,
            jobId: props.job.id,
            questions: form.value.questions,
            resumeText: props.resumeText || ((_b = props.resume) == null ? void 0 : _b.contentText),
            coverLetterText: props.coverLetterText || ((_c = props.coverLetter) == null ? void 0 : _c.contentText)
          }
        });
        form.value = {
          ...form.value,
          questions: data.questions
        };
      } catch (err) {
        const fetchError = err;
        error.value = ((_d = fetchError.data) == null ? void 0 : _d.statusMessage) || fetchError.message || "Failed to generate answers";
      } finally {
        answering.value = false;
      }
    }
    watch(
      () => {
        var _a;
        return [props.resumeText, (_a = props.resume) == null ? void 0 : _a.contentText];
      },
      ([text, saved]) => {
        var _a;
        if ((text || saved) && ((_a = form.value) == null ? void 0 : _a.questions.length) && answeredCount.value === 0 && !loading.value) {
          regenerateAnswers();
        }
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-5 max-w-3xl mx-auto" }, _attrs))}><div class="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-4 text-sm text-slate-300"><p class="font-bold text-blue-400 text-xs uppercase tracking-widest mb-2"> Application form assistant </p><p> Fields are auto-filled from your uploaded CV. Technical questions are answered from your real roles and projects. Use the copy icon on each field, paste into the company site \u2014 this app does not submit applications for you. </p></div><div class="flex flex-wrap gap-2"><button type="button" class="px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-900 text-slate-200 hover:border-blue-500 flex items-center gap-1.5 disabled:opacity-50"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""}>`);
      _push(ssrRenderComponent(unref(RefreshCw), {
        size: 14,
        class: unref(loading) ? "animate-spin" : ""
      }, null, _parent));
      _push(` ${ssrInterpolate(unref(loading) ? "Auto-filling..." : "Reload + auto-fill")}</button><button type="button" class="px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-900 text-slate-200 hover:border-blue-500 flex items-center gap-1.5 disabled:opacity-50"${ssrIncludeBooleanAttr(unref(answering) || !((_a = unref(form)) == null ? void 0 : _a.questions.length)) ? " disabled" : ""}>`);
      _push(ssrRenderComponent(unref(Sparkles), {
        size: 14,
        class: unref(answering) ? "animate-pulse" : ""
      }, null, _parent));
      _push(` ${ssrInterpolate(unref(answering) ? "Answering..." : "Regenerate answers")}</button><button type="button" class="px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-900 text-slate-200 hover:border-blue-500 flex items-center gap-1.5 disabled:opacity-50"${ssrIncludeBooleanAttr(!unref(answeredCount)) ? " disabled" : ""}>`);
      if (unref(copiedAll)) {
        _push(ssrRenderComponent(unref(Check), {
          size: 14,
          class: "text-emerald-400"
        }, null, _parent));
      } else {
        _push(ssrRenderComponent(unref(Copy), { size: 14 }, null, _parent));
      }
      _push(` ${ssrInterpolate(unref(copiedAll) ? "Copied all" : "Copy all answers")}</button><button type="button" class="px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-900 text-slate-200 hover:border-blue-500 flex items-center gap-1.5 disabled:opacity-50"${ssrIncludeBooleanAttr(!((_b = unref(form)) == null ? void 0 : _b.questions.length)) ? " disabled" : ""}>`);
      _push(ssrRenderComponent(unref(Download), { size: 14 }, null, _parent));
      _push(` Export </button><button type="button" class="px-3 py-2 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-600 hover:text-white flex items-center gap-1.5"> Open real form `);
      _push(ssrRenderComponent(unref(ExternalLink), { size: 14 }, null, _parent));
      _push(`</button></div>`);
      if (unref(error)) {
        _push(`<div class="text-red-400 text-xs bg-red-950/20 border border-red-500/20 rounded-xl px-3 py-2">${ssrInterpolate(unref(error))}</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(loading) && !unref(form)) {
        _push(`<div class="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm">`);
        _push(ssrRenderComponent(unref(Loader2), {
          class: "animate-spin",
          size: 18
        }, null, _parent));
        _push(` Reading form and auto-filling answers from your CV... </div>`);
      } else if (unref(form)) {
        _push(`<!--[--><div class="flex flex-wrap items-center gap-3 text-xs text-slate-500"><span><span class="text-emerald-400 font-bold">${ssrInterpolate(unref(answeredCount))}</span>/${ssrInterpolate(unref(form).questions.length)} auto-filled </span><span class="uppercase tracking-widest font-bold"> Source: ${ssrInterpolate(unref(form).extractedFrom)}</span></div>`);
        if (unref(form).notes) {
          _push(`<p class="text-xs text-amber-400/90 bg-amber-950/20 border border-amber-500/20 rounded-xl px-3 py-2">${ssrInterpolate(unref(form).notes)}</p>`);
        } else {
          _push(`<!---->`);
        }
        if (!unref(form).questions.length) {
          _push(`<div class="text-center text-slate-500 text-sm py-10"> No questions found. Open the company form and try Reload, or ensure the job has a description so technical screening questions can be inferred. </div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(unref(form).questions, (question, index) => {
          var _a2, _b2, _c;
          _push(`<div class="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 space-y-4 backdrop-blur-sm shadow-md"><div class="flex items-start justify-between gap-4"><div class="min-w-0 flex-1"><p class="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1.5 flex flex-wrap items-center gap-2 select-none"><span>${ssrInterpolate(question.section || "Question")} ${ssrInterpolate(index + 1)}</span>`);
          if (question.required) {
            _push(`<span class="text-red-400 border border-red-500/20 bg-red-950/20 px-1.5 py-0.5 rounded">Required</span>`);
          } else {
            _push(`<!---->`);
          }
          if (isTechnicalQuestion(question)) {
            _push(`<span class="rounded border border-indigo-500/20 bg-indigo-950/30 px-1.5 py-0.5 text-indigo-300 normal-case tracking-normal font-semibold"> Technical Q&amp;A </span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</p><h4 class="text-sm font-bold text-slate-100 leading-snug">${ssrInterpolate(question.label)}</h4>`);
          if (question.helpText) {
            _push(`<p class="text-xs text-slate-500 mt-1.5 leading-relaxed">${ssrInterpolate(question.helpText)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><button type="button" title="Copy answer" class="${ssrRenderClass([
            unref(copiedId) === question.id ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-350" : "border-slate-850 bg-slate-950/40 text-slate-300 hover:border-indigo-500 hover:text-white",
            "shrink-0 inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold transition-all duration-300 disabled:opacity-40 cursor-pointer"
          ])}"${ssrIncludeBooleanAttr(!((_a2 = question.answer) == null ? void 0 : _a2.trim())) ? " disabled" : ""}>`);
          if (unref(copiedId) === question.id) {
            _push(ssrRenderComponent(unref(Check), {
              size: 13,
              class: "text-emerald-400"
            }, null, _parent));
          } else {
            _push(ssrRenderComponent(unref(Copy), { size: 13 }, null, _parent));
          }
          _push(` ${ssrInterpolate(unref(copiedId) === question.id ? "Copied" : "Copy")}</button></div>`);
          if ((_b2 = question.options) == null ? void 0 : _b2.length) {
            _push(`<div class="flex flex-wrap gap-1.5 select-none"><!--[-->`);
            ssrRenderList(question.options, (option) => {
              _push(`<button type="button" class="${ssrRenderClass([
                question.answer === option ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-300" : "border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-700 hover:text-slate-200",
                "text-[10px] px-2.5 py-1 rounded-lg border transition-all duration-300 cursor-pointer font-medium"
              ])}">${ssrInterpolate(option)}</button>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="relative flex items-center"><textarea${ssrRenderAttr("rows", isTechnicalQuestion(question) ? 6 : 3)} class="w-full bg-slate-950/50 border border-slate-800 focus:border-indigo-500/85 rounded-xl p-3.5 pr-12 text-sm text-slate-200 leading-relaxed outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/70 transition-all duration-300 placeholder:text-slate-650" placeholder="Auto-filled answer appears here \u2014 edit before pasting into the real form">${ssrInterpolate(question.answer)}</textarea><button type="button" title="Copy answer" class="absolute right-3.5 top-3.5 rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-400 hover:border-indigo-500 hover:text-white transition-all duration-300 disabled:opacity-40 cursor-pointer"${ssrIncludeBooleanAttr(!((_c = question.answer) == null ? void 0 : _c.trim())) ? " disabled" : ""}>`);
          if (unref(copiedId) === question.id) {
            _push(ssrRenderComponent(unref(Check), {
              size: 13,
              class: "text-emerald-450"
            }, null, _parent));
          } else {
            _push(ssrRenderComponent(unref(Copy), { size: 13 }, null, _parent));
          }
          _push(`</button></div>`);
          if (question.notes) {
            _push(`<p class="text-xs text-slate-500 italic">${ssrInterpolate(question.notes)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--><!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ApplicationFormPanel.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "CandidateDetailsForm",
  __ssrInlineRender: true,
  props: /* @__PURE__ */ mergeModels({
    required: { type: Boolean },
    hint: {}
  }, {
    "modelValue": {
      default: () => ({
        ...EMPTY_CANDIDATE_PROFILE,
        skillsText: "",
        experienceText: ""
      })
    },
    "modelModifiers": {}
  }),
  emits: ["update:modelValue"],
  setup(__props, { expose: __expose }) {
    const model = useModel(__props, "modelValue");
    const local = computed({
      get: () => model.value,
      set: (value) => {
        model.value = value;
      }
    });
    function syncSkills() {
      local.value = normalizeCandidateProfile({
        ...local.value,
        skillsText: local.value.skillsText
      });
      local.value.skillsText = (local.value.skills || []).join(", ");
    }
    const isComplete = computed(() => {
      var _a, _b, _c, _d, _e, _f, _g;
      const p = local.value;
      return Boolean(
        ((_a = p.fullName) == null ? void 0 : _a.trim()) && ((_b = p.email) == null ? void 0 : _b.trim()) && ((_c = p.phone) == null ? void 0 : _c.trim()) && ((_d = p.location) == null ? void 0 : _d.trim()) && (((_e = p.skillsText) == null ? void 0 : _e.trim()) || ((_f = p.skills) == null ? void 0 : _f.length)) && ((_g = p.experienceText) == null ? void 0 : _g.trim())
      );
    });
    __expose({ isComplete, syncSkills });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["space-y-5 rounded-2xl border p-5", __props.required ? "border-amber-500/20 bg-amber-950/15" : "border-slate-800 bg-slate-900/40 backdrop-blur-sm"]
      }, _attrs))}><div><p class="text-xs font-bold uppercase tracking-widest text-amber-400 select-none">${ssrInterpolate(__props.required ? "Required details" : "Your details")}</p><p class="mt-1 text-xs text-slate-400 select-none leading-relaxed">${ssrInterpolate(__props.hint || "No CV uploaded. Fill these in so we can generate documents with your real name and contact info.")}</p></div><div class="grid gap-4 sm:grid-cols-2"><label class="space-y-1 text-xs flex flex-col"><span class="font-bold text-slate-400 select-none">Full Name *</span><input${ssrRenderAttr("value", unref(local).fullName)} type="text" class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 transition-all duration-300 placeholder:text-slate-650" placeholder="Ada Lovelace"></label><label class="space-y-1 text-xs flex flex-col"><span class="font-bold text-slate-400 select-none">Email *</span><input${ssrRenderAttr("value", unref(local).email)} type="email" class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 transition-all duration-300 placeholder:text-slate-650" placeholder="you@email.com"></label><label class="space-y-1 text-xs flex flex-col"><span class="font-bold text-slate-400 select-none">Phone *</span><input${ssrRenderAttr("value", unref(local).phone)} type="tel" class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 transition-all duration-300 placeholder:text-slate-650" placeholder="+1 555 0100"></label><label class="space-y-1 text-xs flex flex-col"><span class="font-bold text-slate-400 select-none">City / address *</span><input${ssrRenderAttr("value", unref(local).location)} type="text" class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 transition-all duration-300 placeholder:text-slate-650" placeholder="Berlin, Germany"></label><label class="space-y-1 text-xs flex flex-col"><span class="font-bold text-slate-400 select-none">LinkedIn</span><input${ssrRenderAttr("value", unref(local).linkedin)} type="text" class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 transition-all duration-300 placeholder:text-slate-650" placeholder="linkedin.com/in/you"></label><label class="space-y-1 text-xs flex flex-col"><span class="font-bold text-slate-400 select-none">Website / Portfolio</span><input${ssrRenderAttr("value", unref(local).website)} type="text" class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 transition-all duration-300 placeholder:text-slate-650" placeholder="yoursite.com"></label></div><label class="block space-y-1 text-xs"><span class="font-bold text-slate-400 select-none">Skills * (comma-separated)</span><input${ssrRenderAttr("value", unref(local).skillsText)} type="text" class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 transition-all duration-300 placeholder:text-slate-650" placeholder="TypeScript, React, PostgreSQL, Leadership"></label><label class="block space-y-1 text-xs"><span class="font-bold text-slate-400 select-none">Work experience * (one bullet per line)</span><textarea rows="5" class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 transition-all duration-300 placeholder:text-slate-650" placeholder="Company, Role (2021-Present)
- Led delivery of X
- Improved Y by 20%
Earlier Company, Role (2018-2021)
- Built Z">${ssrInterpolate(unref(local).experienceText)}</textarea></label><label class="block space-y-1 text-xs"><span class="font-bold text-slate-400 select-none">Education</span><input${ssrRenderAttr("value", unref(local).education)} type="text" class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 transition-all duration-300 placeholder:text-slate-650" placeholder="B.S. Computer Science, University Name, 2019"></label>`);
      if (__props.required && !unref(isComplete)) {
        _push(`<p class="text-[11px] text-amber-300"> Fill all required fields (*) before generating. </p>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/CandidateDetailsForm.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "TailoredDocEditor",
  __ssrInlineRender: true,
  props: {
    title: {},
    modelValue: {},
    editing: { type: Boolean },
    minHeightClass: {}
  },
  emits: ["update:modelValue", "update:editing"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const html = computed(() => props.modelValue ? marked(props.modelValue) : "");
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "overflow-hidden rounded-2xl border border-slate-700 bg-slate-900" }, _attrs))} data-v-1e718e4b><div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-3" data-v-1e718e4b><h3 class="text-xs font-bold uppercase tracking-widest text-emerald-400" data-v-1e718e4b>${ssrInterpolate(__props.title)}</h3><div class="flex items-center gap-2" data-v-1e718e4b>`);
      ssrRenderSlot(_ctx.$slots, "actions", {}, null, _push, _parent);
      _push(`<button type="button" class="${ssrRenderClass([
        __props.editing ? "border-blue-500 bg-blue-950/40 text-blue-300" : "border-slate-700 text-slate-300 hover:border-slate-500",
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold"
      ])}" data-v-1e718e4b>`);
      _push(ssrRenderComponent(unref(Pencil), { size: 12 }, null, _parent));
      _push(` Edit </button><button type="button" class="${ssrRenderClass([
        !__props.editing ? "border-blue-500 bg-blue-950/40 text-blue-300" : "border-slate-700 text-slate-300 hover:border-slate-500",
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold"
      ])}" data-v-1e718e4b>`);
      _push(ssrRenderComponent(unref(Eye), { size: 12 }, null, _parent));
      _push(` Preview </button></div></div>`);
      if (__props.editing) {
        _push(`<textarea class="${ssrRenderClass([__props.minHeightClass || "min-h-[18rem]", "w-full bg-slate-950/50 px-4 py-4 font-mono text-sm leading-relaxed text-slate-200 outline-none border-t border-slate-800/80 focus:bg-slate-950/80 transition-colors"])}" data-v-1e718e4b>${ssrInterpolate(__props.modelValue)}</textarea>`);
      } else {
        _push(`<div class="${ssrRenderClass([__props.minHeightClass || "min-h-[18rem]", "tailored-preview max-h-[28rem] overflow-y-auto bg-white p-6 md:p-8 text-slate-800 border-t border-slate-100 shadow-inner select-text"])}" data-v-1e718e4b>${(_a = unref(html)) != null ? _a : ""}</div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/TailoredDocEditor.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_4 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-1e718e4b"]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[id]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    useHead({
      title: "Job Details | ScrapeEngine"
    });
    const route = useRoute();
    useRouter();
    const jobId = route.params.id;
    const { data: jobData, error: fetchError, pending } = ([__temp, __restore] = withAsyncContext(() => useFetch(`/api/jobs/${jobId}`, "$xvBVnPU8gU")), __temp = await __temp, __restore(), __temp);
    const job = computed(() => {
      var _a;
      return (_a = jobData.value) == null ? void 0 : _a.job;
    });
    const logoGradient = computed(() => {
      if (!job.value) return "";
      const company = job.value.company || job.value.title || "Unknown";
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
    const { getMaterials, saveMaterials } = useJobMaterials();
    const { isFavorite: checkFavorite } = useFavorites();
    const { markVisited } = useVisitedJobs();
    const isFavorite = computed(() => job.value ? checkFavorite(job.value) : false);
    const activeTab = ref("description");
    const resumeDoc = ref(null);
    const coverLetterDoc = ref(null);
    const resumeText = ref("");
    const coverLetterText = ref("");
    const isTailoring = ref(false);
    const uploading = ref(null);
    const removing = ref(null);
    const tailoredResume = ref("");
    const tailoredCoverLetter = ref("");
    const error = ref(null);
    const toastMessage = ref(null);
    const useSavedDocuments = ref(true);
    const cvFormat = ref(CV_FORMATS[0].id);
    const editingResume = ref(false);
    const editingCoverLetter = ref(false);
    const saving = ref(null);
    const saveMessage = ref(null);
    const candidateProfile = ref({
      ...EMPTY_CANDIDATE_PROFILE,
      skillsText: "",
      experienceText: ""
    });
    const selectedFormat = computed(() => getCvFormat(cvFormat.value));
    const hasTailored = computed(() => Boolean(tailoredResume.value || tailoredCoverLetter.value));
    const needsProfileDetails = computed(() => !resumeText.value.trim());
    const profileReady = computed(() => {
      var _a, _b, _c, _d, _e, _f, _g;
      const p = candidateProfile.value;
      return Boolean(
        ((_a = p.fullName) == null ? void 0 : _a.trim()) && ((_b = p.email) == null ? void 0 : _b.trim()) && ((_c = p.phone) == null ? void 0 : _c.trim()) && ((_d = p.location) == null ? void 0 : _d.trim()) && (((_e = p.skillsText) == null ? void 0 : _e.trim()) || ((_f = p.skills) == null ? void 0 : _f.length)) && ((_g = p.experienceText) == null ? void 0 : _g.trim())
      );
    });
    const canGenerate = computed(
      () => !needsProfileDetails.value || profileReady.value
    );
    async function loadDocuments() {
      try {
        const data = await $fetch("/api/documents");
        resumeDoc.value = data.resume;
        coverLetterDoc.value = data.coverLetter;
      } catch {
      }
    }
    watch(
      () => [resumeDoc.value, coverLetterDoc.value],
      ([resume, coverLetter], previous) => {
        const [prevResume, prevCover] = previous || [void 0, void 0];
        if ((resume == null ? void 0 : resume.contentText) && !resumeText.value) {
          resumeText.value = resume.contentText;
        } else if (!resume && prevResume) {
          resumeText.value = "";
        }
        if ((coverLetter == null ? void 0 : coverLetter.contentText) && !coverLetterText.value) {
          coverLetterText.value = coverLetter.contentText;
        } else if (!coverLetter && prevCover) {
          coverLetterText.value = "";
        }
      },
      { immediate: true }
    );
    function loadSavedForJob() {
      if (!job.value) return false;
      const saved = getMaterials(job.value);
      if (saved) {
        if (saved.resume) tailoredResume.value = saved.resume;
        if (saved.coverLetter) tailoredCoverLetter.value = saved.coverLetter;
        if (saved.cvFormat) cvFormat.value = saved.cvFormat;
        return true;
      }
      return false;
    }
    watch(
      () => {
        var _a;
        return (_a = job.value) == null ? void 0 : _a.url;
      },
      () => {
        var _a;
        tailoredResume.value = "";
        tailoredCoverLetter.value = "";
        loadSavedForJob();
        if ((_a = job.value) == null ? void 0 : _a.url) {
          markVisited(job.value.url);
        }
      },
      { immediate: true }
    );
    const fileBase = computed(() => {
      if (!job.value) return "";
      const company = job.value.company ? `-${slugifyFilename(job.value.company)}` : "";
      return `${slugifyFilename(job.value.title)}${company}`;
    });
    async function saveDocument(type) {
      var _a;
      if (!job.value) return;
      const content = type === "resume" ? tailoredResume.value.trim() : tailoredCoverLetter.value.trim();
      if (!content) return;
      saving.value = type;
      saveMessage.value = null;
      error.value = null;
      try {
        await $fetch("/api/documents/text", {
          method: "POST",
          body: {
            type,
            contentText: content,
            originalName: type === "resume" ? `${fileBase.value}-resume.md` : `${fileBase.value}-cover-letter.md`
          }
        });
        saveMaterials(job.value, {
          resume: tailoredResume.value,
          coverLetter: tailoredCoverLetter.value,
          cvFormat: cvFormat.value
        });
        saveMessage.value = type === "resume" ? "Resume saved to your documents." : "Cover letter saved to your documents.";
        await loadDocuments();
      } catch (err) {
        const fetchError2 = err;
        error.value = ((_a = fetchError2.data) == null ? void 0 : _a.statusMessage) || fetchError2.message || "Save failed";
      } finally {
        saving.value = null;
      }
    }
    function applyToJob() {
      if (!job.value) return;
      markVisited(job.value.url);
      (void 0).open(job.value.url, "_blank", "noopener,noreferrer");
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_ApplicationFormPanel = _sfc_main$3;
      const _component_CvFormatPicker = __nuxt_component_2;
      const _component_CandidateDetailsForm = _sfc_main$2;
      const _component_TailoredDocEditor = __nuxt_component_4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 flex flex-col p-4 md:p-6 overflow-hidden" }, _attrs))}><div class="max-w-[1400px] mx-auto w-full grow flex flex-col h-full overflow-hidden"><header class="flex justify-between items-center mb-6 gap-4 shrink-0 border-b border-slate-900 pb-5"><div class="flex items-center gap-4">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all duration-300 border border-slate-800 flex items-center justify-center",
        title: "Back to Dashboard"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(unref(ArrowLeft), { size: 18 }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(unref(ArrowLeft), { size: 18 })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="flex items-center gap-3"><div class="w-10 h-10 bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center font-bold text-xl glowing-logo text-white select-none"> S </div><div><h1 class="text-2xl font-extrabold tracking-tight"> Scrape<span class="text-gradient">Engine</span></h1><p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest -mt-1">Intelligent Job Hub v5.0</p></div></div></div><div class="flex items-center gap-3">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "text-xs font-bold text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-all duration-300"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Back to Jobs `);
          } else {
            return [
              createTextVNode(" Back to Jobs ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></header>`);
      if (unref(pending)) {
        _push(`<div class="flex-grow flex items-center justify-center">`);
        _push(ssrRenderComponent(unref(Loader2), {
          class: "animate-spin text-indigo-500",
          size: 36
        }, null, _parent));
        _push(`</div>`);
      } else if (unref(fetchError) || !unref(job)) {
        _push(`<div class="flex-grow flex flex-col items-center justify-center text-center opacity-70">`);
        _push(ssrRenderComponent(unref(AlertCircle), {
          class: "text-red-400 mb-4 animate-pulse",
          size: 48
        }, null, _parent));
        _push(`<h2 class="text-lg font-bold text-slate-200">Job Not Found</h2><p class="text-slate-400 text-sm mt-1 mb-6">The job you are looking for does not exist or has been removed.</p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/",
          class: "px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all duration-300"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Return to Dashboard `);
            } else {
              return [
                createTextVNode(" Return to Dashboard ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else {
        _push(`<div class="relative w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col grow min-h-0"><div class="p-6 border-b border-slate-800 flex justify-between items-start gap-4 bg-slate-900/50"><div class="flex gap-4 items-start"><div class="${ssrRenderClass([unref(logoGradient), "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 bg-gradient-to-tr shadow-md"])}">${ssrInterpolate((unref(job).company || unref(job).title).substring(0, 2).toUpperCase())}</div><div><h2 class="text-xl font-bold text-slate-100 pr-8">${ssrInterpolate(unref(job).title)}</h2><div class="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm text-slate-400">`);
        if (unref(job).company) {
          _push(`<span class="flex items-center gap-1.5">`);
          _push(ssrRenderComponent(unref(Building2), { size: 14 }, null, _parent));
          _push(` ${ssrInterpolate(unref(job).company)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<span class="flex items-center gap-1.5">`);
        _push(ssrRenderComponent(unref(MapPin), { size: 14 }, null, _parent));
        _push(` ${ssrInterpolate(unref(job).location)}</span>`);
        if (unref(job).salaryMin || unref(job).salaryMax) {
          _push(`<span class="flex items-center gap-1.5 text-emerald-400 font-semibold">`);
          _push(ssrRenderComponent(unref(DollarSign), { size: 14 }, null, _parent));
          _push(` ${ssrInterpolate(unref(job).currency || "$")}${ssrInterpolate((_a = unref(job).salaryMin) == null ? void 0 : _a.toLocaleString())} `);
          if (unref(job).salaryMax) {
            _push(`<!--[--> - ${ssrInterpolate(unref(job).salaryMax.toLocaleString())}<!--]-->`);
          } else {
            _push(`<!--[-->+<!--]-->`);
          }
          _push(`</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div></div><div class="px-6 border-b border-slate-800 flex gap-2 shrink-0 bg-slate-900/80 backdrop-blur z-10 py-3.5 overflow-x-auto"><button type="button" class="${ssrRenderClass([unref(activeTab) === "description" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40", "px-4 py-2 font-bold text-xs rounded-xl transition-all duration-300 whitespace-nowrap flex items-center gap-2"])}"> Description </button><button type="button" class="${ssrRenderClass([unref(activeTab) === "tailor" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40", "px-4 py-2 font-bold text-xs rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap"])}">`);
        _push(ssrRenderComponent(unref(FileText), { size: 14 }, null, _parent));
        _push(` AI Tailoring </button><button type="button" class="${ssrRenderClass([unref(activeTab) === "application" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40", "px-4 py-2 font-bold text-xs rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap"])}">`);
        _push(ssrRenderComponent(unref(ClipboardList), { size: 14 }, null, _parent));
        _push(` Application Q&amp;A </button>`);
        if (unref(hasTailored)) {
          _push(`<button type="button" class="${ssrRenderClass([unref(activeTab) === "result" ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/10" : "text-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/20", "px-4 py-2 font-bold text-xs rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap"])}">`);
          _push(ssrRenderComponent(unref(CheckCircle), { size: 14 }, null, _parent));
          _push(` Tailored Results </button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="p-6 overflow-y-auto flex-grow text-slate-300 leading-relaxed bg-slate-950/50">`);
        if (unref(activeTab) === "description") {
          _push(`<div class="space-y-4"><div class="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-sm"><p class="font-bold text-emerald-400 text-xs uppercase tracking-widest mb-2">How to apply</p><ol class="list-decimal list-inside space-y-1 text-slate-300 text-sm"><li>Generate tailored resume &amp; cover letter (AI Tailoring tab).</li><li>Preview, edit, then <strong>Save for this job</strong> so they stick with the saved role.</li><li>Open <strong>Application Q&amp;A</strong>, then apply on the company site.</li></ol></div>`);
          if (unref(job).descriptionSource) {
            _push(`<p class="text-[10px] uppercase tracking-widest text-slate-500 font-bold"> Source: ${ssrInterpolate(unref(job).descriptionSource === "detail_page" ? "Full job page" : "Listing page")}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<p class="text-sm whitespace-pre-wrap pb-6">${ssrInterpolate(unref(job).description || "No detailed description was extracted for this role. Click 'Apply on company site' to read the full details.")}</p></div>`);
        } else if (unref(activeTab) === "application") {
          _push(`<div>`);
          _push(ssrRenderComponent(_component_ApplicationFormPanel, {
            job: unref(job),
            resume: unref(resumeDoc),
            "cover-letter": unref(coverLetterDoc),
            "resume-text": unref(resumeText),
            "cover-letter-text": unref(coverLetterText),
            onApply: applyToJob
          }, null, _parent));
          _push(`</div>`);
        } else if (unref(activeTab) === "tailor") {
          _push(`<div class="space-y-6 max-w-4xl mx-auto pb-6"><p class="text-sm text-slate-400"> Pick a CV format (live preview on the right), then upload or paste your materials. </p>`);
          _push(ssrRenderComponent(_component_CvFormatPicker, {
            modelValue: unref(cvFormat),
            "onUpdate:modelValue": ($event) => isRef(cvFormat) ? cvFormat.value = $event : null
          }, null, _parent));
          if (unref(needsProfileDetails)) {
            _push(ssrRenderComponent(_component_CandidateDetailsForm, {
              modelValue: unref(candidateProfile),
              "onUpdate:modelValue": ($event) => isRef(candidateProfile) ? candidateProfile.value = $event : null,
              required: ""
            }, null, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="grid grid-cols-1 sm:grid-cols-2 gap-3"><div class="space-y-2"><label class="${ssrRenderClass([{ "opacity-50 pointer-events-none": !!unref(uploading) || !!unref(removing) }, "flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs cursor-pointer hover:border-blue-500 transition-colors"])}">`);
          _push(ssrRenderComponent(unref(Upload), { size: 14 }, null, _parent));
          _push(` ${ssrInterpolate(unref(uploading) === "resume" ? "Uploading CV..." : "Upload CV")} <input type="file" accept=".pdf,.docx,.txt,.md,application/pdf,text/plain" class="hidden"${ssrIncludeBooleanAttr(!!unref(uploading) || !!unref(removing)) ? " disabled" : ""}></label>`);
          if (unref(resumeDoc) || unref(resumeText).trim()) {
            _push(`<button type="button" class="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-red-400 disabled:opacity-50"${ssrIncludeBooleanAttr(!!unref(uploading) || !!unref(removing)) ? " disabled" : ""}>`);
            _push(ssrRenderComponent(unref(Trash2), { size: 12 }, null, _parent));
            _push(` ${ssrInterpolate(unref(removing) === "resume" ? "Removing..." : unref(resumeDoc) ? "Remove uploaded CV" : "Clear CV text")}</button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="space-y-2"><label class="${ssrRenderClass([{ "opacity-50 pointer-events-none": !!unref(uploading) || !!unref(removing) }, "flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs cursor-pointer hover:border-blue-500 transition-colors"])}">`);
          _push(ssrRenderComponent(unref(Upload), { size: 14 }, null, _parent));
          _push(` ${ssrInterpolate(unref(uploading) === "cover_letter" ? "Uploading..." : "Upload Cover Letter")} <input type="file" accept=".pdf,.docx,.txt,.md,application/pdf,text/plain" class="hidden"${ssrIncludeBooleanAttr(!!unref(uploading) || !!unref(removing)) ? " disabled" : ""}></label>`);
          if (unref(coverLetterDoc) || unref(coverLetterText).trim()) {
            _push(`<button type="button" class="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-red-400 disabled:opacity-50"${ssrIncludeBooleanAttr(!!unref(uploading) || !!unref(removing)) ? " disabled" : ""}>`);
            _push(ssrRenderComponent(unref(Trash2), { size: 12 }, null, _parent));
            _push(` ${ssrInterpolate(unref(removing) === "cover_letter" ? "Removing..." : unref(coverLetterDoc) ? "Remove uploaded cover letter" : "Clear cover letter text")}</button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div><label class="flex items-center gap-2 text-xs text-slate-400"><input${ssrIncludeBooleanAttr(Array.isArray(unref(useSavedDocuments)) ? ssrLooseContain(unref(useSavedDocuments), null) : unref(useSavedDocuments)) ? " checked" : ""} type="checkbox" class="rounded border-slate-700"> Fall back to saved documents from the database when fields are empty </label><div class="space-y-2"><label class="text-xs font-bold uppercase tracking-widest text-slate-500"> Your Resume (Text) </label><textarea placeholder="Paste or upload your resume..." class="w-full h-48 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600">${ssrInterpolate(unref(resumeText))}</textarea></div><div class="space-y-2"><label class="text-xs font-bold uppercase tracking-widest text-slate-500"> Your Cover Letter (Text) </label><textarea placeholder="Paste or upload your cover letter..." class="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600">${ssrInterpolate(unref(coverLetterText))}</textarea></div>`);
          if (unref(error)) {
            _push(`<div class="text-red-400 text-xs flex items-center bg-red-950/20 px-3 py-2 rounded-lg border border-red-500/20">${ssrInterpolate(unref(error))}</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="flex justify-end pt-2"><button type="button"${ssrIncludeBooleanAttr(unref(isTailoring) || !unref(canGenerate)) ? " disabled" : ""} class="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all duration-300">`);
          if (unref(isTailoring)) {
            _push(ssrRenderComponent(unref(Loader2), {
              class: "animate-spin",
              size: 18
            }, null, _parent));
          } else {
            _push(ssrRenderComponent(unref(FileText), { size: 18 }, null, _parent));
          }
          _push(` ${ssrInterpolate(unref(isTailoring) ? "Generating Materials..." : "Generate Tailored Materials")}</button></div></div>`);
        } else {
          _push(`<div class="space-y-6 max-w-4xl mx-auto pb-6"><div class="flex flex-wrap gap-2 justify-between items-center"><div class="flex flex-wrap gap-2"><button type="button" class="px-3 py-2 rounded-xl text-xs font-bold border border-blue-500/40 bg-blue-950/30 text-blue-300 hover:bg-blue-600 hover:text-white flex items-center gap-1.5 disabled:opacity-50 transition-all"${ssrIncludeBooleanAttr(!!unref(saving) || !unref(hasTailored)) ? " disabled" : ""}>`);
          if (unref(saving) === "job") {
            _push(ssrRenderComponent(unref(Loader2), {
              class: "animate-spin",
              size: 14
            }, null, _parent));
          } else {
            _push(ssrRenderComponent(unref(Bookmark), { size: 14 }, null, _parent));
          }
          _push(` Save for this job </button><button type="button" class="px-3 py-2 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-600 hover:text-white flex items-center gap-1.5 disabled:opacity-50 transition-all"${ssrIncludeBooleanAttr(!!unref(saving) || !unref(hasTailored)) ? " disabled" : ""}>`);
          if (unref(saving) === "both") {
            _push(ssrRenderComponent(unref(Loader2), {
              class: "animate-spin",
              size: 14
            }, null, _parent));
          } else {
            _push(ssrRenderComponent(unref(Save), { size: 14 }, null, _parent));
          }
          _push(` Save to documents </button></div><p class="text-[11px] text-slate-500"> Format: ${ssrInterpolate(unref(selectedFormat).name)} \xB7 Opens in preview by default </p></div>`);
          if (unref(saveMessage)) {
            _push(`<div class="rounded-xl border border-emerald-500/20 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-300">${ssrInterpolate(unref(saveMessage))}</div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(error)) {
            _push(`<div class="rounded-xl border border-red-500/20 bg-red-950/20 px-3 py-2 text-xs text-red-300">${ssrInterpolate(unref(error))}</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="flex flex-wrap gap-2 justify-end">`);
          if (unref(tailoredResume)) {
            _push(`<button type="button" class="px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-900 text-slate-200 hover:border-blue-500 flex items-center gap-1.5 transition-all">`);
            _push(ssrRenderComponent(unref(Download), { size: 14 }, null, _parent));
            _push(` Resume (.md) </button>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(tailoredCoverLetter)) {
            _push(`<button type="button" class="px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-900 text-slate-200 hover:border-blue-500 flex items-center gap-1.5 transition-all">`);
            _push(ssrRenderComponent(unref(Download), { size: 14 }, null, _parent));
            _push(` Cover Letter (.md) </button>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(tailoredResume)) {
            _push(`<button type="button" class="px-3 py-2 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-600 hover:text-white flex items-center gap-1.5 transition-all">`);
            _push(ssrRenderComponent(unref(Download), { size: 14 }, null, _parent));
            _push(` Resume PDF </button>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(tailoredCoverLetter)) {
            _push(`<button type="button" class="px-3 py-2 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-600 hover:text-white flex items-center gap-1.5 transition-all">`);
            _push(ssrRenderComponent(unref(Download), { size: 14 }, null, _parent));
            _push(` Cover Letter PDF </button>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(hasTailored)) {
            _push(`<button type="button" class="px-3 py-2 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-600 hover:text-white flex items-center gap-1.5 transition-all">`);
            _push(ssrRenderComponent(unref(Download), { size: 14 }, null, _parent));
            _push(` Download all (.md) </button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-sm text-slate-300"> Preview shows how the documents look. Switch to Edit to change text, then <strong>Save for this job</strong> so the materials stay with this saved role. </div>`);
          if (unref(tailoredCoverLetter)) {
            _push(ssrRenderComponent(_component_TailoredDocEditor, {
              modelValue: unref(tailoredCoverLetter),
              "onUpdate:modelValue": ($event) => isRef(tailoredCoverLetter) ? tailoredCoverLetter.value = $event : null,
              editing: unref(editingCoverLetter),
              "onUpdate:editing": ($event) => isRef(editingCoverLetter) ? editingCoverLetter.value = $event : null,
              title: "Tailored Cover Letter",
              "min-height-class": "min-h-[16rem]"
            }, {
              actions: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<button type="button" class="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:border-emerald-500 disabled:opacity-50 transition-all"${ssrIncludeBooleanAttr(unref(saving) === "cover_letter" || unref(saving) === "both") ? " disabled" : ""}${_scopeId}>`);
                  if (unref(saving) === "cover_letter") {
                    _push2(ssrRenderComponent(unref(Loader2), {
                      class: "animate-spin",
                      size: 12
                    }, null, _parent2, _scopeId));
                  } else {
                    _push2(ssrRenderComponent(unref(Save), { size: 12 }, null, _parent2, _scopeId));
                  }
                  _push2(` Save </button>`);
                } else {
                  return [
                    createVNode("button", {
                      type: "button",
                      class: "inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:border-emerald-500 disabled:opacity-50 transition-all",
                      disabled: unref(saving) === "cover_letter" || unref(saving) === "both",
                      onClick: ($event) => saveDocument("cover_letter")
                    }, [
                      unref(saving) === "cover_letter" ? (openBlock(), createBlock(unref(Loader2), {
                        key: 0,
                        class: "animate-spin",
                        size: 12
                      })) : (openBlock(), createBlock(unref(Save), {
                        key: 1,
                        size: 12
                      })),
                      createTextVNode(" Save ")
                    ], 8, ["disabled", "onClick"])
                  ];
                }
              }),
              _: 1
            }, _parent));
          } else {
            _push(`<!---->`);
          }
          if (unref(tailoredResume)) {
            _push(ssrRenderComponent(_component_TailoredDocEditor, {
              modelValue: unref(tailoredResume),
              "onUpdate:modelValue": ($event) => isRef(tailoredResume) ? tailoredResume.value = $event : null,
              editing: unref(editingResume),
              "onUpdate:editing": ($event) => isRef(editingResume) ? editingResume.value = $event : null,
              title: "Tailored Resume",
              "min-height-class": "min-h-[20rem]"
            }, {
              actions: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<button type="button" class="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:border-emerald-500 disabled:opacity-50 transition-all"${ssrIncludeBooleanAttr(unref(saving) === "resume" || unref(saving) === "both") ? " disabled" : ""}${_scopeId}>`);
                  if (unref(saving) === "resume") {
                    _push2(ssrRenderComponent(unref(Loader2), {
                      class: "animate-spin",
                      size: 12
                    }, null, _parent2, _scopeId));
                  } else {
                    _push2(ssrRenderComponent(unref(Save), { size: 12 }, null, _parent2, _scopeId));
                  }
                  _push2(` Save </button>`);
                } else {
                  return [
                    createVNode("button", {
                      type: "button",
                      class: "inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:border-emerald-500 disabled:opacity-50 transition-all",
                      disabled: unref(saving) === "resume" || unref(saving) === "both",
                      onClick: ($event) => saveDocument("resume")
                    }, [
                      unref(saving) === "resume" ? (openBlock(), createBlock(unref(Loader2), {
                        key: 0,
                        class: "animate-spin",
                        size: 12
                      })) : (openBlock(), createBlock(unref(Save), {
                        key: 1,
                        size: 12
                      })),
                      createTextVNode(" Save ")
                    ], 8, ["disabled", "onClick"])
                  ];
                }
              }),
              _: 1
            }, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        }
        _push(`</div><div class="p-6 border-t border-slate-800 bg-slate-900/50 flex flex-wrap justify-end gap-3 shrink-0"><button type="button" class="px-5 py-2.5 rounded-xl font-bold text-sm border border-red-500/20 bg-red-950/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors flex items-center gap-2">`);
        _push(ssrRenderComponent(unref(Trash2), { size: 16 }, null, _parent));
        _push(` Remove </button><button type="button" class="${ssrRenderClass([
          unref(isFavorite) ? "bg-blue-600/20 border-blue-500/20 text-blue-400" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700",
          "px-5 py-2.5 rounded-xl font-bold text-sm border transition-colors flex items-center gap-2"
        ])}">`);
        _push(ssrRenderComponent(unref(Bookmark), {
          size: 16,
          class: unref(isFavorite) ? "fill-current" : ""
        }, null, _parent));
        _push(` ${ssrInterpolate(unref(isFavorite) ? "Saved" : "Save Role")}</button><button type="button" class="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"> Apply on company site `);
        _push(ssrRenderComponent(unref(ExternalLink), { size: 16 }, null, _parent));
        _push(`</button></div></div>`);
      }
      _push(`</div><div class="fixed bottom-6 right-6 z-50 flex flex-col gap-2">`);
      if (unref(toastMessage)) {
        _push(`<div class="bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-medium text-sm animate-bounce">`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/jobs/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-CQQfYB4m.mjs.map
