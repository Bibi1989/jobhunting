import { _ as __nuxt_component_0 } from './nuxt-link-Cuf_TjgJ.mjs';
import { _ as _sfc_main$1 } from './PortfolioRenderer-KMW0Hdx0.mjs';
import { defineComponent, computed, withAsyncContext, ref, reactive, watchEffect, mergeProps, withCtx, createTextVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr, ssrRenderList, ssrRenderClass, ssrRenderStyle, ssrRenderTeleport } from 'vue/server-renderer';
import { P as PORTFOLIO_TEMPLATES, b as PORTFOLIO_COLORS, o as orderedBodySections } from '../_/portfolio.mjs';
import { c as useRoute, u as useAppToast, b as useAppConfirm } from './server.mjs';
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

const inputClass = "w-full rounded-lg bg-slate-900/60 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-blue-200/30 focus:outline-none focus:border-blue-400 transition";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[id]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    useAppToast();
    useAppConfirm();
    const id = computed(() => String(route.params.id));
    const { data, error } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      () => `/api/portfolio/${id.value}`,
      "$laKZKPuWqg"
    )), __temp = await __temp, __restore(), __temp);
    const form = ref(null);
    const templateSlug = ref(PORTFOLIO_TEMPLATES[0].slug);
    const saving = ref(false);
    const deleting = ref(false);
    const previewSlug = ref(null);
    const editingProjectsTitle = ref(false);
    const editingSkillsTitle = ref(false);
    ref(null);
    const techDraft = reactive({});
    const skillDraft = ref("");
    watchEffect(() => {
      var _a, _b, _c, _d, _e, _f, _g;
      const p = (_a = data.value) == null ? void 0 : _a.portfolio;
      if (p && !form.value) {
        form.value = JSON.parse(JSON.stringify(p.profileData));
        (_b = form.value).formatted_projects || (_b.formatted_projects = []);
        (_c = form.value).core_skills || (_c.core_skills = []);
        (_d = form.value).custom_sections || (_d.custom_sections = []);
        (_e = form.value).section_titles || (_e.section_titles = {});
        (_f = form.value).button_texts || (_f.button_texts = {});
        (_g = form.value).theme_color || (_g.theme_color = PORTFOLIO_COLORS[0].id);
        if (typeof form.value.website === "string") {
          form.value.website = { label: "Website", url: form.value.website };
        } else if (!form.value.website) {
          form.value.website = { label: "", url: "" };
        }
        if (typeof form.value.linkedin === "string") {
          form.value.linkedin = { label: "LinkedIn", url: form.value.linkedin };
        } else if (!form.value.linkedin) {
          form.value.linkedin = { label: "", url: "" };
        }
        if (typeof form.value.github === "string") {
          form.value.github = { label: "GitHub", url: form.value.github };
        } else if (!form.value.github) {
          form.value.github = { label: "", url: "" };
        }
        if (typeof form.value.resume === "string") {
          form.value.resume = { label: "Resume", url: form.value.resume };
        } else if (!form.value.resume) {
          form.value.resume = { label: "", url: "" };
        }
        form.value.section_order = orderedBodySections(form.value).map((s) => s.key);
        templateSlug.value = p.templateSlug;
      }
    });
    const requestUrl = useRequestURL();
    const origin = computed(() => requestUrl.origin);
    function templateName(slug) {
      var _a2;
      var _a;
      return (_a2 = (_a = PORTFOLIO_TEMPLATES.find((t) => t.slug === slug)) == null ? void 0 : _a.name) != null ? _a2 : slug;
    }
    const sectionEntries = computed(() => {
      if (!form.value) return [];
      return orderedBodySections(form.value).map((s) => {
        var _a, _b;
        return {
          key: s.key,
          kind: s.kind,
          label: s.kind === "projects" ? "Projects" : s.kind === "skills" ? "Skills" : ((_b = (_a = s.custom) == null ? void 0 : _a.title) == null ? void 0 : _b.trim()) || "Custom section"
        };
      });
    });
    const sectionDrag = ref(null);
    const sectionOver = ref(null);
    function customSectionFor(key) {
      var _a, _b;
      return (_b = (_a = form.value) == null ? void 0 : _a.custom_sections) == null ? void 0 : _b.find((c) => c.id === key);
    }
    const contactFields = [
      { key: "email", label: "Email", placeholder: "you@example.com", icon: "mail" },
      { key: "phone", label: "Phone", placeholder: "+1 555 123 4567", icon: "call" },
      { key: "location", label: "Location", placeholder: "City, Country", icon: "location_on" },
      { key: "website", label: "Website", placeholder: "yoursite.com", icon: "language" },
      { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/you", icon: "link" },
      { key: "github", label: "GitHub", placeholder: "github.com/you", icon: "code" },
      { key: "resume", label: "Resume", placeholder: "Link to PDF/Doc", icon: "description" }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_PortfolioRenderer = _sfc_main$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "px-6 py-8 max-w-[1500px] mx-auto" }, _attrs))}><div class="flex flex-wrap items-center justify-between gap-4 mb-6"><div class="flex items-center gap-3">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/dashboard/portfolio",
        class: "material-symbols-outlined text-blue-200/70 hover:text-white"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`arrow_back`);
          } else {
            return [
              createTextVNode("arrow_back")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div><h1 class="font-serif text-2xl sm:text-3xl text-white">Edit portfolio</h1>`);
      if (unref(form)) {
        _push(`<p class="text-xs text-blue-200/50">${ssrInterpolate(templateName(unref(templateSlug)))} \xB7 /p/${ssrInterpolate(unref(id))}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
      if (unref(form)) {
        _push(`<div class="flex flex-wrap items-center gap-2"><a${ssrRenderAttr("href", `/p/${unref(id)}`)} target="_blank" rel="noopener" class="rounded-lg border border-white/15 hover:bg-white/5 px-4 py-2 text-sm font-semibold text-blue-100 transition"> View live </a><button type="button" class="rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10 px-4 py-2 text-sm font-semibold transition disabled:opacity-50"${ssrIncludeBooleanAttr(unref(deleting)) ? " disabled" : ""}>${ssrInterpolate(unref(deleting) ? "Deleting\u2026" : "Delete")}</button><button type="button" class="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-5 py-2 text-sm font-semibold text-white transition disabled:opacity-50 shadow-[0_0_18px_rgba(16,185,129,0.35)]"${ssrIncludeBooleanAttr(unref(saving)) ? " disabled" : ""}>${ssrInterpolate(unref(saving) ? "Saving\u2026" : "Save changes")}</button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (unref(error)) {
        _push(`<div class="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center"><p class="text-white font-semibold text-lg">Portfolio not found</p><p class="text-blue-200/60 mt-1">${ssrInterpolate(((_a = unref(error)) == null ? void 0 : _a.statusMessage) || "You may not have access to this portfolio.")}</p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/dashboard/portfolio",
          class: "inline-block mt-4 rounded-lg bg-blue-500 hover:bg-blue-400 px-5 py-2.5 font-semibold text-white"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Back to portfolios `);
            } else {
              return [
                createTextVNode(" Back to portfolios ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else if (unref(form)) {
        _push(`<div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-6 items-start"><div class="space-y-6 min-w-0"><section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h2 class="font-semibold text-white mb-4 flex items-center gap-2"><span class="material-symbols-outlined text-blue-300">dashboard_customize</span> Template </h2><div class="grid grid-cols-2 sm:grid-cols-3 gap-3"><!--[-->`);
        ssrRenderList(unref(PORTFOLIO_TEMPLATES), (template) => {
          _push(`<div class="${ssrRenderClass([unref(templateSlug) === template.slug ? "border-blue-400 ring-2 ring-blue-400/40" : "border-white/10 hover:border-white/25", "group rounded-xl border overflow-hidden bg-white/[0.02] cursor-pointer transition"])}" role="button" tabindex="0"><div class="relative h-24 overflow-hidden border-b border-white/10 bg-slate-900"><div class="absolute top-0 left-0 origin-top-left pointer-events-none" style="${ssrRenderStyle({ "width": "500%", "height": "500%", "transform": "scale(0.2)" })}">`);
          _push(ssrRenderComponent(_component_PortfolioRenderer, {
            slug: template.slug,
            data: unref(form)
          }, null, _parent));
          _push(`</div><button type="button" class="absolute bottom-1 right-1 text-[10px] font-semibold rounded bg-white/90 text-slate-900 px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition"> Preview </button></div><div class="p-2 flex items-center gap-1.5"><span class="w-2 h-2 rounded-full shrink-0 bg-slate-400"></span><span class="text-xs font-semibold text-white truncate">${ssrInterpolate(template.name)}</span>`);
          if (unref(templateSlug) === template.slug) {
            _push(`<span class="material-symbols-outlined text-blue-400 text-[16px] ml-auto">check_circle</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        });
        _push(`<!--]--></div></section><section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h2 class="font-semibold text-white mb-4 flex items-center gap-2"><span class="material-symbols-outlined text-blue-300">palette</span> Color Theme </h2><div class="flex flex-wrap gap-3"><!--[-->`);
        ssrRenderList(unref(PORTFOLIO_COLORS), (color) => {
          _push(`<button type="button" class="${ssrRenderClass([unref(form).theme_color === color.id ? "border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "border-transparent hover:scale-105", "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center"])}" style="${ssrRenderStyle({ backgroundColor: color.hex })}"${ssrRenderAttr("title", color.name)}>`);
          if (unref(form).theme_color === color.id) {
            _push(`<span class="material-symbols-outlined text-white text-[16px] font-bold">check</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</button>`);
        });
        _push(`<!--]--></div></section><section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h2 class="font-semibold text-white mb-4 flex items-center gap-2"><span class="material-symbols-outlined text-blue-300">smart_button</span> Navigation &amp; Buttons </h2><div class="grid sm:grid-cols-2 gap-3"><div><label class="block text-xs uppercase tracking-widest text-blue-200/50 mb-1">Primary Contact CTA</label><input${ssrRenderAttr("value", unref(form).button_texts.contact_cta)} class="${ssrRenderClass(inputClass)}" placeholder="e.g. Contact, Get in touch"></div><div><label class="block text-xs uppercase tracking-widest text-blue-200/50 mb-1">Hero CTA</label><input${ssrRenderAttr("value", unref(form).button_texts.hero_cta)} class="${ssrRenderClass(inputClass)}" placeholder="e.g. View my work"></div><div><label class="block text-xs uppercase tracking-widest text-blue-200/50 mb-1">Projects Nav Link</label><input${ssrRenderAttr("value", unref(form).button_texts.nav_projects)} class="${ssrRenderClass(inputClass)}" placeholder="e.g. Work, Portfolio"></div><div><label class="block text-xs uppercase tracking-widest text-blue-200/50 mb-1">Skills Nav Link</label><input${ssrRenderAttr("value", unref(form).button_texts.nav_skills)} class="${ssrRenderClass(inputClass)}" placeholder="e.g. Skills, Expertise"></div></div></section><section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h2 class="font-semibold text-white mb-4 flex items-center gap-2"><span class="material-symbols-outlined text-blue-300">badge</span> Basics </h2><div class="space-y-3"><div><label class="block text-xs uppercase tracking-widest text-blue-200/50 mb-1">Full name</label><input${ssrRenderAttr("value", unref(form).full_name)} class="${ssrRenderClass(inputClass)}" placeholder="Your name"></div><div><div class="flex items-center gap-2 mb-1 group"><input class="bg-transparent border-b border-transparent focus:border-blue-400 focus:outline-none text-xs uppercase tracking-widest text-blue-200/50 hover:border-white/20 transition" placeholder="Professional bio"${ssrRenderAttr("value", unref(form).section_titles.profile)}><span class="material-symbols-outlined text-[14px] text-blue-200/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">edit</span></div><textarea rows="4" class="${ssrRenderClass(inputClass)}" placeholder="A short first-person summary">${ssrInterpolate(unref(form).professional_bio)}</textarea></div></div></section><section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h2 class="font-semibold text-white mb-1 flex items-center gap-2"><span class="material-symbols-outlined text-blue-300">contact_mail</span> Contact </h2><p class="text-xs text-blue-200/50 mb-4"> Hiring managers use the portfolio contact form \u2014 messages are emailed to the address below (or your account email if this field is empty). Set <code class="text-blue-200/70">RESEND_API_KEY</code> and <code class="text-blue-200/70">CONTACT_FROM_EMAIL</code> for delivery. </p><div class="grid sm:grid-cols-2 gap-3"><!--[-->`);
        ssrRenderList(contactFields, (field) => {
          _push(`<div><label class="block text-xs uppercase tracking-widest text-blue-200/50 mb-1">${ssrInterpolate(field.label)}</label>`);
          if (["website", "linkedin", "github", "resume"].includes(field.key)) {
            _push(`<div class="flex gap-2"><input${ssrRenderAttr("value", unref(form)[field.key].label)} placeholder="Display text" class="${ssrRenderClass([inputClass, "w-1/3"])}"><div class="relative w-2/3"><span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-200/40 text-[18px]">${ssrInterpolate(field.icon)}</span><input${ssrRenderAttr("value", unref(form)[field.key].url)}${ssrRenderAttr("placeholder", field.placeholder)} class="${ssrRenderClass([inputClass, "pl-9"])}"></div></div>`);
          } else {
            _push(`<div class="relative"><span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-200/40 text-[18px]">${ssrInterpolate(field.icon)}</span><input${ssrRenderAttr("value", unref(form)[field.key])}${ssrRenderAttr("placeholder", field.placeholder)} class="${ssrRenderClass([inputClass, "pl-9"])}"></div>`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--></div></section><section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div class="flex items-center justify-between mb-4"><h2 class="font-semibold text-white flex items-center gap-2"><span class="material-symbols-outlined text-blue-300">work</span>`);
        if (!unref(editingProjectsTitle)) {
          _push(`<span class="flex items-center gap-2">${ssrInterpolate(unref(form).section_titles.projects || "Projects")} <button type="button" class="text-blue-200/40 hover:text-white transition"><span class="material-symbols-outlined text-[16px]">edit</span></button></span>`);
        } else {
          _push(`<input${ssrRenderAttr("value", unref(form).section_titles.projects)} class="bg-slate-900/60 border border-blue-500/50 rounded px-2 py-0.5 text-sm text-white focus:outline-none w-40" placeholder="Projects Title" autofocus>`);
        }
        _push(`<span class="text-blue-200/50 text-sm font-normal ml-2">(${ssrInterpolate(unref(form).formatted_projects.length)})</span></h2><button type="button" class="rounded-lg bg-blue-500/90 hover:bg-blue-400 px-3 py-1.5 text-sm font-semibold text-white"> + Add project </button></div>`);
        if (!unref(form).formatted_projects.length) {
          _push(`<p class="text-blue-200/50 italic text-sm"> No projects yet. Add one to showcase your work. </p>`);
        } else {
          _push(`<div class="space-y-4"><!--[-->`);
          ssrRenderList(unref(form).formatted_projects, (project, i) => {
            _push(`<div class="rounded-xl border border-white/10 bg-slate-900/40 p-4"><div class="flex items-center justify-between mb-3"><span class="text-xs font-semibold text-blue-200/50 uppercase tracking-widest">Project ${ssrInterpolate(i + 1)}</span><div class="flex items-center gap-1"><button type="button" class="material-symbols-outlined text-[18px] text-blue-200/50 hover:text-white disabled:opacity-30"${ssrIncludeBooleanAttr(i === 0) ? " disabled" : ""} title="Move up">arrow_upward</button><button type="button" class="material-symbols-outlined text-[18px] text-blue-200/50 hover:text-white disabled:opacity-30"${ssrIncludeBooleanAttr(i === unref(form).formatted_projects.length - 1) ? " disabled" : ""} title="Move down">arrow_downward</button><button type="button" class="material-symbols-outlined text-[18px] text-red-300/70 hover:text-red-300" title="Remove">delete</button></div></div><div class="space-y-3"><input${ssrRenderAttr("value", project.title)} class="${ssrRenderClass(inputClass)}" placeholder="Project title"><textarea rows="2" class="${ssrRenderClass(inputClass)}" placeholder="What it was and the impact">${ssrInterpolate(project.description)}</textarea><input${ssrRenderAttr("value", project.url)} class="${ssrRenderClass(inputClass)}" placeholder="Live / case-study URL (optional)"><div><div class="flex flex-wrap gap-1.5 mb-2"><!--[-->`);
            ssrRenderList(project.tech_stack, (tech) => {
              _push(`<span class="inline-flex items-center gap-1 rounded-md bg-blue-500/15 text-blue-200 text-xs px-2 py-1">${ssrInterpolate(tech)} <button type="button" class="material-symbols-outlined text-[14px] hover:text-white">close</button></span>`);
            });
            _push(`<!--]--></div><input${ssrRenderAttr("value", unref(techDraft)[i])} class="${ssrRenderClass(inputClass)}" placeholder="Add a technology, press Enter"></div></div></div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`</section><section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h2 class="font-semibold text-white mb-4 flex items-center gap-2"><span class="material-symbols-outlined text-blue-300">bolt</span>`);
        if (!unref(editingSkillsTitle)) {
          _push(`<span class="flex items-center gap-2">${ssrInterpolate(unref(form).section_titles.skills || "Core skills")} <button type="button" class="text-blue-200/40 hover:text-white transition"><span class="material-symbols-outlined text-[16px]">edit</span></button></span>`);
        } else {
          _push(`<input${ssrRenderAttr("value", unref(form).section_titles.skills)} class="bg-slate-900/60 border border-blue-500/50 rounded px-2 py-0.5 text-sm text-white focus:outline-none w-40" placeholder="Skills Title" autofocus>`);
        }
        _push(`<span class="text-blue-200/50 text-sm font-normal ml-2">(${ssrInterpolate(unref(form).core_skills.length)})</span></h2><div class="flex flex-wrap gap-2 mb-3"><!--[-->`);
        ssrRenderList(unref(form).core_skills, (skill) => {
          _push(`<span class="inline-flex items-center gap-1 rounded-full bg-white/10 text-blue-100 text-sm px-3 py-1">${ssrInterpolate(skill)} <button type="button" class="material-symbols-outlined text-[15px] hover:text-white">close</button></span>`);
        });
        _push(`<!--]--></div><input${ssrRenderAttr("value", unref(skillDraft))} class="${ssrRenderClass(inputClass)}" placeholder="Add a skill, press Enter"></section><section class="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div class="flex items-center justify-between mb-4"><h2 class="font-semibold text-white flex items-center gap-2"><span class="material-symbols-outlined text-blue-300">reorder</span> Sections </h2><button type="button" class="rounded-lg bg-blue-500/90 hover:bg-blue-400 px-3 py-1.5 text-sm font-semibold text-white"> + Custom section </button></div><p class="text-xs text-blue-200/50 mb-3"> Drag <span class="material-symbols-outlined text-[13px] align-middle">drag_indicator</span> or use the arrows to reorder how sections appear on your portfolio. </p><ul class="space-y-2"><!--[-->`);
        ssrRenderList(unref(sectionEntries), (entry, i) => {
          _push(`<li draggable="true" class="${ssrRenderClass([[
            unref(sectionDrag) === i ? "opacity-40" : "",
            unref(sectionOver) === i && unref(sectionDrag) !== i ? "border-blue-400/60 ring-1 ring-inset ring-blue-400/40" : "border-white/10"
          ], "rounded-xl border bg-slate-900/40 transition-colors"])}"><div class="flex items-center gap-2 px-3 py-2.5"><span class="material-symbols-outlined text-slate-500 text-[18px] cursor-grab active:cursor-grabbing" title="Drag to reorder">drag_indicator</span><span class="material-symbols-outlined text-[16px] text-blue-300/70">${ssrInterpolate(entry.kind === "projects" ? "work" : entry.kind === "skills" ? "bolt" : "article")}</span><span class="flex-1 text-sm font-medium text-white truncate">${ssrInterpolate(entry.label)}</span>`);
          if (entry.kind !== "custom") {
            _push(`<span class="text-[10px] uppercase tracking-wider text-blue-200/40">built-in</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="flex items-center gap-0.5"><button type="button" class="material-symbols-outlined text-[18px] text-blue-200/50 hover:text-white disabled:opacity-30"${ssrIncludeBooleanAttr(i === 0) ? " disabled" : ""} title="Move up">arrow_upward</button><button type="button" class="material-symbols-outlined text-[18px] text-blue-200/50 hover:text-white disabled:opacity-30"${ssrIncludeBooleanAttr(i === unref(sectionEntries).length - 1) ? " disabled" : ""} title="Move down">arrow_downward</button>`);
          if (entry.kind === "custom") {
            _push(`<button type="button" class="material-symbols-outlined text-[18px] text-red-300/70 hover:text-red-300" title="Remove section">delete</button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
          if (entry.kind === "custom" && customSectionFor(entry.key)) {
            _push(`<div class="px-3 pb-3 space-y-2 border-t border-white/5 pt-3"><input${ssrRenderAttr("value", customSectionFor(entry.key).title)} class="${ssrRenderClass(inputClass)}" placeholder="Section title (e.g. Awards, Speaking)"><textarea rows="3" class="${ssrRenderClass(inputClass)}" placeholder="Section content">${ssrInterpolate(customSectionFor(entry.key).content)}</textarea></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</li>`);
        });
        _push(`<!--]--></ul></section><div class="lg:hidden flex gap-2"><button type="button" class="flex-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 font-semibold text-white transition disabled:opacity-50"${ssrIncludeBooleanAttr(unref(saving)) ? " disabled" : ""}>${ssrInterpolate(unref(saving) ? "Saving\u2026" : "Save changes")}</button></div></div><div class="lg:sticky lg:top-20"><div class="flex items-center justify-between mb-2"><p class="text-xs uppercase tracking-widest text-blue-200/50">Live preview</p><button type="button" class="text-xs text-blue-300 hover:text-white">Open full screen</button></div><div class="rounded-2xl border border-white/10 overflow-hidden bg-white h-[70vh] overflow-y-auto shadow-2xl">`);
        _push(ssrRenderComponent(_component_PortfolioRenderer, {
          slug: unref(templateSlug),
          data: unref(form)
        }, null, _parent));
        _push(`</div><p class="text-[11px] text-blue-200/40 mt-2"> Edits preview instantly. Click <span class="text-blue-200">Save changes</span> to publish them to <code class="text-blue-200/70">${ssrInterpolate(unref(origin))}/p/${ssrInterpolate(unref(id))}</code>. </p></div></div>`);
      } else {
        _push(`<div class="text-blue-200/60 py-16 text-center">Loading\u2026</div>`);
      }
      ssrRenderTeleport(_push, (_push2) => {
        if (unref(previewSlug) && unref(form)) {
          _push2(`<div class="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex flex-col"><div class="flex items-center justify-between px-6 h-14 bg-slate-900 border-b border-white/10 shrink-0"><p class="font-semibold text-white">${ssrInterpolate(templateName(unref(previewSlug)))} \u2014 preview</p><div class="flex items-center gap-2"><button type="button" class="rounded-lg bg-blue-500 hover:bg-blue-400 px-4 py-1.5 text-sm font-semibold text-white"> Use this template </button><button type="button" class="rounded-lg border border-white/15 hover:bg-white/5 px-3 py-1.5 text-sm text-blue-100">Close</button></div></div><div class="flex-1 overflow-y-auto bg-white">`);
          _push2(ssrRenderComponent(_component_PortfolioRenderer, {
            slug: unref(previewSlug),
            data: unref(form)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/dashboard/portfolio/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-B2ECNvSL.mjs.map
