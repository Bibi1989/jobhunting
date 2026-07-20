import { _ as __nuxt_component_0 } from './nuxt-link-Cuf_TjgJ.mjs';
import { _ as _sfc_main$2 } from './TemplateThumbnail-By8xlz0M.mjs';
import { defineComponent, ref, computed, mergeProps, withCtx, createTextVNode, unref, useModel, mergeModels, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderAttr, ssrRenderClass, ssrInterpolate, ssrRenderList } from 'vue/server-renderer';
import { aK as resolveTemplateSlug, aL as normalizeSectionsOrder, aM as DEFAULT_SECTIONS_ORDER, aN as sectionLabel } from '../nitro/nitro.mjs';
import { _ as _export_sfc, u as useAppToast, a as useSaaS } from './server.mjs';
import { _ as __nuxt_component_3, a as __nuxt_component_4, b as __nuxt_component_5 } from './RichTextEditor-BGtrDWMw.mjs';
import { useRoute, useRouter } from 'vue-router';
import { r as resolveResumeTemplateId, a as resumeTemplates } from './templates-CJ0hEBg_.mjs';
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

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "SectionReorderPanel",
  __ssrInlineRender: true,
  props: /* @__PURE__ */ mergeModels({
    customSections: {}
  }, {
    "modelValue": { required: true },
    "modelModifiers": {}
  }),
  emits: ["update:modelValue"],
  setup(__props) {
    const order = useModel(__props, "modelValue");
    const dragIndex = ref(null);
    const overIndex = ref(null);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "rounded-xl border border-white/10 bg-white/5 overflow-hidden" }, _attrs))} data-v-18256540><div class="px-4 py-3 border-b border-white/10" data-v-18256540><h2 class="text-sm font-semibold text-white" data-v-18256540>Section order</h2><p class="text-xs text-slate-400 mt-0.5" data-v-18256540> Drag the handle or use the arrows \u2014 preview and PDF download both follow this order. </p></div><ul${ssrRenderAttrs({
        name: "section-reorder",
        class: "divide-y divide-white/5"
      })} data-v-18256540>`);
      ssrRenderList(order.value, (id, index) => {
        _push(`<li draggable="true" class="${ssrRenderClass([[
          unref(dragIndex) === index ? "opacity-40" : "",
          unref(overIndex) === index && unref(dragIndex) !== index ? "bg-blue-500/15 ring-1 ring-inset ring-blue-400/40" : "bg-transparent"
        ], "flex items-center gap-3 px-4 py-2.5 transition-colors"])}" data-v-18256540><span class="material-symbols-outlined text-slate-500 text-[18px] cursor-grab active:cursor-grabbing" title="Drag to reorder" data-v-18256540>drag_indicator</span><span class="flex-1 text-sm text-slate-200 truncate" data-v-18256540>${ssrInterpolate(unref(sectionLabel)(id, __props.customSections || []))}</span><div class="flex items-center gap-1" data-v-18256540><button type="button" class="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"${ssrIncludeBooleanAttr(index === 0) ? " disabled" : ""} aria-label="Move section up" data-v-18256540><span class="material-symbols-outlined text-[18px]" data-v-18256540>keyboard_arrow_up</span></button><button type="button" class="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"${ssrIncludeBooleanAttr(index === order.value.length - 1) ? " disabled" : ""} aria-label="Move section down" data-v-18256540><span class="material-symbols-outlined text-[18px]" data-v-18256540>keyboard_arrow_down</span></button></div></li>`);
      });
      _push(`</ul></div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/builder/pdf/SectionReorderPanel.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_2 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-18256540"]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    useAppToast();
    const { canAccessAI, aiBlockedMessage } = useSaaS();
    const route = useRoute();
    useRouter();
    route.params.id;
    const exporting = ref(false);
    const importing = ref(false);
    ref(null);
    const resolvedFormatId = computed(
      () => resolveResumeTemplateId(resolveTemplateSlug(resumeData.value))
    );
    const sectionsOrderModel = computed({
      get: () => normalizeSectionsOrder(resumeData.value.sectionsOrder, resumeData.value.customSections || []),
      set: (next) => {
        resumeData.value.sectionsOrder = next;
      }
    });
    const activeTab = ref("personalInfo");
    const activePopoverId = ref(null);
    const resumeData = ref({
      name: "My New Resume",
      templateId: "the-distinguished",
      templateSlug: "the-distinguished",
      sectionsOrder: [...DEFAULT_SECTIONS_ORDER],
      themeColor: "#3b82f6",
      personalInfo: {
        fullName: "Jonathan R. Sterling",
        jobTitle: "Product Designer",
        location: "San Francisco, CA",
        email: "jonathan.sterling@email.com",
        phone: "415.555.0198",
        linkedin: "linkedin.com/in/jonathansterling",
        portfolio: "jonathansterling.design",
        github: "",
        summary: "<p>Strategic and visionary Product Designer with over 8 years of experience building scalable digital ecosystems.</p>"
      },
      experience: [
        {
          id: crypto.randomUUID(),
          title: "Senior Fullstack Engineer",
          company: "Innovate Tech Solutions",
          location: "San Francisco, CA",
          startDate: "2026-01",
          endDate: "",
          isCurrent: true,
          description: "<ul><li>Led end-to-end delivery of customer-facing web platforms using React, Node.js, and cloud infrastructure.</li><li>Improved release reliability with automated tests and CI/CD, cutting production incidents over successive quarters.</li><li>Mentored engineers and partnered with product to ship scoped features on a predictable cadence.</li></ul>"
        }
      ],
      education: [
        {
          id: crypto.randomUUID(),
          degree: "B.S. Computer Science",
          school: "State University",
          location: "California, USA",
          graduationDate: "2019-06",
          description: ""
        }
      ],
      skills: [
        { id: crypto.randomUUID(), name: "TypeScript" },
        { id: crypto.randomUUID(), name: "React" },
        { id: crypto.randomUUID(), name: "Node.js" },
        { id: crypto.randomUUID(), name: "System Design" }
      ],
      projects: [],
      achievements: [],
      customSections: []
    });
    ref(false);
    const saving = ref(false);
    const enhancingIds = ref(/* @__PURE__ */ new Set());
    const translating = ref(false);
    const atsRunning = ref(false);
    const atsFixing = ref(false);
    const atsResult = ref(null);
    const atsJobDescription = ref("");
    function atsSeverityClass(severity) {
      if (severity === "critical") return "border-red-500/40 bg-red-500/10 text-red-200";
      if (severity === "warning") return "border-amber-500/40 bg-amber-500/10 text-amber-100";
      return "border-sky-500/40 bg-sky-500/10 text-sky-100";
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_BuilderTemplateThumbnail = _sfc_main$2;
      const _component_BuilderPdfSectionReorderPanel = __nuxt_component_2;
      const _component_BuilderRichTextEditor = __nuxt_component_3;
      const _component_ClientOnly = __nuxt_component_4;
      const _component_BuilderPdfResumePdfPreview = __nuxt_component_5;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-100 font-sans selection:bg-blue-500/30 h-screen flex flex-col" }, _attrs))} data-v-4b1c464e><header class="flex justify-between items-center px-6 h-16 shrink-0 bg-slate-900/40 backdrop-blur-md border-b border-white/10" data-v-4b1c464e><div class="flex items-center gap-8" data-v-4b1c464e>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "font-serif text-2xl text-white font-bold hover:text-blue-300 transition-colors"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`ScrapeEngine`);
          } else {
            return [
              createTextVNode("ScrapeEngine")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<nav class="hidden md:flex gap-6 items-center" data-v-4b1c464e>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/builder",
        class: "font-semibold text-slate-300 hover:text-white transition-colors duration-200"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`My Projects`);
          } else {
            return [
              createTextVNode("My Projects")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/builder/templates",
        class: "font-semibold text-slate-300 hover:text-white transition-colors duration-200"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Templates`);
          } else {
            return [
              createTextVNode("Templates")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</nav></div><div class="flex items-center gap-4" data-v-4b1c464e><div class="flex items-center gap-2" data-v-4b1c464e><select class="bg-white/5 border border-white/10 rounded px-3 py-1 text-sm focus:border-blue-400 focus:bg-white/10 outline-none text-white transition-all cursor-pointer" data-v-4b1c464e><option value="en" class="bg-slate-800 text-white" data-v-4b1c464e${ssrIncludeBooleanAttr(Array.isArray(resumeData.value.language) ? ssrLooseContain(resumeData.value.language, "en") : ssrLooseEqual(resumeData.value.language, "en")) ? " selected" : ""}>EN</option><option value="de" class="bg-slate-800 text-white" data-v-4b1c464e${ssrIncludeBooleanAttr(Array.isArray(resumeData.value.language) ? ssrLooseContain(resumeData.value.language, "de") : ssrLooseEqual(resumeData.value.language, "de")) ? " selected" : ""}>DE</option><option value="fr" class="bg-slate-800 text-white" data-v-4b1c464e${ssrIncludeBooleanAttr(Array.isArray(resumeData.value.language) ? ssrLooseContain(resumeData.value.language, "fr") : ssrLooseEqual(resumeData.value.language, "fr")) ? " selected" : ""}>FR</option><option value="es" class="bg-slate-800 text-white" data-v-4b1c464e${ssrIncludeBooleanAttr(Array.isArray(resumeData.value.language) ? ssrLooseContain(resumeData.value.language, "es") : ssrLooseEqual(resumeData.value.language, "es")) ? " selected" : ""}>ES</option></select>`);
      if (translating.value) {
        _push(`<span class="material-symbols-outlined text-blue-400 animate-spin text-sm" data-v-4b1c464e>refresh</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<input type="text"${ssrRenderAttr("value", resumeData.value.name)} class="bg-white/5 border border-white/10 rounded px-3 py-1 text-sm focus:border-blue-400 focus:bg-white/10 outline-none text-white transition-all" placeholder="Resume Name" data-v-4b1c464e></div><input type="file" class="hidden" accept=".pdf,.docx,.doc,.txt" data-v-4b1c464e><button${ssrIncludeBooleanAttr(importing.value || saving.value || exporting.value) ? " disabled" : ""} class="px-4 py-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 rounded hover:bg-indigo-500 hover:text-white transition-colors font-semibold text-sm disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-[0_0_15px_rgba(99,102,241,0.2)]" data-v-4b1c464e><span class="${ssrRenderClass([{ "animate-spin": importing.value }, "material-symbols-outlined text-[16px]"])}" data-v-4b1c464e>${ssrInterpolate(importing.value ? "refresh" : "upload_file")}</span><span class="hidden md:inline" data-v-4b1c464e>${ssrInterpolate(importing.value ? "Importing..." : "Import Resume")}</span></button><button${ssrIncludeBooleanAttr(saving.value) ? " disabled" : ""} class="px-4 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/50 rounded hover:bg-blue-500 hover:text-white transition-colors font-semibold text-sm disabled:opacity-50 cursor-pointer" data-v-4b1c464e>${ssrInterpolate(saving.value ? "Saving..." : "Save Draft")}</button><button${ssrIncludeBooleanAttr(exporting.value) ? " disabled" : ""} class="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors font-semibold text-sm shadow-[0_0_15px_rgba(59,130,246,0.5)] cursor-pointer disabled:opacity-50" data-v-4b1c464e>${ssrInterpolate(exporting.value ? "Exporting..." : "Export PDF")}</button></div></header><div class="flex flex-1 overflow-hidden" data-v-4b1c464e><aside class="w-64 shrink-0 flex flex-col py-6 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 overflow-y-auto" data-v-4b1c464e><nav class="flex-1" data-v-4b1c464e><ul class="space-y-1" data-v-4b1c464e><!--[-->`);
      ssrRenderList([
        { id: "template", label: "Template", icon: "view_quilt" },
        { id: "layout", label: "Section Order", icon: "reorder" },
        { id: "personalInfo", label: "Personal Info", icon: "person" },
        { id: "experience", label: "Experience", icon: "work" },
        { id: "projects", label: "Projects", icon: "integration_instructions" },
        { id: "education", label: "Education", icon: "school" },
        { id: "skills", label: "Skills", icon: "psychology" },
        { id: "achievements", label: "Achievements", icon: "emoji_events" },
        { id: "custom", label: "Custom Sections", icon: "dashboard_customize" },
        { id: "atsCheck", label: "ATS Check", icon: "fact_check" }
      ], (tab) => {
        _push(`<li data-v-4b1c464e><button class="${ssrRenderClass(["w-full flex items-center gap-4 px-6 py-3 text-sm transition-all cursor-pointer", activeTab.value === tab.id ? "text-blue-400 font-bold border-r-2 border-blue-400 bg-blue-500/10" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"])}" data-v-4b1c464e><span class="material-symbols-outlined" data-v-4b1c464e>${ssrInterpolate(tab.icon)}</span><span class="flex-1 text-left" data-v-4b1c464e>${ssrInterpolate(tab.label)}</span>`);
        if (tab.id === "atsCheck") {
          _push(`<span class="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" data-v-4b1c464e>Pro</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</button></li>`);
      });
      _push(`<!--]--></ul></nav></aside><main class="flex-1 flex overflow-hidden" data-v-4b1c464e><section class="w-1/2 h-full flex flex-col bg-slate-900/40 backdrop-blur-md border-r border-white/10 overflow-y-auto p-8 custom-scrollbar relative" data-v-4b1c464e>`);
      if (activeTab.value === "template") {
        _push(`<div data-v-4b1c464e><div class="mb-8" data-v-4b1c464e><h1 class="font-bold text-2xl text-white mb-1" data-v-4b1c464e>Choose Template</h1><p class="text-blue-200/60 text-sm" data-v-4b1c464e>Select a design for your resume.</p></div><div class="grid grid-cols-2 gap-4" data-v-4b1c464e><!--[-->`);
        ssrRenderList(unref(resumeTemplates), (tpl) => {
          _push(`<button type="button" class="${ssrRenderClass([resolvedFormatId.value === tpl.id ? "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.35)]" : "border-white/10 hover:border-blue-400/50", "cursor-pointer border-2 rounded-xl overflow-hidden text-left transition-all group"])}" data-v-4b1c464e><div class="aspect-[3/4] bg-slate-900/40 border-b border-white/5 relative overflow-hidden" data-v-4b1c464e>`);
          _push(ssrRenderComponent(_component_BuilderTemplateThumbnail, {
            "template-id": tpl.id,
            name: tpl.name
          }, null, _parent));
          if (resolvedFormatId.value === tpl.id) {
            _push(`<div class="absolute top-2 right-2 bg-blue-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" data-v-4b1c464e> Selected </div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="p-3 bg-white/5" data-v-4b1c464e><h3 class="font-bold text-white text-sm mb-0.5 group-hover:text-blue-300 transition-colors" data-v-4b1c464e>${ssrInterpolate(tpl.name)}</h3><p class="text-[11px] text-slate-400 leading-snug" data-v-4b1c464e>${ssrInterpolate(tpl.desc)}</p></div></button>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (activeTab.value === "layout") {
        _push(`<div class="space-y-6" data-v-4b1c464e><div class="mb-2" data-v-4b1c464e><h1 class="font-bold text-2xl text-white mb-1" data-v-4b1c464e>Section Order</h1><p class="text-blue-200/60 text-sm" data-v-4b1c464e> Reorder blocks for both the live PDF canvas and the downloaded file. </p></div>`);
        _push(ssrRenderComponent(_component_BuilderPdfSectionReorderPanel, {
          modelValue: sectionsOrderModel.value,
          "onUpdate:modelValue": ($event) => sectionsOrderModel.value = $event,
          "custom-sections": resumeData.value.customSections
        }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      if (activeTab.value === "personalInfo") {
        _push(`<div data-v-4b1c464e><div class="mb-8" data-v-4b1c464e><h1 class="font-bold text-2xl text-white mb-1" data-v-4b1c464e>Personal Info</h1><p class="text-blue-200/60 text-sm" data-v-4b1c464e>Update your contact details and professional summary.</p></div><div class="space-y-6" data-v-4b1c464e><div class="grid grid-cols-2 gap-4" data-v-4b1c464e><div class="flex flex-col" data-v-4b1c464e><label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Full Name</label><input${ssrRenderAttr("value", resumeData.value.personalInfo.fullName)} type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" data-v-4b1c464e></div><div class="flex flex-col" data-v-4b1c464e><label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Job Title</label><input${ssrRenderAttr("value", resumeData.value.personalInfo.jobTitle)} type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" data-v-4b1c464e></div></div><div class="grid grid-cols-2 gap-4" data-v-4b1c464e><div class="flex flex-col" data-v-4b1c464e><label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Email</label><input${ssrRenderAttr("value", resumeData.value.personalInfo.email)} type="email" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" data-v-4b1c464e></div><div class="flex flex-col" data-v-4b1c464e><label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Phone</label><input${ssrRenderAttr("value", resumeData.value.personalInfo.phone)} type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" data-v-4b1c464e></div></div><div class="grid grid-cols-2 gap-4" data-v-4b1c464e><div class="flex flex-col" data-v-4b1c464e><label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Location</label><input${ssrRenderAttr("value", resumeData.value.personalInfo.location)} type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" data-v-4b1c464e></div><div class="flex flex-col" data-v-4b1c464e><label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Portfolio Website</label><input${ssrRenderAttr("value", resumeData.value.personalInfo.portfolio)} type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" data-v-4b1c464e></div></div><div class="grid grid-cols-2 gap-4" data-v-4b1c464e><div class="flex flex-col" data-v-4b1c464e><label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>LinkedIn</label><input${ssrRenderAttr("value", resumeData.value.personalInfo.linkedin)} type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" data-v-4b1c464e></div><div class="flex flex-col" data-v-4b1c464e><label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>GitHub</label><input${ssrRenderAttr("value", resumeData.value.personalInfo.github)} type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" data-v-4b1c464e></div></div><div class="flex flex-col relative" data-v-4b1c464e><div class="flex justify-between items-end mb-1" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider" data-v-4b1c464e>Professional Summary <span class="text-blue-400 normal-case ml-2" data-v-4b1c464e>(Rich Text Supported)</span></label><button${ssrIncludeBooleanAttr(enhancingIds.value.has("summary")) ? " disabled" : ""} class="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white px-2 py-1 rounded border border-indigo-500/30 transition-colors disabled:opacity-50 z-10" data-v-4b1c464e><span class="${ssrRenderClass([{ "animate-spin": enhancingIds.value.has("summary") }, "material-symbols-outlined text-[12px]"])}" data-v-4b1c464e>${ssrInterpolate(enhancingIds.value.has("summary") ? "refresh" : "auto_awesome")}</span> ${ssrInterpolate(enhancingIds.value.has("summary") ? "Enhancing..." : "AI Enhance")}</button></div><div class="bg-white/5 rounded border border-white/10" data-v-4b1c464e>`);
        _push(ssrRenderComponent(_component_BuilderRichTextEditor, {
          modelValue: resumeData.value.personalInfo.summary,
          "onUpdate:modelValue": ($event) => resumeData.value.personalInfo.summary = $event
        }, null, _parent));
        _push(`</div></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (activeTab.value === "experience") {
        _push(`<div data-v-4b1c464e><div class="mb-8 flex justify-between items-end" data-v-4b1c464e><div data-v-4b1c464e><h1 class="font-bold text-2xl text-white mb-1" data-v-4b1c464e>Professional Experience</h1><p class="text-blue-200/60 text-sm" data-v-4b1c464e>Highlight your career progression.</p></div><button class="text-sm bg-blue-500/20 text-blue-300 border border-blue-500/50 px-4 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-colors font-semibold shadow-[0_0_10px_rgba(59,130,246,0.2)]" data-v-4b1c464e><span class="material-symbols-outlined text-[16px] align-text-bottom mr-1" data-v-4b1c464e>add</span> Add </button></div><div class="space-y-8 pb-10" data-v-4b1c464e><!--[-->`);
        ssrRenderList(resumeData.value.experience, (exp, index) => {
          _push(`<div class="bg-white/5 p-6 rounded-xl border border-white/10 relative group hover:border-white/20 transition-colors" data-v-4b1c464e><button class="absolute top-4 right-4 text-red-400 hover:text-red-300 material-symbols-outlined text-sm bg-red-400/10 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 z-10" data-v-4b1c464e>delete</button><div class="space-y-5 mt-2" data-v-4b1c464e><div class="flex flex-col" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Job Title</label><input${ssrRenderAttr("value", exp.title)} type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white font-semibold outline-none transition-colors" data-v-4b1c464e></div><div class="grid grid-cols-2 gap-6" data-v-4b1c464e><div class="flex flex-col" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Company</label><div class="flex items-center gap-2 relative" data-v-4b1c464e><input${ssrRenderAttr("value", exp.company)} type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" data-v-4b1c464e><button class="${ssrRenderClass([{ "text-blue-400": exp.companyWebsite || activePopoverId.value === exp.id }, "text-slate-400 hover:text-blue-400 material-symbols-outlined text-[16px] transition-colors"])}" data-v-4b1c464e>link</button>`);
          if (activePopoverId.value === exp.id) {
            _push(`<div class="absolute top-full right-0 mt-2 p-3 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-50 w-72" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1 block" data-v-4b1c464e>Link URL</label><input${ssrRenderAttr("value", exp.companyWebsite)} placeholder="https://" class="w-full bg-black/50 border border-slate-600 rounded px-3 py-1.5 text-sm mb-3 text-white outline-none focus:border-blue-500 transition-colors" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1 block" data-v-4b1c464e>Display Text</label><input${ssrRenderAttr("value", exp.companyWebsiteName)} placeholder="Text to display (optional)" class="w-full bg-black/50 border border-slate-600 rounded px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 transition-colors" data-v-4b1c464e></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div><div class="flex flex-col" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Location</label><input${ssrRenderAttr("value", exp.location)} type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" data-v-4b1c464e></div></div><div class="grid grid-cols-2 gap-6" data-v-4b1c464e><div class="flex flex-col" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Start Date</label><input${ssrRenderAttr("value", exp.startDate)} type="month" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" data-v-4b1c464e></div><div class="flex flex-col" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>End Date</label>`);
          if (!exp.isCurrent) {
            _push(`<input${ssrRenderAttr("value", exp.endDate)} type="month" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" data-v-4b1c464e>`);
          } else {
            _push(`<div class="py-1 text-blue-300 font-semibold text-sm" data-v-4b1c464e>Present</div>`);
          }
          _push(`<label class="flex items-center gap-2 mt-2 cursor-pointer w-max" data-v-4b1c464e><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(exp.isCurrent) ? ssrLooseContain(exp.isCurrent, null) : exp.isCurrent) ? " checked" : ""} class="accent-blue-500 w-4 h-4 rounded border-white/20" data-v-4b1c464e><span class="text-xs text-slate-300" data-v-4b1c464e>I currently work here</span></label></div></div><div class="flex flex-col relative" data-v-4b1c464e><div class="flex justify-between items-end mb-1" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider" data-v-4b1c464e>Description <span class="text-blue-400 normal-case ml-2" data-v-4b1c464e>(Rich Text Supported)</span></label><button${ssrIncludeBooleanAttr(enhancingIds.value.has(exp.id)) ? " disabled" : ""} class="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white px-2 py-1 rounded border border-indigo-500/30 transition-colors disabled:opacity-50 z-10" data-v-4b1c464e><span class="${ssrRenderClass([{ "animate-spin": enhancingIds.value.has(exp.id) }, "material-symbols-outlined text-[12px]"])}" data-v-4b1c464e>${ssrInterpolate(enhancingIds.value.has(exp.id) ? "refresh" : "auto_awesome")}</span> ${ssrInterpolate(enhancingIds.value.has(exp.id) ? "Enhancing..." : "AI Enhance")}</button></div><div class="bg-white/5 rounded border border-white/10" data-v-4b1c464e>`);
          _push(ssrRenderComponent(_component_BuilderRichTextEditor, {
            modelValue: exp.description,
            "onUpdate:modelValue": ($event) => exp.description = $event
          }, null, _parent));
          _push(`</div></div></div></div>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (activeTab.value === "projects") {
        _push(`<div data-v-4b1c464e><div class="mb-8 flex justify-between items-end" data-v-4b1c464e><div data-v-4b1c464e><h1 class="font-bold text-2xl text-white mb-1" data-v-4b1c464e>Projects</h1><p class="text-blue-200/60 text-sm" data-v-4b1c464e>Key projects and case studies.</p></div><button class="text-sm bg-blue-500/20 text-blue-300 border border-blue-500/50 px-4 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-colors font-semibold shadow-[0_0_10px_rgba(59,130,246,0.2)]" data-v-4b1c464e><span class="material-symbols-outlined text-[16px] align-text-bottom mr-1" data-v-4b1c464e>add</span> Add </button></div><div class="space-y-8 pb-10" data-v-4b1c464e><!--[-->`);
        ssrRenderList(resumeData.value.projects, (proj, index) => {
          _push(`<div class="bg-white/5 p-6 rounded-xl border border-white/10 relative group hover:border-white/20 transition-colors" data-v-4b1c464e><button class="absolute top-4 right-4 text-red-400 hover:text-red-300 material-symbols-outlined text-sm bg-red-400/10 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 z-10" data-v-4b1c464e>delete</button><div class="space-y-5 mt-2" data-v-4b1c464e><div class="flex flex-col" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Project Title</label><div class="flex items-center gap-2 relative" data-v-4b1c464e><input${ssrRenderAttr("value", proj.title)} type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white font-semibold outline-none transition-colors" data-v-4b1c464e><button class="${ssrRenderClass([{ "text-blue-400": proj.linkUrl || activePopoverId.value === proj.id }, "text-slate-400 hover:text-blue-400 material-symbols-outlined text-[16px] transition-colors"])}" data-v-4b1c464e>link</button>`);
          if (activePopoverId.value === proj.id) {
            _push(`<div class="absolute top-full right-0 mt-2 p-3 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-50 w-72" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1 block" data-v-4b1c464e>Link URL</label><input${ssrRenderAttr("value", proj.linkUrl)} placeholder="https://" class="w-full bg-black/50 border border-slate-600 rounded px-3 py-1.5 text-sm mb-3 text-white outline-none focus:border-blue-500 transition-colors" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1 block" data-v-4b1c464e>Display Text</label><input${ssrRenderAttr("value", proj.linkName)} placeholder="Text to display (optional)" class="w-full bg-black/50 border border-slate-600 rounded px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 transition-colors" data-v-4b1c464e></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div><div class="grid grid-cols-2 gap-6" data-v-4b1c464e><div class="flex flex-col" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Organization / Client</label><input${ssrRenderAttr("value", proj.organization)} type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" data-v-4b1c464e></div><div class="flex flex-col" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Location</label><input${ssrRenderAttr("value", proj.location)} type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" data-v-4b1c464e></div></div><div class="grid grid-cols-2 gap-6" data-v-4b1c464e><div class="flex flex-col" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Start Date</label><input${ssrRenderAttr("value", proj.startDate)} type="month" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" data-v-4b1c464e></div><div class="flex flex-col" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>End Date</label>`);
          if (!proj.isCurrent) {
            _push(`<input${ssrRenderAttr("value", proj.endDate)} type="month" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" data-v-4b1c464e>`);
          } else {
            _push(`<div class="py-1 text-blue-300 font-semibold text-sm" data-v-4b1c464e>Present</div>`);
          }
          _push(`<label class="flex items-center gap-2 mt-2 cursor-pointer w-max" data-v-4b1c464e><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(proj.isCurrent) ? ssrLooseContain(proj.isCurrent, null) : proj.isCurrent) ? " checked" : ""} class="accent-blue-500 w-4 h-4 rounded border-white/20" data-v-4b1c464e><span class="text-xs text-slate-300" data-v-4b1c464e>I currently work on this</span></label></div></div><div class="flex flex-col relative" data-v-4b1c464e><div class="flex justify-between items-end mb-1" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider" data-v-4b1c464e>Description <span class="text-blue-400 normal-case ml-2" data-v-4b1c464e>(Rich Text Supported)</span></label><button${ssrIncludeBooleanAttr(enhancingIds.value.has(proj.id)) ? " disabled" : ""} class="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white px-2 py-1 rounded border border-indigo-500/30 transition-colors disabled:opacity-50 z-10" data-v-4b1c464e><span class="${ssrRenderClass([{ "animate-spin": enhancingIds.value.has(proj.id) }, "material-symbols-outlined text-[12px]"])}" data-v-4b1c464e>${ssrInterpolate(enhancingIds.value.has(proj.id) ? "refresh" : "auto_awesome")}</span> ${ssrInterpolate(enhancingIds.value.has(proj.id) ? "Enhancing..." : "AI Enhance")}</button></div><div class="bg-white/5 rounded border border-white/10" data-v-4b1c464e>`);
          _push(ssrRenderComponent(_component_BuilderRichTextEditor, {
            modelValue: proj.description,
            "onUpdate:modelValue": ($event) => proj.description = $event
          }, null, _parent));
          _push(`</div></div></div></div>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (activeTab.value === "education") {
        _push(`<div data-v-4b1c464e><div class="mb-8 flex justify-between items-end" data-v-4b1c464e><div data-v-4b1c464e><h1 class="font-bold text-2xl text-white mb-1" data-v-4b1c464e>Education</h1><p class="text-blue-200/60 text-sm" data-v-4b1c464e>Your academic background.</p></div><button class="text-sm bg-blue-500/20 text-blue-300 border border-blue-500/50 px-4 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-colors font-semibold shadow-[0_0_10px_rgba(59,130,246,0.2)]" data-v-4b1c464e><span class="material-symbols-outlined text-[16px] align-text-bottom mr-1" data-v-4b1c464e>add</span> Add </button></div><div class="space-y-8 pb-10" data-v-4b1c464e><!--[-->`);
        ssrRenderList(resumeData.value.education, (edu, index) => {
          _push(`<div class="bg-white/5 p-6 rounded-xl border border-white/10 relative group hover:border-white/20 transition-colors" data-v-4b1c464e><button class="absolute top-4 right-4 text-red-400 hover:text-red-300 material-symbols-outlined text-sm bg-red-400/10 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 z-10" data-v-4b1c464e>delete</button><div class="space-y-5 mt-2" data-v-4b1c464e><div class="flex flex-col" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Degree / Program</label><input${ssrRenderAttr("value", edu.degree)} type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white font-semibold outline-none transition-colors" data-v-4b1c464e></div><div class="flex flex-col" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>School / University</label><input${ssrRenderAttr("value", edu.school)} type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" data-v-4b1c464e></div><div class="grid grid-cols-2 gap-6" data-v-4b1c464e><div class="flex flex-col" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Location</label><input${ssrRenderAttr("value", edu.location)} type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" data-v-4b1c464e></div><div class="flex flex-col" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Graduation Date</label><input${ssrRenderAttr("value", edu.graduationDate)} type="month" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" data-v-4b1c464e></div></div><div class="flex flex-col" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Description / Honors <span class="text-blue-400 normal-case ml-2" data-v-4b1c464e>(Rich Text Supported)</span></label><div class="bg-white/5 rounded border border-white/10 mt-1" data-v-4b1c464e>`);
          _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
          _push(`</div></div></div></div>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (activeTab.value === "skills") {
        _push(`<div data-v-4b1c464e><div class="mb-8 flex justify-between items-end" data-v-4b1c464e><div data-v-4b1c464e><h1 class="font-bold text-2xl text-white mb-1" data-v-4b1c464e>Skills</h1><p class="text-blue-200/60 text-sm" data-v-4b1c464e>Core competencies and technical skills.</p></div><button class="text-sm bg-blue-500/20 text-blue-300 border border-blue-500/50 px-4 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-colors font-semibold shadow-[0_0_10px_rgba(59,130,246,0.2)]" data-v-4b1c464e><span class="material-symbols-outlined text-[16px] align-text-bottom mr-1" data-v-4b1c464e>add</span> Add </button></div><div class="grid grid-cols-2 gap-4 pb-10" data-v-4b1c464e><!--[-->`);
        ssrRenderList(resumeData.value.skills, (skill, index) => {
          _push(`<div class="flex items-center gap-2 bg-white/5 p-2 px-3 rounded-lg border border-white/10 group hover:border-white/20 transition-colors" data-v-4b1c464e><input${ssrRenderAttr("value", skill.name)} type="text" class="flex-1 bg-transparent border-none text-sm outline-none text-white" placeholder="e.g. TypeScript" data-v-4b1c464e><button class="text-red-400 material-symbols-outlined text-sm hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity" data-v-4b1c464e>close</button></div>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (activeTab.value === "achievements") {
        _push(`<div data-v-4b1c464e><div class="mb-8 flex justify-between items-end" data-v-4b1c464e><div data-v-4b1c464e><h1 class="font-bold text-2xl text-white mb-1" data-v-4b1c464e>Achievements &amp; Awards</h1><p class="text-blue-200/60 text-sm" data-v-4b1c464e>Notable honors, certifications, and awards.</p></div><button class="text-sm bg-blue-500/20 text-blue-300 border border-blue-500/50 px-4 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-colors font-semibold shadow-[0_0_10px_rgba(59,130,246,0.2)]" data-v-4b1c464e><span class="material-symbols-outlined text-[16px] align-text-bottom mr-1" data-v-4b1c464e>add</span> Add </button></div><div class="space-y-6 pb-10" data-v-4b1c464e><!--[-->`);
        ssrRenderList(resumeData.value.achievements, (ach, index) => {
          _push(`<div class="bg-white/5 p-6 rounded-xl border border-white/10 relative group hover:border-white/20 transition-colors" data-v-4b1c464e><button class="absolute top-4 right-4 text-red-400 hover:text-red-300 material-symbols-outlined text-sm bg-red-400/10 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 z-10" data-v-4b1c464e>delete</button><div class="space-y-5 mt-2" data-v-4b1c464e><div class="flex flex-col" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Title</label><input${ssrRenderAttr("value", ach.title)} type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white font-semibold outline-none transition-colors" data-v-4b1c464e></div><div class="grid grid-cols-2 gap-6" data-v-4b1c464e><div class="flex flex-col" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Issuer / Organization</label><input${ssrRenderAttr("value", ach.issuer)} type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" data-v-4b1c464e></div><div class="flex flex-col" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Date</label><input${ssrRenderAttr("value", ach.date)} type="month" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" data-v-4b1c464e></div></div><div class="flex flex-col" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Description (Optional) <span class="text-blue-400 normal-case ml-2" data-v-4b1c464e>(Rich Text Supported)</span></label><div class="bg-white/5 rounded border border-white/10 mt-1" data-v-4b1c464e>`);
          _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
          _push(`</div></div></div></div>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (activeTab.value === "custom") {
        _push(`<div data-v-4b1c464e><div class="mb-8 flex justify-between items-end" data-v-4b1c464e><div data-v-4b1c464e><h1 class="font-bold text-2xl text-white mb-1" data-v-4b1c464e>Custom Sections</h1><p class="text-blue-200/60 text-sm" data-v-4b1c464e>Add any custom categories like Publications, Volunteering, etc.</p></div><button class="text-sm bg-blue-500/20 text-blue-300 border border-blue-500/50 px-4 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-colors font-semibold shadow-[0_0_10px_rgba(59,130,246,0.2)]" data-v-4b1c464e><span class="material-symbols-outlined text-[16px] align-text-bottom mr-1" data-v-4b1c464e>add</span> Section </button></div><div class="space-y-10 pb-10" data-v-4b1c464e><!--[-->`);
        ssrRenderList(resumeData.value.customSections, (section, sIndex) => {
          _push(`<div class="bg-white/5 p-6 rounded-xl border border-white/10 relative" data-v-4b1c464e><button class="absolute top-4 right-4 text-red-400 hover:text-red-300 material-symbols-outlined text-sm bg-red-400/10 p-1.5 rounded-md transition-colors z-10" data-v-4b1c464e>delete</button><div class="flex flex-col mb-6 w-3/4" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-blue-400 tracking-wider mb-1" data-v-4b1c464e>Section Title</label><input${ssrRenderAttr("value", section.title)} type="text" class="w-full bg-transparent border-0 border-b-2 border-blue-500/50 py-1 focus:border-blue-400 text-white text-lg font-bold outline-none transition-colors" data-v-4b1c464e></div><div class="space-y-6" data-v-4b1c464e><!--[-->`);
          ssrRenderList(section.items, (item, iIndex) => {
            _push(`<div class="bg-black/20 p-4 rounded border border-white/5 relative group hover:border-white/20 transition-colors" data-v-4b1c464e><button class="absolute top-2 right-2 text-red-400 hover:text-red-300 material-symbols-outlined text-sm transition-colors opacity-0 group-hover:opacity-100 z-10" data-v-4b1c464e>close</button><div class="space-y-4" data-v-4b1c464e><div class="grid grid-cols-2 gap-4" data-v-4b1c464e><div class="flex flex-col" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Item Title</label><input${ssrRenderAttr("value", item.title)} type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white font-semibold outline-none text-sm transition-colors" data-v-4b1c464e></div><div class="flex flex-col" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Date</label><input${ssrRenderAttr("value", item.date)} type="month" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none text-sm transition-colors" data-v-4b1c464e></div></div><div class="flex flex-col" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Subtitle</label><input${ssrRenderAttr("value", item.subtitle)} type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none text-sm transition-colors" data-v-4b1c464e></div><div class="flex flex-col" data-v-4b1c464e><label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e>Description <span class="text-blue-400 normal-case ml-2" data-v-4b1c464e>(Rich Text Supported)</span></label><div class="bg-white/5 rounded border border-white/10 mt-1" data-v-4b1c464e>`);
            _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
            _push(`</div></div></div></div>`);
          });
          _push(`<!--]--></div><button class="text-xs flex items-center text-blue-300 hover:text-blue-400 transition-colors mt-4" data-v-4b1c464e><span class="material-symbols-outlined text-[14px] mr-1" data-v-4b1c464e>add</span> Add Item </button></div>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (activeTab.value === "atsCheck") {
        _push(`<div class="pb-12" data-v-4b1c464e><div class="mb-8" data-v-4b1c464e><div class="flex items-center gap-2 mb-1" data-v-4b1c464e><h1 class="font-bold text-2xl text-white" data-v-4b1c464e>ATS Check</h1><span class="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" data-v-4b1c464e>Pro</span></div><p class="text-blue-200/60 text-sm" data-v-4b1c464e> Score your resume for applicant tracking systems and get concrete fixes. Uses 2 credits per run. </p></div>`);
        if (!unref(canAccessAI)) {
          _push(`<div class="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100 text-sm" data-v-4b1c464e>${ssrInterpolate(unref(aiBlockedMessage)() || "Upgrade to Pro and keep credits available to run ATS Check.")} `);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/pricing",
            class: "ml-2 underline text-amber-200 hover:text-white"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`View pricing`);
              } else {
                return [
                  createTextVNode("View pricing")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="space-y-4 mb-6" data-v-4b1c464e><div class="flex flex-col" data-v-4b1c464e><label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1" data-v-4b1c464e> Target job description <span class="normal-case text-slate-500" data-v-4b1c464e>(optional)</span></label><textarea rows="5" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-blue-400 resize-y" placeholder="Paste a job description to check keyword alignment\u2026" data-v-4b1c464e>${ssrInterpolate(atsJobDescription.value)}</textarea></div><div class="flex flex-wrap items-center gap-3" data-v-4b1c464e><button type="button" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-colors disabled:opacity-50 shadow-[0_0_18px_rgba(99,102,241,0.35)]"${ssrIncludeBooleanAttr(atsRunning.value || atsFixing.value || !unref(canAccessAI)) ? " disabled" : ""} data-v-4b1c464e><span class="${ssrRenderClass([{ "animate-spin": atsRunning.value }, "material-symbols-outlined text-[18px]"])}" data-v-4b1c464e>${ssrInterpolate(atsRunning.value ? "refresh" : "fact_check")}</span> ${ssrInterpolate(atsRunning.value ? "Analyzing\u2026" : "Run ATS Check")}</button>`);
        if (atsResult.value) {
          _push(`<button type="button" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 transition-colors disabled:opacity-50 shadow-[0_0_18px_rgba(16,185,129,0.35)]"${ssrIncludeBooleanAttr(atsFixing.value || atsRunning.value || !unref(canAccessAI)) ? " disabled" : ""} data-v-4b1c464e><span class="${ssrRenderClass([{ "animate-spin": atsFixing.value }, "material-symbols-outlined text-[18px]"])}" data-v-4b1c464e>${ssrInterpolate(atsFixing.value ? "refresh" : "auto_fix_high")}</span> ${ssrInterpolate(atsFixing.value ? "Applying fixes\u2026" : "Fix ATS Issues")}</button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (atsResult.value) {
          _push(`<p class="text-[11px] text-slate-400 w-full" data-v-4b1c464e> Fix uses 3 credits and rewrites summary, bullets, and skills from the audit findings. </p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (atsResult.value) {
          _push(`<div class="space-y-6" data-v-4b1c464e><div class="rounded-xl border border-white/10 bg-white/5 p-6 flex flex-wrap items-center gap-6" data-v-4b1c464e><div class="flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 border-indigo-400/60 bg-indigo-500/10" data-v-4b1c464e><span class="text-3xl font-black text-white" data-v-4b1c464e>${ssrInterpolate(atsResult.value.score)}</span><span class="text-[10px] uppercase tracking-widest text-indigo-200" data-v-4b1c464e>/ 100</span></div><div class="flex-1 min-w-[200px]" data-v-4b1c464e><p class="text-xs uppercase tracking-widest text-slate-400 mb-1" data-v-4b1c464e>Grade ${ssrInterpolate(atsResult.value.grade)}</p><p class="text-slate-200 text-sm leading-relaxed" data-v-4b1c464e>${ssrInterpolate(atsResult.value.summary)}</p></div></div>`);
          if (atsResult.value.strengths.length) {
            _push(`<div data-v-4b1c464e><h3 class="text-xs uppercase tracking-widest text-emerald-300/80 font-semibold mb-2" data-v-4b1c464e>Strengths</h3><ul class="space-y-1.5" data-v-4b1c464e><!--[-->`);
            ssrRenderList(atsResult.value.strengths, (s, i) => {
              _push(`<li class="text-sm text-slate-300 flex gap-2" data-v-4b1c464e><span class="material-symbols-outlined text-emerald-400 text-[16px] mt-0.5" data-v-4b1c464e>check_circle</span><span data-v-4b1c464e>${ssrInterpolate(s)}</span></li>`);
            });
            _push(`<!--]--></ul></div>`);
          } else {
            _push(`<!---->`);
          }
          if (atsResult.value.issues.length) {
            _push(`<div data-v-4b1c464e><h3 class="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2" data-v-4b1c464e>Issues</h3><div class="space-y-3" data-v-4b1c464e><!--[-->`);
            ssrRenderList(atsResult.value.issues, (issue, i) => {
              _push(`<div class="${ssrRenderClass([atsSeverityClass(issue.severity), "rounded-lg border p-3 text-sm"])}" data-v-4b1c464e><div class="flex items-center gap-2 mb-1" data-v-4b1c464e><span class="text-[10px] uppercase font-bold tracking-wider opacity-80" data-v-4b1c464e>${ssrInterpolate(issue.severity)}</span><span class="text-[10px] uppercase tracking-wider opacity-60" data-v-4b1c464e>${ssrInterpolate(issue.category)}</span></div><p class="font-medium mb-1" data-v-4b1c464e>${ssrInterpolate(issue.message)}</p><p class="opacity-80 text-xs leading-relaxed" data-v-4b1c464e>${ssrInterpolate(issue.suggestion)}</p></div>`);
            });
            _push(`<!--]--></div></div>`);
          } else {
            _push(`<!---->`);
          }
          if (atsResult.value.keywordGaps.length) {
            _push(`<div class="flex flex-wrap gap-2" data-v-4b1c464e><h3 class="w-full text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1" data-v-4b1c464e>Keyword gaps</h3><!--[-->`);
            ssrRenderList(atsResult.value.keywordGaps, (kw, i) => {
              _push(`<span class="text-[11px] px-2 py-1 rounded-full bg-white/10 text-slate-200 border border-white/10" data-v-4b1c464e>${ssrInterpolate(kw)}</span>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          if (atsResult.value.quickWins.length) {
            _push(`<div data-v-4b1c464e><h3 class="text-xs uppercase tracking-widest text-blue-300/80 font-semibold mb-2" data-v-4b1c464e>Quick wins</h3><ol class="list-decimal list-inside space-y-1.5 text-sm text-slate-300" data-v-4b1c464e><!--[-->`);
            ssrRenderList(atsResult.value.quickWins, (w, i) => {
              _push(`<li data-v-4b1c464e>${ssrInterpolate(w)}</li>`);
            });
            _push(`<!--]--></ol></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</section><section class="w-1/2 h-full bg-slate-800/80 overflow-y-auto p-12 flex justify-center items-start shadow-inner" data-v-4b1c464e>`);
      _push(ssrRenderComponent(_component_BuilderPdfResumePdfPreview, { resume: resumeData.value }, null, _parent));
      _push(`</section></main></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/builder/resume/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _id_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-4b1c464e"]]);

export { _id_ as default };
//# sourceMappingURL=_id_-R8Ai1zPd.mjs.map
