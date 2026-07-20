import { _ as __nuxt_component_0 } from './nuxt-link-Cuf_TjgJ.mjs';
import { _ as __nuxt_component_2$1 } from './CvFormatPicker-pXplRX-f.mjs';
import { defineComponent, ref, computed, mergeProps, withCtx, unref, createVNode, createTextVNode, isRef, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderClass, ssrIncludeBooleanAttr, ssrRenderList, ssrRenderStyle } from 'vue/server-renderer';
import { marked } from 'marked';
import { _ as _export_sfc } from './server.mjs';
import MarkdownIt from 'markdown-it';
import { ArrowLeft, FileUp, Trash2, Loader2, Sparkles, FileText, Check, Copy } from 'lucide-vue-next';
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
  __name: "ResumeThemeRenderer",
  __ssrInlineRender: true,
  props: {
    markdown: {},
    formatId: {}
  },
  setup(__props) {
    const props = __props;
    function stripInlineEmphasis(text) {
      return text.replace(/\*\*([^*]+?)\*\*/g, "$1").replace(/__([^_]+?)__/g, "$1").replace(/`([^`]+?)`/g, "$1").replace(/(^|[^*\s])\*([^*\n]+?)\*(?=[^*]|$)/g, "$1$2").replace(/\*\*/g, "");
    }
    const parsed = computed(() => {
      const mdText = stripInlineEmphasis(props.markdown || "");
      const lines = mdText.split("\n");
      const resume = {
        name: "Jordan Ellis",
        title: "Software Engineer",
        contact: [],
        email: "",
        phone: "",
        location: "",
        linkedin: "",
        website: "",
        summary: "",
        skills: [],
        experience: [],
        education: [],
        credentials: [],
        projects: [],
        extras: []
      };
      let currentSection = "";
      let currentJob = null;
      let currentSchool = null;
      let currentProject = null;
      let currentExtra = null;
      let currentExtraItem = null;
      let foundName = false;
      let foundTitle = false;
      let foundContact = false;
      const flushExtraItem = () => {
        if (currentExtra && currentExtraItem) {
          currentExtra.items.push(currentExtraItem);
          currentExtraItem = null;
        }
      };
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        if (line.startsWith("# ") && !foundName) {
          resume.name = line.replace("# ", "").trim();
          foundName = true;
          continue;
        }
        if (line.startsWith("## ")) {
          if (currentJob) {
            resume.experience.push(currentJob);
            currentJob = null;
          }
          if (currentSchool) {
            resume.education.push(currentSchool);
            currentSchool = null;
          }
          if (currentProject) {
            resume.projects.push(currentProject);
            currentProject = null;
          }
          flushExtraItem();
          currentExtra = null;
          const rawTitle = line.replace("## ", "").trim();
          const secName = rawTitle.toLowerCase();
          if (secName.includes("summary") || secName.includes("profile")) {
            currentSection = "summary";
          } else if (secName.includes("experience") || secName.includes("employment") || secName.includes("leadership")) {
            currentSection = "experience";
          } else if (secName.includes("skills") || secName.includes("competencies") || secName.includes("expertise") || secName.includes("technologies") || secName.includes("stack")) {
            currentSection = "skills";
          } else if (secName.includes("education")) {
            currentSection = "education";
          } else if (secName.includes("project")) {
            currentSection = "projects";
          } else if (secName.includes("credential") || secName.includes("certif") || secName.includes("achievement")) {
            currentSection = "credentials";
          } else {
            currentSection = "extra";
            currentExtra = { title: rawTitle, items: [] };
            resume.extras.push(currentExtra);
          }
          continue;
        }
        if (foundName && !foundTitle && !line.startsWith("#") && !line.includes("@") && !line.includes("\xB7") && !line.includes("|")) {
          resume.title = line;
          foundTitle = true;
          continue;
        }
        if (foundName && !foundContact && (line.includes("\xB7") || line.includes("|") || line.includes("@"))) {
          const parts = line.split(/[·|•]/).map((p) => p.trim());
          resume.contact = parts;
          parts.forEach((part) => {
            if (part.includes("@")) {
              resume.email = part;
            } else if (part.includes("linkedin.com")) {
              resume.linkedin = part;
            } else if (part.match(/\+?\d[\d\s-()]{7,}/)) {
              resume.phone = part;
            } else if (part.includes(".com") || part.includes(".io") || part.includes(".org") || part.includes(".me")) {
              resume.website = part;
            } else {
              resume.location = part;
            }
          });
          foundContact = true;
          continue;
        }
        if (currentSection === "summary") {
          if (!line.startsWith("#")) {
            resume.summary += (resume.summary ? "\n" : "") + line;
          }
        } else if (currentSection === "skills") {
          if (line.startsWith("- ") || line.startsWith("* ")) {
            const skill = line.substring(2).trim();
            if (skill) resume.skills.push(skill);
          } else if (line.includes("\xB7") || line.includes("|") || line.includes(",")) {
            const splitChar = line.includes("\xB7") ? "\xB7" : line.includes("|") ? "|" : ",";
            line.split(splitChar).forEach((s) => {
              const trimmed = s.trim();
              if (trimmed) resume.skills.push(trimmed);
            });
          } else if (line && !line.startsWith("#")) {
            resume.skills.push(line);
          }
        } else if (currentSection === "experience") {
          if (line.startsWith("### ")) {
            if (currentJob) resume.experience.push(currentJob);
            const headerText = line.replace("### ", "").trim();
            const commaIdx = headerText.indexOf(",");
            let title = headerText;
            let company = "";
            if (commaIdx !== -1) {
              title = headerText.substring(0, commaIdx).trim();
              company = headerText.substring(commaIdx + 1).trim();
            }
            currentJob = {
              title,
              company,
              dates: "",
              location: "",
              bullets: []
            };
          } else if (line.startsWith("*") && line.endsWith("*") && currentJob) {
            const meta = line.replace(/\*/g, "").trim();
            const metaParts = meta.split(/[·|•]/).map((p) => p.trim());
            if (metaParts.length > 1) {
              currentJob.location = metaParts[0];
              currentJob.dates = metaParts[1];
            } else {
              currentJob.dates = meta;
            }
          } else if ((line.startsWith("- ") || line.startsWith("* ")) && currentJob) {
            currentJob.bullets.push(line.substring(2).trim());
          }
        } else if (currentSection === "education") {
          if (line.startsWith("### ")) {
            if (currentSchool) resume.education.push(currentSchool);
            const headerText = line.replace("### ", "").trim();
            const commaIdx = headerText.indexOf(",");
            let degree = headerText;
            let school = "";
            if (commaIdx !== -1) {
              degree = headerText.substring(0, commaIdx).trim();
              school = headerText.substring(commaIdx + 1).trim();
            }
            currentSchool = {
              degree,
              school,
              dates: "",
              location: "",
              bullets: []
            };
          } else if (line.startsWith("*") && line.endsWith("*") && currentSchool) {
            const meta = line.replace(/\*/g, "").trim();
            const metaParts = meta.split(/[·|•]/).map((p) => p.trim());
            if (metaParts.length > 1) {
              currentSchool.location = metaParts[0];
              currentSchool.dates = metaParts[1];
            } else {
              currentSchool.dates = meta;
            }
          } else if ((line.startsWith("- ") || line.startsWith("* ")) && currentSchool) {
            currentSchool.bullets.push(line.substring(2).trim());
          }
        } else if (currentSection === "projects") {
          if (line.startsWith("### ")) {
            if (currentProject) resume.projects.push(currentProject);
            currentProject = {
              name: line.replace("### ", "").trim(),
              bullets: []
            };
          } else if ((line.startsWith("- ") || line.startsWith("* ")) && currentProject) {
            currentProject.bullets.push(line.substring(2).trim());
          }
        } else if (currentSection === "credentials") {
          if (line.startsWith("- ") || line.startsWith("* ")) {
            resume.credentials.push(line.substring(2).trim());
          } else if (!line.startsWith("#")) {
            line.split(/[·|,]/).forEach((c) => {
              const trimmed = c.trim();
              if (trimmed) resume.credentials.push(trimmed);
            });
          }
        } else if (currentSection === "extra" && currentExtra) {
          if (line.startsWith("### ")) {
            flushExtraItem();
            currentExtraItem = {
              title: line.replace("### ", "").trim(),
              bullets: []
            };
          } else if (line.startsWith("*") && line.endsWith("*") && currentExtraItem) {
            currentExtraItem.subtitle = line.replace(/\*/g, "").trim();
          } else if ((line.startsWith("- ") || line.startsWith("* ")) && currentExtraItem) {
            currentExtraItem.bullets.push(line.substring(2).trim());
          } else if ((line.startsWith("- ") || line.startsWith("* ")) && !currentExtraItem) {
            currentExtra.items.push({ title: line.substring(2).trim(), bullets: [] });
          }
        }
      }
      if (currentJob) resume.experience.push(currentJob);
      if (currentSchool) resume.education.push(currentSchool);
      if (currentProject) resume.projects.push(currentProject);
      flushExtraItem();
      if (!resume.email && resume.contact.length) {
        resume.email = resume.contact.find((c) => c.includes("@")) || "";
      }
      resume.skills = resume.skills.map((s) => s.trim()).filter(Boolean);
      resume.education = resume.education.filter((e) => {
        const degree = (e.degree || "").trim();
        const school = (e.school || "").trim();
        return Boolean(school || degree && degree.toLowerCase() !== "degree");
      });
      return resume;
    });
    const plainHtml = computed(() => props.markdown ? marked(props.markdown) : "");
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      if (__props.formatId === "the-corporate" || __props.formatId === "corporate-accent") {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "theme-corporate w-full bg-white relative overflow-hidden flex flex-col text-slate-800 text-left select-text p-0" }, _attrs))} data-v-0befcea5><header class="bg-[#091426] text-white p-7" data-v-0befcea5><div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4" data-v-0befcea5><div class="flex flex-col gap-1" data-v-0befcea5><h1 class="font-extrabold text-2xl tracking-tight text-white leading-tight" data-v-0befcea5>${ssrInterpolate(parsed.value.name)}</h1><p class="text-[10px] uppercase tracking-[0.2em] text-indigo-300 font-bold" data-v-0befcea5>${ssrInterpolate(parsed.value.title)}</p></div><div class="flex flex-col gap-1 items-start sm:items-end text-left sm:text-right text-[10px] text-slate-300 font-medium" data-v-0befcea5>`);
        if (parsed.value.email) {
          _push(`<span class="flex items-center gap-1.5" data-v-0befcea5>${ssrInterpolate(parsed.value.email)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.phone) {
          _push(`<span class="flex items-center gap-1.5" data-v-0befcea5>${ssrInterpolate(parsed.value.phone)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.location) {
          _push(`<span class="flex items-center gap-1.5" data-v-0befcea5>${ssrInterpolate(parsed.value.location)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.linkedin || parsed.value.website) {
          _push(`<span class="flex items-center gap-1.5 text-indigo-300" data-v-0befcea5>${ssrInterpolate(parsed.value.linkedin || parsed.value.website)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></header><div class="px-7 py-5" data-v-0befcea5><div class="mb-2.5" data-v-0befcea5><h3 class="text-[10px] font-bold text-[#091426] uppercase tracking-widest mb-1 select-none" data-v-0befcea5>Professional Profile</h3><div class="h-[1px] bg-slate-200 w-full" data-v-0befcea5></div></div><p class="text-[10.5px] leading-relaxed text-slate-600" data-v-0befcea5>${ssrInterpolate(parsed.value.summary)}</p></div><div class="px-7 pb-5" data-v-0befcea5><div class="mb-3" data-v-0befcea5><h3 class="text-[10px] font-bold text-[#091426] uppercase tracking-widest mb-1 select-none" data-v-0befcea5>Professional Experience</h3><div class="h-[1px] bg-slate-200 w-full" data-v-0befcea5></div></div><!--[-->`);
        ssrRenderList(parsed.value.experience, (job, index) => {
          _push(`<div class="mb-4 last:mb-0" data-v-0befcea5><div class="flex justify-between items-baseline mb-0.5" data-v-0befcea5><h4 class="text-[11px] font-bold text-[#091426]" data-v-0befcea5>${ssrInterpolate(job.title)}</h4><span class="text-[8.5px] text-slate-400 italic uppercase font-bold" data-v-0befcea5>${ssrInterpolate(job.dates)}</span></div><div class="flex justify-between items-baseline mb-1.5" data-v-0befcea5><span class="text-[10px] text-slate-500 font-semibold" data-v-0befcea5>${ssrInterpolate(job.company)}</span><span class="text-[9px] text-slate-400 font-medium" data-v-0befcea5>${ssrInterpolate(job.location)}</span></div><ul class="list-none space-y-1 pl-1" data-v-0befcea5><!--[-->`);
          ssrRenderList(job.bullets, (b, bIdx) => {
            _push(`<li class="flex gap-2 items-start text-[10px] leading-normal text-slate-600" data-v-0befcea5><span class="mt-1.5 w-1.5 h-1.5 bg-[#091426]/60 shrink-0" data-v-0befcea5></span><p data-v-0befcea5>${ssrInterpolate(b)}</p></li>`);
          });
          _push(`<!--]--></ul></div>`);
        });
        _push(`<!--]--></div>`);
        if (parsed.value.projects.length) {
          _push(`<div class="px-7 pb-5" data-v-0befcea5><div class="mb-3" data-v-0befcea5><h3 class="text-[10px] font-bold text-[#091426] uppercase tracking-widest mb-1 select-none" data-v-0befcea5>Projects</h3><div class="h-[1px] bg-slate-200 w-full" data-v-0befcea5></div></div><!--[-->`);
          ssrRenderList(parsed.value.projects, (p, pIdx) => {
            _push(`<div class="mb-3.5 last:mb-0" data-v-0befcea5><h4 class="text-[11px] font-bold text-[#091426] mb-1.5" data-v-0befcea5>${ssrInterpolate(p.name)}</h4><ul class="list-none space-y-1 pl-1" data-v-0befcea5><!--[-->`);
            ssrRenderList(p.bullets, (b, bIdx) => {
              _push(`<li class="flex gap-2 items-start text-[10px] leading-normal text-slate-600" data-v-0befcea5><span class="mt-1.5 w-1.5 h-1.5 bg-[#091426]/60 shrink-0" data-v-0befcea5></span><p data-v-0befcea5>${ssrInterpolate(b)}</p></li>`);
            });
            _push(`<!--]--></ul></div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="px-7 pb-8 grid grid-cols-1 md:grid-cols-2 gap-5" data-v-0befcea5><div data-v-0befcea5><div class="mb-2.5" data-v-0befcea5><h3 class="text-[10px] font-bold text-[#091426] uppercase tracking-widest mb-1 select-none" data-v-0befcea5>Core Competencies</h3><div class="h-[1px] bg-slate-200 w-full" data-v-0befcea5></div></div><div class="flex flex-wrap gap-1.5" data-v-0befcea5><!--[-->`);
        ssrRenderList(parsed.value.skills, (s, sIdx) => {
          _push(`<span class="pdf-avoid-break px-2.5 py-1 leading-normal bg-slate-50 border border-slate-200 text-[9px] font-bold text-[#091426] uppercase rounded" data-v-0befcea5>${ssrInterpolate(s)}</span>`);
        });
        _push(`<!--]--></div></div><div data-v-0befcea5><div class="mb-2.5" data-v-0befcea5><h3 class="text-[10px] font-bold text-[#091426] uppercase tracking-widest mb-1 select-none" data-v-0befcea5>Education</h3><div class="h-[1px] bg-slate-200 w-full" data-v-0befcea5></div></div><div class="space-y-2" data-v-0befcea5><!--[-->`);
        ssrRenderList(parsed.value.education, (edu, eduIdx) => {
          _push(`<div data-v-0befcea5><h5 class="text-[10px] font-bold text-[#091426]" data-v-0befcea5>${ssrInterpolate(edu.degree)}</h5><p class="text-[9.5px] text-slate-500 font-medium" data-v-0befcea5>${ssrInterpolate(edu.school)} `);
          if (edu.dates) {
            _push(`<span class="text-slate-400 font-normal" data-v-0befcea5>| ${ssrInterpolate(edu.dates)}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</p></div>`);
        });
        _push(`<!--]--></div></div></div><!--[-->`);
        ssrRenderList(parsed.value.extras, (extra) => {
          _push(`<section class="preview-extra-section px-7 pb-4" data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2" data-v-0befcea5>${ssrInterpolate(extra.title)}</h2><div class="space-y-2" data-v-0befcea5><!--[-->`);
          ssrRenderList(extra.items, (item, iIdx) => {
            _push(`<div data-v-0befcea5><h4 class="font-bold text-[10.5px] text-slate-800" data-v-0befcea5>${ssrInterpolate(item.title)}</h4>`);
            if (item.subtitle) {
              _push(`<p class="text-[9px] text-slate-500" data-v-0befcea5>${ssrInterpolate(item.subtitle)}</p>`);
            } else {
              _push(`<!---->`);
            }
            if (item.bullets.length) {
              _push(`<ul class="text-[9.5px] text-slate-600 list-disc space-y-0.5" data-v-0befcea5><!--[-->`);
              ssrRenderList(item.bullets, (b, bIdx) => {
                _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
              });
              _push(`<!--]--></ul>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div></section>`);
        });
        _push(`<!--]--><footer class="h-[5px] bg-[#091426] shrink-0" data-v-0befcea5></footer></div>`);
      } else if (__props.formatId === "the-executive" || __props.formatId === "executive-two-column") {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "theme-executive w-full bg-white relative p-7 flex flex-col text-slate-800 text-left select-text" }, _attrs))} data-v-0befcea5><header class="text-center mb-5 border-b border-slate-200 pb-4" data-v-0befcea5><h1 class="text-2xl font-bold tracking-tight text-[#091426] mb-1 leading-tight" data-v-0befcea5>${ssrInterpolate(parsed.value.name)}</h1><p class="text-[9px] uppercase tracking-[0.2em] text-[#006a61] font-bold mb-2.5" data-v-0befcea5>${ssrInterpolate(parsed.value.title)}</p><div class="flex flex-wrap justify-center gap-x-2.5 gap-y-1 text-[9.5px] text-slate-500 font-medium" data-v-0befcea5>`);
        if (parsed.value.location) {
          _push(`<span data-v-0befcea5>${ssrInterpolate(parsed.value.location)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.location && parsed.value.phone) {
          _push(`<span class="text-slate-400" data-v-0befcea5>\u2022</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.phone) {
          _push(`<span data-v-0befcea5>${ssrInterpolate(parsed.value.phone)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.phone && parsed.value.email) {
          _push(`<span class="text-slate-400" data-v-0befcea5>\u2022</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.email) {
          _push(`<span data-v-0befcea5>${ssrInterpolate(parsed.value.email)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.email && (parsed.value.linkedin || parsed.value.website)) {
          _push(`<span class="text-slate-400" data-v-0befcea5>\u2022</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.linkedin || parsed.value.website) {
          _push(`<span class="text-[#006a61]" data-v-0befcea5>${ssrInterpolate(parsed.value.linkedin || parsed.value.website)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></header><div class="grid grid-cols-12 gap-5 flex-grow" data-v-0befcea5><aside class="col-span-4 flex flex-col gap-4 border-r border-slate-200 pr-4" data-v-0befcea5>`);
        if (parsed.value.education.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none" data-v-0befcea5>Education</h2><div class="h-[1px] bg-slate-200 w-full mb-2" data-v-0befcea5></div><div class="flex flex-col gap-2.5" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.education, (edu, idx) => {
            _push(`<div data-v-0befcea5><h3 class="text-[9.5px] font-bold text-slate-800 leading-snug" data-v-0befcea5>${ssrInterpolate(edu.school)}</h3><p class="text-[9px] italic text-slate-500 leading-snug" data-v-0befcea5>${ssrInterpolate(edu.degree)}</p><p class="text-[8px] text-slate-400 mt-0.5" data-v-0befcea5>${ssrInterpolate(edu.dates)}</p></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.skills.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none" data-v-0befcea5>Core Expertise</h2><div class="h-[1px] bg-slate-200 w-full mb-2" data-v-0befcea5></div><ul class="flex flex-col gap-1" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.skills, (s, idx) => {
            _push(`<li class="flex items-center gap-2 text-[9.5px] text-slate-700 font-medium" data-v-0befcea5><span class="w-1.5 h-1.5 bg-[#006a61] rotate-45 shrink-0" data-v-0befcea5></span><span data-v-0befcea5>${ssrInterpolate(s)}</span></li>`);
          });
          _push(`<!--]--></ul></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.credentials.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none" data-v-0befcea5>Credentials</h2><div class="h-[1px] bg-slate-200 w-full mb-2" data-v-0befcea5></div><div class="text-[9px] text-slate-600 space-y-1 font-medium" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.credentials, (c, idx) => {
            _push(`<p data-v-0befcea5>${ssrInterpolate(c)}</p>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</aside><section class="col-span-8 flex flex-col gap-4" data-v-0befcea5>`);
        if (parsed.value.summary) {
          _push(`<div data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none" data-v-0befcea5>Executive Summary</h2><div class="h-[1px] bg-slate-200 w-full mb-2" data-v-0befcea5></div><p class="text-[10px] leading-relaxed text-slate-600" data-v-0befcea5>${ssrInterpolate(parsed.value.summary)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.experience.length) {
          _push(`<div data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none" data-v-0befcea5>Experience</h2><div class="h-[1px] bg-slate-200 w-full mb-2" data-v-0befcea5></div><div class="flex flex-col gap-3.5" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.experience, (job, idx) => {
            _push(`<article data-v-0befcea5><div class="flex justify-between items-baseline mb-0.5" data-v-0befcea5><h3 class="text-[10.5px] font-bold text-slate-800" data-v-0befcea5>${ssrInterpolate(job.title)}</h3><span class="text-[7.5px] text-slate-400 uppercase font-bold" data-v-0befcea5>${ssrInterpolate(job.dates)}</span></div><p class="text-[9.5px] italic text-[#006a61] mb-1 font-semibold" data-v-0befcea5>${ssrInterpolate(job.company)} `);
            if (job.location) {
              _push(`<span class="text-slate-400 font-normal" data-v-0befcea5>| ${ssrInterpolate(job.location)}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</p><ul class="flex flex-col gap-1 pl-1" data-v-0befcea5><!--[-->`);
            ssrRenderList(job.bullets, (b, bIdx) => {
              _push(`<li class="relative pl-3 text-[9.5px] text-slate-600 leading-normal before:content-[&#39;-&#39;] before:absolute before:left-0 before:font-bold before:text-slate-400" data-v-0befcea5>${ssrInterpolate(b)}</li>`);
            });
            _push(`<!--]--></ul></article>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.projects.length) {
          _push(`<div data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none" data-v-0befcea5>Projects</h2><div class="h-[1px] bg-slate-200 w-full mb-2" data-v-0befcea5></div><div class="flex flex-col gap-3" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.projects, (p, pIdx) => {
            _push(`<div data-v-0befcea5><h4 class="text-[10.5px] font-bold text-slate-800 mb-1 leading-snug" data-v-0befcea5>${ssrInterpolate(p.name)}</h4><ul class="flex flex-col gap-1 pl-1" data-v-0befcea5><!--[-->`);
            ssrRenderList(p.bullets, (b, bIdx) => {
              _push(`<li class="relative pl-3 text-[9.5px] text-slate-600 leading-normal before:content-[&#39;-&#39;] before:absolute before:left-0 before:font-bold before:text-slate-400" data-v-0befcea5>${ssrInterpolate(b)}</li>`);
            });
            _push(`<!--]--></ul></div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</section></div><!--[-->`);
        ssrRenderList(parsed.value.extras, (extra) => {
          _push(`<section class="preview-extra-section" data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2" data-v-0befcea5>${ssrInterpolate(extra.title)}</h2><div class="space-y-2" data-v-0befcea5><!--[-->`);
          ssrRenderList(extra.items, (item, iIdx) => {
            _push(`<div data-v-0befcea5><h4 class="font-bold text-[10.5px] text-slate-800" data-v-0befcea5>${ssrInterpolate(item.title)}</h4>`);
            if (item.subtitle) {
              _push(`<p class="text-[9px] text-slate-500" data-v-0befcea5>${ssrInterpolate(item.subtitle)}</p>`);
            } else {
              _push(`<!---->`);
            }
            if (item.bullets.length) {
              _push(`<ul class="text-[9.5px] text-slate-600 list-disc space-y-0.5" data-v-0befcea5><!--[-->`);
              ssrRenderList(item.bullets, (b, bIdx) => {
                _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
              });
              _push(`<!--]--></ul>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div></section>`);
        });
        _push(`<!--]--></div>`);
      } else if (__props.formatId === "the-strategist" || __props.formatId === "strategist-sidebar") {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "theme-strategist w-full bg-white relative flex overflow-hidden text-slate-800 text-left select-text p-0" }, _attrs))} data-v-0befcea5><section class="theme-sidebar w-1/3 bg-[#f8f9ff] p-5 border-r border-slate-200 flex flex-col gap-5 shrink-0" data-v-0befcea5><div data-v-0befcea5><h3 class="text-[10px] font-bold text-[#091426] uppercase tracking-widest border-b border-slate-300 pb-1 mb-2 select-none" data-v-0befcea5>Contact</h3><div class="flex flex-col gap-1.5 text-[9px] text-slate-600 font-medium" data-v-0befcea5>`);
        if (parsed.value.email) {
          _push(`<div class="flex items-start gap-1.5" data-v-0befcea5><span class="w-1 h-1 mt-1.5 shrink-0 bg-slate-400 rounded-full" data-v-0befcea5></span><span class="break-all leading-normal" data-v-0befcea5>${ssrInterpolate(parsed.value.email)}</span></div>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.phone) {
          _push(`<div class="flex items-start gap-1.5" data-v-0befcea5><span class="w-1 h-1 mt-1.5 shrink-0 bg-slate-400 rounded-full" data-v-0befcea5></span><span class="leading-normal" data-v-0befcea5>${ssrInterpolate(parsed.value.phone)}</span></div>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.location) {
          _push(`<div class="flex items-start gap-1.5" data-v-0befcea5><span class="w-1 h-1 mt-1.5 shrink-0 bg-slate-400 rounded-full" data-v-0befcea5></span><span class="break-words leading-normal" data-v-0befcea5>${ssrInterpolate(parsed.value.location)}</span></div>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.linkedin || parsed.value.website) {
          _push(`<div class="flex items-start gap-1.5 text-[#006a61]" data-v-0befcea5><span class="w-1 h-1 mt-1.5 shrink-0 bg-slate-400 rounded-full" data-v-0befcea5></span><span class="break-all leading-normal" data-v-0befcea5>${ssrInterpolate(parsed.value.linkedin || parsed.value.website)}</span></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
        if (parsed.value.skills.length) {
          _push(`<div data-v-0befcea5><h3 class="text-[10px] font-bold text-[#091426] uppercase tracking-widest border-b border-slate-300 pb-1 mb-2 select-none" data-v-0befcea5>Expertise</h3><div class="flex flex-col gap-1" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.skills, (s, idx) => {
            _push(`<div class="pdf-avoid-break text-[9px] text-slate-700 font-bold uppercase tracking-wider bg-white border border-slate-200/80 px-2 py-1 rounded shadow-sm text-center leading-normal break-words" data-v-0befcea5>${ssrInterpolate(s)}</div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.education.length) {
          _push(`<div data-v-0befcea5><h3 class="text-[10px] font-bold text-[#091426] uppercase tracking-widest border-b border-slate-300 pb-1 mb-2 select-none" data-v-0befcea5>Education</h3><div class="space-y-2" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.education, (edu, idx) => {
            _push(`<div data-v-0befcea5><h5 class="text-[9.5px] font-bold text-slate-800 leading-snug" data-v-0befcea5>${ssrInterpolate(edu.school)}</h5><p class="text-[9px] text-slate-500 leading-snug" data-v-0befcea5>${ssrInterpolate(edu.degree)}</p>`);
            if (edu.dates) {
              _push(`<p class="text-[8px] text-slate-400 mt-0.5" data-v-0befcea5>${ssrInterpolate(edu.dates)}</p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</section><section class="w-2/3 p-6 flex flex-col gap-4" data-v-0befcea5><div data-v-0befcea5><h1 class="text-2xl font-extrabold tracking-tight text-[#091426] mb-0.5 leading-tight" data-v-0befcea5>${ssrInterpolate(parsed.value.name)}</h1><h2 class="text-[9.5px] font-bold tracking-[0.15em] text-[#006a61] uppercase mb-3 leading-snug" data-v-0befcea5>${ssrInterpolate(parsed.value.title)}</h2><div class="h-[2px] bg-gradient-to-r from-[#091426] via-[#006a61] to-transparent w-full opacity-30" data-v-0befcea5></div></div>`);
        if (parsed.value.summary) {
          _push(`<div data-v-0befcea5><h3 class="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest mb-1 select-none" data-v-0befcea5>Profile</h3><p class="text-[10px] leading-relaxed text-slate-600" data-v-0befcea5>${ssrInterpolate(parsed.value.summary)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.experience.length) {
          _push(`<div data-v-0befcea5><h3 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest mb-2 select-none" data-v-0befcea5>Experience</h3><div class="space-y-3" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.experience, (job, idx) => {
            _push(`<div data-v-0befcea5><div class="flex justify-between items-baseline mb-0.5" data-v-0befcea5><h4 class="text-[10.5px] font-bold text-slate-800" data-v-0befcea5>${ssrInterpolate(job.title)}</h4><span class="text-[7.5px] text-slate-400 font-bold uppercase" data-v-0befcea5>${ssrInterpolate(job.dates)}</span></div><p class="text-[9px] text-[#006a61] font-bold mb-1 leading-snug" data-v-0befcea5>${ssrInterpolate(job.company)} `);
            if (job.location) {
              _push(`<span class="text-slate-400 font-normal" data-v-0befcea5>\xB7 ${ssrInterpolate(job.location)}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</p><ul class="space-y-0.5 pl-0.5 list-none" data-v-0befcea5><!--[-->`);
            ssrRenderList(job.bullets, (b, bIdx) => {
              _push(`<li class="flex gap-2 items-start text-[9.5px] leading-normal text-slate-600" data-v-0befcea5><span class="mt-1.5 w-1 h-1 bg-slate-300 rounded-full shrink-0" data-v-0befcea5></span><p data-v-0befcea5>${ssrInterpolate(b)}</p></li>`);
            });
            _push(`<!--]--></ul></div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.projects.length) {
          _push(`<div data-v-0befcea5><h3 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest mb-2 select-none" data-v-0befcea5>Projects</h3><div class="space-y-3" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.projects, (p, pIdx) => {
            _push(`<div data-v-0befcea5><h4 class="text-[10.5px] font-bold text-slate-800 mb-1 leading-snug" data-v-0befcea5>${ssrInterpolate(p.name)}</h4><ul class="space-y-0.5 pl-0.5 list-none" data-v-0befcea5><!--[-->`);
            ssrRenderList(p.bullets, (b, bIdx) => {
              _push(`<li class="flex gap-2 items-start text-[9.5px] leading-normal text-slate-600" data-v-0befcea5><span class="mt-1.5 w-1.5 h-1.5 bg-slate-300 rounded-full shrink-0" data-v-0befcea5></span><p data-v-0befcea5>${ssrInterpolate(b)}</p></li>`);
            });
            _push(`<!--]--></ul></div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(parsed.value.extras, (extra) => {
          _push(`<section class="preview-extra-section" data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2" data-v-0befcea5>${ssrInterpolate(extra.title)}</h2><div class="space-y-2" data-v-0befcea5><!--[-->`);
          ssrRenderList(extra.items, (item, iIdx) => {
            _push(`<div data-v-0befcea5><h4 class="font-bold text-[10.5px] text-slate-800" data-v-0befcea5>${ssrInterpolate(item.title)}</h4>`);
            if (item.subtitle) {
              _push(`<p class="text-[9px] text-slate-500" data-v-0befcea5>${ssrInterpolate(item.subtitle)}</p>`);
            } else {
              _push(`<!---->`);
            }
            if (item.bullets.length) {
              _push(`<ul class="text-[9.5px] text-slate-600 list-disc space-y-0.5" data-v-0befcea5><!--[-->`);
              ssrRenderList(item.bullets, (b, bIdx) => {
                _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
              });
              _push(`<!--]--></ul>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div></section>`);
        });
        _push(`<!--]--></section></div>`);
      } else if (__props.formatId === "the-creative-director") {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "theme-creative-director w-full relative flex flex-row items-stretch text-slate-800 text-left select-text p-0" }, _attrs))} data-v-0befcea5><aside class="theme-sidebar w-[280px] shrink-0 flex flex-col justify-start p-7 self-stretch" style="${ssrRenderStyle({ "background-color": "#006a61", "color": "#ffffff" })}" data-v-0befcea5><div data-v-0befcea5><h1 class="text-3xl font-black leading-none uppercase break-words" style="${ssrRenderStyle({ "color": "#ffffff" })}" data-v-0befcea5>${ssrInterpolate(parsed.value.name)}</h1><p class="text-[9px] uppercase tracking-widest mt-2 font-bold" style="${ssrRenderStyle({ "color": "#ccfbf1" })}" data-v-0befcea5>${ssrInterpolate(parsed.value.title)}</p><div class="mt-6 space-y-4" data-v-0befcea5><div data-v-0befcea5><h4 class="text-[9px] uppercase tracking-widest font-bold border-b pb-1 mb-2" style="${ssrRenderStyle({ "color": "#99f6e4", "border-color": "rgba(255,255,255,0.25)" })}" data-v-0befcea5>Contact</h4><ul class="list-none space-y-1.5 text-[9.5px] leading-normal pl-0" style="${ssrRenderStyle({ "color": "#ffffff", "list-style": "none" })}" data-v-0befcea5>`);
        if (parsed.value.email) {
          _push(`<li class="break-all leading-normal" style="${ssrRenderStyle({ "color": "#ffffff", "overflow": "visible", "height": "auto", "list-style": "none" })}" data-v-0befcea5>${ssrInterpolate(parsed.value.email)}</li>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.phone) {
          _push(`<li class="leading-normal" style="${ssrRenderStyle({ "color": "#ffffff", "overflow": "visible", "height": "auto", "list-style": "none" })}" data-v-0befcea5>${ssrInterpolate(parsed.value.phone)}</li>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.location) {
          _push(`<li class="break-words leading-normal" style="${ssrRenderStyle({ "color": "#ffffff", "overflow": "visible", "height": "auto", "list-style": "none" })}" data-v-0befcea5>${ssrInterpolate(parsed.value.location)}</li>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.linkedin || parsed.value.website) {
          _push(`<li class="break-all leading-normal" style="${ssrRenderStyle({ "color": "#ccfbf1", "overflow": "visible", "height": "auto", "list-style": "none" })}" data-v-0befcea5>${ssrInterpolate(parsed.value.linkedin || parsed.value.website)}</li>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</ul></div>`);
        if (parsed.value.skills.length) {
          _push(`<div data-v-0befcea5><h4 class="text-[9px] uppercase tracking-widest font-bold border-b pb-1 mb-2" style="${ssrRenderStyle({ "color": "#99f6e4", "border-color": "rgba(255,255,255,0.25)" })}" data-v-0befcea5>Skills</h4><div class="flex flex-wrap gap-1.5" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.skills, (s, idx) => {
            _push(`<span class="pdf-avoid-break inline-block px-2.5 py-1.5 text-[9px] leading-normal font-semibold rounded" style="${ssrRenderStyle({ "background-color": "#0f766e", "border": "1px solid #5eead4", "color": "#ffffff", "overflow": "visible", "height": "auto", "max-height": "none", "white-space": "normal" })}" data-v-0befcea5>${ssrInterpolate(s)}</span>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.education.length) {
          _push(`<div data-v-0befcea5><h4 class="text-[9px] uppercase tracking-widest font-bold border-b pb-1 mb-2" style="${ssrRenderStyle({ "color": "#99f6e4", "border-color": "rgba(255,255,255,0.25)" })}" data-v-0befcea5>Education</h4><div class="space-y-2.5 text-[9.5px]" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.education, (edu, idx) => {
            _push(`<div data-v-0befcea5><p class="font-bold" style="${ssrRenderStyle({ "color": "#ffffff" })}" data-v-0befcea5>${ssrInterpolate(edu.degree)}</p><p style="${ssrRenderStyle({ "color": "#e2e8f0" })}" data-v-0befcea5>${ssrInterpolate(edu.school)} `);
            if (edu.dates) {
              _push(`<span data-v-0befcea5>, ${ssrInterpolate(edu.dates)}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</p></div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></aside><div class="flex-1 bg-white p-8 flex flex-col gap-4 min-w-0 self-stretch" data-v-0befcea5>`);
        if (parsed.value.summary) {
          _push(`<section class="pdf-avoid-break" data-v-0befcea5><h2 class="text-[10px] font-bold text-[#006a61] uppercase tracking-wider mb-2 flex items-center gap-2" data-v-0befcea5><span data-v-0befcea5>Profile</span><span class="h-[1px] flex-1 bg-teal-100" data-v-0befcea5></span></h2><p class="text-[11px] leading-relaxed text-slate-600" data-v-0befcea5>${ssrInterpolate(parsed.value.summary)}</p></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.experience.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[10px] font-bold text-[#006a61] uppercase tracking-wider mb-3 flex items-center gap-2" data-v-0befcea5><span data-v-0befcea5>Experience</span><span class="h-[1px] flex-1 bg-teal-100" data-v-0befcea5></span></h2><div class="space-y-4" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.experience, (job, idx) => {
            _push(`<div class="relative pl-4 border-l border-teal-200/60" data-v-0befcea5><div class="absolute -left-[4px] top-1 w-2 h-2 rounded-full bg-[#006a61]" data-v-0befcea5></div><div class="flex justify-between items-start mb-0.5 gap-2 pdf-avoid-break" data-v-0befcea5><h4 class="font-bold text-[11.5px] text-slate-800" data-v-0befcea5>${ssrInterpolate(job.title)}</h4><span class="text-[8px] text-slate-400 uppercase font-bold shrink-0" data-v-0befcea5>${ssrInterpolate(job.dates)}</span></div><p class="text-[#006a61] font-semibold text-[9.5px] mb-1.5 pdf-avoid-break" data-v-0befcea5>${ssrInterpolate(job.company)} `);
            if (job.location) {
              _push(`<span class="text-slate-500 font-normal" data-v-0befcea5>| ${ssrInterpolate(job.location)}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</p><ul class="text-[10px] text-slate-600 space-y-1 list-disc" data-v-0befcea5><!--[-->`);
            ssrRenderList(job.bullets, (b, bIdx) => {
              _push(`<li class="pdf-avoid-break" data-v-0befcea5>${ssrInterpolate(b)}</li>`);
            });
            _push(`<!--]--></ul></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.projects.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[10px] font-bold text-[#006a61] uppercase tracking-wider mb-2.5 flex items-center gap-2" data-v-0befcea5><span data-v-0befcea5>Selected Work</span><span class="h-[1px] flex-1 bg-teal-100" data-v-0befcea5></span></h2><div class="space-y-2" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.projects, (p, pIdx) => {
            _push(`<div data-v-0befcea5><h4 class="font-bold text-[10.5px] text-slate-800" data-v-0befcea5>${ssrInterpolate(p.name)}</h4><ul class="text-[9.5px] text-slate-600 space-y-0.5 list-disc" data-v-0befcea5><!--[-->`);
            ssrRenderList(p.bullets, (b, bIdx) => {
              _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
            });
            _push(`<!--]--></ul></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.credentials.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[10px] font-bold text-[#006a61] uppercase tracking-wider mb-2 flex items-center gap-2" data-v-0befcea5><span data-v-0befcea5>Awards &amp; Credentials</span><span class="h-[1px] flex-1 bg-teal-100" data-v-0befcea5></span></h2><ul class="text-[9.5px] text-slate-600 space-y-1 list-disc" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.credentials, (c, idx) => {
            _push(`<li data-v-0befcea5>${ssrInterpolate(c)}</li>`);
          });
          _push(`<!--]--></ul></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(parsed.value.extras, (extra) => {
          _push(`<section data-v-0befcea5><h2 class="text-[10px] font-bold text-[#006a61] uppercase tracking-wider mb-2 flex items-center gap-2" data-v-0befcea5><span data-v-0befcea5>${ssrInterpolate(extra.title)}</span><span class="h-[1px] flex-1 bg-teal-100" data-v-0befcea5></span></h2><div class="space-y-2" data-v-0befcea5><!--[-->`);
          ssrRenderList(extra.items, (item, iIdx) => {
            _push(`<div data-v-0befcea5><h4 class="font-bold text-[10.5px] text-slate-800" data-v-0befcea5>${ssrInterpolate(item.title)}</h4>`);
            if (item.subtitle) {
              _push(`<p class="text-[9px] text-slate-500 mb-0.5" data-v-0befcea5>${ssrInterpolate(item.subtitle)}</p>`);
            } else {
              _push(`<!---->`);
            }
            if (item.bullets.length) {
              _push(`<ul class="text-[9.5px] text-slate-600 space-y-0.5 list-disc" data-v-0befcea5><!--[-->`);
              ssrRenderList(item.bullets, (b, bIdx) => {
                _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
              });
              _push(`<!--]--></ul>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div></section>`);
        });
        _push(`<!--]--></div></div>`);
      } else if (__props.formatId === "the-partner") {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "theme-partner w-full bg-white relative p-8 flex flex-col gap-5 text-slate-800 text-left select-text" }, _attrs))} data-v-0befcea5><header class="text-center flex flex-col items-center gap-2 pt-4" data-v-0befcea5><h1 class="text-2xl font-semibold tracking-wider text-[#091426] serif" data-v-0befcea5>${ssrInterpolate(parsed.value.name)}</h1><p class="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-bold border-y border-slate-200 py-1 w-full max-w-md" data-v-0befcea5>${ssrInterpolate(parsed.value.title)}</p><div class="flex flex-wrap justify-center gap-3 text-[9.5px] text-slate-500 mt-1 font-medium" data-v-0befcea5>`);
        if (parsed.value.location) {
          _push(`<span data-v-0befcea5>${ssrInterpolate(parsed.value.location)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.phone) {
          _push(`<span data-v-0befcea5>${ssrInterpolate(parsed.value.phone)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.email) {
          _push(`<span data-v-0befcea5>${ssrInterpolate(parsed.value.email)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.linkedin || parsed.value.website) {
          _push(`<span class="underline text-slate-700" data-v-0befcea5>${ssrInterpolate(parsed.value.linkedin || parsed.value.website)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></header>`);
        if (parsed.value.summary) {
          _push(`<section class="mt-2" data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] border-b-2 border-[#091426] pb-0.5 mb-2" data-v-0befcea5>Executive Profile</h2><p class="text-[10.5px] leading-relaxed text-slate-600 serif" data-v-0befcea5>${ssrInterpolate(parsed.value.summary)}</p></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.experience.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] border-b-2 border-[#091426] pb-0.5 mb-2.5" data-v-0befcea5>Professional Experience</h2><div class="space-y-4" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.experience, (job, idx) => {
            _push(`<div data-v-0befcea5><div class="flex justify-between items-baseline mb-0.5" data-v-0befcea5><h3 class="text-[11px] font-bold text-slate-800" data-v-0befcea5>${ssrInterpolate(job.title)}</h3><span class="text-[8px] text-slate-400 font-bold uppercase" data-v-0befcea5>${ssrInterpolate(job.dates)}</span></div><p class="text-[9.5px] text-slate-500 font-bold italic mb-1" data-v-0befcea5>${ssrInterpolate(job.company)} `);
            if (job.location) {
              _push(`<span class="text-slate-400 font-normal" data-v-0befcea5>| ${ssrInterpolate(job.location)}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</p><ul class="space-y-0.5 list-disc text-[10px] text-slate-600" data-v-0befcea5><!--[-->`);
            ssrRenderList(job.bullets, (b, bIdx) => {
              _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
            });
            _push(`<!--]--></ul></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.projects.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] border-b-2 border-[#091426] pb-0.5 mb-2.5" data-v-0befcea5>Selected Engagements</h2><div class="space-y-2" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.projects, (p, pIdx) => {
            _push(`<div data-v-0befcea5><h4 class="text-[10.5px] font-bold text-slate-800" data-v-0befcea5>${ssrInterpolate(p.name)}</h4><ul class="space-y-0.5 list-disc text-[9.5px] text-slate-600" data-v-0befcea5><!--[-->`);
            ssrRenderList(p.bullets, (b, bIdx) => {
              _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
            });
            _push(`<!--]--></ul></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="grid grid-cols-2 gap-6" data-v-0befcea5>`);
        if (parsed.value.skills.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] border-b-2 border-[#091426] pb-0.5 mb-2" data-v-0befcea5>Core Expertise</h2><div class="grid grid-cols-2 gap-y-1 gap-x-2" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.skills, (s, idx) => {
            _push(`<div class="flex items-center gap-1.5 text-[9.5px] text-slate-600" data-v-0befcea5><span class="text-[#091426] font-bold" data-v-0befcea5>\u2713</span><span data-v-0befcea5>${ssrInterpolate(s)}</span></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.education.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] border-b-2 border-[#091426] pb-0.5 mb-2" data-v-0befcea5>Education</h2><div class="space-y-2" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.education, (edu, idx) => {
            _push(`<div data-v-0befcea5><h5 class="text-[10px] font-bold text-slate-800" data-v-0befcea5>${ssrInterpolate(edu.school)}</h5><p class="text-[9px] text-slate-500 leading-tight" data-v-0befcea5>${ssrInterpolate(edu.degree)} `);
            if (edu.dates) {
              _push(`<span class="text-slate-400" data-v-0befcea5>| ${ssrInterpolate(edu.dates)}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</p></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.credentials.length) {
          _push(`<section class="col-span-2" data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] border-b-2 border-[#091426] pb-0.5 mb-2" data-v-0befcea5>Credentials</h2><ul class="list-disc text-[9.5px] text-slate-600 space-y-0.5" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.credentials, (c, idx) => {
            _push(`<li data-v-0befcea5>${ssrInterpolate(c)}</li>`);
          });
          _push(`<!--]--></ul></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><!--[-->`);
        ssrRenderList(parsed.value.extras, (extra) => {
          _push(`<section class="preview-extra-section" data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2" data-v-0befcea5>${ssrInterpolate(extra.title)}</h2><div class="space-y-2" data-v-0befcea5><!--[-->`);
          ssrRenderList(extra.items, (item, iIdx) => {
            _push(`<div data-v-0befcea5><h4 class="font-bold text-[10.5px] text-slate-800" data-v-0befcea5>${ssrInterpolate(item.title)}</h4>`);
            if (item.subtitle) {
              _push(`<p class="text-[9px] text-slate-500" data-v-0befcea5>${ssrInterpolate(item.subtitle)}</p>`);
            } else {
              _push(`<!---->`);
            }
            if (item.bullets.length) {
              _push(`<ul class="text-[9.5px] text-slate-600 list-disc space-y-0.5" data-v-0befcea5><!--[-->`);
              ssrRenderList(item.bullets, (b, bIdx) => {
                _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
              });
              _push(`<!--]--></ul>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div></section>`);
        });
        _push(`<!--]--></div>`);
      } else if (__props.formatId === "the-innovator") {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "theme-innovator w-full bg-[#091426] text-white relative p-8 flex flex-col gap-5 text-left select-text" }, _attrs))} data-v-0befcea5><div class="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" data-v-0befcea5></div><div class="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" data-v-0befcea5></div><header class="relative border-b border-teal-500/20 pb-5 z-10" data-v-0befcea5><h1 class="text-3xl font-black tracking-tight text-white uppercase" data-v-0befcea5>${ssrInterpolate(parsed.value.name)}</h1><p class="text-[9.5px] font-bold tracking-[0.2em] text-teal-400 uppercase mt-1" data-v-0befcea5>${ssrInterpolate(parsed.value.title)}</p><div class="flex flex-wrap gap-4 text-[9.5px] text-slate-400 mt-4" data-v-0befcea5>`);
        if (parsed.value.email) {
          _push(`<span data-v-0befcea5>\u2709 ${ssrInterpolate(parsed.value.email)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.phone) {
          _push(`<span data-v-0befcea5>\u260E ${ssrInterpolate(parsed.value.phone)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.location) {
          _push(`<span data-v-0befcea5>\u26B2 ${ssrInterpolate(parsed.value.location)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.linkedin || parsed.value.website) {
          _push(`<span class="text-teal-400" data-v-0befcea5>${ssrInterpolate(parsed.value.linkedin || parsed.value.website)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></header><div class="grid grid-cols-12 gap-5 relative z-10 flex-grow" data-v-0befcea5><section class="col-span-8 flex flex-col gap-4" data-v-0befcea5>`);
        if (parsed.value.summary) {
          _push(`<div data-v-0befcea5><h2 class="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-1.5 select-none" data-v-0befcea5>Innovation Profile</h2><p class="text-[10.5px] leading-relaxed text-slate-300 bg-slate-900/40 p-3 rounded-lg border border-slate-800/60" data-v-0befcea5>${ssrInterpolate(parsed.value.summary)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.experience.length) {
          _push(`<div data-v-0befcea5><h2 class="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-2 select-none" data-v-0befcea5>Professional Experience</h2><div class="space-y-4" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.experience, (job, idx) => {
            _push(`<div class="bg-slate-900/20 border border-slate-800/40 p-3 rounded-xl" data-v-0befcea5><div class="flex justify-between items-baseline mb-1" data-v-0befcea5><h3 class="text-[11px] font-bold text-white" data-v-0befcea5>${ssrInterpolate(job.title)}</h3><span class="text-[8px] text-teal-300 font-bold bg-teal-950/60 border border-teal-500/20 px-1.5 py-0.5 rounded" data-v-0befcea5>${ssrInterpolate(job.dates)}</span></div><p class="text-[9.5px] text-teal-400/90 font-medium mb-2" data-v-0befcea5>${ssrInterpolate(job.company)} `);
            if (job.location) {
              _push(`<span class="text-slate-500" data-v-0befcea5>| ${ssrInterpolate(job.location)}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</p><ul class="space-y-1 pl-1 list-none text-[9.5px] text-slate-300" data-v-0befcea5><!--[-->`);
            ssrRenderList(job.bullets, (b, bIdx) => {
              _push(`<li class="flex gap-2 items-start" data-v-0befcea5><span class="text-teal-400 font-bold mt-0.5 shrink-0" data-v-0befcea5>\xBB</span><p data-v-0befcea5>${ssrInterpolate(b)}</p></li>`);
            });
            _push(`<!--]--></ul></div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.projects.length) {
          _push(`<div data-v-0befcea5><h2 class="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-2 select-none" data-v-0befcea5>Selected Works</h2><div class="grid grid-cols-1 sm:grid-cols-2 gap-2" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.projects, (p, pIdx) => {
            _push(`<div class="p-3 bg-slate-900/40 border border-slate-800/60 rounded-lg" data-v-0befcea5><h4 class="text-[10px] font-bold text-white mb-1" data-v-0befcea5>${ssrInterpolate(p.name)}</h4><!--[-->`);
            ssrRenderList(p.bullets.slice(0, 2), (b, bIdx) => {
              _push(`<p class="text-[9px] text-slate-400 leading-snug" data-v-0befcea5>${ssrInterpolate(b)}</p>`);
            });
            _push(`<!--]--></div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</section><aside class="col-span-4 flex flex-col gap-4" data-v-0befcea5>`);
        if (parsed.value.skills.length) {
          _push(`<section class="bg-slate-900/40 border border-slate-800/80 p-3 rounded-xl" data-v-0befcea5><h2 class="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-2 select-none" data-v-0befcea5>Technologies</h2><div class="flex flex-wrap gap-1.5" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.skills, (s, idx) => {
            _push(`<span class="pdf-avoid-break px-2 py-1 leading-normal bg-slate-950 text-[9px] font-bold text-teal-300 border border-teal-500/20 rounded" data-v-0befcea5>${ssrInterpolate(s)}</span>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.education.length) {
          _push(`<section class="bg-slate-900/40 border border-slate-800/80 p-3 rounded-xl" data-v-0befcea5><h2 class="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-2 select-none" data-v-0befcea5>Education</h2><div class="space-y-2.5" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.education, (edu, idx) => {
            _push(`<div data-v-0befcea5><h5 class="text-[9.5px] font-bold text-white" data-v-0befcea5>${ssrInterpolate(edu.degree)}</h5><p class="text-[8.5px] text-slate-400" data-v-0befcea5>${ssrInterpolate(edu.school)}</p>`);
            if (edu.dates) {
              _push(`<p class="text-[8px] text-teal-300/80" data-v-0befcea5>${ssrInterpolate(edu.dates)}</p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.credentials.length) {
          _push(`<section class="bg-slate-900/40 border border-slate-800/80 p-3 rounded-xl" data-v-0befcea5><h2 class="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-2 select-none" data-v-0befcea5>Verified</h2><ul class="space-y-2 list-none" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.credentials, (c, idx) => {
            _push(`<li class="border-l-2 border-teal-500/40 pl-2 text-[9px] text-slate-300 font-medium" data-v-0befcea5>${ssrInterpolate(c)}</li>`);
          });
          _push(`<!--]--></ul></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</aside></div><!--[-->`);
        ssrRenderList(parsed.value.extras, (extra) => {
          _push(`<section class="preview-extra-section relative z-10 bg-slate-900/40 border border-slate-800/80 p-3 rounded-xl" data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-widest text-teal-400 mb-2 select-none" data-v-0befcea5>${ssrInterpolate(extra.title)}</h2><div class="space-y-2" data-v-0befcea5><!--[-->`);
          ssrRenderList(extra.items, (item, iIdx) => {
            _push(`<div data-v-0befcea5><h4 class="font-bold text-[10.5px] text-white" data-v-0befcea5>${ssrInterpolate(item.title)}</h4>`);
            if (item.subtitle) {
              _push(`<p class="text-[9px] text-slate-400" data-v-0befcea5>${ssrInterpolate(item.subtitle)}</p>`);
            } else {
              _push(`<!---->`);
            }
            if (item.bullets.length) {
              _push(`<ul class="text-[9.5px] text-slate-300 list-disc space-y-0.5" data-v-0befcea5><!--[-->`);
              ssrRenderList(item.bullets, (b, bIdx) => {
                _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
              });
              _push(`<!--]--></ul>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div></section>`);
        });
        _push(`<!--]--></div>`);
      } else if (__props.formatId === "the-digital-nomad") {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "theme-digital-nomad w-full bg-white relative flex flex-row items-stretch text-slate-800 text-left select-text p-0" }, _attrs))} data-v-0befcea5><div class="theme-sidebar w-1/2 p-8 flex flex-col justify-start shrink-0" style="${ssrRenderStyle({ "background-color": "#0b1c30", "color": "#ffffff" })}" data-v-0befcea5><div data-v-0befcea5><h1 class="text-3xl font-black text-white leading-tight uppercase" data-v-0befcea5>${ssrInterpolate(parsed.value.name)}</h1><p class="text-[9.5px] uppercase tracking-[0.25em] text-[#ff4e69] font-bold mt-1.5" data-v-0befcea5>${ssrInterpolate(parsed.value.title)}</p><div class="mt-6 space-y-4" data-v-0befcea5>`);
        if (parsed.value.summary) {
          _push(`<section data-v-0befcea5><h3 class="text-[9.5px] uppercase tracking-widest text-[#ff4e69] font-bold mb-2.5" data-v-0befcea5>Nomad Profile</h3><p class="text-[10.5px] leading-relaxed text-slate-300 opacity-90 max-w-sm" data-v-0befcea5>${ssrInterpolate(parsed.value.summary)}</p></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<section data-v-0befcea5><h3 class="text-[9.5px] uppercase tracking-widest text-[#ff4e69] font-bold mb-2.5" data-v-0befcea5>Contact</h3><ul class="list-none space-y-2 text-[9.5px] text-slate-300 pl-0" style="${ssrRenderStyle({ "list-style": "none" })}" data-v-0befcea5>`);
        if (parsed.value.email) {
          _push(`<li class="break-all leading-normal" style="${ssrRenderStyle({ "list-style": "none", "overflow": "visible", "height": "auto" })}" data-v-0befcea5>\u2709 ${ssrInterpolate(parsed.value.email)}</li>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.phone) {
          _push(`<li class="leading-normal" style="${ssrRenderStyle({ "list-style": "none", "overflow": "visible", "height": "auto" })}" data-v-0befcea5>\u260E ${ssrInterpolate(parsed.value.phone)}</li>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.location) {
          _push(`<li class="break-words leading-normal" style="${ssrRenderStyle({ "list-style": "none", "overflow": "visible", "height": "auto" })}" data-v-0befcea5>\u26B2 ${ssrInterpolate(parsed.value.location)}</li>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.linkedin || parsed.value.website) {
          _push(`<li class="text-[#ff4e69] font-semibold break-all leading-normal" style="${ssrRenderStyle({ "list-style": "none", "overflow": "visible", "height": "auto" })}" data-v-0befcea5>${ssrInterpolate(parsed.value.linkedin || parsed.value.website)}</li>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</ul></section>`);
        if (parsed.value.skills.length) {
          _push(`<section data-v-0befcea5><h3 class="text-[9.5px] uppercase tracking-widest text-[#ff4e69] font-bold mb-2.5" data-v-0befcea5>Skills</h3><div class="flex flex-wrap gap-1.5" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.skills, (s, idx) => {
            _push(`<span class="px-2 py-1 leading-normal bg-white/10 border border-white/15 text-[9px] font-semibold text-white rounded" data-v-0befcea5>${ssrInterpolate(s)}</span>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div><div class="w-1/2 bg-white p-8 flex flex-col gap-4 min-w-0" data-v-0befcea5>`);
        if (parsed.value.experience.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-widest text-[#091426] border-b border-slate-200 pb-1 mb-3" data-v-0befcea5>Experience</h2><div class="space-y-4" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.experience, (job, idx) => {
            _push(`<div data-v-0befcea5><div class="flex justify-between items-baseline mb-0.5" data-v-0befcea5><h4 class="font-bold text-[11px] text-slate-800" data-v-0befcea5>${ssrInterpolate(job.title)}</h4><span class="text-[7.5px] text-[#ff4e69] font-bold uppercase" data-v-0befcea5>${ssrInterpolate(job.dates)}</span></div><p class="text-[#0b1c30] font-semibold text-[9.5px] mb-1.5" data-v-0befcea5>${ssrInterpolate(job.company)} `);
            if (job.location) {
              _push(`<span class="text-slate-400 font-normal" data-v-0befcea5>| ${ssrInterpolate(job.location)}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</p><ul class="text-[9.5px] text-slate-600 space-y-1 list-disc" data-v-0befcea5><!--[-->`);
            ssrRenderList(job.bullets, (b, bIdx) => {
              _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
            });
            _push(`<!--]--></ul></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.projects.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-widest text-[#091426] border-b border-slate-200 pb-1 mb-3" data-v-0befcea5>Selected Work</h2><div class="space-y-3" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.projects, (p, pIdx) => {
            _push(`<div data-v-0befcea5><h4 class="font-bold text-[10.5px] text-slate-800" data-v-0befcea5>${ssrInterpolate(p.name)}</h4><ul class="text-[9.5px] text-slate-600 space-y-0.5 list-disc" data-v-0befcea5><!--[-->`);
            ssrRenderList(p.bullets, (b, bIdx) => {
              _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
            });
            _push(`<!--]--></ul></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.skills.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-widest text-[#091426] border-b border-slate-200 pb-1 mb-2.5" data-v-0befcea5>Skills</h2><div class="flex flex-wrap gap-1" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.skills, (s, idx) => {
            _push(`<span class="pdf-avoid-break px-2 py-1 leading-normal border border-[#0b1c30] rounded-full text-[9px] text-[#0b1c30] font-bold" data-v-0befcea5>${ssrInterpolate(s)}</span>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.education.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-widest text-[#091426] border-b border-slate-200 pb-1 mb-2" data-v-0befcea5>Education</h2><div class="space-y-2" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.education, (edu, idx) => {
            _push(`<div class="text-[9.5px]" data-v-0befcea5><p class="font-bold text-slate-800" data-v-0befcea5>${ssrInterpolate(edu.degree)}</p><p class="text-slate-500" data-v-0befcea5>${ssrInterpolate(edu.school)} `);
            if (edu.dates) {
              _push(`<span class="text-slate-400" data-v-0befcea5>, ${ssrInterpolate(edu.dates)}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</p></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.credentials.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-widest text-[#091426] border-b border-slate-200 pb-1 mb-2" data-v-0befcea5>Credentials</h2><ul class="text-[9px] text-slate-600 space-y-1 list-disc" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.credentials, (c, idx) => {
            _push(`<li data-v-0befcea5>${ssrInterpolate(c)}</li>`);
          });
          _push(`<!--]--></ul></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(parsed.value.extras, (extra) => {
          _push(`<section class="preview-extra-section" data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2" data-v-0befcea5>${ssrInterpolate(extra.title)}</h2><div class="space-y-2" data-v-0befcea5><!--[-->`);
          ssrRenderList(extra.items, (item, iIdx) => {
            _push(`<div data-v-0befcea5><h4 class="font-bold text-[10.5px] text-slate-800" data-v-0befcea5>${ssrInterpolate(item.title)}</h4>`);
            if (item.subtitle) {
              _push(`<p class="text-[9px] text-slate-500" data-v-0befcea5>${ssrInterpolate(item.subtitle)}</p>`);
            } else {
              _push(`<!---->`);
            }
            if (item.bullets.length) {
              _push(`<ul class="text-[9.5px] text-slate-600 list-disc space-y-0.5" data-v-0befcea5><!--[-->`);
              ssrRenderList(item.bullets, (b, bIdx) => {
                _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
              });
              _push(`<!--]--></ul>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div></section>`);
        });
        _push(`<!--]--></div></div>`);
      } else if (__props.formatId === "the-social-media-pro") {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "theme-social-media-pro w-full bg-white relative flex flex-col text-slate-800 text-left select-text p-0" }, _attrs))} data-v-0befcea5><div class="h-28 bg-gradient-to-r from-[#091426] via-[#006a61] to-[#ff4e69] relative shrink-0" data-v-0befcea5></div><div class="px-7 relative flex-grow flex flex-col pb-8" data-v-0befcea5><div class="flex flex-col sm:flex-row justify-between items-start gap-4 -mt-10 mb-5 relative z-10" data-v-0befcea5><div class="w-20 h-20 bg-slate-100 rounded-full border-4 border-white shadow-md flex items-center justify-center shrink-0" data-v-0befcea5><span class="text-slate-400 text-xs select-none" data-v-0befcea5>\u{1F4F7} Photo</span></div><div class="flex-grow pt-10 sm:pt-12" data-v-0befcea5><h1 class="text-2xl font-extrabold text-[#091426] tracking-tight leading-none" data-v-0befcea5>${ssrInterpolate(parsed.value.name)}</h1><p class="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1" data-v-0befcea5>${ssrInterpolate(parsed.value.title)}</p></div><div class="sm:text-right pt-2 sm:pt-12 text-[9.5px] text-slate-500 font-medium space-y-0.5" data-v-0befcea5>`);
        if (parsed.value.email) {
          _push(`<p data-v-0befcea5>\u2709 ${ssrInterpolate(parsed.value.email)}</p>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.phone) {
          _push(`<p data-v-0befcea5>\u260E ${ssrInterpolate(parsed.value.phone)}</p>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.location) {
          _push(`<p data-v-0befcea5>\u26B2 ${ssrInterpolate(parsed.value.location)}</p>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.linkedin || parsed.value.website) {
          _push(`<p class="text-[#006a61] font-semibold" data-v-0befcea5>${ssrInterpolate(parsed.value.linkedin || parsed.value.website)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><div class="grid grid-cols-12 gap-5 flex-grow" data-v-0befcea5><section class="col-span-8 flex flex-col gap-4" data-v-0befcea5>`);
        if (parsed.value.summary) {
          _push(`<div data-v-0befcea5><h3 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-1.5" data-v-0befcea5>Bio</h3><p class="text-[10.5px] leading-relaxed text-slate-600" data-v-0befcea5>${ssrInterpolate(parsed.value.summary)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.experience.length) {
          _push(`<div data-v-0befcea5><h3 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2" data-v-0befcea5>Campaign Experience</h3><div class="space-y-3.5" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.experience, (job, idx) => {
            _push(`<div data-v-0befcea5><div class="flex justify-between items-baseline mb-0.5" data-v-0befcea5><h4 class="text-[10.5px] font-bold text-slate-800" data-v-0befcea5>${ssrInterpolate(job.title)}</h4><span class="text-[7.5px] text-[#ff4e69] font-bold uppercase" data-v-0befcea5>${ssrInterpolate(job.dates)}</span></div><p class="text-[9.5px] text-[#006a61] font-bold mb-1" data-v-0befcea5>${ssrInterpolate(job.company)} `);
            if (job.location) {
              _push(`<span class="text-slate-400 font-normal" data-v-0befcea5>| ${ssrInterpolate(job.location)}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</p><ul class="space-y-0.5 list-disc text-[9.5px] text-slate-600" data-v-0befcea5><!--[-->`);
            ssrRenderList(job.bullets, (b, bIdx) => {
              _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
            });
            _push(`<!--]--></ul></div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.projects.length) {
          _push(`<div data-v-0befcea5><h3 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2" data-v-0befcea5>Featured Work</h3><div class="space-y-2.5" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.projects, (p, pIdx) => {
            _push(`<div data-v-0befcea5><h4 class="text-[10.5px] font-bold text-slate-800" data-v-0befcea5>${ssrInterpolate(p.name)}</h4><ul class="space-y-0.5 list-disc text-[9.5px] text-slate-600" data-v-0befcea5><!--[-->`);
            ssrRenderList(p.bullets, (b, bIdx) => {
              _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
            });
            _push(`<!--]--></ul></div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</section><aside class="col-span-4 flex flex-col gap-4" data-v-0befcea5>`);
        if (parsed.value.skills.length) {
          _push(`<section data-v-0befcea5><h3 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2" data-v-0befcea5>Capabilities</h3><div class="flex flex-wrap gap-1" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.skills, (s, idx) => {
            _push(`<span class="pdf-avoid-break px-2 py-1 leading-normal bg-slate-50 border border-slate-200 text-[9px] font-semibold text-slate-700 rounded" data-v-0befcea5>${ssrInterpolate(s)}</span>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.education.length) {
          _push(`<section data-v-0befcea5><h3 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2" data-v-0befcea5>Education</h3><div class="space-y-2 text-[9.5px]" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.education, (edu, idx) => {
            _push(`<div data-v-0befcea5><p class="font-bold text-slate-800 leading-snug" data-v-0befcea5>${ssrInterpolate(edu.school)}</p><p class="text-slate-500 leading-tight" data-v-0befcea5>${ssrInterpolate(edu.degree)}</p></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.credentials.length) {
          _push(`<section data-v-0befcea5><h3 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2" data-v-0befcea5>Highlights</h3><ul class="space-y-1 text-[9px] text-slate-600 list-disc" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.credentials, (c, idx) => {
            _push(`<li data-v-0befcea5>${ssrInterpolate(c)}</li>`);
          });
          _push(`<!--]--></ul></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</aside></div></div><div class="h-1 bg-gradient-to-r from-[#091426] via-[#006a61] to-[#ff4e69] shrink-0" data-v-0befcea5></div><!--[-->`);
        ssrRenderList(parsed.value.extras, (extra) => {
          _push(`<section class="preview-extra-section" data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2" data-v-0befcea5>${ssrInterpolate(extra.title)}</h2><div class="space-y-2" data-v-0befcea5><!--[-->`);
          ssrRenderList(extra.items, (item, iIdx) => {
            _push(`<div data-v-0befcea5><h4 class="font-bold text-[10.5px] text-slate-800" data-v-0befcea5>${ssrInterpolate(item.title)}</h4>`);
            if (item.subtitle) {
              _push(`<p class="text-[9px] text-slate-500" data-v-0befcea5>${ssrInterpolate(item.subtitle)}</p>`);
            } else {
              _push(`<!---->`);
            }
            if (item.bullets.length) {
              _push(`<ul class="text-[9.5px] text-slate-600 list-disc space-y-0.5" data-v-0befcea5><!--[-->`);
              ssrRenderList(item.bullets, (b, bIdx) => {
                _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
              });
              _push(`<!--]--></ul>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div></section>`);
        });
        _push(`<!--]--></div>`);
      } else if (__props.formatId === "the-brand-architect") {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "theme-brand-architect w-full bg-white relative p-8 flex flex-col gap-5 text-slate-800 text-left select-text overflow-hidden" }, _attrs))} data-v-0befcea5><div class="absolute -top-6 -left-10 text-[160px] font-extrabold text-slate-50 opacity-[0.45] select-none pointer-events-none serif" data-v-0befcea5>${ssrInterpolate(parsed.value.name ? parsed.value.name.replace(/^Dr.s*/i, "").charAt(0).toUpperCase() : "M")}</div><header class="relative z-10 flex flex-col md:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-5" data-v-0befcea5><div data-v-0befcea5><h1 class="text-2xl font-bold tracking-tight text-[#091426] uppercase serif" data-v-0befcea5>${ssrInterpolate(parsed.value.name)}</h1><p class="text-[9px] uppercase tracking-[0.25em] text-[#006a61] bg-[#091426] text-white px-2 py-0.5 inline-block font-bold mt-2" data-v-0befcea5>${ssrInterpolate(parsed.value.title)}</p></div><div class="flex flex-col gap-0.5 text-[9.5px] text-slate-500 font-medium border-l border-slate-300 pl-3 md:pl-0 md:border-l-0 md:border-r md:pr-3 md:text-right" data-v-0befcea5>`);
        if (parsed.value.email) {
          _push(`<span data-v-0befcea5>${ssrInterpolate(parsed.value.email)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.phone) {
          _push(`<span data-v-0befcea5>${ssrInterpolate(parsed.value.phone)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.location) {
          _push(`<span data-v-0befcea5>${ssrInterpolate(parsed.value.location)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.linkedin || parsed.value.website) {
          _push(`<span class="underline text-slate-600" data-v-0befcea5>${ssrInterpolate(parsed.value.linkedin || parsed.value.website)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></header><div class="relative z-10 flex flex-col gap-5 flex-grow" data-v-0befcea5>`);
        if (parsed.value.summary) {
          _push(`<section data-v-0befcea5><h2 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2 select-none" data-v-0befcea5>Profile</h2><p class="text-[10.5px] leading-relaxed text-slate-600 font-medium" data-v-0befcea5>${ssrInterpolate(parsed.value.summary)}</p></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.experience.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-3 select-none" data-v-0befcea5>Experience</h2><div class="space-y-4" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.experience, (job, idx) => {
            _push(`<div data-v-0befcea5><div class="flex justify-between items-baseline mb-0.5" data-v-0befcea5><h4 class="text-[11px] font-bold text-slate-800 leading-snug" data-v-0befcea5>${ssrInterpolate(job.title)}</h4><span class="text-[8px] text-slate-400 font-bold uppercase" data-v-0befcea5>${ssrInterpolate(job.dates)}</span></div><p class="text-[9px] text-[#006a61] font-bold uppercase tracking-wider mb-1.5 leading-snug" data-v-0befcea5>${ssrInterpolate(job.company)} `);
            if (job.location) {
              _push(`<span class="text-slate-400 font-normal" data-v-0befcea5>| ${ssrInterpolate(job.location)}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</p><ul class="space-y-1 list-none pl-1 text-[9.5px] text-slate-600" data-v-0befcea5><!--[-->`);
            ssrRenderList(job.bullets, (b, bIdx) => {
              _push(`<li class="flex gap-2 items-start" data-v-0befcea5><span class="text-[#006a61] font-bold mt-0.5" data-v-0befcea5>\u25AA</span><p data-v-0befcea5>${ssrInterpolate(b)}</p></li>`);
            });
            _push(`<!--]--></ul></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.projects.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-3 select-none" data-v-0befcea5>Selected Work</h2><div class="space-y-2.5" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.projects, (p, pIdx) => {
            _push(`<div data-v-0befcea5><h4 class="text-[10.5px] font-bold text-slate-800" data-v-0befcea5>${ssrInterpolate(p.name)}</h4><ul class="text-[9.5px] text-slate-600 space-y-0.5 list-disc" data-v-0befcea5><!--[-->`);
            ssrRenderList(p.bullets, (b, bIdx) => {
              _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
            });
            _push(`<!--]--></ul></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="grid grid-cols-2 gap-5" data-v-0befcea5>`);
        if (parsed.value.skills.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2 select-none" data-v-0befcea5>Expertise</h2><div class="flex flex-wrap gap-1" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.skills, (s, idx) => {
            _push(`<span class="pdf-avoid-break px-2.5 py-1 leading-normal bg-slate-50 border border-slate-200 text-[9px] font-bold text-[#091426] uppercase rounded" data-v-0befcea5>${ssrInterpolate(s)}</span>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.education.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2 select-none" data-v-0befcea5>Education</h2><div class="space-y-2" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.education, (edu, idx) => {
            _push(`<div class="text-[9.5px]" data-v-0befcea5><h5 class="font-bold text-slate-800 leading-snug" data-v-0befcea5>${ssrInterpolate(edu.school)}</h5><p class="text-slate-500 leading-tight" data-v-0befcea5>${ssrInterpolate(edu.degree)} `);
            if (edu.dates) {
              _push(`<span class="text-slate-400" data-v-0befcea5>, ${ssrInterpolate(edu.dates)}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</p></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.credentials.length) {
          _push(`<section class="col-span-2" data-v-0befcea5><h2 class="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2 select-none" data-v-0befcea5>Credentials</h2><ul class="list-disc text-[9.5px] text-slate-600 space-y-0.5" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.credentials, (c, idx) => {
            _push(`<li data-v-0befcea5>${ssrInterpolate(c)}</li>`);
          });
          _push(`<!--]--></ul></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><!--[-->`);
        ssrRenderList(parsed.value.extras, (extra) => {
          _push(`<section class="preview-extra-section" data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2" data-v-0befcea5>${ssrInterpolate(extra.title)}</h2><div class="space-y-2" data-v-0befcea5><!--[-->`);
          ssrRenderList(extra.items, (item, iIdx) => {
            _push(`<div data-v-0befcea5><h4 class="font-bold text-[10.5px] text-slate-800" data-v-0befcea5>${ssrInterpolate(item.title)}</h4>`);
            if (item.subtitle) {
              _push(`<p class="text-[9px] text-slate-500" data-v-0befcea5>${ssrInterpolate(item.subtitle)}</p>`);
            } else {
              _push(`<!---->`);
            }
            if (item.bullets.length) {
              _push(`<ul class="text-[9.5px] text-slate-600 list-disc space-y-0.5" data-v-0befcea5><!--[-->`);
              ssrRenderList(item.bullets, (b, bIdx) => {
                _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
              });
              _push(`<!--]--></ul>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div></section>`);
        });
        _push(`<!--]--></div>`);
      } else if (__props.formatId === "the-typographer") {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "theme-typographer w-full bg-white relative p-8 flex flex-col gap-4 text-slate-800 text-left select-text" }, _attrs))} data-v-0befcea5><header class="grid grid-cols-12 border-b-2 border-slate-900 pb-5" data-v-0befcea5><div class="col-span-8" data-v-0befcea5><h1 class="text-3xl font-black tracking-tighter text-slate-900 leading-[0.95] uppercase break-words" data-v-0befcea5>${ssrInterpolate(parsed.value.name)}</h1><p class="text-[9.5px] font-bold uppercase tracking-widest text-[#006a61] mt-2 select-none" data-v-0befcea5>${ssrInterpolate(parsed.value.title)}</p></div><div class="col-span-4 text-right text-[9.5px] text-slate-500 font-medium space-y-0.5" data-v-0befcea5>`);
        if (parsed.value.email) {
          _push(`<p data-v-0befcea5>${ssrInterpolate(parsed.value.email)}</p>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.phone) {
          _push(`<p data-v-0befcea5>${ssrInterpolate(parsed.value.phone)}</p>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.location) {
          _push(`<p data-v-0befcea5>${ssrInterpolate(parsed.value.location)}</p>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.linkedin || parsed.value.website) {
          _push(`<p class="underline text-slate-800" data-v-0befcea5>${ssrInterpolate(parsed.value.linkedin || parsed.value.website)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></header><div class="grid grid-cols-12 gap-5 flex-grow" data-v-0befcea5><section class="col-span-8 flex flex-col gap-5 border-r border-slate-200 pr-5" data-v-0befcea5>`);
        if (parsed.value.summary) {
          _push(`<div data-v-0befcea5><h2 class="text-[9.5px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2 select-none" data-v-0befcea5>Profile Summary</h2><p class="text-[10px] leading-relaxed text-slate-600 serif" data-v-0befcea5>${ssrInterpolate(parsed.value.summary)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.experience.length) {
          _push(`<div data-v-0befcea5><h2 class="text-[9.5px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-3 select-none" data-v-0befcea5>Experience Timeline</h2><div class="space-y-4" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.experience, (job, idx) => {
            _push(`<div data-v-0befcea5><div class="flex justify-between items-baseline mb-0.5" data-v-0befcea5><h3 class="text-[10.5px] font-extrabold text-slate-900 uppercase tracking-tight" data-v-0befcea5>${ssrInterpolate(job.title)}</h3><span class="text-[7.5px] text-slate-400 font-extrabold uppercase" data-v-0befcea5>${ssrInterpolate(job.dates)}</span></div><p class="text-[9px] text-[#006a61] font-bold uppercase tracking-wider mb-1.5" data-v-0befcea5>${ssrInterpolate(job.company)} `);
            if (job.location) {
              _push(`<span class="text-slate-400 font-normal" data-v-0befcea5>| ${ssrInterpolate(job.location)}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</p><ul class="space-y-1 list-disc text-[9.5px] text-slate-600" data-v-0befcea5><!--[-->`);
            ssrRenderList(job.bullets, (b, bIdx) => {
              _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
            });
            _push(`<!--]--></ul></div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.projects.length) {
          _push(`<div data-v-0befcea5><h2 class="text-[9.5px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-3 select-none" data-v-0befcea5>Selected Work</h2><div class="space-y-3" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.projects, (p, pIdx) => {
            _push(`<div data-v-0befcea5><h4 class="text-[10.5px] font-extrabold text-slate-900 uppercase tracking-tight" data-v-0befcea5>${ssrInterpolate(p.name)}</h4><ul class="space-y-1 list-disc text-[9.5px] text-slate-600" data-v-0befcea5><!--[-->`);
            ssrRenderList(p.bullets, (b, bIdx) => {
              _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
            });
            _push(`<!--]--></ul></div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</section><aside class="col-span-4 flex flex-col gap-5" data-v-0befcea5>`);
        if (parsed.value.skills.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[9.5px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2 select-none" data-v-0befcea5>Core Stack</h2><ul class="space-y-1 font-bold text-[9px] text-slate-700 uppercase tracking-wider pl-1 list-none" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.skills, (s, idx) => {
            _push(`<li class="flex gap-1.5 items-center" data-v-0befcea5><span class="w-1.5 h-1.5 bg-slate-900 rounded-full shrink-0" data-v-0befcea5></span><span data-v-0befcea5>${ssrInterpolate(s)}</span></li>`);
          });
          _push(`<!--]--></ul></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.education.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[9.5px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2 select-none" data-v-0befcea5>Academic</h2><div class="space-y-2.5 text-[9px]" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.education, (edu, idx) => {
            _push(`<div data-v-0befcea5><p class="font-extrabold text-slate-900 uppercase leading-snug" data-v-0befcea5>${ssrInterpolate(edu.school)}</p><p class="text-slate-500 leading-tight" data-v-0befcea5>${ssrInterpolate(edu.degree)}</p></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.credentials.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[9.5px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2 select-none" data-v-0befcea5>Credentials</h2><ul class="space-y-1 text-[9px] text-slate-600 list-disc" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.credentials, (c, idx) => {
            _push(`<li data-v-0befcea5>${ssrInterpolate(c)}</li>`);
          });
          _push(`<!--]--></ul></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</aside></div><!--[-->`);
        ssrRenderList(parsed.value.extras, (extra) => {
          _push(`<section class="preview-extra-section" data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2" data-v-0befcea5>${ssrInterpolate(extra.title)}</h2><div class="space-y-2" data-v-0befcea5><!--[-->`);
          ssrRenderList(extra.items, (item, iIdx) => {
            _push(`<div data-v-0befcea5><h4 class="font-bold text-[10.5px] text-slate-800" data-v-0befcea5>${ssrInterpolate(item.title)}</h4>`);
            if (item.subtitle) {
              _push(`<p class="text-[9px] text-slate-500" data-v-0befcea5>${ssrInterpolate(item.subtitle)}</p>`);
            } else {
              _push(`<!---->`);
            }
            if (item.bullets.length) {
              _push(`<ul class="text-[9.5px] text-slate-600 list-disc space-y-0.5" data-v-0befcea5><!--[-->`);
              ssrRenderList(item.bullets, (b, bIdx) => {
                _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
              });
              _push(`<!--]--></ul>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div></section>`);
        });
        _push(`<!--]--></div>`);
      } else if (__props.formatId === "the-researcher" || __props.formatId === "the-researcher-updated") {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "theme-researcher w-full bg-white relative p-8 flex flex-col gap-5 text-slate-800 text-left select-text" }, _attrs))} data-v-0befcea5><header class="text-center mb-4" data-v-0befcea5><h1 class="text-xl font-bold tracking-wide text-slate-900 serif" data-v-0befcea5>${ssrInterpolate(parsed.value.name)}</h1><div class="flex flex-wrap justify-center gap-x-3 gap-y-0.5 text-[9.5px] text-slate-500 mt-1.5 font-medium" data-v-0befcea5>`);
        if (parsed.value.email) {
          _push(`<span data-v-0befcea5>${ssrInterpolate(parsed.value.email)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.phone) {
          _push(`<span data-v-0befcea5>${ssrInterpolate(parsed.value.phone)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.location) {
          _push(`<span data-v-0befcea5>${ssrInterpolate(parsed.value.location)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.linkedin || parsed.value.website) {
          _push(`<span class="underline text-slate-600" data-v-0befcea5>${ssrInterpolate(parsed.value.linkedin || parsed.value.website)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><p class="text-[9.5px] uppercase tracking-wider text-slate-400 font-bold mt-2 select-none" data-v-0befcea5>${ssrInterpolate(parsed.value.title)}</p></header>`);
        if (parsed.value.summary) {
          _push(`<section data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2 select-none" data-v-0befcea5>Research Profile</h2><p class="text-[10px] leading-relaxed text-slate-600 serif" data-v-0befcea5>${ssrInterpolate(parsed.value.summary)}</p></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.experience.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2.5 select-none" data-v-0befcea5>Academic Appointments</h2><div class="space-y-4" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.experience, (job, idx) => {
            _push(`<div data-v-0befcea5><div class="flex justify-between items-baseline mb-0.5" data-v-0befcea5><h3 class="text-[10.5px] font-bold text-slate-800" data-v-0befcea5>${ssrInterpolate(job.title)}</h3><span class="text-[8px] text-slate-400 font-bold uppercase" data-v-0befcea5>${ssrInterpolate(job.dates)}</span></div><p class="text-[9px] text-[#006a61] font-bold mb-1 leading-snug" data-v-0befcea5>${ssrInterpolate(job.company)} `);
            if (job.location) {
              _push(`<span class="text-slate-400 font-normal" data-v-0befcea5>| ${ssrInterpolate(job.location)}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</p><ul class="space-y-0.5 list-disc text-[9.5px] text-slate-600 leading-normal" data-v-0befcea5><!--[-->`);
            ssrRenderList(job.bullets, (b, bIdx) => {
              _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
            });
            _push(`<!--]--></ul></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.projects.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2.5 select-none" data-v-0befcea5>Projects &amp; Publications</h2><div class="space-y-2.5" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.projects, (p, pIdx) => {
            _push(`<div data-v-0befcea5><h4 class="text-[10.5px] font-bold text-slate-800" data-v-0befcea5>${ssrInterpolate(p.name)}</h4><ul class="space-y-0.5 list-disc text-[9.5px] text-slate-600" data-v-0befcea5><!--[-->`);
            ssrRenderList(p.bullets, (b, bIdx) => {
              _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
            });
            _push(`<!--]--></ul></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.credentials.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2 select-none" data-v-0befcea5>Credentials</h2><ul class="list-disc text-[9.5px] text-slate-600 space-y-0.5" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.credentials, (c, idx) => {
            _push(`<li data-v-0befcea5>${ssrInterpolate(c)}</li>`);
          });
          _push(`<!--]--></ul></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="grid grid-cols-2 gap-5" data-v-0befcea5>`);
        if (parsed.value.education.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[9.5px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2 select-none" data-v-0befcea5>Education</h2><div class="space-y-2 text-[9px]" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.education, (edu, idx) => {
            _push(`<div data-v-0befcea5><p class="font-bold text-slate-800 leading-snug" data-v-0befcea5>${ssrInterpolate(edu.school)}</p><p class="text-slate-500 leading-tight" data-v-0befcea5>${ssrInterpolate(edu.degree)} `);
            if (edu.dates) {
              _push(`<span class="text-slate-400" data-v-0befcea5>, ${ssrInterpolate(edu.dates)}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</p></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.skills.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[9.5px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2 select-none" data-v-0befcea5>Fields &amp; Methodologies</h2><div class="flex flex-wrap gap-1" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.skills, (s, idx) => {
            _push(`<span class="pdf-avoid-break px-2 py-1 leading-normal bg-slate-50 border border-slate-200 text-[9px] text-slate-700 rounded" data-v-0befcea5>${ssrInterpolate(s)}</span>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><!--[-->`);
        ssrRenderList(parsed.value.extras, (extra) => {
          _push(`<section class="preview-extra-section" data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2" data-v-0befcea5>${ssrInterpolate(extra.title)}</h2><div class="space-y-2" data-v-0befcea5><!--[-->`);
          ssrRenderList(extra.items, (item, iIdx) => {
            _push(`<div data-v-0befcea5><h4 class="font-bold text-[10.5px] text-slate-800" data-v-0befcea5>${ssrInterpolate(item.title)}</h4>`);
            if (item.subtitle) {
              _push(`<p class="text-[9px] text-slate-500" data-v-0befcea5>${ssrInterpolate(item.subtitle)}</p>`);
            } else {
              _push(`<!---->`);
            }
            if (item.bullets.length) {
              _push(`<ul class="text-[9.5px] text-slate-600 list-disc space-y-0.5" data-v-0befcea5><!--[-->`);
              ssrRenderList(item.bullets, (b, bIdx) => {
                _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
              });
              _push(`<!--]--></ul>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div></section>`);
        });
        _push(`<!--]--></div>`);
      } else if (__props.formatId === "the-engineer") {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "theme-engineer w-full bg-white relative flex flex-row items-stretch text-slate-800 text-left select-text p-0 ring-1 ring-slate-200/50" }, _attrs))} data-v-0befcea5><div class="flex-[2] p-6 border-r border-slate-200/80 flex flex-col gap-5 min-w-0" data-v-0befcea5><header data-v-0befcea5><h1 class="text-2xl font-extrabold text-slate-900 uppercase tracking-tight leading-none" data-v-0befcea5>${ssrInterpolate(parsed.value.name)}</h1><p class="text-[9.5px] font-bold uppercase tracking-widest text-[#006a61] mt-1.5 pb-2 border-b border-slate-100" data-v-0befcea5>${ssrInterpolate(parsed.value.title)}</p><div class="flex flex-wrap gap-3 text-[9.5px] text-slate-500 mt-2 font-medium" data-v-0befcea5>`);
        if (parsed.value.email) {
          _push(`<span data-v-0befcea5>\u2709 ${ssrInterpolate(parsed.value.email)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.location) {
          _push(`<span data-v-0befcea5>\u26B2 ${ssrInterpolate(parsed.value.location)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.linkedin || parsed.value.website) {
          _push(`<span class="text-[#006a61]" data-v-0befcea5>${ssrInterpolate(parsed.value.linkedin || parsed.value.website)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></header>`);
        if (parsed.value.summary) {
          _push(`<section data-v-0befcea5><h2 class="text-[9.5px] font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-0.5 mb-2 select-none" data-v-0befcea5>Profile</h2><p class="text-[10px] leading-relaxed text-slate-600" data-v-0befcea5>${ssrInterpolate(parsed.value.summary)}</p></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.experience.length) {
          _push(`<section class="flex-grow" data-v-0befcea5><h2 class="text-[9.5px] font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-0.5 mb-3 select-none" data-v-0befcea5>Engineering Experience</h2><div class="space-y-4" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.experience, (job, idx) => {
            _push(`<div data-v-0befcea5><div class="flex justify-between items-baseline mb-0.5" data-v-0befcea5><h4 class="font-bold text-[10.5px] text-slate-800" data-v-0befcea5>${ssrInterpolate(job.title)}</h4><span class="text-[7.5px] text-slate-400 font-bold bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded" data-v-0befcea5>${ssrInterpolate(job.dates)}</span></div><p class="text-[9px] text-[#006a61] font-bold mb-1.5" data-v-0befcea5>${ssrInterpolate(job.company)} `);
            if (job.location) {
              _push(`<span class="text-slate-400 font-normal" data-v-0befcea5>| ${ssrInterpolate(job.location)}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</p><ul class="space-y-0.5 list-none pl-0.5 text-[9.5px] text-slate-600 leading-normal" data-v-0befcea5><!--[-->`);
            ssrRenderList(job.bullets, (b, bIdx) => {
              _push(`<li class="flex gap-2 items-start" data-v-0befcea5><span class="text-slate-400 mt-1 shrink-0 font-bold" data-v-0befcea5>\u25AA</span><p data-v-0befcea5>${ssrInterpolate(b)}</p></li>`);
            });
            _push(`<!--]--></ul></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.projects.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[9.5px] font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-0.5 mb-3 select-none" data-v-0befcea5>Selected Projects</h2><div class="space-y-3" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.projects, (p, pIdx) => {
            _push(`<div data-v-0befcea5><h4 class="font-bold text-[10.5px] text-slate-800" data-v-0befcea5>${ssrInterpolate(p.name)}</h4><ul class="space-y-0.5 list-disc text-[9.5px] text-slate-600" data-v-0befcea5><!--[-->`);
            ssrRenderList(p.bullets, (b, bIdx) => {
              _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
            });
            _push(`<!--]--></ul></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(parsed.value.extras, (extra) => {
          _push(`<section class="preview-extra-section" data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2" data-v-0befcea5>${ssrInterpolate(extra.title)}</h2><div class="space-y-2" data-v-0befcea5><!--[-->`);
          ssrRenderList(extra.items, (item, iIdx) => {
            _push(`<div data-v-0befcea5><h4 class="font-bold text-[10.5px] text-slate-800" data-v-0befcea5>${ssrInterpolate(item.title)}</h4>`);
            if (item.subtitle) {
              _push(`<p class="text-[9px] text-slate-500" data-v-0befcea5>${ssrInterpolate(item.subtitle)}</p>`);
            } else {
              _push(`<!---->`);
            }
            if (item.bullets.length) {
              _push(`<ul class="text-[9.5px] text-slate-600 list-disc space-y-0.5" data-v-0befcea5><!--[-->`);
              ssrRenderList(item.bullets, (b, bIdx) => {
                _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
              });
              _push(`<!--]--></ul>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div></section>`);
        });
        _push(`<!--]--></div><div class="theme-sidebar flex-1 bg-slate-50/50 p-6 flex flex-col gap-5 shrink-0" data-v-0befcea5>`);
        if (parsed.value.skills.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[9.5px] font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-0.5 mb-2.5 select-none" data-v-0befcea5>Stack &amp; Tools</h2><div class="flex flex-wrap gap-1" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.skills, (s, idx) => {
            _push(`<span class="pdf-avoid-break px-2 py-1 leading-normal bg-white border border-slate-200 rounded text-[9px] font-semibold text-slate-700" data-v-0befcea5>${ssrInterpolate(s)}</span>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.education.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[9.5px] font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-0.5 mb-2 select-none" data-v-0befcea5>Education</h2><div class="space-y-2.5 text-[9px]" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.education, (edu, idx) => {
            _push(`<div data-v-0befcea5><h5 class="font-bold text-slate-800 leading-snug" data-v-0befcea5>${ssrInterpolate(edu.school)}</h5><p class="text-slate-500 leading-tight" data-v-0befcea5>${ssrInterpolate(edu.degree)}</p>`);
            if (edu.dates) {
              _push(`<p class="text-slate-400 text-[8px] mt-0.5" data-v-0befcea5>${ssrInterpolate(edu.dates)}</p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.credentials.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[9.5px] font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-0.5 mb-2 select-none" data-v-0befcea5>Certifications</h2><ul class="space-y-1 text-[9px] text-slate-600 list-disc" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.credentials, (c, idx) => {
            _push(`<li data-v-0befcea5>${ssrInterpolate(c)}</li>`);
          });
          _push(`<!--]--></ul></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      } else if (__props.formatId === "the-distinguished") {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "theme-distinguished w-full bg-white relative p-8 flex flex-col gap-5 text-slate-800 text-left select-text" }, _attrs))} data-v-0befcea5><div class="absolute top-0 left-0 right-0 h-1 bg-[#091426] shrink-0" data-v-0befcea5></div><header class="flex flex-col sm:flex-row justify-between items-end border-b border-slate-200 pb-4" data-v-0befcea5><div data-v-0befcea5><h1 class="text-2xl font-bold tracking-tight text-[#091426] serif" data-v-0befcea5>${ssrInterpolate(parsed.value.name)}</h1><p class="text-[9px] uppercase tracking-[0.2em] text-[#006a61] font-bold mt-1" data-v-0befcea5>${ssrInterpolate(parsed.value.title)}</p></div><div class="flex flex-wrap gap-x-3 gap-y-0.5 text-[9.5px] text-slate-500 mt-2 sm:mt-0 font-medium" data-v-0befcea5>`);
        if (parsed.value.email) {
          _push(`<span data-v-0befcea5>${ssrInterpolate(parsed.value.email)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.phone) {
          _push(`<span data-v-0befcea5>${ssrInterpolate(parsed.value.phone)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.location) {
          _push(`<span data-v-0befcea5>${ssrInterpolate(parsed.value.location)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></header><div class="grid grid-cols-12 gap-5 flex-grow" data-v-0befcea5><aside class="col-span-4 flex flex-col gap-4 border-r border-slate-200 pr-4" data-v-0befcea5>`);
        if (parsed.value.skills.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none" data-v-0befcea5>Expertise</h2><div class="h-[1px] bg-slate-200 w-full mb-2" data-v-0befcea5></div><ul class="flex flex-col gap-1 list-none pl-0.5 text-[9.5px] text-slate-600 font-medium" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.skills, (s, idx) => {
            _push(`<li class="flex gap-1.5 items-center" data-v-0befcea5><span class="w-1.5 h-1.5 bg-[#006a61] rounded-full shrink-0" data-v-0befcea5></span><span data-v-0befcea5>${ssrInterpolate(s)}</span></li>`);
          });
          _push(`<!--]--></ul></section>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.education.length) {
          _push(`<section data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none" data-v-0befcea5>Credentials</h2><div class="h-[1px] bg-slate-200 w-full mb-2" data-v-0befcea5></div><div class="space-y-2 text-[9px]" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.education, (edu, idx) => {
            _push(`<div data-v-0befcea5><h5 class="font-bold text-slate-800 leading-snug" data-v-0befcea5>${ssrInterpolate(edu.school)}</h5><p class="text-slate-500 leading-tight" data-v-0befcea5>${ssrInterpolate(edu.degree)}</p></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</aside><section class="col-span-8 flex flex-col gap-4" data-v-0befcea5>`);
        if (parsed.value.summary) {
          _push(`<div data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none" data-v-0befcea5>Professional Profile</h2><div class="h-[1px] bg-slate-200 w-full mb-2" data-v-0befcea5></div><p class="text-[10.5px] leading-relaxed text-slate-600 serif" data-v-0befcea5>${ssrInterpolate(parsed.value.summary)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.experience.length) {
          _push(`<div data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none" data-v-0befcea5>Experience Timeline</h2><div class="h-[1px] bg-slate-200 w-full mb-2" data-v-0befcea5></div><div class="space-y-4" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.experience, (job, idx) => {
            _push(`<div data-v-0befcea5><div class="flex justify-between items-baseline mb-0.5" data-v-0befcea5><h3 class="text-[10.5px] font-bold text-slate-800" data-v-0befcea5>${ssrInterpolate(job.title)}</h3><span class="text-[8px] text-slate-400 font-bold uppercase" data-v-0befcea5>${ssrInterpolate(job.dates)}</span></div><p class="text-[9.5px] text-[#006a61] font-bold mb-1.5" data-v-0befcea5>${ssrInterpolate(job.company)} `);
            if (job.location) {
              _push(`<span class="text-slate-400 font-normal" data-v-0befcea5>| ${ssrInterpolate(job.location)}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</p><ul class="space-y-0.5 list-disc text-[9.5px] text-slate-600" data-v-0befcea5><!--[-->`);
            ssrRenderList(job.bullets, (b, bIdx) => {
              _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
            });
            _push(`<!--]--></ul></div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.projects.length) {
          _push(`<div data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none" data-v-0befcea5>Projects</h2><div class="h-[1px] bg-slate-200 w-full mb-2" data-v-0befcea5></div><div class="space-y-3" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.projects, (p, pIdx) => {
            _push(`<div data-v-0befcea5><h4 class="text-[10.5px] font-bold text-slate-800" data-v-0befcea5>${ssrInterpolate(p.name)}</h4><ul class="space-y-0.5 list-disc text-[9.5px] text-slate-600" data-v-0befcea5><!--[-->`);
            ssrRenderList(p.bullets, (b, bIdx) => {
              _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
            });
            _push(`<!--]--></ul></div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (parsed.value.credentials.length) {
          _push(`<div data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none" data-v-0befcea5>Achievements</h2><div class="h-[1px] bg-slate-200 w-full mb-2" data-v-0befcea5></div><ul class="space-y-0.5 list-disc text-[9.5px] text-slate-600" data-v-0befcea5><!--[-->`);
          ssrRenderList(parsed.value.credentials, (c, idx) => {
            _push(`<li data-v-0befcea5>${ssrInterpolate(c)}</li>`);
          });
          _push(`<!--]--></ul></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</section></div><!--[-->`);
        ssrRenderList(parsed.value.extras, (extra) => {
          _push(`<section class="preview-extra-section" data-v-0befcea5><h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2" data-v-0befcea5>${ssrInterpolate(extra.title)}</h2><div class="space-y-2" data-v-0befcea5><!--[-->`);
          ssrRenderList(extra.items, (item, iIdx) => {
            _push(`<div data-v-0befcea5><h4 class="font-bold text-[10.5px] text-slate-800" data-v-0befcea5>${ssrInterpolate(item.title)}</h4>`);
            if (item.subtitle) {
              _push(`<p class="text-[9px] text-slate-500" data-v-0befcea5>${ssrInterpolate(item.subtitle)}</p>`);
            } else {
              _push(`<!---->`);
            }
            if (item.bullets.length) {
              _push(`<ul class="text-[9.5px] text-slate-600 list-disc space-y-0.5" data-v-0befcea5><!--[-->`);
              ssrRenderList(item.bullets, (b, bIdx) => {
                _push(`<li data-v-0befcea5>${ssrInterpolate(b)}</li>`);
              });
              _push(`<!--]--></ul>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div></section>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "markdown-preview max-w-none text-left" }, _attrs))} data-v-0befcea5>${(_a = plainHtml.value) != null ? _a : ""}</div>`);
      }
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ResumeThemeRenderer.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_2 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-0befcea5"]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "apply",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "Document Generator"
    });
    const md = new MarkdownIt({
      html: false,
      linkify: true,
      breaks: true
    });
    const jobDescription = ref("");
    const resumeFile = ref(null);
    const coverLetterFile = ref(null);
    const dragging = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const result = ref(null);
    const copied = ref(null);
    const selectedFormat = ref("the-corporate");
    computed(() => {
      var _a;
      return ((_a = result.value) == null ? void 0 : _a.resume) ? md.render(result.value.resume) : "";
    });
    const coverLetterHtml = computed(
      () => {
        var _a;
        return ((_a = result.value) == null ? void 0 : _a.coverLetter) ? md.render(result.value.coverLetter) : "";
      }
    );
    const canGenerate = computed(() => jobDescription.value.trim().length >= 40);
    return (_ctx, _push, _parent, _attrs) => {
      var _a2;
      var _a, _b, _c, _d;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_CvFormatPicker = __nuxt_component_2$1;
      const _component_ResumeThemeRenderer = __nuxt_component_2;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 py-8 md:py-12" }, _attrs))} data-v-521a02a5><div class="mx-auto max-w-[1400px] px-4 md:px-6" data-v-521a02a5><div class="mb-10 flex flex-wrap items-start justify-between gap-4 border-b border-slate-900 pb-8" data-v-521a02a5><div data-v-521a02a5>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-400 transition-colors"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(unref(ArrowLeft), { size: 14 }, null, _parent2, _scopeId));
            _push2(` Back to scraper `);
          } else {
            return [
              createVNode(unref(ArrowLeft), { size: 14 }),
              createTextVNode(" Back to scraper ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<h1 class="text-3xl font-extrabold tracking-tight md:text-4xl" data-v-521a02a5> Document <span class="text-gradient" data-v-521a02a5>Generator</span></h1><p class="mt-2 max-w-2xl text-sm text-slate-400" data-v-521a02a5> Paste a job description, upload your PDF resume, and generate tailored documents that keep your roles and projects aligned. </p></div></div><div class="grid gap-8 lg:grid-cols-12 items-start" data-v-521a02a5><section class="lg:col-span-5 space-y-6 glass-panel rounded-3xl p-6 relative overflow-hidden group" data-v-521a02a5><div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-500" data-v-521a02a5></div><div data-v-521a02a5><label class="mb-2 block text-xs font-bold uppercase tracking-widest text-indigo-400 select-none" data-v-521a02a5> Job Description </label><textarea rows="12" placeholder="Paste the full job posting details here..." class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-2xl px-4 py-3.5 text-slate-100 text-sm leading-relaxed outline-none transition-all duration-300 focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 placeholder:text-slate-650" data-v-521a02a5>${ssrInterpolate(unref(jobDescription))}</textarea></div><div class="grid gap-4 sm:grid-cols-2" data-v-521a02a5><div data-v-521a02a5><p class="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400 select-none" data-v-521a02a5> Resume PDF </p><label class="${ssrRenderClass([
        unref(dragging) === "resume" ? "border-indigo-500 bg-indigo-950/20" : "border-slate-800 bg-slate-950/30 hover:border-slate-700 hover:bg-slate-900/20",
        "flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center transition-all duration-300"
      ])}" data-v-521a02a5>`);
      _push(ssrRenderComponent(unref(FileUp), {
        size: 20,
        class: "mb-2 text-slate-500"
      }, null, _parent));
      _push(`<span class="text-[11px] font-medium text-slate-300 leading-snug truncate max-w-full" data-v-521a02a5>${ssrInterpolate(((_a = unref(resumeFile)) == null ? void 0 : _a.name) || "Drop PDF or Browse")}</span><input type="file" accept="application/pdf,.pdf" class="hidden" data-v-521a02a5></label>`);
      if (unref(resumeFile)) {
        _push(`<button type="button" class="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors" data-v-521a02a5>`);
        _push(ssrRenderComponent(unref(Trash2), { size: 12 }, null, _parent));
        _push(` Remove Resume </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div data-v-521a02a5><p class="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400 select-none" data-v-521a02a5> Cover Letter PDF </p><label class="${ssrRenderClass([
        unref(dragging) === "coverLetter" ? "border-indigo-500 bg-indigo-950/20" : "border-slate-800 bg-slate-950/30 hover:border-slate-700 hover:bg-slate-900/20",
        "flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center transition-all duration-300"
      ])}" data-v-521a02a5>`);
      _push(ssrRenderComponent(unref(FileUp), {
        size: 20,
        class: "mb-2 text-slate-500"
      }, null, _parent));
      _push(`<span class="text-[11px] font-medium text-slate-300 leading-snug truncate max-w-full" data-v-521a02a5>${ssrInterpolate(((_b = unref(coverLetterFile)) == null ? void 0 : _b.name) || "Optional PDF")}</span><input type="file" accept="application/pdf,.pdf" class="hidden" data-v-521a02a5></label>`);
      if (unref(coverLetterFile)) {
        _push(`<button type="button" class="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors" data-v-521a02a5>`);
        _push(ssrRenderComponent(unref(Trash2), { size: 12 }, null, _parent));
        _push(` Remove Cover Letter </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
      if (unref(error)) {
        _push(`<div class="rounded-xl border border-red-500/20 bg-red-950/20 px-3.5 py-2.5 text-xs text-red-300" data-v-521a02a5>${ssrInterpolate(unref(error))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<button type="button"${ssrIncludeBooleanAttr(unref(loading) || !unref(canGenerate)) ? " disabled" : ""} class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-300 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/30 disabled:opacity-40 disabled:pointer-events-none hover:scale-[1.01] active:scale-[0.99] cursor-pointer" data-v-521a02a5>`);
      if (unref(loading)) {
        _push(ssrRenderComponent(unref(Loader2), {
          class: "animate-spin",
          size: 18
        }, null, _parent));
      } else {
        _push(ssrRenderComponent(unref(Sparkles), { size: 18 }, null, _parent));
      }
      _push(` ${ssrInterpolate(unref(loading) ? "Generating Tailored Materials..." : "Generate Tailored Materials")}</button></section><section class="lg:col-span-7 space-y-4" data-v-521a02a5>`);
      if (!unref(result) && !unref(loading)) {
        _push(`<div class="flex min-h-[34rem] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-850 bg-slate-900/10 px-6 text-center text-slate-500" data-v-521a02a5><div class="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mb-4" data-v-521a02a5>`);
        _push(ssrRenderComponent(unref(FileText), {
          size: 24,
          class: "text-slate-400"
        }, null, _parent));
        _push(`</div><p class="text-sm font-bold text-slate-400 select-none" data-v-521a02a5>No Previews Generated</p><p class="mt-1 max-w-sm text-xs leading-relaxed" data-v-521a02a5> Your tailored resume and cover letter output previews will display here after extraction and processing. </p></div>`);
      } else if (unref(loading)) {
        _push(`<div class="flex min-h-[34rem] items-center justify-center rounded-3xl border border-slate-850 bg-slate-900/30 backdrop-blur-sm" data-v-521a02a5><div class="flex flex-col items-center gap-4 text-sm text-slate-400" data-v-521a02a5>`);
        _push(ssrRenderComponent(unref(Loader2), {
          class: "animate-spin text-indigo-400",
          size: 28
        }, null, _parent));
        _push(`<span data-v-521a02a5>${ssrInterpolate(unref(resumeFile) ? "Reading PDF and drafting full tailored CV..." : "Analyzing role details with Gemini...")}</span></div></div>`);
      } else {
        _push(`<div class="space-y-6" data-v-521a02a5>`);
        if ((_c = unref(result)) == null ? void 0 : _c.model) {
          _push(`<p class="text-xs text-slate-500 select-none" data-v-521a02a5> Engine model: <span class="font-mono text-slate-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800" data-v-521a02a5>${ssrInterpolate(unref(result).model)}</span>`);
          if (unref(result).mode) {
            _push(`<span class="ml-2 font-semibold" data-v-521a02a5>\xB7 Mode: ${ssrInterpolate(unref(result).mode)}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="glass-panel rounded-3xl p-5 border border-slate-850/60" data-v-521a02a5>`);
        _push(ssrRenderComponent(_component_CvFormatPicker, {
          modelValue: unref(selectedFormat),
          "onUpdate:modelValue": ($event) => isRef(selectedFormat) ? selectedFormat.value = $event : null
        }, null, _parent));
        _push(`</div><div class="grid gap-6 xl:grid-cols-2" data-v-521a02a5><article class="overflow-hidden rounded-2xl border border-slate-850 bg-slate-900/40 backdrop-blur-sm shadow-xl flex flex-col" data-v-521a02a5><div class="flex items-center justify-between gap-2 border-b border-slate-850/80 px-4 py-3 bg-slate-900/60" data-v-521a02a5><h2 class="text-xs font-bold uppercase tracking-widest text-indigo-400" data-v-521a02a5>Cover Letter</h2><button type="button" class="inline-flex items-center gap-1.5 rounded-xl border border-slate-850 bg-slate-950/40 px-3 py-1.5 text-[11px] font-bold text-slate-300 hover:border-indigo-500 hover:text-white transition-all duration-300 cursor-pointer" data-v-521a02a5>`);
        if (unref(copied) === "coverLetter") {
          _push(ssrRenderComponent(unref(Check), {
            size: 12,
            class: "text-emerald-400"
          }, null, _parent));
        } else {
          _push(ssrRenderComponent(unref(Copy), { size: 12 }, null, _parent));
        }
        _push(` ${ssrInterpolate(unref(copied) === "coverLetter" ? "Copied" : "Copy")}</button></div><div class="doc-preview max-h-[32rem] overflow-y-auto bg-white p-6 md:p-8 text-slate-800 border-t border-slate-100 shadow-inner select-text" data-v-521a02a5>${(_a2 = unref(coverLetterHtml)) != null ? _a2 : ""}</div></article><article class="overflow-hidden rounded-2xl border border-slate-850 bg-slate-900/40 backdrop-blur-sm shadow-xl flex flex-col" data-v-521a02a5><div class="flex items-center justify-between gap-2 border-b border-slate-850/80 px-4 py-3 bg-slate-900/60" data-v-521a02a5><h2 class="text-xs font-bold uppercase tracking-widest text-indigo-400" data-v-521a02a5>Tailored Resume</h2><button type="button" class="inline-flex items-center gap-1.5 rounded-xl border border-slate-850 bg-slate-950/40 px-3 py-1.5 text-[11px] font-bold text-slate-300 hover:border-indigo-500 hover:text-white transition-all duration-300 cursor-pointer" data-v-521a02a5>`);
        if (unref(copied) === "resume") {
          _push(ssrRenderComponent(unref(Check), {
            size: 12,
            class: "text-emerald-400"
          }, null, _parent));
        } else {
          _push(ssrRenderComponent(unref(Copy), { size: 12 }, null, _parent));
        }
        _push(` ${ssrInterpolate(unref(copied) === "resume" ? "Copied" : "Copy")}</button></div><div class="doc-preview max-h-[32rem] overflow-y-auto bg-white border-t border-slate-100 shadow-inner select-text p-0" data-v-521a02a5>`);
        _push(ssrRenderComponent(_component_ResumeThemeRenderer, {
          markdown: ((_d = unref(result)) == null ? void 0 : _d.resume) || "",
          "format-id": unref(selectedFormat)
        }, null, _parent));
        _push(`</div></article></div></div>`);
      }
      _push(`&gt; </section></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/apply.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const apply = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-521a02a5"]]);

export { apply as default };
//# sourceMappingURL=apply-gT0RFIrU.mjs.map
