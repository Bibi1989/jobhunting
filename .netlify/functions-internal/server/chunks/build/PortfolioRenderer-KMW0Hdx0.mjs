import { defineComponent, computed, mergeProps, unref, createVNode, resolveDynamicComponent, withCtx, createTextVNode, toDisplayString, openBlock, createBlock, createCommentVNode, Fragment, renderList, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderVNode, ssrInterpolate, ssrRenderAttr, ssrRenderList, ssrRenderStyle, ssrRenderComponent, ssrRenderClass, ssrRenderSlot } from 'vue/server-renderer';
import { D as DEFAULT_TEMPLATE_SLUG, o as orderedBodySections, a as absoluteUrl, m as mailtoHref, t as telHref } from '../_/portfolio.mjs';
import { _ as _export_sfc } from './server.mjs';

const _sfc_main$c = /* @__PURE__ */ defineComponent({
  __name: "PortfolioProjectLink",
  __ssrInlineRender: true,
  props: {
    project: {},
    index: {}
  },
  setup(__props) {
    const props = __props;
    const href = computed(() => absoluteUrl(props.project.url));
    const anchor = computed(() => {
      var _a;
      return `project-${((_a = props.index) != null ? _a : 0) + 1}`;
    });
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(href)) {
        _push(`<a${ssrRenderAttrs(mergeProps({
          id: unref(anchor),
          href: unref(href),
          target: "_blank",
          rel: "noopener noreferrer",
          class: "group block outline-none"
        }, _attrs))}>`);
        ssrRenderSlot(_ctx.$slots, "default", { hasLink: true }, null, _push, _parent);
        _push(`</a>`);
      } else {
        _push(`<article${ssrRenderAttrs(mergeProps({
          id: unref(anchor),
          class: "group block"
        }, _attrs))}>`);
        ssrRenderSlot(_ctx.$slots, "default", { hasLink: false }, null, _push, _parent);
        _push(`</article>`);
      }
    };
  }
});
const _sfc_setup$c = _sfc_main$c.setup;
_sfc_main$c.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/portfolio/PortfolioProjectLink.vue");
  return _sfc_setup$c ? _sfc_setup$c(props, ctx) : void 0;
};
const _sfc_main$b = /* @__PURE__ */ defineComponent({
  __name: "PortfolioContactLinks",
  __ssrInlineRender: true,
  props: {
    data: {},
    variant: { default: "stack" },
    className: { default: "" }
  },
  setup(__props) {
    const props = __props;
    const email = computed(() => mailtoHref(props.data.email));
    const phone = computed(() => telHref(props.data.phone));
    function extractUrl(val) {
      if (!val) return null;
      return absoluteUrl(typeof val === "string" ? val : val.url);
    }
    function extractLabel(val, defaultLabel) {
      if (!val) return defaultLabel;
      return typeof val === "string" ? val : val.label;
    }
    const website = computed(() => extractUrl(props.data.website));
    const linkedin = computed(() => extractUrl(props.data.linkedin));
    const github = computed(() => extractUrl(props.data.github));
    const resume = computed(() => extractUrl(props.data.resume));
    const links = computed(() => {
      const items = [];
      if (email.value && props.data.email) {
        items.push({ key: "email", label: props.data.email, href: email.value, icon: "mail" });
      }
      if (phone.value && props.data.phone) {
        items.push({ key: "phone", label: props.data.phone, href: phone.value, icon: "call" });
      }
      if (props.data.location) {
        items.push({
          key: "location",
          label: props.data.location,
          href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.data.location)}`,
          icon: "location_on"
        });
      }
      if (website.value) {
        items.push({
          key: "website",
          label: extractLabel(props.data.website, "Website"),
          href: website.value,
          icon: "language"
        });
      }
      if (linkedin.value) {
        items.push({
          key: "linkedin",
          label: extractLabel(props.data.linkedin, "LinkedIn"),
          href: linkedin.value,
          icon: "work"
        });
      }
      if (github.value) {
        items.push({
          key: "github",
          label: extractLabel(props.data.github, "GitHub"),
          href: github.value,
          icon: "code"
        });
      }
      if (resume.value) {
        items.push({
          key: "resume",
          label: extractLabel(props.data.resume, "Resume"),
          href: resume.value,
          icon: "description"
        });
      }
      return items;
    });
    const primaryCta = computed(() => {
      var _a;
      const ctaLabel = ((_a = props.data.button_texts) == null ? void 0 : _a.contact_cta) || props.data.cta_text;
      if (ctaLabel) {
        if (email.value) return { href: email.value, label: ctaLabel };
        if (linkedin.value) return { href: linkedin.value, label: ctaLabel };
        if (website.value) return { href: website.value, label: ctaLabel };
        return { href: "#contact", label: ctaLabel };
      }
      if (email.value) return { href: email.value, label: "Email me" };
      if (linkedin.value) return { href: linkedin.value, label: "Connect on LinkedIn" };
      if (website.value) return { href: website.value, label: "Visit website" };
      return { href: "#contact", label: "Get in touch" };
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[-->`);
      if (unref(links).length) {
        _push(`<div class="${ssrRenderClass(__props.className)}">`);
        if (__props.variant === "row") {
          _push(`<div class="flex flex-wrap items-center gap-x-5 gap-y-2"><!--[-->`);
          ssrRenderList(unref(links), (link) => {
            _push(`<a${ssrRenderAttr("href", link.href)} class="inline-flex items-center gap-1.5 underline-offset-4 transition hover:underline"${ssrRenderAttr("target", link.href.startsWith("http") ? "_blank" : void 0)}${ssrRenderAttr("rel", link.href.startsWith("http") ? "noopener noreferrer" : void 0)}><span class="material-symbols-outlined text-base">${ssrInterpolate(link.icon)}</span><span>${ssrInterpolate(link.label)}</span></a>`);
          });
          _push(`<!--]--></div>`);
        } else if (__props.variant === "pills") {
          _push(`<div class="flex flex-wrap gap-2"><!--[-->`);
          ssrRenderList(unref(links), (link) => {
            _push(`<a${ssrRenderAttr("href", link.href)} class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition hover:opacity-90"${ssrRenderAttr("target", link.href.startsWith("http") ? "_blank" : void 0)}${ssrRenderAttr("rel", link.href.startsWith("http") ? "noopener noreferrer" : void 0)}><span class="material-symbols-outlined text-base">${ssrInterpolate(link.icon)}</span> ${ssrInterpolate(link.label)}</a>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<ul class="space-y-2"><!--[-->`);
          ssrRenderList(unref(links), (link) => {
            _push(`<li><a${ssrRenderAttr("href", link.href)} class="inline-flex items-center gap-2 underline-offset-4 transition hover:underline"${ssrRenderAttr("target", link.href.startsWith("http") ? "_blank" : void 0)}${ssrRenderAttr("rel", link.href.startsWith("http") ? "noopener noreferrer" : void 0)}><span class="material-symbols-outlined text-base">${ssrInterpolate(link.icon)}</span> ${ssrInterpolate(link.label)}</a></li>`);
          });
          _push(`<!--]--></ul>`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      ssrRenderSlot(_ctx.$slots, "cta", {
        cta: unref(primaryCta),
        links: unref(links)
      }, null, _push, _parent);
      _push(`<!--]-->`);
    };
  }
});
const _sfc_setup$b = _sfc_main$b.setup;
_sfc_main$b.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/portfolio/PortfolioContactLinks.vue");
  return _sfc_setup$b ? _sfc_setup$b(props, ctx) : void 0;
};
const portfolioContactKey = /* @__PURE__ */ Symbol("portfolioContactOpen");
function portfolioContactCta() {
  return { href: "#contact", external: false };
}
const _sfc_main$a = /* @__PURE__ */ defineComponent({
  __name: "TheVisionary",
  __ssrInlineRender: true,
  props: {
    data: {}
  },
  setup(__props) {
    const props = __props;
    const sections = computed(
      () => orderedBodySections(props.data, { projects: "Selected Work", skills: "Capabilities" })
    );
    const initials = computed(() => {
      const parts = props.data.full_name.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) return "";
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    });
    const bioSentences = computed(() => {
      var _a2, _b, _c;
      var _a;
      const bio = (_a2 = (_a = props.data.professional_bio) == null ? void 0 : _a.trim()) != null ? _a2 : "";
      if (!bio) return { headline: "", rest: "" };
      const match = bio.match(/^(.*?[.!?])(\s+(.*))?$/s);
      if (!match) return { headline: bio, rest: "" };
      return { headline: (_b = match[1]) != null ? _b : bio, rest: ((_c = match[3]) != null ? _c : "").trim() };
    });
    const primaryCta = computed(() => portfolioContactCta());
    const mockCards = computed(() => {
      var _a, _b;
      const projects = (_a = props.data.formatted_projects) != null ? _a : [];
      const skills = (_b = props.data.core_skills) != null ? _b : [];
      return [0, 1, 2].map((i) => {
        var _a2;
        const project = projects[i];
        if (project) {
          return {
            title: project.title,
            subtitle: ((_a2 = project.tech_stack) == null ? void 0 : _a2.slice(0, 3).join(" \xB7 ")) || skills[i] || ""
          };
        }
        return {
          title: skills[i] || props.data.full_name,
          subtitle: skills[i + 1] || skills[0] || ""
        };
      });
    });
    const gradientClasses = [
      "from-primary-500 via-purple-500 to-primary-500",
      "from-primary-400 via-primary-500 to-primary-600",
      "from-primary-500 via-primary-500 to-primary-400",
      "from-primary-400 via-orange-500 to-primary-500",
      "from-primary-400 via-primary-500 to-primary-500"
    ];
    function gradientFor(index) {
      return gradientClasses[index % gradientClasses.length];
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d;
      const _component_PortfolioProjectLink = _sfc_main$c;
      const _component_PortfolioContactLinks = _sfc_main$b;
      _push(`<div${ssrRenderAttrs(mergeProps({
        id: "top",
        class: "min-h-screen bg-primary-50 text-primary-900",
        style: { "font-family": "ui-sans-serif, system-ui, sans-serif" }
      }, _attrs))}><header class="sticky top-0 z-50 border-b border-primary-200/80 bg-white/80 backdrop-blur-md"><nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"><a href="#top" class="flex items-center gap-2 text-lg font-bold tracking-tight text-primary-900"><span class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-sm font-bold text-white shadow-md shadow-indigo-500/30">${ssrInterpolate(unref(initials))}</span><span class="hidden sm:inline">${ssrInterpolate(__props.data.full_name)}</span></a><div class="flex items-center gap-6"><a href="#work" class="hidden text-sm font-medium text-primary-600 transition hover:text-primary-600 sm:inline">${ssrInterpolate(((_a = __props.data.button_texts) == null ? void 0 : _a.nav_projects) || `<a href="#work" class="hidden text-sm font-medium text-primary-600 transition hover:text-primary-600 sm:inline">
            Work
          </a>`.replace(/<[^>]+>/g, "").trim())}</a><a href="#skills" class="hidden text-sm font-medium text-primary-600 transition hover:text-primary-600 sm:inline">${ssrInterpolate(((_b = __props.data.button_texts) == null ? void 0 : _b.nav_skills) || `<a href="#skills" class="hidden text-sm font-medium text-primary-600 transition hover:text-primary-600 sm:inline">
            Skills
          </a>`.replace(/<[^>]+>/g, "").trim())}</a><a href="#contact" class="hidden text-sm font-medium text-primary-600 transition hover:text-primary-600 sm:inline">${ssrInterpolate(((_c = __props.data.button_texts) == null ? void 0 : _c.contact_cta) || __props.data.cta_text || "Contact")}</a><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 transition hover:bg-primary-600 hover:shadow-lg hover:shadow-indigo-500/40"> Get in touch </a></div></nav></header><section class="relative overflow-hidden px-6 pb-28 pt-16 sm:pt-24"><div class="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-primary-200/50 blur-3xl"></div><div class="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-primary-200/50 blur-3xl"></div><div class="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]"><div><p class="mb-5 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-700"><span class="material-symbols-outlined text-sm">auto_awesome</span> ${ssrInterpolate(__props.data.full_name)}</p>`);
      if (unref(bioSentences).headline) {
        _push(`<h1 class="text-4xl font-extrabold leading-[1.1] tracking-tight text-primary-900 sm:text-5xl lg:text-6xl">${ssrInterpolate(unref(bioSentences).headline)}</h1>`);
      } else {
        _push(`<h1 class="text-4xl font-extrabold leading-[1.1] tracking-tight text-primary-900 sm:text-5xl lg:text-6xl">${ssrInterpolate(__props.data.full_name)}</h1>`);
      }
      if (unref(bioSentences).rest) {
        _push(`<p class="mt-6 max-w-xl text-lg leading-relaxed text-primary-600">${ssrInterpolate(unref(bioSentences).rest)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="mt-10 flex flex-wrap items-center gap-4"><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="inline-flex items-center gap-2 rounded-full bg-primary-500 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:bg-primary-600 hover:shadow-xl hover:shadow-indigo-500/40"> Let&#39;s talk <span class="material-symbols-outlined text-lg">arrow_forward</span></a><a href="#work" class="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-primary-700 transition hover:text-primary-600">${ssrInterpolate(((_d = __props.data.button_texts) == null ? void 0 : _d.hero_cta) || `View work
              south`)} <span class="material-symbols-outlined text-lg">south</span></a></div></div><div class="relative mx-auto hidden h-[420px] w-full max-w-md lg:block"><div class="absolute left-0 top-4 w-80 -rotate-3 rounded-2xl border border-primary-200 bg-white p-3 shadow-2xl shadow-indigo-900/10 transition hover:-translate-y-1 hover:rotate-0"><div class="mb-3 flex items-center gap-1.5 px-1"><span class="h-2.5 w-2.5 rounded-full bg-primary-400"></span><span class="h-2.5 w-2.5 rounded-full bg-primary-400"></span><span class="h-2.5 w-2.5 rounded-full bg-primary-400"></span></div><div class="h-28 rounded-xl bg-gradient-to-br from-primary-400 via-purple-400 to-primary-400"></div><div class="mt-3 space-y-1 px-1"><p class="truncate text-sm font-semibold text-primary-800">${ssrInterpolate(unref(mockCards)[0].title)}</p>`);
      if (unref(mockCards)[0].subtitle) {
        _push(`<p class="truncate text-xs text-primary-500" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}">${ssrInterpolate(unref(mockCards)[0].subtitle)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="absolute -bottom-2 right-2 w-40 rotate-6 rounded-3xl border-4 border-primary-900 bg-white p-2 shadow-2xl shadow-indigo-900/20 transition hover:-translate-y-1 hover:rotate-3"><div class="mx-auto mb-2 h-1.5 w-10 rounded-full bg-primary-800"></div><div class="h-44 rounded-2xl bg-gradient-to-b from-primary-300 via-primary-400 to-primary-500"></div><div class="mt-2 space-y-1 px-1"><p class="truncate text-[11px] font-semibold text-primary-800">${ssrInterpolate(unref(mockCards)[1].title)}</p>`);
      if (unref(mockCards)[1].subtitle) {
        _push(`<p class="truncate text-[10px] text-primary-500" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}">${ssrInterpolate(unref(mockCards)[1].subtitle)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="absolute right-8 top-32 w-56 rotate-3 rounded-2xl border border-primary-200 bg-white p-3 shadow-xl shadow-indigo-900/10 transition hover:-translate-y-1 hover:rotate-0"><div class="flex items-center gap-2"><span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100"><span class="material-symbols-outlined text-base text-primary-600">bolt</span></span><div class="min-w-0 flex-1"><p class="truncate text-xs font-semibold text-primary-800">${ssrInterpolate(unref(mockCards)[2].title)}</p>`);
      if (unref(mockCards)[2].subtitle) {
        _push(`<p class="truncate text-[10px] text-primary-500" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}">${ssrInterpolate(unref(mockCards)[2].subtitle)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div></div></div></section><!--[-->`);
      ssrRenderList(unref(sections), (section) => {
        _push(`<!--[-->`);
        if (section.kind === "projects") {
          _push(`<section id="work" class="mx-auto max-w-6xl px-6 py-24"><div class="mb-14 max-w-2xl"><p class="mb-3 text-sm font-semibold uppercase tracking-wider text-primary-600">Selected Work</p><h2 class="text-3xl font-extrabold tracking-tight text-primary-900 sm:text-4xl"> Projects worth talking about </h2></div><div class="grid gap-8 sm:grid-cols-2"><!--[-->`);
          ssrRenderList(__props.data.formatted_projects, (project, index) => {
            _push(ssrRenderComponent(_component_PortfolioProjectLink, {
              key: project.title + index,
              project,
              index
            }, {
              default: withCtx(({ hasLink }, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<div class="flex h-full flex-col overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-sm shadow-slate-200/50 transition group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-indigo-200/40"${_scopeId}><div class="${ssrRenderClass([gradientFor(index), "relative h-40 w-full overflow-hidden bg-gradient-to-br"])}"${_scopeId}><div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_60%)]"${_scopeId}></div><span class="material-symbols-outlined absolute bottom-3 right-3 text-4xl text-white/70 transition group-hover:scale-110"${_scopeId}> rocket_launch </span></div><div class="flex flex-1 flex-col p-6"${_scopeId}><div class="flex items-start justify-between gap-2"${_scopeId}><h3 class="text-xl font-bold text-primary-900"${_scopeId}>${ssrInterpolate(project.title)}</h3>`);
                  if (hasLink) {
                    _push2(`<span class="material-symbols-outlined shrink-0 text-primary-500" aria-hidden="true"${_scopeId}> open_in_new </span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div><p class="mt-2.5 flex-1 text-sm leading-relaxed text-primary-600"${_scopeId}>${ssrInterpolate(project.description)}</p>`);
                  if (project.tech_stack && project.tech_stack.length > 0) {
                    _push2(`<div class="mt-5 flex flex-wrap gap-2"${_scopeId}><!--[-->`);
                    ssrRenderList(project.tech_stack, (tech) => {
                      _push2(`<span class="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}"${_scopeId}>${ssrInterpolate(tech)}</span>`);
                    });
                    _push2(`<!--]--></div>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  if (hasLink) {
                    _push2(`<p class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600"${_scopeId}> Open project <span class="material-symbols-outlined text-base"${_scopeId}>arrow_forward</span></p>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div></div>`);
                } else {
                  return [
                    createVNode("div", { class: "flex h-full flex-col overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-sm shadow-slate-200/50 transition group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-indigo-200/40" }, [
                      createVNode("div", {
                        class: ["relative h-40 w-full overflow-hidden bg-gradient-to-br", gradientFor(index)]
                      }, [
                        createVNode("div", { class: "absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_60%)]" }),
                        createVNode("span", { class: "material-symbols-outlined absolute bottom-3 right-3 text-4xl text-white/70 transition group-hover:scale-110" }, " rocket_launch ")
                      ], 2),
                      createVNode("div", { class: "flex flex-1 flex-col p-6" }, [
                        createVNode("div", { class: "flex items-start justify-between gap-2" }, [
                          createVNode("h3", { class: "text-xl font-bold text-primary-900" }, toDisplayString(project.title), 1),
                          hasLink ? (openBlock(), createBlock("span", {
                            key: 0,
                            class: "material-symbols-outlined shrink-0 text-primary-500",
                            "aria-hidden": "true"
                          }, " open_in_new ")) : createCommentVNode("", true)
                        ]),
                        createVNode("p", { class: "mt-2.5 flex-1 text-sm leading-relaxed text-primary-600" }, toDisplayString(project.description), 1),
                        project.tech_stack && project.tech_stack.length > 0 ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "mt-5 flex flex-wrap gap-2"
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(project.tech_stack, (tech) => {
                            return openBlock(), createBlock("span", {
                              key: tech,
                              class: "rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700",
                              style: { "font-family": "'JetBrains Mono', monospace" }
                            }, toDisplayString(tech), 1);
                          }), 128))
                        ])) : createCommentVNode("", true),
                        hasLink ? (openBlock(), createBlock("p", {
                          key: 1,
                          class: "mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600"
                        }, [
                          createTextVNode(" Open project "),
                          createVNode("span", { class: "material-symbols-outlined text-base" }, "arrow_forward")
                        ])) : createCommentVNode("", true)
                      ])
                    ])
                  ];
                }
              }),
              _: 2
            }, _parent));
          });
          _push(`<!--]--></div></section>`);
        } else if (section.kind === "skills") {
          _push(`<section id="skills" class="bg-white px-6 py-24"><div class="mx-auto max-w-6xl"><div class="mb-12 max-w-2xl"><p class="mb-3 text-sm font-semibold uppercase tracking-wider text-primary-600">Capabilities</p><h2 class="text-3xl font-extrabold tracking-tight text-primary-900 sm:text-4xl"> Tools of the trade </h2></div><div class="flex flex-wrap gap-3"><!--[-->`);
          ssrRenderList(__props.data.core_skills, (skill) => {
            _push(`<span class="inline-flex items-center gap-2 rounded-2xl border border-primary-200 bg-primary-50 px-5 py-2.5 text-sm font-semibold text-primary-800 shadow-sm transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"><span class="h-2 w-2 rounded-full bg-primary-500"></span> ${ssrInterpolate(skill)}</span>`);
          });
          _push(`<!--]--></div></div></section>`);
        } else if (section.custom && section.custom.content && section.custom.content.trim()) {
          _push(`<section${ssrRenderAttr("id", `section-${section.key}`)} class="mx-auto max-w-6xl px-6 py-24"><div class="mb-14 max-w-2xl"><p class="mb-3 text-sm font-semibold uppercase tracking-wider text-primary-600">${ssrInterpolate(section.title)}</p><h2 class="text-3xl font-extrabold tracking-tight text-primary-900 sm:text-4xl">${ssrInterpolate(section.title)}</h2></div><div class="max-w-3xl space-y-5"><!--[-->`);
          ssrRenderList(section.custom.content.split(/\n{2,}/), (paragraph, index) => {
            _push(`<p class="text-lg leading-relaxed text-primary-600">${ssrInterpolate(paragraph)}</p>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--]-->`);
      });
      _push(`<!--]--><footer id="contact" class="relative overflow-hidden px-6 py-24"><div class="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-600"></div><div class="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"></div><div class="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-white/10 blur-3xl"></div><div class="relative mx-auto flex max-w-4xl flex-col items-center gap-8 text-center"><h2 class="text-3xl font-extrabold tracking-tight text-white sm:text-5xl"> Ready to build something impactful? </h2><p class="max-w-xl text-lg text-primary-100">${ssrInterpolate(__props.data.full_name)} is open to new projects, collaborations, and opportunities. </p><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-primary-600 shadow-xl transition hover:-translate-y-0.5 hover:bg-primary-50"><span class="material-symbols-outlined text-lg">mail</span> Get in touch with ${ssrInterpolate(__props.data.full_name)}</a>`);
      _push(ssrRenderComponent(_component_PortfolioContactLinks, {
        data: __props.data,
        variant: "pills",
        "class-name": "text-primary-100 [&_a]:border-white/30 [&_a]:bg-white/10 [&_a]:text-white"
      }, null, _parent));
      _push(`<a href="#top" class="text-sm font-semibold text-primary-100 underline-offset-4 transition hover:text-white hover:underline"> Back to top </a></div></footer></div>`);
    };
  }
});
const _sfc_setup$a = _sfc_main$a.setup;
_sfc_main$a.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/portfolio/templates/TheVisionary.vue");
  return _sfc_setup$a ? _sfc_setup$a(props, ctx) : void 0;
};
const _sfc_main$9 = /* @__PURE__ */ defineComponent({
  __name: "TheMinimalist",
  __ssrInlineRender: true,
  props: {
    data: {}
  },
  setup(__props) {
    const props = __props;
    const sections = computed(
      () => orderedBodySections(props.data, { projects: "Selected work", skills: "Skills" })
    );
    const caption = computed(() => {
      var _a2;
      var _a;
      const bio = (_a2 = (_a = props.data.professional_bio) == null ? void 0 : _a.trim()) != null ? _a2 : "";
      if (!bio) return "";
      const words = bio.split(/\s+/).slice(0, 6).join(" ");
      return words.replace(/[.,;:]+$/, "");
    });
    const primaryCta = computed(() => portfolioContactCta());
    function pad(index) {
      return String(index + 1).padStart(2, "0");
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c;
      const _component_PortfolioProjectLink = _sfc_main$c;
      const _component_PortfolioContactLinks = _sfc_main$b;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-primary-950 text-primary-100" }, _attrs))}><header class="sticky top-0 z-40 border-b border-white/10 bg-primary-950/90 backdrop-blur"><nav class="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 sm:px-10"><a href="#top" class="text-xs tracking-[0.3em] text-primary-300 uppercase hover:text-white" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}">${ssrInterpolate(__props.data.full_name)}</a><div class="flex items-center gap-6 sm:gap-8"><a href="#work" class="text-[11px] tracking-[0.2em] text-primary-400 uppercase transition hover:text-white" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}">${ssrInterpolate(((_a = __props.data.button_texts) == null ? void 0 : _a.nav_projects) || `<a
            href="#work"
            class="text-[11px] tracking-[0.2em] text-primary-400 uppercase transition hover:text-white"
            style="font-family: 'JetBrains Mono', monospace"
          >
            Work
          </a>`.replace(/<[^>]+>/g, "").trim())}</a><a href="#skills" class="text-[11px] tracking-[0.2em] text-primary-400 uppercase transition hover:text-white" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}">${ssrInterpolate(((_b = __props.data.button_texts) == null ? void 0 : _b.nav_skills) || `<a
            href="#skills"
            class="text-[11px] tracking-[0.2em] text-primary-400 uppercase transition hover:text-white"
            style="font-family: 'JetBrains Mono', monospace"
          >
            Skills
          </a>`.replace(/<[^>]+>/g, "").trim())}</a><a href="#contact" class="text-[11px] tracking-[0.2em] text-primary-400 uppercase transition hover:text-white" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}">${ssrInterpolate(((_c = __props.data.button_texts) == null ? void 0 : _c.contact_cta) || __props.data.cta_text || "Contact")}</a></div></nav></header><section id="top" class="mx-auto flex max-w-5xl flex-col justify-center px-6 pt-28 pb-32 sm:px-10 sm:pt-40 sm:pb-44">`);
      if (unref(caption)) {
        _push(`<p class="mb-8 text-xs tracking-[0.35em] text-primary-500 uppercase" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}">${ssrInterpolate(unref(caption))}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<h1 class="text-[13vw] leading-[0.95] font-normal text-primary-50 sm:text-7xl md:text-8xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}">${ssrInterpolate(__props.data.full_name)}</h1><div class="mt-14 flex flex-wrap items-center gap-8"><a href="#work" class="inline-flex items-center gap-2 text-xs tracking-[0.2em] text-primary-300 uppercase transition hover:text-white" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}"><span>View the work</span><span class="material-symbols-outlined text-sm">arrow_downward</span></a><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="inline-flex items-center gap-2 text-xs tracking-[0.2em] text-primary-300 uppercase transition hover:text-white" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}"><span>Get in touch</span><span class="material-symbols-outlined text-sm">north_east</span></a></div></section>`);
      if (__props.data.professional_bio) {
        _push(`<section class="border-t border-white/10 px-6 py-24 sm:px-10 sm:py-32"><div class="mx-auto max-w-4xl"><blockquote class="pl-6 text-2xl leading-[1.7] text-primary-200 italic sm:pl-12 sm:text-3xl md:text-4xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif", "border-left": "1px solid rgba(255, 255, 255, 0.15)" })}"> \u201C${ssrInterpolate(__props.data.professional_bio)}\u201D </blockquote></div></section>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(unref(sections), (section) => {
        var _a2, _b2;
        _push(`<!--[-->`);
        if (section.kind === "projects") {
          _push(`<section id="work" class="border-t border-white/10 px-6 py-24 sm:px-10 sm:py-32"><div class="mx-auto max-w-4xl"><p class="mb-16 text-xs tracking-[0.35em] text-primary-500 uppercase" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}">${ssrInterpolate(section.title)}</p><div><!--[-->`);
          ssrRenderList(__props.data.formatted_projects, (project, index) => {
            _push(ssrRenderComponent(_component_PortfolioProjectLink, {
              key: project.title + index,
              project,
              index
            }, {
              default: withCtx(({ hasLink }, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<div class="grid grid-cols-[3rem_1fr] gap-6 border-t border-white/10 py-10 first:border-t-0 sm:grid-cols-[4rem_1fr] sm:gap-10"${_scopeId}><span class="pt-1 text-sm text-primary-600" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}"${_scopeId}>${ssrInterpolate(pad(index))}</span><div${_scopeId}><div class="flex items-start gap-3"${_scopeId}><h3 class="text-2xl text-primary-50 sm:text-3xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}"${_scopeId}>${ssrInterpolate(project.title)}</h3>`);
                  if (hasLink) {
                    _push2(`<span class="material-symbols-outlined mt-1 text-primary-400 transition group-hover:text-white" aria-hidden="true"${_scopeId}> open_in_new </span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div>`);
                  if (project.description) {
                    _push2(`<p class="mt-4 max-w-2xl text-[15px] leading-relaxed text-primary-400"${_scopeId}>${ssrInterpolate(project.description)}</p>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  if (project.tech_stack && project.tech_stack.length) {
                    _push2(`<p class="mt-5 text-xs tracking-wide text-primary-500" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}"${_scopeId}><!--[-->`);
                    ssrRenderList(project.tech_stack, (tech, techIndex) => {
                      _push2(`<span${_scopeId}>`);
                      if (techIndex > 0) {
                        _push2(`<span class="px-2 text-primary-700"${_scopeId}>\xB7</span>`);
                      } else {
                        _push2(`<!---->`);
                      }
                      _push2(`${ssrInterpolate(tech)}</span>`);
                    });
                    _push2(`<!--]--></p>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  if (hasLink) {
                    _push2(`<p class="mt-4 text-xs tracking-[0.2em] text-primary-400 uppercase transition group-hover:text-white" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}"${_scopeId}> Open project \u2192 </p>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div></div>`);
                } else {
                  return [
                    createVNode("div", { class: "grid grid-cols-[3rem_1fr] gap-6 border-t border-white/10 py-10 first:border-t-0 sm:grid-cols-[4rem_1fr] sm:gap-10" }, [
                      createVNode("span", {
                        class: "pt-1 text-sm text-primary-600",
                        style: { "font-family": "'JetBrains Mono', monospace" }
                      }, toDisplayString(pad(index)), 1),
                      createVNode("div", null, [
                        createVNode("div", { class: "flex items-start gap-3" }, [
                          createVNode("h3", {
                            class: "text-2xl text-primary-50 sm:text-3xl",
                            style: { "font-family": "'Playfair Display', serif" }
                          }, toDisplayString(project.title), 1),
                          hasLink ? (openBlock(), createBlock("span", {
                            key: 0,
                            class: "material-symbols-outlined mt-1 text-primary-400 transition group-hover:text-white",
                            "aria-hidden": "true"
                          }, " open_in_new ")) : createCommentVNode("", true)
                        ]),
                        project.description ? (openBlock(), createBlock("p", {
                          key: 0,
                          class: "mt-4 max-w-2xl text-[15px] leading-relaxed text-primary-400"
                        }, toDisplayString(project.description), 1)) : createCommentVNode("", true),
                        project.tech_stack && project.tech_stack.length ? (openBlock(), createBlock("p", {
                          key: 1,
                          class: "mt-5 text-xs tracking-wide text-primary-500",
                          style: { "font-family": "'JetBrains Mono', monospace" }
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(project.tech_stack, (tech, techIndex) => {
                            return openBlock(), createBlock("span", { key: tech }, [
                              techIndex > 0 ? (openBlock(), createBlock("span", {
                                key: 0,
                                class: "px-2 text-primary-700"
                              }, "\xB7")) : createCommentVNode("", true),
                              createTextVNode(toDisplayString(tech), 1)
                            ]);
                          }), 128))
                        ])) : createCommentVNode("", true),
                        hasLink ? (openBlock(), createBlock("p", {
                          key: 2,
                          class: "mt-4 text-xs tracking-[0.2em] text-primary-400 uppercase transition group-hover:text-white",
                          style: { "font-family": "'JetBrains Mono', monospace" }
                        }, " Open project \u2192 ")) : createCommentVNode("", true)
                      ])
                    ])
                  ];
                }
              }),
              _: 2
            }, _parent));
          });
          _push(`<!--]--></div></div></section>`);
        } else if (section.kind === "skills") {
          _push(`<section id="skills" class="border-t border-white/10 px-6 py-24 sm:px-10 sm:py-32"><div class="mx-auto max-w-4xl"><p class="mb-12 text-xs tracking-[0.35em] text-primary-500 uppercase" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}">${ssrInterpolate(section.title)}</p><p class="text-lg leading-loose text-primary-300 sm:text-xl"><!--[-->`);
          ssrRenderList(__props.data.core_skills, (skill, index) => {
            _push(`<span>`);
            if (index > 0) {
              _push(`<span class="px-3 text-primary-700">\xB7</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`${ssrInterpolate(skill)}</span>`);
          });
          _push(`<!--]--></p></div></section>`);
        } else {
          _push(`<section${ssrRenderAttr("id", `section-${section.key}`)} class="border-t border-white/10 px-6 py-24 sm:px-10 sm:py-32"><div class="mx-auto max-w-4xl"><p class="mb-12 text-xs tracking-[0.35em] text-primary-500 uppercase" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}">${ssrInterpolate(section.title)}</p>`);
          if ((_b2 = (_a2 = section.custom) == null ? void 0 : _a2.content) == null ? void 0 : _b2.trim()) {
            _push(`<div class="space-y-6"><!--[-->`);
            ssrRenderList(section.custom.content.split(/\n{2,}/), (paragraph, paragraphIndex) => {
              _push(`<p class="max-w-2xl text-[15px] leading-relaxed text-primary-400">${ssrInterpolate(paragraph)}</p>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></section>`);
        }
        _push(`<!--]-->`);
      });
      _push(`<!--]--><footer id="contact" class="border-t border-white/10 px-6 py-24 sm:px-10 sm:py-36"><div class="mx-auto flex max-w-4xl flex-col items-start gap-10"><h2 class="text-5xl text-primary-50 sm:text-6xl md:text-7xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}"> Let\u2019s talk. </h2><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="inline-flex items-center gap-2 text-xs tracking-[0.25em] text-primary-300 uppercase transition hover:text-white" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}"><span>Get in touch</span><span class="material-symbols-outlined text-sm">north_east</span></a>`);
      _push(ssrRenderComponent(_component_PortfolioContactLinks, {
        data: __props.data,
        variant: "stack",
        "class-name": "text-primary-400 [&_a]:text-primary-300"
      }, null, _parent));
      _push(`<p class="text-[11px] tracking-[0.2em] text-primary-600 uppercase" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}">${ssrInterpolate(__props.data.full_name)} \u2014 <a href="#top" class="hover:text-primary-300">Back to top</a></p></div></footer></div>`);
    };
  }
});
const _sfc_setup$9 = _sfc_main$9.setup;
_sfc_main$9.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/portfolio/templates/TheMinimalist.vue");
  return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
const _sfc_main$8 = /* @__PURE__ */ defineComponent({
  __name: "TheArchitect",
  __ssrInlineRender: true,
  props: {
    data: {}
  },
  setup(__props) {
    const props = __props;
    const sections = computed(
      () => orderedBodySections(props.data, {
        projects: "Selected Systems & Builds",
        skills: "Core Competencies"
      })
    );
    const initials = computed(() => {
      const parts = props.data.full_name.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) return "??";
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    });
    const mark = initials;
    const primaryCta = computed(() => portfolioContactCta());
    const nodes = computed(() => {
      var _a;
      const skills = ((_a = props.data.core_skills) != null ? _a : []).slice(0, 4);
      if (skills.length >= 4) return skills;
      const fallback = ["API", "Queue", "Cache", "DB"];
      return [...skills, ...fallback].slice(0, 4);
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a2, _b2;
      var _a, _b, _c, _d, _e;
      const _component_PortfolioProjectLink = _sfc_main$c;
      const _component_PortfolioContactLinks = _sfc_main$b;
      _push(`<div${ssrRenderAttrs(mergeProps({
        id: "top",
        class: "min-h-screen bg-primary-950 text-primary-100"
      }, _attrs))}><header class="sticky top-0 z-50 border-b border-primary-800 bg-primary-950/90 backdrop-blur"><nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"><a href="#top" class="text-lg font-bold tracking-tight text-primary-100" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"><span class="text-primary-400">[</span>${ssrInterpolate(unref(mark))}<span class="text-primary-400">]</span></a><div class="hidden items-center gap-8 text-sm text-primary-400 sm:flex" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"><a href="#work" class="transition-colors hover:text-primary-400">${ssrInterpolate(((_a = __props.data.button_texts) == null ? void 0 : _a.nav_projects) || "./work")}</a><a href="#skills" class="transition-colors hover:text-primary-400">${ssrInterpolate(((_b = __props.data.button_texts) == null ? void 0 : _b.nav_skills) || "./skills")}</a><a href="#contact" class="transition-colors hover:text-primary-400">${ssrInterpolate(((_c = __props.data.button_texts) == null ? void 0 : _c.contact_cta) || __props.data.cta_text || "./contact")}</a></div><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="rounded border border-primary-500/40 bg-primary-500/10 px-4 py-2 text-xs font-semibold text-primary-300 transition-colors hover:bg-primary-500/20" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"> &gt; connect() </a></nav></header><section class="relative mx-auto max-w-6xl px-6 py-24 sm:py-32"><div class="grid gap-16 lg:grid-cols-2 lg:items-center"><div><p class="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"> // systems &amp; distributed architecture </p><h1 class="text-4xl font-bold leading-tight text-primary-50 sm:text-5xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display',serif" })}">${ssrInterpolate(__props.data.full_name)}</h1>`);
      if (__props.data.professional_bio) {
        _push(`<p class="mt-6 max-w-xl text-base leading-relaxed text-primary-400">${ssrInterpolate(__props.data.professional_bio)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="mt-8 flex flex-wrap gap-4"><a href="#work" class="rounded border border-primary-700 bg-primary-900 px-5 py-3 text-sm font-semibold text-primary-100 transition-colors hover:border-primary-500 hover:text-primary-300" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"> view_projects() </a><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="rounded bg-primary-500 px-5 py-3 text-sm font-semibold text-primary-950 transition-colors hover:bg-primary-400" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"> get_in_touch() </a></div></div><div class="rounded-lg border border-primary-800 bg-primary-900/60 p-6"><p class="mb-4 text-xs uppercase tracking-widest text-primary-500" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"> system.diagram </p><div class="grid grid-cols-2 gap-3"><!--[-->`);
      ssrRenderList(unref(nodes), (node) => {
        _push(`<div class="flex items-center justify-center gap-2 rounded border border-primary-500/30 bg-primary-950 px-4 py-6 text-sm text-primary-300" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"><span class="material-symbols-outlined shrink-0 text-base text-primary-500">memory</span><span class="truncate">${ssrInterpolate(node)}</span></div>`);
      });
      _push(`<!--]--></div><div class="my-3 flex items-center justify-center"><span class="material-symbols-outlined text-primary-600">south</span></div><pre class="overflow-x-auto rounded border border-primary-800 bg-primary-950 p-4 text-xs leading-relaxed text-primary-400" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"><code><span class="text-primary-400">$</span> stack --describe
projects  : ${ssrInterpolate((_a2 = (_d = __props.data.formatted_projects) == null ? void 0 : _d.length) != null ? _a2 : 0)}
skills    : ${ssrInterpolate((_b2 = (_e = __props.data.core_skills) == null ? void 0 : _e.length) != null ? _b2 : 0)}
runtime   : node@22 / edge
status    : <span class="text-primary-400">operational</span></code></pre></div></div></section><!--[-->`);
      ssrRenderList(unref(sections), (section) => {
        var _a22, _b22, _c2, _d2;
        _push(`<!--[-->`);
        if (section.kind === "projects") {
          _push(`<section id="work" class="border-t border-primary-800 bg-primary-950 px-6 py-24"><div class="mx-auto max-w-6xl"><p class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"> // 02 </p><h2 class="text-3xl font-bold text-primary-50" style="${ssrRenderStyle({ "font-family": "'Playfair Display',serif" })}"> Selected Systems &amp; Builds </h2>`);
          if ((_a22 = __props.data.formatted_projects) == null ? void 0 : _a22.length) {
            _push(`<div class="mt-12 grid gap-6 sm:grid-cols-2"><!--[-->`);
            ssrRenderList(__props.data.formatted_projects, (project, idx) => {
              _push(ssrRenderComponent(_component_PortfolioProjectLink, {
                key: project.title + idx,
                project,
                index: idx
              }, {
                default: withCtx(({ hasLink }, _push2, _parent2, _scopeId) => {
                  var _a3, _b3;
                  if (_push2) {
                    _push2(`<div class="h-full rounded-lg border border-primary-800 bg-primary-900 p-6 transition-colors group-hover:border-primary-500/50"${_scopeId}><div class="mb-3 flex items-center justify-between text-xs text-primary-500" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"${_scopeId}><span${_scopeId}>proj_${ssrInterpolate(String(idx + 1).padStart(2, "0"))}</span>`);
                    if (hasLink) {
                      _push2(`<span class="inline-flex items-center gap-1 text-primary-400"${_scopeId}><span class="material-symbols-outlined text-sm"${_scopeId}>open_in_new</span></span>`);
                    } else {
                      _push2(`<span class="text-primary-500"${_scopeId}>// deployed</span>`);
                    }
                    _push2(`</div><h3 class="text-lg font-semibold text-primary-100"${_scopeId}>${ssrInterpolate(project.title)}</h3>`);
                    if (project.description) {
                      _push2(`<p class="mt-2 text-sm leading-relaxed text-primary-400"${_scopeId}>${ssrInterpolate(project.description)}</p>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    if ((_a3 = project.tech_stack) == null ? void 0 : _a3.length) {
                      _push2(`<div class="mt-4 flex flex-wrap gap-2"${_scopeId}><!--[-->`);
                      ssrRenderList(project.tech_stack, (tech) => {
                        _push2(`<code class="rounded border border-primary-500/30 bg-primary-500/10 px-2 py-1 text-xs text-primary-300" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"${_scopeId}>${ssrInterpolate(tech)}</code>`);
                      });
                      _push2(`<!--]--></div>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    if (hasLink) {
                      _push2(`<p class="mt-4 text-xs font-semibold text-primary-400" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"${_scopeId}> open_project() \u2192 </p>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(`</div>`);
                  } else {
                    return [
                      createVNode("div", { class: "h-full rounded-lg border border-primary-800 bg-primary-900 p-6 transition-colors group-hover:border-primary-500/50" }, [
                        createVNode("div", {
                          class: "mb-3 flex items-center justify-between text-xs text-primary-500",
                          style: { "font-family": "'JetBrains Mono',monospace" }
                        }, [
                          createVNode("span", null, "proj_" + toDisplayString(String(idx + 1).padStart(2, "0")), 1),
                          hasLink ? (openBlock(), createBlock("span", {
                            key: 0,
                            class: "inline-flex items-center gap-1 text-primary-400"
                          }, [
                            createVNode("span", { class: "material-symbols-outlined text-sm" }, "open_in_new")
                          ])) : (openBlock(), createBlock("span", {
                            key: 1,
                            class: "text-primary-500"
                          }, "// deployed"))
                        ]),
                        createVNode("h3", { class: "text-lg font-semibold text-primary-100" }, toDisplayString(project.title), 1),
                        project.description ? (openBlock(), createBlock("p", {
                          key: 0,
                          class: "mt-2 text-sm leading-relaxed text-primary-400"
                        }, toDisplayString(project.description), 1)) : createCommentVNode("", true),
                        ((_b3 = project.tech_stack) == null ? void 0 : _b3.length) ? (openBlock(), createBlock("div", {
                          key: 1,
                          class: "mt-4 flex flex-wrap gap-2"
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(project.tech_stack, (tech) => {
                            return openBlock(), createBlock("code", {
                              key: tech,
                              class: "rounded border border-primary-500/30 bg-primary-500/10 px-2 py-1 text-xs text-primary-300",
                              style: { "font-family": "'JetBrains Mono',monospace" }
                            }, toDisplayString(tech), 1);
                          }), 128))
                        ])) : createCommentVNode("", true),
                        hasLink ? (openBlock(), createBlock("p", {
                          key: 2,
                          class: "mt-4 text-xs font-semibold text-primary-400",
                          style: { "font-family": "'JetBrains Mono',monospace" }
                        }, " open_project() \u2192 ")) : createCommentVNode("", true)
                      ])
                    ];
                  }
                }),
                _: 2
              }, _parent));
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></section>`);
        } else if (section.kind === "skills") {
          _push(`<section id="skills" class="border-t border-primary-800 bg-primary-900/30 px-6 py-24"><div class="mx-auto max-w-6xl"><p class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"> // 03 </p><h2 class="text-3xl font-bold text-primary-50" style="${ssrRenderStyle({ "font-family": "'Playfair Display',serif" })}"> Core Competencies </h2>`);
          if ((_b22 = __props.data.core_skills) == null ? void 0 : _b22.length) {
            _push(`<div class="mt-10 flex flex-wrap gap-3"><!--[-->`);
            ssrRenderList(__props.data.core_skills, (skill) => {
              _push(`<span class="flex items-center gap-2 rounded border border-primary-700 bg-primary-950 px-4 py-2 text-sm text-primary-300" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"><span class="material-symbols-outlined text-sm text-primary-500">check_small</span> ${ssrInterpolate(skill)}</span>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></section>`);
        } else {
          _push(`<section${ssrRenderAttr("id", `section-${section.key}`)} class="border-t border-primary-800 bg-primary-950 px-6 py-24"><div class="mx-auto max-w-6xl"><p class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"> // custom </p><h2 class="text-3xl font-bold text-primary-50" style="${ssrRenderStyle({ "font-family": "'Playfair Display',serif" })}">${ssrInterpolate(section.title)}</h2>`);
          if ((_d2 = (_c2 = section.custom) == null ? void 0 : _c2.content) == null ? void 0 : _d2.trim()) {
            _push(`<div class="mt-8 max-w-3xl space-y-4"><!--[-->`);
            ssrRenderList(section.custom.content.split(/\n{2,}/), (paragraph, pIdx) => {
              _push(`<p class="text-base leading-relaxed text-primary-400">${ssrInterpolate(paragraph)}</p>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></section>`);
        }
        _push(`<!--]-->`);
      });
      _push(`<!--]--><footer id="contact" class="border-t border-primary-800 bg-primary-950 px-6 py-24"><div class="mx-auto max-w-3xl text-center"><p class="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"> // 04 -- deploy_contact </p><h2 class="text-3xl font-bold text-primary-50 sm:text-4xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display',serif" })}"> Let&#39;s architect something reliable. </h2><p class="mx-auto mt-4 max-w-xl text-sm text-primary-400"> Open to systems design, infrastructure, and distributed-platform engagements. </p><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="mt-8 inline-flex items-center gap-2 rounded bg-primary-500 px-6 py-3 text-sm font-semibold text-primary-950 transition-colors hover:bg-primary-400" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"><span class="material-symbols-outlined text-base">terminal</span> initiate_contact() </a>`);
      _push(ssrRenderComponent(_component_PortfolioContactLinks, {
        data: __props.data,
        variant: "row",
        "class-name": "mt-10 justify-center text-primary-400 [&_a]:text-primary-300"
      }, null, _parent));
      _push(`<div class="mt-16 flex items-center justify-center gap-3 text-xs text-primary-600" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"><span class="flex h-8 w-8 items-center justify-center rounded-full border border-primary-700 text-primary-400">${ssrInterpolate(unref(initials))}</span><span>${ssrInterpolate(__props.data.full_name)} \u2014 systems architecture</span></div></div></footer></div>`);
    };
  }
});
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/portfolio/templates/TheArchitect.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const _sfc_main$7 = /* @__PURE__ */ defineComponent({
  __name: "TheDirector",
  __ssrInlineRender: true,
  props: {
    data: {}
  },
  setup(__props) {
    const props = __props;
    const sections = computed(
      () => orderedBodySections(props.data, { projects: "The Body of Work", skills: "Areas of Mastery" })
    );
    const initials = computed(() => {
      const parts = props.data.full_name.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) return "AD";
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    });
    computed(() => {
      const parts = props.data.full_name.trim().split(/\s+/).filter(Boolean);
      return parts[0] || props.data.full_name;
    });
    const bioSentences = computed(() => {
      const text = props.data.professional_bio.trim();
      const matches = text.match(/[^.!?]+[.!?]*/g);
      return matches ? matches.map((s) => s.trim()).filter(Boolean) : [];
    });
    const heroLead = computed(() => bioSentences.value[0] || props.data.professional_bio);
    const pullQuote = computed(
      () => bioSentences.value[1] || bioSentences.value[0] || props.data.professional_bio
    );
    const leadDiscipline = computed(() => props.data.core_skills[0] || "Creative Direction");
    const primaryCta = computed(() => portfolioContactCta());
    function pad(index) {
      return String(index + 1).padStart(2, "0");
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d;
      const _component_PortfolioProjectLink = _sfc_main$c;
      const _component_PortfolioContactLinks = _sfc_main$b;
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "min-h-screen w-full bg-[#f5f5f0] text-stone-900 antialiased",
        style: { "font-family": "ui-serif, Georgia, serif" }
      }, _attrs))} data-v-8fc704dc><header class="sticky top-0 z-40 border-b border-primary-800/15 bg-[#f5f5f0]/90 backdrop-blur-sm" data-v-8fc704dc><nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10" data-v-8fc704dc><a href="#top" class="text-sm tracking-[0.25em] uppercase" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}" data-v-8fc704dc>${ssrInterpolate(__props.data.full_name)}</a><div class="flex items-center gap-8" data-v-8fc704dc><a href="#work" class="hidden text-xs tracking-[0.2em] text-stone-600 uppercase transition hover:text-primary-700 sm:inline" data-v-8fc704dc>${ssrInterpolate(((_a = __props.data.button_texts) == null ? void 0 : _a.nav_projects) || `<a
            href="#work"
            class="hidden text-xs tracking-[0.2em] text-stone-600 uppercase transition hover:text-primary-700 sm:inline"
          >
            Work
          </a>`.replace(/<[^>]+>/g, "").trim())}</a><a href="#skills" class="hidden text-xs tracking-[0.2em] text-stone-600 uppercase transition hover:text-primary-700 sm:inline" data-v-8fc704dc>${ssrInterpolate(((_b = __props.data.button_texts) == null ? void 0 : _b.nav_skills) || `<a
            href="#skills"
            class="hidden text-xs tracking-[0.2em] text-stone-600 uppercase transition hover:text-primary-700 sm:inline"
          >
            Skills
          </a>`.replace(/<[^>]+>/g, "").trim())}</a><a href="#contact" class="hidden text-xs tracking-[0.2em] text-stone-600 uppercase transition hover:text-primary-700 sm:inline" data-v-8fc704dc>${ssrInterpolate(((_c = __props.data.button_texts) == null ? void 0 : _c.contact_cta) || __props.data.cta_text || "Contact")}</a><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="inline-flex items-center gap-1.5 border border-stone-900 px-4 py-2 text-xs tracking-[0.15em] uppercase transition hover:bg-stone-900 hover:text-[#f5f5f0]" data-v-8fc704dc> Contact <span class="material-symbols-outlined text-sm" data-v-8fc704dc>north_east</span></a></div></nav></header><section id="top" class="mx-auto max-w-6xl px-6 pt-16 pb-24 sm:px-10 sm:pt-24" data-v-8fc704dc><div class="grid grid-cols-1 items-center gap-16 lg:grid-cols-[1.15fr_0.85fr]" data-v-8fc704dc><div data-v-8fc704dc><p class="mb-6 flex items-center gap-3 text-xs tracking-[0.35em] text-primary-700 uppercase" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}" data-v-8fc704dc><span class="h-px w-10 bg-primary-700/60" data-v-8fc704dc></span> A Portfolio By </p><h1 class="text-6xl leading-[0.95] font-medium tracking-tight sm:text-7xl lg:text-8xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}" data-v-8fc704dc>${ssrInterpolate(__props.data.full_name)}</h1><p class="mt-6 text-2xl text-stone-700 italic sm:text-3xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}" data-v-8fc704dc> Orchestrating ${ssrInterpolate(unref(leadDiscipline))} Narratives. </p>`);
      if (unref(heroLead)) {
        _push(`<p class="mt-8 max-w-lg text-base leading-relaxed text-stone-600" data-v-8fc704dc>${ssrInterpolate(unref(heroLead))}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="mt-10 flex flex-wrap items-center gap-6" data-v-8fc704dc><a href="#work" class="inline-flex items-center gap-2 bg-stone-900 px-6 py-3 text-xs tracking-[0.2em] text-[#f5f5f0] uppercase transition hover:bg-primary-800" data-v-8fc704dc> View the Work <span class="material-symbols-outlined text-sm" data-v-8fc704dc>arrow_forward</span></a><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="inline-flex items-center gap-2 text-xs tracking-[0.2em] text-stone-700 uppercase underline decoration-amber-700/50 underline-offset-8 transition hover:text-primary-800" data-v-8fc704dc> Get in Touch </a></div></div><div class="mx-auto w-full max-w-[320px]" data-v-8fc704dc><div class="relative aspect-[3/4] w-full border border-primary-700/40 p-3" data-v-8fc704dc><div class="pointer-events-none absolute top-2 left-2 h-4 w-4 border-t border-l border-primary-700/60" data-v-8fc704dc></div><div class="pointer-events-none absolute top-2 right-2 h-4 w-4 border-t border-r border-primary-700/60" data-v-8fc704dc></div><div class="pointer-events-none absolute bottom-2 left-2 h-4 w-4 border-b border-l border-primary-700/60" data-v-8fc704dc></div><div class="pointer-events-none absolute right-2 bottom-2 h-4 w-4 border-r border-b border-primary-700/60" data-v-8fc704dc></div><div class="flex h-full w-full items-center justify-center" style="${ssrRenderStyle({ "background": "radial-gradient(\n                    ellipse at 50% 30%,\n                    rgba(217, 160, 89, 0.16),\n                    transparent 65%\n                  ),\n                  linear-gradient(160deg, #eae7de 0%, #d8d3c6 55%, #c9c2b0 100%)" })}" data-v-8fc704dc><span class="text-7xl text-stone-800/70" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}" data-v-8fc704dc>${ssrInterpolate(unref(initials))}</span></div></div><p class="mt-4 text-center text-[11px] tracking-[0.3em] text-stone-500 uppercase" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}" data-v-8fc704dc>${ssrInterpolate(__props.data.full_name)} \u2014 ${ssrInterpolate(unref(leadDiscipline))}</p></div></div></section><section class="border-t border-primary-800/15" data-v-8fc704dc><div class="mx-auto max-w-6xl px-6 py-24 sm:px-10" data-v-8fc704dc><p class="mb-10 text-xs tracking-[0.35em] text-primary-700 uppercase" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}" data-v-8fc704dc>${ssrInterpolate(((_d = __props.data.section_titles) == null ? void 0 : _d.profile) || "Leadership & Legacy")}</p><div class="grid grid-cols-1 gap-14 lg:grid-cols-2" data-v-8fc704dc><p class="director-dropcap text-lg leading-relaxed text-stone-700" data-v-8fc704dc>${ssrInterpolate(__props.data.professional_bio)}</p><div class="border-l border-primary-800/25 pl-8" data-v-8fc704dc><p class="text-xs tracking-[0.3em] text-stone-500 uppercase" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}" data-v-8fc704dc> Philosophy </p><p class="mt-4 text-2xl leading-snug text-stone-800 italic" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}" data-v-8fc704dc> \u201C${ssrInterpolate(unref(pullQuote))}\u201D </p><p class="mt-6 text-sm tracking-[0.2em] text-stone-500 uppercase" data-v-8fc704dc> \u2014 ${ssrInterpolate(__props.data.full_name)}</p></div></div></div></section><!--[-->`);
      ssrRenderList(unref(sections), (section) => {
        var _a2, _b2;
        _push(`<!--[-->`);
        if (section.kind === "projects") {
          _push(`<section id="work" class="border-t border-primary-800/15" data-v-8fc704dc><div class="mx-auto max-w-6xl px-6 py-24 sm:px-10" data-v-8fc704dc><div class="mb-16 flex items-end justify-between" data-v-8fc704dc><div data-v-8fc704dc><p class="mb-4 text-xs tracking-[0.35em] text-primary-700 uppercase" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}" data-v-8fc704dc> Selected Work </p><h2 class="text-4xl sm:text-5xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}" data-v-8fc704dc>${ssrInterpolate(section.title)}</h2></div></div>`);
          if (__props.data.formatted_projects && __props.data.formatted_projects.length) {
            _push(`<div data-v-8fc704dc><!--[-->`);
            ssrRenderList(__props.data.formatted_projects, (project, index) => {
              _push(ssrRenderComponent(_component_PortfolioProjectLink, {
                key: project.title + index,
                project,
                index
              }, {
                default: withCtx(({ hasLink }, _push2, _parent2, _scopeId) => {
                  if (_push2) {
                    _push2(`<div class="grid grid-cols-1 gap-6 border-t border-primary-800/15 py-12 first:border-t-0 md:grid-cols-[auto_1fr] md:gap-12" data-v-8fc704dc${_scopeId}><span class="text-sm text-primary-700" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}" data-v-8fc704dc${_scopeId}>${ssrInterpolate(pad(index))}</span><div class="${ssrRenderClass(index % 2 === 1 ? "md:text-right" : "")}" data-v-8fc704dc${_scopeId}><div class="${ssrRenderClass([index % 2 === 1 ? "md:flex-row-reverse" : "", "flex items-start gap-3"])}" data-v-8fc704dc${_scopeId}><h3 class="text-3xl leading-tight sm:text-4xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}" data-v-8fc704dc${_scopeId}>${ssrInterpolate(project.title)}</h3>`);
                    if (hasLink) {
                      _push2(`<span class="material-symbols-outlined mt-2 shrink-0 text-primary-700" aria-hidden="true" data-v-8fc704dc${_scopeId}> open_in_new </span>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(`</div><p class="${ssrRenderClass([index % 2 === 1 ? "md:ml-auto" : "", "mt-4 max-w-2xl text-base leading-relaxed text-stone-600"])}" data-v-8fc704dc${_scopeId}>${ssrInterpolate(project.description)}</p>`);
                    if (project.tech_stack && project.tech_stack.length) {
                      _push2(`<div class="${ssrRenderClass([index % 2 === 1 ? "md:justify-end" : "", "mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[11px] tracking-[0.25em] text-stone-500 uppercase"])}" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}" data-v-8fc704dc${_scopeId}><!--[-->`);
                      ssrRenderList(project.tech_stack, (tech) => {
                        _push2(`<span data-v-8fc704dc${_scopeId}>${ssrInterpolate(tech)}</span>`);
                      });
                      _push2(`<!--]--></div>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    if (hasLink) {
                      _push2(`<p class="${ssrRenderClass([index % 2 === 1 ? "md:text-right" : "", "mt-4 text-xs tracking-[0.2em] text-primary-700 uppercase"])}" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}" data-v-8fc704dc${_scopeId}> Open project \u2192 </p>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(`</div></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "grid grid-cols-1 gap-6 border-t border-primary-800/15 py-12 first:border-t-0 md:grid-cols-[auto_1fr] md:gap-12" }, [
                        createVNode("span", {
                          class: "text-sm text-primary-700",
                          style: { "font-family": "'JetBrains Mono', monospace" }
                        }, toDisplayString(pad(index)), 1),
                        createVNode("div", {
                          class: index % 2 === 1 ? "md:text-right" : ""
                        }, [
                          createVNode("div", {
                            class: ["flex items-start gap-3", index % 2 === 1 ? "md:flex-row-reverse" : ""]
                          }, [
                            createVNode("h3", {
                              class: "text-3xl leading-tight sm:text-4xl",
                              style: { "font-family": "'Playfair Display', serif" }
                            }, toDisplayString(project.title), 1),
                            hasLink ? (openBlock(), createBlock("span", {
                              key: 0,
                              class: "material-symbols-outlined mt-2 shrink-0 text-primary-700",
                              "aria-hidden": "true"
                            }, " open_in_new ")) : createCommentVNode("", true)
                          ], 2),
                          createVNode("p", {
                            class: ["mt-4 max-w-2xl text-base leading-relaxed text-stone-600", index % 2 === 1 ? "md:ml-auto" : ""]
                          }, toDisplayString(project.description), 3),
                          project.tech_stack && project.tech_stack.length ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: ["mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[11px] tracking-[0.25em] text-stone-500 uppercase", index % 2 === 1 ? "md:justify-end" : ""],
                            style: { "font-family": "'JetBrains Mono', monospace" }
                          }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(project.tech_stack, (tech) => {
                              return openBlock(), createBlock("span", { key: tech }, toDisplayString(tech), 1);
                            }), 128))
                          ], 2)) : createCommentVNode("", true),
                          hasLink ? (openBlock(), createBlock("p", {
                            key: 1,
                            class: ["mt-4 text-xs tracking-[0.2em] text-primary-700 uppercase", index % 2 === 1 ? "md:text-right" : ""],
                            style: { "font-family": "'JetBrains Mono', monospace" }
                          }, " Open project \u2192 ", 2)) : createCommentVNode("", true)
                        ], 2)
                      ])
                    ];
                  }
                }),
                _: 2
              }, _parent));
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></section>`);
        } else if (section.kind === "skills") {
          _push(`<section id="skills" class="border-t border-primary-800/15 bg-stone-900/[0.02]" data-v-8fc704dc><div class="mx-auto max-w-6xl px-6 py-24 sm:px-10" data-v-8fc704dc><p class="mb-4 text-xs tracking-[0.35em] text-primary-700 uppercase" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}" data-v-8fc704dc> Capabilities </p><h2 class="mb-14 text-4xl sm:text-5xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}" data-v-8fc704dc>${ssrInterpolate(section.title)}</h2>`);
          if (__props.data.core_skills && __props.data.core_skills.length) {
            _push(`<ul class="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3" data-v-8fc704dc><!--[-->`);
            ssrRenderList(__props.data.core_skills, (skill, index) => {
              _push(`<li class="flex items-center gap-4 border-b border-primary-800/15 pb-4" data-v-8fc704dc><span class="text-xs text-primary-700" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}" data-v-8fc704dc>${ssrInterpolate(pad(index))}</span><span class="text-sm tracking-[0.15em] text-stone-800 uppercase" data-v-8fc704dc>${ssrInterpolate(skill)}</span></li>`);
            });
            _push(`<!--]--></ul>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></section>`);
        } else {
          _push(`<section${ssrRenderAttr("id", `section-${section.key}`)} class="border-t border-primary-800/15" data-v-8fc704dc><div class="mx-auto max-w-6xl px-6 py-24 sm:px-10" data-v-8fc704dc><h2 class="mb-6 text-4xl sm:text-5xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}" data-v-8fc704dc>${ssrInterpolate(section.title)}</h2><span class="mb-10 block h-px w-16 bg-primary-700/60" data-v-8fc704dc></span>`);
          if ((_b2 = (_a2 = section.custom) == null ? void 0 : _a2.content) == null ? void 0 : _b2.trim()) {
            _push(`<div class="max-w-2xl space-y-6" data-v-8fc704dc><!--[-->`);
            ssrRenderList(section.custom.content.trim().split(/\n{2,}/), (paragraph, pIndex) => {
              _push(`<p class="text-base leading-relaxed text-stone-600" data-v-8fc704dc>${ssrInterpolate(paragraph)}</p>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></section>`);
        }
        _push(`<!--]-->`);
      });
      _push(`<!--]--><footer id="contact" class="border-t border-primary-800/15" data-v-8fc704dc><div class="mx-auto max-w-6xl px-6 py-24 text-center sm:px-10" data-v-8fc704dc><p class="text-4xl leading-snug sm:text-5xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}" data-v-8fc704dc> Let&#39;s build the next classic. </p><p class="mx-auto mt-6 max-w-md text-base text-stone-600" data-v-8fc704dc>${ssrInterpolate(__props.data.full_name)} is currently open to new collaborations, commissions, and creative partnerships. </p><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="mt-10 inline-flex items-center gap-2 border border-stone-900 bg-stone-900 px-6 py-3 text-xs tracking-[0.2em] text-[#f5f5f0] uppercase transition hover:bg-primary-800 hover:border-primary-800" data-v-8fc704dc> Get in Touch <span class="material-symbols-outlined text-sm" data-v-8fc704dc>north_east</span></a>`);
      _push(ssrRenderComponent(_component_PortfolioContactLinks, {
        data: __props.data,
        variant: "row",
        "class-name": "mt-10 justify-center text-stone-600 [&_a]:text-primary-800"
      }, null, _parent));
      _push(`<div class="mt-10 flex flex-wrap items-center justify-center gap-8" data-v-8fc704dc><a href="#work" class="text-xs tracking-[0.2em] text-stone-600 uppercase transition hover:text-primary-700" data-v-8fc704dc> Review the Work </a><a href="#skills" class="text-xs tracking-[0.2em] text-stone-600 uppercase transition hover:text-primary-700" data-v-8fc704dc> See Capabilities </a><a href="#top" class="inline-flex items-center gap-2 border border-stone-900 px-6 py-3 text-xs tracking-[0.2em] text-stone-900 uppercase transition hover:bg-stone-900 hover:text-[#f5f5f0]" data-v-8fc704dc> Back to Top <span class="material-symbols-outlined text-sm" data-v-8fc704dc>north</span></a></div><p class="mt-16 text-[11px] tracking-[0.3em] text-stone-400 uppercase" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}" data-v-8fc704dc>${ssrInterpolate(__props.data.full_name)} \xB7 Portfolio Edition </p></div></footer></div>`);
    };
  }
});
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/portfolio/templates/TheDirector.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const TheDirector = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["__scopeId", "data-v-8fc704dc"]]);
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "TheLeader",
  __ssrInlineRender: true,
  props: {
    data: {}
  },
  setup(__props) {
    const props = __props;
    const sections = computed(
      () => orderedBodySections(props.data, { projects: "Leadership Highlights", skills: "Core Competencies" })
    );
    const initials = computed(() => {
      var _a;
      const parts = ((_a = props.data.full_name) != null ? _a : "").trim().split(/\s+/).filter(Boolean);
      if (!parts.length) return "";
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    });
    const tagline = computed(() => {
      var _a2, _b;
      var _a;
      const bio = (_a2 = (_a = props.data.professional_bio) == null ? void 0 : _a.trim()) != null ? _a2 : "";
      if (!bio) return "";
      const firstClause = (_b = bio.split(new RegExp("(?<=[.!?])\\s"))[0]) != null ? _b : bio;
      return firstClause.replace(/[.,;:]+$/, "");
    });
    const primaryCta = computed(() => portfolioContactCta());
    function pad(index) {
      return String(index + 1).padStart(2, "0");
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d;
      const _component_PortfolioProjectLink = _sfc_main$c;
      const _component_PortfolioContactLinks = _sfc_main$b;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-[#0f172a] text-primary-200" }, _attrs))}><header class="sticky top-0 z-40 border-b border-primary-400/10 bg-[#0f172a]/95 backdrop-blur"><nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10"><a href="#top" class="text-sm tracking-[0.25em] text-primary-100 uppercase transition hover:text-primary-400" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}">${ssrInterpolate(__props.data.full_name)}</a><div class="flex items-center gap-8 sm:gap-10"><a href="#work" class="text-[11px] tracking-[0.25em] text-primary-400 uppercase transition hover:text-primary-400" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}">${ssrInterpolate(((_a = __props.data.button_texts) == null ? void 0 : _a.nav_projects) || `<a
            href="#work"
            class="text-[11px] tracking-[0.25em] text-primary-400 uppercase transition hover:text-primary-400"
            style="font-family: 'JetBrains Mono', monospace"
          >
            Work
          </a>`.replace(/<[^>]+>/g, "").trim())}</a><a href="#skills" class="text-[11px] tracking-[0.25em] text-primary-400 uppercase transition hover:text-primary-400" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}">${ssrInterpolate(((_b = __props.data.button_texts) == null ? void 0 : _b.nav_skills) || `<a
            href="#skills"
            class="text-[11px] tracking-[0.25em] text-primary-400 uppercase transition hover:text-primary-400"
            style="font-family: 'JetBrains Mono', monospace"
          >
            Skills
          </a>`.replace(/<[^>]+>/g, "").trim())}</a><a href="#contact" class="hidden text-[11px] tracking-[0.25em] text-primary-400 uppercase transition hover:text-primary-400 sm:inline" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}">${ssrInterpolate(((_c = __props.data.button_texts) == null ? void 0 : _c.contact_cta) || __props.data.cta_text || "Contact")}</a><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="rounded-full border border-primary-400/50 px-5 py-2 text-[11px] tracking-[0.2em] text-primary-400 uppercase transition hover:border-primary-400 hover:bg-primary-400/10" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}"> Contact </a></div></nav></header><section id="top" class="relative mx-auto flex max-w-4xl flex-col items-center px-6 pt-28 pb-24 text-center sm:px-10 sm:pt-36 sm:pb-32"><div class="pointer-events-none absolute top-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-20 blur-3xl" style="${ssrRenderStyle({ "background": "radial-gradient(circle, #fbbf24 0%, transparent 70%)" })}" aria-hidden="true"></div><div class="relative mb-10 flex items-center gap-4"><span class="h-px w-10 bg-gradient-to-r from-transparent to-primary-400/70"></span><span class="material-symbols-outlined text-sm text-primary-400/80">workspace_premium</span><span class="h-px w-10 bg-gradient-to-l from-transparent to-primary-400/70"></span></div>`);
      if (unref(initials)) {
        _push(`<div class="relative mb-10 flex h-40 w-40 items-center justify-center rounded-full sm:h-48 sm:w-48"><div class="absolute inset-0 rounded-full" style="${ssrRenderStyle({ "background": "radial-gradient(circle at 35% 30%, #1e293b 0%, #0f172a 70%)", "box-shadow": "inset 0 0 0 1px rgba(251, 191, 36, 0.35),\n              0 0 60px rgba(251, 191, 36, 0.12)" })}"></div><div class="absolute inset-[6px] rounded-full border border-primary-400/60"></div><span class="relative text-4xl tracking-wide text-primary-300 sm:text-5xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}">${ssrInterpolate(unref(initials))}</span></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<h1 class="relative text-4xl leading-tight font-normal text-primary-50 sm:text-6xl md:text-7xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}">${ssrInterpolate(__props.data.full_name)}</h1>`);
      if (unref(tagline)) {
        _push(`<p class="relative mt-6 max-w-xl text-sm tracking-[0.08em] text-primary-400 sm:text-base">${ssrInterpolate(unref(tagline))}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="relative mt-12 flex items-center gap-4"><span class="h-px w-16 bg-gradient-to-r from-transparent to-primary-400/50"></span><span class="h-1.5 w-1.5 rotate-45 bg-primary-400/70"></span><span class="h-px w-16 bg-gradient-to-l from-transparent to-primary-400/50"></span></div><div class="relative mt-12 flex flex-wrap items-center justify-center gap-4"><a href="#work" class="inline-flex items-center gap-2 rounded-full bg-primary-400 px-7 py-3 text-xs font-medium tracking-[0.2em] text-primary-900 uppercase transition hover:bg-primary-300" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}"><span>Leadership highlights</span><span class="material-symbols-outlined text-sm">arrow_forward</span></a><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="inline-flex items-center gap-2 rounded-full border border-primary-400/40 px-7 py-3 text-xs tracking-[0.2em] text-primary-300 uppercase transition hover:border-primary-400 hover:bg-primary-400/10" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}"><span>Get in touch</span></a></div></section>`);
      if (__props.data.professional_bio) {
        _push(`<section class="border-t border-primary-400/10 px-6 py-24 sm:px-10 sm:py-28"><div class="mx-auto max-w-3xl text-center"><p class="mb-8 text-xs tracking-[0.4em] text-primary-400/80 uppercase" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}">${ssrInterpolate(((_d = __props.data.section_titles) == null ? void 0 : _d.profile) || "Executive Summary")}</p><p class="text-xl leading-[1.9] text-primary-300 sm:text-2xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}">${ssrInterpolate(__props.data.professional_bio)}</p></div></section>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(unref(sections), (section) => {
        _push(`<!--[-->`);
        if (section.kind === "projects") {
          _push(`<section id="work" class="border-t border-primary-400/10 px-6 py-24 sm:px-10 sm:py-28"><div class="mx-auto max-w-5xl"><div class="mb-16 text-center"><p class="mb-4 text-xs tracking-[0.4em] text-primary-400/80 uppercase" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}"> Track Record </p><h2 class="text-3xl text-primary-50 sm:text-4xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}">${ssrInterpolate(section.title)}</h2></div><div class="grid gap-8 sm:grid-cols-2"><!--[-->`);
          ssrRenderList(__props.data.formatted_projects, (project, index) => {
            _push(ssrRenderComponent(_component_PortfolioProjectLink, {
              key: project.title + index,
              project,
              index
            }, {
              default: withCtx(({ hasLink }, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<div class="group relative h-full rounded-sm border border-primary-400/20 bg-white/[0.02] p-8 transition group-hover:border-primary-400/50 group-hover:bg-white/[0.04]"${_scopeId}><span class="absolute top-0 left-0 h-4 w-4 border-t border-l border-primary-400/60"${_scopeId}></span><span class="absolute top-0 right-0 h-4 w-4 border-t border-r border-primary-400/60"${_scopeId}></span><span class="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-primary-400/60"${_scopeId}></span><span class="absolute right-0 bottom-0 h-4 w-4 border-r border-b border-primary-400/60"${_scopeId}></span><div class="mb-4 flex items-center justify-between"${_scopeId}><span class="block text-[11px] tracking-[0.3em] text-primary-400/60" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}"${_scopeId}>${ssrInterpolate(pad(index))}</span>`);
                  if (hasLink) {
                    _push2(`<span class="material-symbols-outlined text-primary-400/70" aria-hidden="true"${_scopeId}> open_in_new </span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div><h3 class="mb-4 text-2xl text-primary-50" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}"${_scopeId}>${ssrInterpolate(project.title)}</h3>`);
                  if (project.description) {
                    _push2(`<p class="mb-6 text-[15px] leading-relaxed text-primary-400"${_scopeId}>${ssrInterpolate(project.description)}</p>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  if (project.tech_stack && project.tech_stack.length) {
                    _push2(`<div class="flex flex-wrap gap-2"${_scopeId}><!--[-->`);
                    ssrRenderList(project.tech_stack, (tech) => {
                      _push2(`<span class="rounded-full border border-primary-400/25 px-3 py-1 text-[10px] tracking-[0.15em] text-primary-300/90 uppercase" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}"${_scopeId}>${ssrInterpolate(tech)}</span>`);
                    });
                    _push2(`<!--]--></div>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  if (hasLink) {
                    _push2(`<p class="mt-5 text-[11px] tracking-[0.2em] text-primary-400 uppercase" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}"${_scopeId}> Open project \u2192 </p>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div>`);
                } else {
                  return [
                    createVNode("div", { class: "group relative h-full rounded-sm border border-primary-400/20 bg-white/[0.02] p-8 transition group-hover:border-primary-400/50 group-hover:bg-white/[0.04]" }, [
                      createVNode("span", { class: "absolute top-0 left-0 h-4 w-4 border-t border-l border-primary-400/60" }),
                      createVNode("span", { class: "absolute top-0 right-0 h-4 w-4 border-t border-r border-primary-400/60" }),
                      createVNode("span", { class: "absolute bottom-0 left-0 h-4 w-4 border-b border-l border-primary-400/60" }),
                      createVNode("span", { class: "absolute right-0 bottom-0 h-4 w-4 border-r border-b border-primary-400/60" }),
                      createVNode("div", { class: "mb-4 flex items-center justify-between" }, [
                        createVNode("span", {
                          class: "block text-[11px] tracking-[0.3em] text-primary-400/60",
                          style: { "font-family": "'JetBrains Mono', monospace" }
                        }, toDisplayString(pad(index)), 1),
                        hasLink ? (openBlock(), createBlock("span", {
                          key: 0,
                          class: "material-symbols-outlined text-primary-400/70",
                          "aria-hidden": "true"
                        }, " open_in_new ")) : createCommentVNode("", true)
                      ]),
                      createVNode("h3", {
                        class: "mb-4 text-2xl text-primary-50",
                        style: { "font-family": "'Playfair Display', serif" }
                      }, toDisplayString(project.title), 1),
                      project.description ? (openBlock(), createBlock("p", {
                        key: 0,
                        class: "mb-6 text-[15px] leading-relaxed text-primary-400"
                      }, toDisplayString(project.description), 1)) : createCommentVNode("", true),
                      project.tech_stack && project.tech_stack.length ? (openBlock(), createBlock("div", {
                        key: 1,
                        class: "flex flex-wrap gap-2"
                      }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(project.tech_stack, (tech) => {
                          return openBlock(), createBlock("span", {
                            key: tech,
                            class: "rounded-full border border-primary-400/25 px-3 py-1 text-[10px] tracking-[0.15em] text-primary-300/90 uppercase",
                            style: { "font-family": "'JetBrains Mono', monospace" }
                          }, toDisplayString(tech), 1);
                        }), 128))
                      ])) : createCommentVNode("", true),
                      hasLink ? (openBlock(), createBlock("p", {
                        key: 2,
                        class: "mt-5 text-[11px] tracking-[0.2em] text-primary-400 uppercase",
                        style: { "font-family": "'JetBrains Mono', monospace" }
                      }, " Open project \u2192 ")) : createCommentVNode("", true)
                    ])
                  ];
                }
              }),
              _: 2
            }, _parent));
          });
          _push(`<!--]--></div></div></section>`);
        } else if (section.kind === "skills") {
          _push(`<section id="skills" class="border-t border-primary-400/10 px-6 py-24 sm:px-10 sm:py-28"><div class="mx-auto max-w-4xl"><div class="mb-16 text-center"><p class="mb-4 text-xs tracking-[0.4em] text-primary-400/80 uppercase" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}"> Expertise </p><h2 class="text-3xl text-primary-50 sm:text-4xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}">${ssrInterpolate(section.title)}</h2></div><div class="grid grid-cols-1 gap-x-12 gap-y-5 sm:grid-cols-2"><!--[-->`);
          ssrRenderList(__props.data.core_skills, (skill) => {
            _push(`<div class="flex items-center gap-4 border-b border-primary-400/10 pb-5"><span class="h-1.5 w-1.5 shrink-0 rotate-45 bg-primary-400"></span><span class="text-base tracking-wide text-primary-300 sm:text-lg">${ssrInterpolate(skill)}</span></div>`);
          });
          _push(`<!--]--></div></div></section>`);
        } else if (section.custom && section.custom.content && section.custom.content.trim()) {
          _push(`<section${ssrRenderAttr("id", `section-${section.key}`)} class="border-t border-primary-400/10 px-6 py-24 sm:px-10 sm:py-28"><div class="mx-auto max-w-3xl text-center"><div class="mb-16 flex items-center justify-center gap-4"><span class="h-px w-10 bg-gradient-to-r from-transparent to-primary-400/70"></span><span class="material-symbols-outlined text-sm text-primary-400/80">workspace_premium</span><span class="h-px w-10 bg-gradient-to-l from-transparent to-primary-400/70"></span></div><h2 class="mb-10 text-3xl text-primary-50 sm:text-4xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}">${ssrInterpolate(section.title)}</h2><div class="space-y-6 text-left"><!--[-->`);
          ssrRenderList(section.custom.content.split(/\n{2,}/), (paragraph, index) => {
            _push(`<p class="text-lg leading-[1.9] text-primary-300" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}">${ssrInterpolate(paragraph)}</p>`);
          });
          _push(`<!--]--></div></div></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--]-->`);
      });
      _push(`<!--]--><footer id="contact" class="relative border-t border-primary-400/10 px-6 py-24 sm:px-10 sm:py-32"><div class="pointer-events-none absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full opacity-15 blur-3xl" style="${ssrRenderStyle({ "background": "radial-gradient(circle, #fbbf24 0%, transparent 70%)" })}" aria-hidden="true"></div><div class="relative mx-auto flex max-w-3xl flex-col items-center gap-8 text-center"><div class="flex items-center gap-4"><span class="h-px w-10 bg-gradient-to-r from-transparent to-primary-400/70"></span><span class="material-symbols-outlined text-sm text-primary-400/80">workspace_premium</span><span class="h-px w-10 bg-gradient-to-l from-transparent to-primary-400/70"></span></div><h2 class="text-4xl text-primary-50 sm:text-5xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}"> It would be an honor to work together. </h2><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="inline-flex items-center gap-2 rounded-full bg-primary-400 px-8 py-3 text-xs font-medium tracking-[0.2em] text-primary-900 uppercase transition hover:bg-primary-300" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}"><span>Start the conversation</span><span class="material-symbols-outlined text-sm">north_east</span></a>`);
      _push(ssrRenderComponent(_component_PortfolioContactLinks, {
        data: __props.data,
        variant: "row",
        "class-name": "justify-center text-primary-400 [&_a]:text-primary-300"
      }, null, _parent));
      _push(`<p class="mt-6 text-[11px] tracking-[0.25em] text-primary-500 uppercase" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}">${ssrInterpolate(__props.data.full_name)} \u2014 <a href="#top" class="transition hover:text-primary-400">Back to top</a></p></div></footer></div>`);
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/portfolio/templates/TheLeader.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "TheStrategist",
  __ssrInlineRender: true,
  props: {
    data: {}
  },
  setup(__props) {
    const props = __props;
    const sections = computed(
      () => orderedBodySections(props.data, { projects: "Selected Work", skills: "Toolkit" })
    );
    const initials = computed(() => {
      const parts = props.data.full_name.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) return "??";
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    });
    const primaryCta = computed(() => portfolioContactCta());
    const kpiTiles = computed(() => {
      var _a2, _b2;
      var _a, _b;
      return [
        {
          value: String((_a2 = (_a = props.data.formatted_projects) == null ? void 0 : _a.length) != null ? _a2 : 0),
          label: "Projects Shipped",
          icon: "rocket_launch"
        },
        {
          value: String((_b2 = (_b = props.data.core_skills) == null ? void 0 : _b.length) != null ? _b2 : 0),
          label: "Core Skills",
          icon: "workspace_premium"
        },
        {
          value: "E2E",
          label: "End-to-end Ownership",
          icon: "route"
        },
        {
          value: "PM",
          label: "Product Strategy",
          icon: "target"
        }
      ];
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c;
      const _component_PortfolioProjectLink = _sfc_main$c;
      const _component_PortfolioContactLinks = _sfc_main$b;
      _push(`<div${ssrRenderAttrs(mergeProps({
        id: "top",
        class: "min-h-screen bg-primary-900 text-primary-100"
      }, _attrs))}><header class="sticky top-0 z-50 border-b border-primary-800 bg-primary-900/90 backdrop-blur"><nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"><a href="#top" class="flex items-center gap-2 text-base font-bold tracking-tight text-primary-100"><span class="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary-400 to-primary-500 text-xs font-bold text-primary-950">${ssrInterpolate(unref(initials))}</span> ${ssrInterpolate(__props.data.full_name)}</a><div class="hidden items-center gap-8 text-sm font-medium text-primary-400 sm:flex"><a href="#work" class="transition-colors hover:text-primary-400">${ssrInterpolate(((_a = __props.data.button_texts) == null ? void 0 : _a.nav_projects) || "Work")}</a><a href="#skills" class="transition-colors hover:text-primary-400">${ssrInterpolate(((_b = __props.data.button_texts) == null ? void 0 : _b.nav_skills) || "Skills")}</a><a href="#contact" class="transition-colors hover:text-primary-400">${ssrInterpolate(((_c = __props.data.button_texts) == null ? void 0 : _c.contact_cta) || __props.data.cta_text || "Contact")}</a></div><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-primary-950 transition-colors hover:bg-primary-400"> Get in touch </a></nav></header><section class="relative overflow-hidden border-b border-primary-800 px-6 py-24 sm:py-32"><div class="pointer-events-none absolute inset-x-0 top-0 -z-0 h-96 bg-gradient-to-b from-primary-500/10 via-primary-500/5 to-transparent"></div><div class="relative mx-auto max-w-4xl text-center"><p class="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400"> Product Strategy &amp; Growth </p><h1 class="text-4xl font-bold leading-tight text-primary-50 sm:text-6xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display',serif" })}"> Defining user needs. <span class="bg-gradient-to-r from-primary-400 to-primary-400 bg-clip-text text-transparent">Driving product growth.</span></h1>`);
      if (__props.data.professional_bio) {
        _push(`<p class="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-primary-400">${ssrInterpolate(__props.data.professional_bio)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="mt-8 flex flex-wrap items-center justify-center gap-4"><a href="#work" class="rounded-md bg-primary-500 px-6 py-3 text-sm font-semibold text-primary-950 transition-colors hover:bg-primary-400"> View the work </a><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="rounded-md border border-primary-700 bg-primary-900 px-6 py-3 text-sm font-semibold text-primary-100 transition-colors hover:border-primary-400 hover:text-primary-300"> Start a conversation </a></div></div><div class="relative mx-auto mt-20 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-4"><!--[-->`);
      ssrRenderList(unref(kpiTiles), (tile) => {
        _push(`<div class="rounded-lg border border-primary-800 bg-primary-900/70 p-6 text-center transition-colors hover:border-primary-500/50"><span class="material-symbols-outlined mb-2 inline-block text-2xl text-primary-400">${ssrInterpolate(tile.icon)}</span><p class="text-2xl font-bold text-primary-50" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}">${ssrInterpolate(tile.value)}</p><p class="mt-1 text-xs uppercase tracking-wide text-primary-500">${ssrInterpolate(tile.label)}</p></div>`);
      });
      _push(`<!--]--></div></section><!--[-->`);
      ssrRenderList(unref(sections), (section) => {
        var _a2, _b2;
        _push(`<!--[-->`);
        if (section.kind === "projects") {
          _push(`<section id="work" class="border-b border-primary-800 px-6 py-24"><div class="mx-auto max-w-6xl"><div class="mb-12 flex items-end justify-between gap-6"><div><p class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400"> Selected Work </p><h2 class="text-3xl font-bold text-primary-50" style="${ssrRenderStyle({ "font-family": "'Playfair Display',serif" })}"> Outcomes, not output. </h2></div></div>`);
          if ((_a2 = __props.data.formatted_projects) == null ? void 0 : _a2.length) {
            _push(`<div class="grid gap-6 sm:grid-cols-2"><!--[-->`);
            ssrRenderList(__props.data.formatted_projects, (project, idx) => {
              _push(ssrRenderComponent(_component_PortfolioProjectLink, {
                key: project.title + idx,
                project,
                index: idx
              }, {
                default: withCtx(({ hasLink }, _push2, _parent2, _scopeId) => {
                  var _a3, _b3;
                  if (_push2) {
                    _push2(`<div class="h-full rounded-lg border border-primary-800 bg-primary-900/60 p-6 transition-colors group-hover:border-primary-500/50"${_scopeId}><p class="mb-3 flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-widest text-primary-400"${_scopeId}><span class="inline-flex items-center gap-2"${_scopeId}><span class="material-symbols-outlined text-sm"${_scopeId}>flag</span> Focus ${ssrInterpolate(String(idx + 1).padStart(2, "0"))}</span>`);
                    if (hasLink) {
                      _push2(`<span class="material-symbols-outlined text-sm" aria-hidden="true"${_scopeId}> open_in_new </span>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(`</p><h3 class="text-lg font-semibold text-primary-50"${_scopeId}>${ssrInterpolate(project.title)}</h3>`);
                    if (project.description) {
                      _push2(`<p class="mt-2 text-sm leading-relaxed text-primary-400"${_scopeId}>${ssrInterpolate(project.description)}</p>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    if ((_a3 = project.tech_stack) == null ? void 0 : _a3.length) {
                      _push2(`<div class="mt-5 flex flex-wrap gap-2"${_scopeId}><!--[-->`);
                      ssrRenderList(project.tech_stack, (tech) => {
                        _push2(`<span class="rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-300"${_scopeId}>${ssrInterpolate(tech)}</span>`);
                      });
                      _push2(`<!--]--></div>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    if (hasLink) {
                      _push2(`<p class="mt-4 text-sm font-semibold text-primary-400"${_scopeId}> Open project \u2192 </p>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(`</div>`);
                  } else {
                    return [
                      createVNode("div", { class: "h-full rounded-lg border border-primary-800 bg-primary-900/60 p-6 transition-colors group-hover:border-primary-500/50" }, [
                        createVNode("p", { class: "mb-3 flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-widest text-primary-400" }, [
                          createVNode("span", { class: "inline-flex items-center gap-2" }, [
                            createVNode("span", { class: "material-symbols-outlined text-sm" }, "flag"),
                            createTextVNode(" Focus " + toDisplayString(String(idx + 1).padStart(2, "0")), 1)
                          ]),
                          hasLink ? (openBlock(), createBlock("span", {
                            key: 0,
                            class: "material-symbols-outlined text-sm",
                            "aria-hidden": "true"
                          }, " open_in_new ")) : createCommentVNode("", true)
                        ]),
                        createVNode("h3", { class: "text-lg font-semibold text-primary-50" }, toDisplayString(project.title), 1),
                        project.description ? (openBlock(), createBlock("p", {
                          key: 0,
                          class: "mt-2 text-sm leading-relaxed text-primary-400"
                        }, toDisplayString(project.description), 1)) : createCommentVNode("", true),
                        ((_b3 = project.tech_stack) == null ? void 0 : _b3.length) ? (openBlock(), createBlock("div", {
                          key: 1,
                          class: "mt-5 flex flex-wrap gap-2"
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(project.tech_stack, (tech) => {
                            return openBlock(), createBlock("span", {
                              key: tech,
                              class: "rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-300"
                            }, toDisplayString(tech), 1);
                          }), 128))
                        ])) : createCommentVNode("", true),
                        hasLink ? (openBlock(), createBlock("p", {
                          key: 2,
                          class: "mt-4 text-sm font-semibold text-primary-400"
                        }, " Open project \u2192 ")) : createCommentVNode("", true)
                      ])
                    ];
                  }
                }),
                _: 2
              }, _parent));
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></section>`);
        } else if (section.kind === "skills") {
          _push(`<section id="skills" class="border-b border-primary-800 bg-primary-900/40 px-6 py-24"><div class="mx-auto max-w-6xl"><p class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400"> Toolkit </p><h2 class="text-3xl font-bold text-primary-50" style="${ssrRenderStyle({ "font-family": "'Playfair Display',serif" })}"> The strategic toolkit. </h2>`);
          if ((_b2 = __props.data.core_skills) == null ? void 0 : _b2.length) {
            _push(`<div class="mt-10 flex flex-wrap gap-3"><!--[-->`);
            ssrRenderList(__props.data.core_skills, (skill) => {
              _push(`<span class="flex items-center gap-2 rounded-md border border-primary-700 bg-primary-950 px-4 py-2 text-sm font-medium text-primary-200 transition-colors hover:border-primary-500/50"><span class="material-symbols-outlined text-sm text-primary-400">check_circle</span> ${ssrInterpolate(skill)}</span>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></section>`);
        } else if (section.custom && section.custom.content && section.custom.content.trim()) {
          _push(`<section${ssrRenderAttr("id", `section-${section.key}`)} class="border-b border-primary-800 px-6 py-24"><div class="mx-auto max-w-6xl"><p class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400">${ssrInterpolate(section.title)}</p><h2 class="text-3xl font-bold text-primary-50" style="${ssrRenderStyle({ "font-family": "'Playfair Display',serif" })}">${ssrInterpolate(section.title)}</h2><div class="mt-8 max-w-3xl space-y-4"><!--[-->`);
          ssrRenderList(section.custom.content.split(/\n{2,}/), (paragraph, index) => {
            _push(`<p class="text-sm leading-relaxed text-primary-400">${ssrInterpolate(paragraph)}</p>`);
          });
          _push(`<!--]--></div></div></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--]-->`);
      });
      _push(`<!--]--><footer id="contact" class="px-6 py-24"><div class="mx-auto max-w-3xl text-center"><p class="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400"> Let&#39;s build the roadmap </p><h2 class="text-3xl font-bold text-primary-50 sm:text-4xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display',serif" })}"> Ready to define what&#39;s next. </h2><p class="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-primary-400"> Open to product strategy, roadmap, and growth engagements \u2014 let&#39;s talk about the problem worth solving next. </p><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="mt-8 inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-primary-500 to-primary-500 px-6 py-3 text-sm font-semibold text-primary-950 transition-colors hover:opacity-90"><span class="material-symbols-outlined text-base">mail</span> Reach out </a>`);
      _push(ssrRenderComponent(_component_PortfolioContactLinks, {
        data: __props.data,
        variant: "row",
        "class-name": "mt-10 justify-center text-primary-400 [&_a]:text-primary-300"
      }, null, _parent));
      _push(`<div class="mt-16 flex items-center justify-center gap-3 text-xs text-primary-500"><span class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-500 text-[11px] font-bold text-primary-950">${ssrInterpolate(unref(initials))}</span><span>${ssrInterpolate(__props.data.full_name)} \u2014 Product Strategy</span></div></div></footer></div>`);
    };
  }
});
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/portfolio/templates/TheStrategist.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "TheCreator",
  __ssrInlineRender: true,
  props: {
    data: {}
  },
  setup(__props) {
    const props = __props;
    const sections = computed(
      () => orderedBodySections(props.data, { projects: "Selected Work", skills: "Toolkit" })
    );
    const initials = computed(() => {
      const parts = props.data.full_name.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) return "??";
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    });
    const primaryCta = computed(() => portfolioContactCta());
    const skillGradients = [
      "from-primary-500/20 to-primary-500/20 border-primary-400/40 text-primary-200",
      "from-primary-500/20 to-primary-500/20 border-primary-400/40 text-primary-200",
      "from-primary-500/20 to-primary-500/20 border-primary-400/40 text-primary-200"
    ];
    function skillClass(idx) {
      return skillGradients[idx % skillGradients.length];
    }
    const projectAccents = [
      { ring: "group-hover:shadow-fuchsia-500/30", chip: "border-primary-400/40 bg-primary-500/10 text-primary-200" },
      { ring: "group-hover:shadow-violet-500/30", chip: "border-primary-400/40 bg-primary-500/10 text-primary-200" },
      { ring: "group-hover:shadow-cyan-500/30", chip: "border-primary-400/40 bg-primary-500/10 text-primary-200" }
    ];
    function accent(idx) {
      return projectAccents[idx % projectAccents.length];
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c;
      const _component_PortfolioProjectLink = _sfc_main$c;
      const _component_PortfolioContactLinks = _sfc_main$b;
      _push(`<div${ssrRenderAttrs(mergeProps({
        id: "top",
        class: "relative min-h-screen overflow-x-hidden bg-[#0a0a12] text-primary-100"
      }, _attrs))} data-v-406d6f52><div class="pointer-events-none fixed inset-0 z-0 overflow-hidden" data-v-406d6f52><div class="blob-float absolute -left-40 -top-32 h-96 w-96 rounded-full bg-primary-600/30 blur-[100px]" data-v-406d6f52></div><div class="blob-pulse absolute right-0 top-1/3 h-[28rem] w-[28rem] rounded-full bg-primary-600/30 blur-[110px]" data-v-406d6f52></div><div class="blob-float absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-primary-500/25 blur-[100px]" style="${ssrRenderStyle({ "animation-delay": "-4s" })}" data-v-406d6f52></div></div><header class="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a12]/70 backdrop-blur-xl" data-v-406d6f52><nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4" data-v-406d6f52><a href="#top" class="bg-gradient-to-r from-primary-400 via-primary-400 to-primary-400 bg-clip-text text-lg font-bold tracking-tight text-transparent" style="${ssrRenderStyle({ "font-family": "'Playfair Display',serif" })}" data-v-406d6f52>${ssrInterpolate(__props.data.full_name)}</a><div class="hidden items-center gap-8 text-sm font-medium text-primary-300 sm:flex" data-v-406d6f52><a href="#work" class="transition-colors hover:text-primary-300" data-v-406d6f52>${ssrInterpolate(((_a = __props.data.button_texts) == null ? void 0 : _a.nav_projects) || "Work")}</a><a href="#skills" class="transition-colors hover:text-primary-300" data-v-406d6f52>${ssrInterpolate(((_b = __props.data.button_texts) == null ? void 0 : _b.nav_skills) || "Skills")}</a><a href="#contact" class="transition-colors hover:text-primary-300" data-v-406d6f52>${ssrInterpolate(((_c = __props.data.button_texts) == null ? void 0 : _c.contact_cta) || __props.data.cta_text || "Contact")}</a></div><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="rounded-full bg-gradient-to-r from-primary-500 via-primary-500 to-primary-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-fuchsia-500/30 transition-transform hover:scale-105" data-v-406d6f52> Let&#39;s Create </a></nav></header><section class="relative z-10 mx-auto max-w-6xl px-6 py-28 sm:py-36" data-v-406d6f52><p class="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-primary-300 backdrop-blur" data-v-406d6f52><span class="material-symbols-outlined text-sm" data-v-406d6f52>auto_awesome</span> Digital Creator &amp; Technologist </p><h1 class="max-w-4xl bg-gradient-to-br from-primary-300 via-primary-300 to-primary-300 bg-clip-text text-4xl font-bold leading-tight text-transparent sm:text-6xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display',serif" })}" data-v-406d6f52> Crafting immersive digital experiences </h1>`);
      if (__props.data.professional_bio) {
        _push(`<p class="mt-8 max-w-2xl text-lg leading-relaxed text-primary-300" data-v-406d6f52>${ssrInterpolate(__props.data.professional_bio)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<p class="mt-2 max-w-2xl text-base text-primary-400" data-v-406d6f52>${ssrInterpolate(__props.data.full_name)} works at the intersection of light, motion, and code. </p><div class="mt-10 flex flex-wrap gap-4" data-v-406d6f52><a href="#work" class="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 via-primary-500 to-primary-500 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-fuchsia-500/40 transition-transform hover:scale-105" data-v-406d6f52> View the Work <span class="material-symbols-outlined text-base transition-transform group-hover:translate-x-1" data-v-406d6f52> arrow_forward </span></a><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-primary-100 backdrop-blur transition-colors hover:border-primary-400/50 hover:text-primary-200" data-v-406d6f52><span class="material-symbols-outlined text-base" data-v-406d6f52>mail</span> Say Hello </a></div></section><!--[-->`);
      ssrRenderList(unref(sections), (section) => {
        var _a2, _b2, _c2, _d;
        _push(`<!--[-->`);
        if (section.kind === "projects") {
          _push(`<section id="work" class="relative z-10 border-t border-white/10 px-6 py-24" data-v-406d6f52><div class="mx-auto max-w-6xl" data-v-406d6f52><p class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-300" data-v-406d6f52> Selected Work </p><h2 class="bg-gradient-to-r from-primary-300 to-primary-300 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display',serif" })}" data-v-406d6f52> Projects that push pixels &amp; possibilities </h2>`);
          if ((_a2 = __props.data.formatted_projects) == null ? void 0 : _a2.length) {
            _push(`<div class="mt-12 grid gap-6 sm:grid-cols-2" data-v-406d6f52><!--[-->`);
            ssrRenderList(__props.data.formatted_projects, (project, idx) => {
              _push(ssrRenderComponent(_component_PortfolioProjectLink, {
                key: project.title + idx,
                project,
                index: idx
              }, {
                default: withCtx(({ hasLink }, _push2, _parent2, _scopeId) => {
                  var _a3, _b3;
                  if (_push2) {
                    _push2(`<div class="${ssrRenderClass([accent(idx).ring, "relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-7 shadow-lg backdrop-blur-xl transition-all duration-300 group-hover:-translate-y-1 group-hover:border-white/20"])}" data-v-406d6f52${_scopeId}><div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-primary-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" data-v-406d6f52${_scopeId}></div><div class="relative" data-v-406d6f52${_scopeId}><div class="mb-4 flex items-center justify-between" data-v-406d6f52${_scopeId}><div class="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-500 text-sm font-bold text-white shadow-md" data-v-406d6f52${_scopeId}>${ssrInterpolate(String(idx + 1).padStart(2, "0"))}</div>`);
                    if (hasLink) {
                      _push2(`<span class="material-symbols-outlined text-primary-300" aria-hidden="true" data-v-406d6f52${_scopeId}> open_in_new </span>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(`</div><h3 class="text-lg font-semibold text-primary-50" data-v-406d6f52${_scopeId}>${ssrInterpolate(project.title)}</h3>`);
                    if (project.description) {
                      _push2(`<p class="mt-2 text-sm leading-relaxed text-primary-300" data-v-406d6f52${_scopeId}>${ssrInterpolate(project.description)}</p>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    if ((_a3 = project.tech_stack) == null ? void 0 : _a3.length) {
                      _push2(`<div class="mt-5 flex flex-wrap gap-2" data-v-406d6f52${_scopeId}><!--[-->`);
                      ssrRenderList(project.tech_stack, (tech) => {
                        _push2(`<span class="${ssrRenderClass([accent(idx).chip, "rounded-full border px-3 py-1 text-xs font-medium"])}" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}" data-v-406d6f52${_scopeId}>${ssrInterpolate(tech)}</span>`);
                      });
                      _push2(`<!--]--></div>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    if (hasLink) {
                      _push2(`<p class="mt-4 text-sm font-semibold text-primary-300" data-v-406d6f52${_scopeId}> Open project \u2192 </p>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(`</div></div>`);
                  } else {
                    return [
                      createVNode("div", {
                        class: [accent(idx).ring, "relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-7 shadow-lg backdrop-blur-xl transition-all duration-300 group-hover:-translate-y-1 group-hover:border-white/20"]
                      }, [
                        createVNode("div", { class: "pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-primary-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" }),
                        createVNode("div", { class: "relative" }, [
                          createVNode("div", { class: "mb-4 flex items-center justify-between" }, [
                            createVNode("div", { class: "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-500 text-sm font-bold text-white shadow-md" }, toDisplayString(String(idx + 1).padStart(2, "0")), 1),
                            hasLink ? (openBlock(), createBlock("span", {
                              key: 0,
                              class: "material-symbols-outlined text-primary-300",
                              "aria-hidden": "true"
                            }, " open_in_new ")) : createCommentVNode("", true)
                          ]),
                          createVNode("h3", { class: "text-lg font-semibold text-primary-50" }, toDisplayString(project.title), 1),
                          project.description ? (openBlock(), createBlock("p", {
                            key: 0,
                            class: "mt-2 text-sm leading-relaxed text-primary-300"
                          }, toDisplayString(project.description), 1)) : createCommentVNode("", true),
                          ((_b3 = project.tech_stack) == null ? void 0 : _b3.length) ? (openBlock(), createBlock("div", {
                            key: 1,
                            class: "mt-5 flex flex-wrap gap-2"
                          }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(project.tech_stack, (tech) => {
                              return openBlock(), createBlock("span", {
                                key: tech,
                                class: [accent(idx).chip, "rounded-full border px-3 py-1 text-xs font-medium"],
                                style: { "font-family": "'JetBrains Mono',monospace" }
                              }, toDisplayString(tech), 3);
                            }), 128))
                          ])) : createCommentVNode("", true),
                          hasLink ? (openBlock(), createBlock("p", {
                            key: 2,
                            class: "mt-4 text-sm font-semibold text-primary-300"
                          }, " Open project \u2192 ")) : createCommentVNode("", true)
                        ])
                      ], 2)
                    ];
                  }
                }),
                _: 2
              }, _parent));
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></section>`);
        } else if (section.kind === "skills") {
          _push(`<section id="skills" class="relative z-10 border-t border-white/10 px-6 py-24" data-v-406d6f52><div class="mx-auto max-w-6xl" data-v-406d6f52><p class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-300" data-v-406d6f52> Toolkit </p><h2 class="bg-gradient-to-r from-primary-300 to-primary-300 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display',serif" })}" data-v-406d6f52> Skills &amp; Superpowers </h2>`);
          if ((_b2 = __props.data.core_skills) == null ? void 0 : _b2.length) {
            _push(`<div class="mt-10 flex flex-wrap gap-3" data-v-406d6f52><!--[-->`);
            ssrRenderList(__props.data.core_skills, (skill, idx) => {
              _push(`<span class="${ssrRenderClass([skillClass(idx), "rounded-full border bg-gradient-to-r px-5 py-2.5 text-sm font-medium backdrop-blur transition-transform hover:scale-105"])}" data-v-406d6f52>${ssrInterpolate(skill)}</span>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></section>`);
        } else {
          _push(`<section${ssrRenderAttr("id", `section-${section.key}`)} class="relative z-10 border-t border-white/10 px-6 py-24" data-v-406d6f52><div class="mx-auto max-w-6xl" data-v-406d6f52><p class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-300" data-v-406d6f52> Section </p><h2 class="bg-gradient-to-r from-primary-300 via-primary-300 to-primary-300 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display',serif" })}" data-v-406d6f52>${ssrInterpolate(section.title)}</h2>`);
          if ((_d = (_c2 = section.custom) == null ? void 0 : _c2.content) == null ? void 0 : _d.trim()) {
            _push(`<div class="mt-10 max-w-3xl space-y-4 rounded-2xl border border-white/10 bg-white/5 p-8 text-base leading-relaxed text-primary-300 shadow-lg backdrop-blur-xl" data-v-406d6f52><!--[-->`);
            ssrRenderList(section.custom.content.split(/\n{2,}/), (paragraph, pIdx) => {
              _push(`<p data-v-406d6f52>${ssrInterpolate(paragraph)}</p>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></section>`);
        }
        _push(`<!--]-->`);
      });
      _push(`<!--]--><footer id="contact" class="relative z-10 border-t border-white/10 px-6 py-28" data-v-406d6f52><div class="mx-auto max-w-3xl text-center" data-v-406d6f52><div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 via-primary-500 to-primary-500 text-lg font-bold text-white shadow-xl shadow-fuchsia-500/40" data-v-406d6f52>${ssrInterpolate(unref(initials))}</div><h2 class="mt-8 bg-gradient-to-br from-primary-300 via-primary-300 to-primary-300 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display',serif" })}" data-v-406d6f52> Let&#39;s build something unforgettable. </h2><p class="mx-auto mt-4 max-w-xl text-base text-primary-300" data-v-406d6f52>${ssrInterpolate(__props.data.full_name)} is open to collaborations in design, motion, and interactive development. </p><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="mt-9 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 via-primary-500 to-primary-500 px-8 py-4 text-sm font-semibold text-white shadow-2xl shadow-violet-500/40 transition-transform hover:scale-105" data-v-406d6f52><span class="material-symbols-outlined text-base" data-v-406d6f52>bolt</span> Start a Project </a>`);
      _push(ssrRenderComponent(_component_PortfolioContactLinks, {
        data: __props.data,
        variant: "pills",
        "class-name": "mt-10 justify-center text-primary-300 [&_a]:border-white/20 [&_a]:bg-white/5"
      }, null, _parent));
      _push(`<div class="mt-16 flex items-center justify-center gap-2 text-xs text-primary-500" data-v-406d6f52><span class="material-symbols-outlined text-sm text-primary-400" data-v-406d6f52>favorite</span><span data-v-406d6f52>${ssrInterpolate(__props.data.full_name)} \u2014 light, motion &amp; code</span></div></div></footer></div>`);
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/portfolio/templates/TheCreator.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const TheCreator = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["__scopeId", "data-v-406d6f52"]]);
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "TheInvestigator",
  __ssrInlineRender: true,
  props: {
    data: {}
  },
  setup(__props) {
    const props = __props;
    const sections = computed(
      () => orderedBodySections(props.data, {
        projects: "Publications & Projects",
        skills: "Fields of Focus"
      })
    );
    const initials = computed(() => {
      const parts = props.data.full_name.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) return "";
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    });
    const bioSentences = computed(() => {
      var _a2;
      var _a;
      const bio = (_a2 = (_a = props.data.professional_bio) == null ? void 0 : _a.trim()) != null ? _a2 : "";
      if (!bio) return [];
      const matches = bio.match(/[^.!?]+[.!?]+(\s+|$)/g);
      if (!matches) return [bio];
      return matches.map((s) => s.trim()).filter(Boolean);
    });
    const tagline = computed(() => {
      var _a, _b;
      return (_b = (_a = bioSentences.value[0]) != null ? _a : props.data.professional_bio) != null ? _b : "";
    });
    const primaryCta = computed(() => portfolioContactCta());
    function romanNumeral(n) {
      const numerals = [
        [1e3, "M"],
        [900, "CM"],
        [500, "D"],
        [400, "CD"],
        [100, "C"],
        [90, "XC"],
        [50, "L"],
        [40, "XL"],
        [10, "X"],
        [9, "IX"],
        [5, "V"],
        [4, "IV"],
        [1, "I"]
      ];
      let value = n;
      let out = "";
      for (const [amount, symbol] of numerals) {
        while (value >= amount) {
          out += symbol;
          value -= amount;
        }
      }
      return out;
    }
    function paddedIndex(index) {
      return String(index + 1).padStart(2, "0");
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d;
      const _component_PortfolioProjectLink = _sfc_main$c;
      const _component_PortfolioContactLinks = _sfc_main$b;
      _push(`<div${ssrRenderAttrs(mergeProps({
        id: "top",
        class: "min-h-screen",
        style: { "background-color": "#fbfbf9", "color": "#1c1c1a", "font-family": "'Georgia', 'Iowan Old Style', serif" }
      }, _attrs))}><header class="sticky top-0 z-50 border-b border-primary-900/15 bg-[#fbfbf9]/95 backdrop-blur-sm"><nav class="mx-auto flex max-w-5xl items-center justify-between px-6 py-5"><a href="#top" class="flex items-center gap-3 text-primary-900"><span class="flex h-9 w-9 items-center justify-center rounded-full border border-primary-900/40 text-xs font-semibold tracking-wide text-primary-900">${ssrInterpolate(unref(initials))}</span><span class="text-base tracking-wide" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}">${ssrInterpolate(__props.data.full_name)}</span></a><div class="flex items-center gap-7 text-sm"><a href="#work" class="hidden text-primary-900/70 transition hover:text-primary-900 sm:inline">${ssrInterpolate(((_a = __props.data.button_texts) == null ? void 0 : _a.nav_projects) || `<a href="#work" class="hidden text-primary-900/70 transition hover:text-primary-900 sm:inline">
            Work
          </a>`.replace(/<[^>]+>/g, "").trim())}</a><a href="#skills" class="hidden text-primary-900/70 transition hover:text-primary-900 sm:inline">${ssrInterpolate(((_b = __props.data.button_texts) == null ? void 0 : _b.nav_skills) || `<a href="#skills" class="hidden text-primary-900/70 transition hover:text-primary-900 sm:inline">
            Skills
          </a>`.replace(/<[^>]+>/g, "").trim())}</a><a href="#contact" class="hidden text-primary-900/70 transition hover:text-primary-900 sm:inline">${ssrInterpolate(((_c = __props.data.button_texts) == null ? void 0 : _c.contact_cta) || __props.data.cta_text || "Contact")}</a><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="rounded-sm border border-primary-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary-900 transition hover:bg-primary-900 hover:text-white"> Contact </a></div></nav></header><section class="mx-auto max-w-5xl px-6 py-20 sm:py-28"><div class="grid items-center gap-14 md:grid-cols-[auto_1fr]"><div class="mx-auto md:mx-0"><div class="border border-primary-900/50 p-2"><div class="flex h-40 w-40 items-center justify-center border border-primary-900/20 bg-[#f3f2ec] text-5xl text-primary-900 sm:h-48 sm:w-48" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}">${ssrInterpolate(unref(initials))}</div></div><p class="mt-3 text-center text-xs uppercase tracking-[0.2em] text-primary-900/60"> Curriculum\xA0Vitae </p></div><div><p class="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-primary-900/60"> Independent Research &amp; Practice </p><h1 class="text-4xl leading-tight text-primary-900 sm:text-5xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}"> Dr. ${ssrInterpolate(__props.data.full_name)}</h1>`);
      if (unref(tagline)) {
        _push(`<p class="mt-6 max-w-2xl text-lg leading-relaxed text-[#3a3a36]">${ssrInterpolate(unref(tagline))}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="mt-9 flex flex-wrap items-center gap-8 text-sm"><a href="#work" class="border-b border-primary-900/40 pb-0.5 text-primary-900 transition hover:border-primary-900"> Read selected work \u2192 </a><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="border-b border-primary-900/40 pb-0.5 text-primary-900 transition hover:border-primary-900"> Get in touch \u2192 </a></div></div></div></section><hr class="mx-auto max-w-5xl border-primary-900/15">`);
      if (unref(bioSentences).length) {
        _push(`<section class="mx-auto max-w-5xl px-6 py-20"><p class="mb-6 text-xs font-semibold uppercase tracking-[0.25em] text-primary-900/60">${ssrInterpolate(((_d = __props.data.section_titles) == null ? void 0 : _d.profile) || "Research Statement")}</p><div class="max-w-3xl space-y-5 text-[1.05rem] leading-[1.9] text-[#3a3a36]"><!--[-->`);
        ssrRenderList(unref(bioSentences), (sentence, index) => {
          _push(`<p>${ssrInterpolate(sentence)}</p>`);
        });
        _push(`<!--]--></div></section>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(bioSentences).length) {
        _push(`<hr class="mx-auto max-w-5xl border-primary-900/15">`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(unref(sections), (section) => {
        var _a2, _b2, _c2;
        _push(`<!--[-->`);
        if (section.kind === "projects") {
          _push(`<section id="work" class="mx-auto max-w-5xl px-6 py-20"><p class="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary-900/60"> Selected Work </p><h2 class="mb-12 text-3xl text-primary-900 sm:text-4xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}">${ssrInterpolate(section.title)}</h2>`);
          if ((_a2 = __props.data.formatted_projects) == null ? void 0 : _a2.length) {
            _push(`<ol class="space-y-12"><!--[-->`);
            ssrRenderList(__props.data.formatted_projects, (project, index) => {
              _push(`<li class="border-b border-primary-900/10 pb-12 last:border-b-0 last:pb-0">`);
              _push(ssrRenderComponent(_component_PortfolioProjectLink, {
                project,
                index
              }, {
                default: withCtx(({ hasLink }, _push2, _parent2, _scopeId) => {
                  if (_push2) {
                    _push2(`<div class="flex gap-6 sm:gap-8"${_scopeId}><span class="shrink-0 pt-1 text-sm text-primary-900/50" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}"${_scopeId}>${ssrInterpolate(paddedIndex(index))} \xB7 ${ssrInterpolate(romanNumeral(index + 1))}</span><div class="min-w-0 flex-1"${_scopeId}><div class="flex items-start gap-2"${_scopeId}><h3 class="text-xl text-primary-900 sm:text-2xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}"${_scopeId}>${ssrInterpolate(project.title)}</h3>`);
                    if (hasLink) {
                      _push2(`<span class="material-symbols-outlined mt-1 shrink-0 text-primary-900/60" aria-hidden="true"${_scopeId}> open_in_new </span>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(`</div><p class="mt-3 max-w-3xl text-base leading-[1.85] text-[#3a3a36]"${_scopeId}>${ssrInterpolate(project.description)}</p>`);
                    if (project.tech_stack && project.tech_stack.length > 0) {
                      _push2(`<div class="mt-5"${_scopeId}><p class="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary-900/50"${_scopeId}> Methods &amp; Tools </p><div class="flex flex-wrap gap-x-5 gap-y-2"${_scopeId}><!--[-->`);
                      ssrRenderList(project.tech_stack, (tech) => {
                        _push2(`<span class="text-xs text-primary-900/80" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}"${_scopeId}>${ssrInterpolate(tech)}</span>`);
                      });
                      _push2(`<!--]--></div></div>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    if (hasLink) {
                      _push2(`<p class="mt-4 text-sm text-primary-900 underline-offset-4 group-hover:underline"${_scopeId}> Open project \u2192 </p>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(`</div></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "flex gap-6 sm:gap-8" }, [
                        createVNode("span", {
                          class: "shrink-0 pt-1 text-sm text-primary-900/50",
                          style: { "font-family": "'JetBrains Mono', monospace" }
                        }, toDisplayString(paddedIndex(index)) + " \xB7 " + toDisplayString(romanNumeral(index + 1)), 1),
                        createVNode("div", { class: "min-w-0 flex-1" }, [
                          createVNode("div", { class: "flex items-start gap-2" }, [
                            createVNode("h3", {
                              class: "text-xl text-primary-900 sm:text-2xl",
                              style: { "font-family": "'Playfair Display', serif" }
                            }, toDisplayString(project.title), 1),
                            hasLink ? (openBlock(), createBlock("span", {
                              key: 0,
                              class: "material-symbols-outlined mt-1 shrink-0 text-primary-900/60",
                              "aria-hidden": "true"
                            }, " open_in_new ")) : createCommentVNode("", true)
                          ]),
                          createVNode("p", { class: "mt-3 max-w-3xl text-base leading-[1.85] text-[#3a3a36]" }, toDisplayString(project.description), 1),
                          project.tech_stack && project.tech_stack.length > 0 ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "mt-5"
                          }, [
                            createVNode("p", { class: "mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary-900/50" }, " Methods & Tools "),
                            createVNode("div", { class: "flex flex-wrap gap-x-5 gap-y-2" }, [
                              (openBlock(true), createBlock(Fragment, null, renderList(project.tech_stack, (tech) => {
                                return openBlock(), createBlock("span", {
                                  key: tech,
                                  class: "text-xs text-primary-900/80",
                                  style: { "font-family": "'JetBrains Mono', monospace" }
                                }, toDisplayString(tech), 1);
                              }), 128))
                            ])
                          ])) : createCommentVNode("", true),
                          hasLink ? (openBlock(), createBlock("p", {
                            key: 1,
                            class: "mt-4 text-sm text-primary-900 underline-offset-4 group-hover:underline"
                          }, " Open project \u2192 ")) : createCommentVNode("", true)
                        ])
                      ])
                    ];
                  }
                }),
                _: 2
              }, _parent));
              _push(`</li>`);
            });
            _push(`<!--]--></ol>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</section>`);
        } else if (section.kind === "skills") {
          _push(`<section id="skills" class="mx-auto max-w-5xl px-6 py-20"><p class="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary-900/60"> Areas of Expertise </p><h2 class="mb-10 text-3xl text-primary-900 sm:text-4xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}">${ssrInterpolate(section.title)}</h2>`);
          if ((_b2 = __props.data.core_skills) == null ? void 0 : _b2.length) {
            _push(`<ul class="grid gap-x-10 gap-y-4 sm:grid-cols-2"><!--[-->`);
            ssrRenderList(__props.data.core_skills, (skill, index) => {
              _push(`<li class="flex items-baseline gap-4 border-b border-primary-900/10 pb-3"><span class="text-xs text-primary-900/40" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono', monospace" })}">${ssrInterpolate(paddedIndex(index))}</span><span class="text-base text-[#3a3a36]">${ssrInterpolate(skill)}</span></li>`);
            });
            _push(`<!--]--></ul>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</section>`);
        } else if (section.custom && ((_c2 = section.custom.content) == null ? void 0 : _c2.trim())) {
          _push(`<section${ssrRenderAttr("id", `section-${section.key}`)} class="mx-auto max-w-5xl px-6 py-20"><p class="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary-900/60">${ssrInterpolate(section.title)}</p><h2 class="mb-8 text-3xl text-primary-900 sm:text-4xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}">${ssrInterpolate(section.title)}</h2><div class="max-w-3xl space-y-5 text-[1.05rem] leading-[1.9] text-[#3a3a36]"><!--[-->`);
          ssrRenderList(section.custom.content.split(/\n{2,}/), (paragraph, pIdx) => {
            _push(`<p>${ssrInterpolate(paragraph.trim())}</p>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<hr class="mx-auto max-w-5xl border-primary-900/15"><!--]-->`);
      });
      _push(`<!--]--><footer id="contact" class="border-t border-primary-900/15 bg-[#f3f2ec] px-6 py-20"><div class="mx-auto max-w-5xl"><p class="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary-900/60"> Correspondence </p><h2 class="mb-5 max-w-2xl text-3xl leading-tight text-primary-900 sm:text-4xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display', serif" })}"> Inquiries regarding collaboration, review, or consultation are welcome. </h2><p class="mb-9 max-w-2xl text-base leading-relaxed text-[#3a3a36]">${ssrInterpolate(__props.data.full_name)} welcomes correspondence from colleagues, institutions, and collaborators interested in this body of work. </p><div class="flex flex-wrap items-center gap-8"><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="inline-flex items-center gap-2 rounded-sm border border-primary-900 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-primary-900 transition hover:bg-primary-900 hover:text-white"><span class="material-symbols-outlined text-base">mail</span> Write to ${ssrInterpolate(__props.data.full_name)}</a><a href="#top" class="text-sm text-primary-900/60 underline-offset-4 transition hover:text-primary-900 hover:underline"> Back to top </a></div>`);
      _push(ssrRenderComponent(_component_PortfolioContactLinks, {
        data: __props.data,
        variant: "stack",
        "class-name": "mt-10 text-primary-900/80 [&_a]:text-primary-900"
      }, null, _parent));
      _push(`<p class="mt-14 border-t border-primary-900/10 pt-6 text-xs uppercase tracking-[0.2em] text-primary-900/40">${ssrInterpolate(__props.data.full_name)} \u2014 Research &amp; Practice </p></div></footer></div>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/portfolio/templates/TheInvestigator.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "TheBuilder",
  __ssrInlineRender: true,
  props: {
    data: {}
  },
  setup(__props) {
    const props = __props;
    const sections = computed(
      () => orderedBodySections(props.data, {
        projects: "Builds & Engineered Projects",
        skills: "Tools of the Trade"
      })
    );
    const initials = computed(() => {
      const parts = props.data.full_name.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) return "??";
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    });
    const primaryCta = computed(() => portfolioContactCta());
    const specSheet = computed(() => {
      var _a, _b;
      const skills = (_a = props.data.core_skills) != null ? _a : [];
      const projects = (_b = props.data.formatted_projects) != null ? _b : [];
      return [
        { key: "name", value: props.data.full_name },
        { key: "projects", value: String(projects.length) },
        { key: "skills", value: skills.slice(0, 3).join(", ") || "full-stack engineering" },
        { key: "focus", value: skills[0] || "precise, incremental, tested" }
      ];
    });
    const gridStyle = {
      backgroundImage: "linear-gradient(rgba(16,185,129,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.06) 1px, transparent 1px)",
      backgroundSize: "40px 40px"
    };
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c;
      const _component_PortfolioProjectLink = _sfc_main$c;
      const _component_PortfolioContactLinks = _sfc_main$b;
      _push(`<div${ssrRenderAttrs(mergeProps({
        id: "top",
        class: "min-h-screen bg-primary-950 text-primary-100",
        style: gridStyle
      }, _attrs))}><header class="sticky top-0 z-50 border-b border-primary-500/20 bg-primary-950/90 backdrop-blur"><nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"><a href="#top" class="flex items-center gap-2 text-lg font-bold tracking-tight text-primary-100" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"><span class="flex h-8 w-8 items-center justify-center rounded border border-primary-500/50 bg-primary-500/10 text-xs text-primary-400">${ssrInterpolate(unref(initials))}</span><span class="text-primary-400">&lt;</span>${ssrInterpolate(__props.data.full_name.split(" ")[0])}<span class="text-primary-400">/&gt;</span></a><div class="hidden items-center gap-8 text-sm text-primary-400 sm:flex" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"><a href="#work" class="transition-colors hover:text-primary-400">${ssrInterpolate(((_a = __props.data.button_texts) == null ? void 0 : _a.nav_projects) || "01_work")}</a><a href="#skills" class="transition-colors hover:text-primary-400">${ssrInterpolate(((_b = __props.data.button_texts) == null ? void 0 : _b.nav_skills) || "02_skills")}</a><a href="#contact" class="transition-colors hover:text-primary-400">${ssrInterpolate(((_c = __props.data.button_texts) == null ? void 0 : _c.contact_cta) || __props.data.cta_text || "03_contact")}</a></div><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="rounded border border-primary-500/40 bg-primary-500/10 px-4 py-2 text-xs font-semibold text-primary-300 transition-colors hover:bg-primary-500/20" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"> &gt; build_with_me </a></nav></header><section class="relative mx-auto max-w-6xl px-6 py-24 sm:py-32"><div class="grid gap-16 lg:grid-cols-[1.4fr_1fr] lg:items-start"><div><p class="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"><span class="material-symbols-outlined text-sm">architecture</span> precision engineering &amp; digital craft </p><h1 class="text-4xl font-bold leading-tight text-primary-50 sm:text-5xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display',serif" })}"> Engineering scalable digital products with well-crafted, precise lines. </h1>`);
      if (__props.data.professional_bio) {
        _push(`<p class="mt-6 max-w-xl text-base leading-relaxed text-primary-400">${ssrInterpolate(__props.data.professional_bio)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<p class="mt-4 text-xs uppercase tracking-[0.2em] text-primary-600" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"> // built by ${ssrInterpolate(__props.data.full_name)}</p><div class="mt-8 flex flex-wrap gap-4"><a href="#work" class="rounded border border-primary-700 bg-primary-900 px-5 py-3 text-sm font-semibold text-primary-100 transition-colors hover:border-primary-500 hover:text-primary-300" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"> inspect_the_work() </a><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="rounded bg-primary-500 px-5 py-3 text-sm font-semibold text-primary-950 transition-colors hover:bg-primary-400" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"> start_a_project() </a></div></div><div class="relative rounded border border-primary-500/30 bg-primary-900/60 p-6"><span class="absolute -left-px -top-px h-4 w-4 border-l-2 border-t-2 border-primary-400"></span><span class="absolute -right-px -top-px h-4 w-4 border-r-2 border-t-2 border-primary-400"></span><span class="absolute -bottom-px -left-px h-4 w-4 border-b-2 border-l-2 border-primary-400"></span><span class="absolute -bottom-px -right-px h-4 w-4 border-b-2 border-r-2 border-primary-400"></span><p class="mb-4 text-xs uppercase tracking-widest text-primary-400" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"> spec_sheet.txt </p><dl class="space-y-3 text-xs" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"><!--[-->`);
      ssrRenderList(unref(specSheet), (row) => {
        _push(`<div class="flex items-baseline justify-between gap-4 border-b border-primary-800 pb-3"><dt class="shrink-0 text-primary-500">${ssrInterpolate(row.key)}:</dt><dd class="truncate text-right text-primary-200">${ssrInterpolate(row.value)}</dd></div>`);
      });
      _push(`<!--]--></dl><p class="mt-4 text-xs text-primary-500/70" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"> status: <span class="text-primary-400">available_for_work</span></p></div></div></section><!--[-->`);
      ssrRenderList(unref(sections), (section) => {
        var _a2, _b2, _c2;
        _push(`<!--[-->`);
        if (section.kind === "projects") {
          _push(`<section id="work" class="border-t border-primary-500/20 bg-primary-950 px-6 py-24"><div class="mx-auto max-w-6xl"><p class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"> section_01 </p><h2 class="text-3xl font-bold text-primary-50" style="${ssrRenderStyle({ "font-family": "'Playfair Display',serif" })}">${ssrInterpolate(section.title)}</h2>`);
          if ((_a2 = __props.data.formatted_projects) == null ? void 0 : _a2.length) {
            _push(`<div class="mt-12 grid gap-6 sm:grid-cols-2"><!--[-->`);
            ssrRenderList(__props.data.formatted_projects, (project, idx) => {
              _push(ssrRenderComponent(_component_PortfolioProjectLink, {
                key: project.title + idx,
                project,
                index: idx
              }, {
                default: withCtx(({ hasLink }, _push2, _parent2, _scopeId) => {
                  var _a3, _b3;
                  if (_push2) {
                    _push2(`<div class="relative h-full rounded border border-primary-800 bg-primary-900 p-6 transition-colors group-hover:border-primary-500/50"${_scopeId}><span class="absolute -left-px -top-px h-3 w-3 border-l-2 border-t-2 border-primary-500/60"${_scopeId}></span><span class="absolute -right-px -bottom-px h-3 w-3 border-b-2 border-r-2 border-primary-500/60"${_scopeId}></span><div class="mb-3 flex items-center justify-between text-xs text-primary-500" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"${_scopeId}><span class="text-primary-400"${_scopeId}>${ssrInterpolate(String(idx + 1).padStart(2, "0"))} /</span>`);
                    if (hasLink) {
                      _push2(`<span class="inline-flex items-center gap-1 text-primary-400"${_scopeId}><span class="material-symbols-outlined text-sm"${_scopeId}>open_in_new</span></span>`);
                    } else {
                      _push2(`<span${_scopeId}>build</span>`);
                    }
                    _push2(`</div><h3 class="text-lg font-semibold text-primary-100"${_scopeId}>${ssrInterpolate(project.title)}</h3>`);
                    if (project.description) {
                      _push2(`<p class="mt-2 text-sm leading-relaxed text-primary-400"${_scopeId}>${ssrInterpolate(project.description)}</p>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    if ((_a3 = project.tech_stack) == null ? void 0 : _a3.length) {
                      _push2(`<div class="mt-4 flex flex-wrap gap-2"${_scopeId}><!--[-->`);
                      ssrRenderList(project.tech_stack, (tech) => {
                        _push2(`<code class="rounded border border-primary-500/30 bg-primary-500/10 px-2 py-1 text-xs text-primary-300" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"${_scopeId}>${ssrInterpolate(tech)}</code>`);
                      });
                      _push2(`<!--]--></div>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    if (hasLink) {
                      _push2(`<p class="mt-4 text-xs font-semibold text-primary-400" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"${_scopeId}> open_project() \u2192 </p>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(`</div>`);
                  } else {
                    return [
                      createVNode("div", { class: "relative h-full rounded border border-primary-800 bg-primary-900 p-6 transition-colors group-hover:border-primary-500/50" }, [
                        createVNode("span", { class: "absolute -left-px -top-px h-3 w-3 border-l-2 border-t-2 border-primary-500/60" }),
                        createVNode("span", { class: "absolute -right-px -bottom-px h-3 w-3 border-b-2 border-r-2 border-primary-500/60" }),
                        createVNode("div", {
                          class: "mb-3 flex items-center justify-between text-xs text-primary-500",
                          style: { "font-family": "'JetBrains Mono',monospace" }
                        }, [
                          createVNode("span", { class: "text-primary-400" }, toDisplayString(String(idx + 1).padStart(2, "0")) + " /", 1),
                          hasLink ? (openBlock(), createBlock("span", {
                            key: 0,
                            class: "inline-flex items-center gap-1 text-primary-400"
                          }, [
                            createVNode("span", { class: "material-symbols-outlined text-sm" }, "open_in_new")
                          ])) : (openBlock(), createBlock("span", { key: 1 }, "build"))
                        ]),
                        createVNode("h3", { class: "text-lg font-semibold text-primary-100" }, toDisplayString(project.title), 1),
                        project.description ? (openBlock(), createBlock("p", {
                          key: 0,
                          class: "mt-2 text-sm leading-relaxed text-primary-400"
                        }, toDisplayString(project.description), 1)) : createCommentVNode("", true),
                        ((_b3 = project.tech_stack) == null ? void 0 : _b3.length) ? (openBlock(), createBlock("div", {
                          key: 1,
                          class: "mt-4 flex flex-wrap gap-2"
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(project.tech_stack, (tech) => {
                            return openBlock(), createBlock("code", {
                              key: tech,
                              class: "rounded border border-primary-500/30 bg-primary-500/10 px-2 py-1 text-xs text-primary-300",
                              style: { "font-family": "'JetBrains Mono',monospace" }
                            }, toDisplayString(tech), 1);
                          }), 128))
                        ])) : createCommentVNode("", true),
                        hasLink ? (openBlock(), createBlock("p", {
                          key: 2,
                          class: "mt-4 text-xs font-semibold text-primary-400",
                          style: { "font-family": "'JetBrains Mono',monospace" }
                        }, " open_project() \u2192 ")) : createCommentVNode("", true)
                      ])
                    ];
                  }
                }),
                _: 2
              }, _parent));
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></section>`);
        } else if (section.kind === "skills") {
          _push(`<section id="skills" class="border-t border-primary-500/20 bg-primary-900/30 px-6 py-24"><div class="mx-auto max-w-6xl"><p class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"> section_02 </p><h2 class="text-3xl font-bold text-primary-50" style="${ssrRenderStyle({ "font-family": "'Playfair Display',serif" })}">${ssrInterpolate(section.title)}</h2>`);
          if ((_b2 = __props.data.core_skills) == null ? void 0 : _b2.length) {
            _push(`<div class="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"><!--[-->`);
            ssrRenderList(__props.data.core_skills, (skill) => {
              _push(`<div class="flex items-center gap-3 rounded border border-primary-800 bg-primary-950 px-4 py-3 text-sm text-primary-300" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"><span class="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400"></span> ${ssrInterpolate(skill)}</div>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></section>`);
        } else if (section.custom && ((_c2 = section.custom.content) == null ? void 0 : _c2.trim())) {
          _push(`<section${ssrRenderAttr("id", `section-${section.key}`)} class="border-t border-primary-500/20 bg-primary-950 px-6 py-24"><div class="mx-auto max-w-6xl"><p class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"> custom_section </p><h2 class="text-3xl font-bold text-primary-50" style="${ssrRenderStyle({ "font-family": "'Playfair Display',serif" })}">${ssrInterpolate(section.title)}</h2><div class="mt-8 max-w-3xl space-y-4 text-sm leading-relaxed text-primary-400"><!--[-->`);
          ssrRenderList(section.custom.content.split(/\n{2,}/), (paragraph, pIdx) => {
            _push(`<p>${ssrInterpolate(paragraph.trim())}</p>`);
          });
          _push(`<!--]--></div></div></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--]-->`);
      });
      _push(`<!--]--><footer id="contact" class="border-t border-primary-500/20 bg-primary-950 px-6 py-24"><div class="mx-auto max-w-3xl text-center"><p class="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"> section_03 -- contact </p><h2 class="text-3xl font-bold text-primary-50 sm:text-4xl" style="${ssrRenderStyle({ "font-family": "'Playfair Display',serif" })}"> Let&#39;s build. </h2><p class="mx-auto mt-4 max-w-xl text-sm text-primary-400"> Open to freelance engagements where precision, craft, and clean execution matter. </p><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="mt-8 inline-flex items-center gap-2 rounded bg-primary-500 px-6 py-3 text-sm font-semibold text-primary-950 transition-colors hover:bg-primary-400" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"><span class="material-symbols-outlined text-base">terminal</span> run_contact.sh </a>`);
      _push(ssrRenderComponent(_component_PortfolioContactLinks, {
        data: __props.data,
        variant: "row",
        "class-name": "mt-10 justify-center text-primary-400 [&_a]:text-primary-300"
      }, null, _parent));
      _push(`<div class="mt-16 flex items-center justify-center gap-3 text-xs text-primary-600" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"><span class="flex h-8 w-8 items-center justify-center rounded border border-primary-500/40 text-primary-400">${ssrInterpolate(unref(initials))}</span><span>${ssrInterpolate(__props.data.full_name)} \u2014 precision engineering</span></div></div></footer></div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/portfolio/templates/TheBuilder.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "TheCatalyst",
  __ssrInlineRender: true,
  props: {
    data: {}
  },
  setup(__props) {
    const props = __props;
    const sections = computed(
      () => orderedBodySections(props.data, { projects: "Case Studies", skills: "The growth toolkit" })
    );
    const initials = computed(() => {
      const parts = props.data.full_name.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) return "??";
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    });
    const primaryCta = computed(() => portfolioContactCta());
    const growthBars = computed(() => {
      var _a2, _b2;
      var _a, _b;
      const projectCount = (_a2 = (_a = props.data.formatted_projects) == null ? void 0 : _a.length) != null ? _a2 : 0;
      const skillCount = (_b2 = (_b = props.data.core_skills) == null ? void 0 : _b.length) != null ? _b2 : 0;
      const base = [28, 40, 34, 52, 61, 55, 74, 88, 100];
      const scale = Math.min(1.15, 0.55 + (projectCount + skillCount) * 0.05);
      return base.map((h, i) => Math.round(Math.min(100, h * scale * (0.9 + i % 3 * 0.05))));
    });
    const growthLabels = computed(() => {
      var _a, _b;
      const projects = (_a = props.data.formatted_projects) != null ? _a : [];
      const skills = (_b = props.data.core_skills) != null ? _b : [];
      return growthBars.value.map((_, i) => {
        var _a2;
        if (projects[i % Math.max(projects.length, 1)]) {
          return projects[i % projects.length].title.slice(0, 12);
        }
        return ((_a2 = skills[i % Math.max(skills.length, 1)]) == null ? void 0 : _a2.slice(0, 10)) || `Q${i + 1}`;
      });
    });
    const leadFocusLabel = computed(() => {
      var _a;
      const skill = (_a = props.data.core_skills) == null ? void 0 : _a[0];
      if (skill) return skill.length > 12 ? skill.slice(0, 11) + "\u2026" : skill;
      return "Full-Funnel";
    });
    const statTiles = computed(() => {
      var _a2, _b2;
      var _a, _b;
      return [
        {
          value: String((_a2 = (_a = props.data.formatted_projects) == null ? void 0 : _a.length) != null ? _a2 : 0),
          label: "Case Studies",
          icon: "trending_up"
        },
        {
          value: String((_b2 = (_b = props.data.core_skills) == null ? void 0 : _b.length) != null ? _b2 : 0),
          label: "Growth Levers",
          icon: "bolt"
        },
        {
          value: leadFocusLabel.value,
          label: "Lead Focus",
          icon: "target"
        }
      ];
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c;
      const _component_PortfolioProjectLink = _sfc_main$c;
      const _component_PortfolioContactLinks = _sfc_main$b;
      _push(`<div${ssrRenderAttrs(mergeProps({
        id: "top",
        class: "min-h-screen bg-white text-primary-900"
      }, _attrs))}><header class="sticky top-0 z-50 border-b border-primary-200 bg-white/90 backdrop-blur"><nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"><a href="#top" class="flex items-center gap-2 text-base font-bold tracking-tight text-primary-900"><span class="flex h-8 w-8 items-center justify-center rounded-md bg-primary-500 text-xs font-bold text-white">${ssrInterpolate(unref(initials))}</span> ${ssrInterpolate(__props.data.full_name)}</a><div class="hidden items-center gap-8 text-sm font-semibold text-primary-600 sm:flex"><a href="#work" class="transition-colors hover:text-primary-600">${ssrInterpolate(((_a = __props.data.button_texts) == null ? void 0 : _a.nav_projects) || "Work")}</a><a href="#skills" class="transition-colors hover:text-primary-600">${ssrInterpolate(((_b = __props.data.button_texts) == null ? void 0 : _b.nav_skills) || "Skills")}</a><a href="#contact" class="transition-colors hover:text-primary-600">${ssrInterpolate(((_c = __props.data.button_texts) == null ? void 0 : _c.contact_cta) || __props.data.cta_text || "Contact")}</a></div><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="rounded-md bg-primary-500 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-green-500/30 transition-colors hover:bg-primary-600"> Let&#39;s talk </a></nav></header><section class="relative overflow-hidden border-b border-primary-200 px-6 py-20 sm:py-28"><div class="pointer-events-none absolute inset-x-0 top-0 -z-0 h-80 bg-gradient-to-b from-primary-500/10 via-primary-400/5 to-transparent"></div><div class="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2"><div><p class="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary-600"><span class="material-symbols-outlined text-sm">rocket_launch</span> Growth &amp; Marketing Leadership </p><h1 class="text-4xl font-extrabold leading-tight tracking-tight text-primary-900 sm:text-5xl"> Data-Driven Growth for <span class="text-primary-500">Market Leaders</span></h1>`);
      if (__props.data.professional_bio) {
        _push(`<p class="mt-6 max-w-xl text-base leading-relaxed text-primary-600">${ssrInterpolate(__props.data.professional_bio)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="mt-8 flex flex-wrap items-center gap-4"><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="rounded-md bg-primary-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-green-500/30 transition-colors hover:bg-primary-600"> Start growing today </a><a href="#work" class="rounded-md border border-primary-300 px-6 py-3 text-sm font-bold text-primary-700 transition-colors hover:border-primary-500 hover:text-primary-600"> See the case studies </a></div><div class="mt-10 grid grid-cols-3 gap-4"><!--[-->`);
      ssrRenderList(unref(statTiles), (tile) => {
        _push(`<div class="rounded-lg border border-primary-200 bg-primary-50 p-4 text-center"><span class="material-symbols-outlined mb-1 inline-block text-xl text-primary-500">${ssrInterpolate(tile.icon)}</span><p class="text-xl font-extrabold text-primary-900" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}">${ssrInterpolate(tile.value)}</p><p class="mt-1 text-[11px] font-semibold uppercase tracking-wide text-primary-500">${ssrInterpolate(tile.label)}</p></div>`);
      });
      _push(`<!--]--></div></div><div class="rounded-2xl border border-primary-200 bg-primary-50 p-8 shadow-sm"><div class="mb-6 flex items-center justify-between"><p class="text-sm font-bold text-primary-700">Momentum Curve</p><span class="material-symbols-outlined text-primary-500">show_chart</span></div><div class="flex h-48 items-end gap-2 sm:gap-3"><!--[-->`);
      ssrRenderList(unref(growthBars), (height, idx) => {
        _push(`<div class="group/bar relative flex flex-1 flex-col items-center justify-end"><div class="w-full rounded-t-md bg-gradient-to-t from-primary-500 to-primary-400 transition-transform group-hover/bar:scale-105" style="${ssrRenderStyle({ height: height + "%" })}"></div></div>`);
      });
      _push(`<!--]--></div><div class="mt-3 flex gap-2 sm:gap-3"><!--[-->`);
      ssrRenderList(unref(growthLabels).slice(0, 9), (label, idx) => {
        _push(`<p class="flex-1 truncate text-center text-[9px] font-semibold uppercase tracking-wide text-primary-400" style="${ssrRenderStyle({ "font-family": "'JetBrains Mono',monospace" })}"${ssrRenderAttr("title", label)}>${ssrInterpolate(label)}</p>`);
      });
      _push(`<!--]--></div></div></div></section><!--[-->`);
      ssrRenderList(unref(sections), (section) => {
        var _a2, _b2, _c2;
        _push(`<!--[-->`);
        if (section.kind === "projects") {
          _push(`<section id="work" class="border-b border-primary-200 px-6 py-24"><div class="mx-auto max-w-6xl"><div class="mb-12"><p class="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-primary-600"> Case Studies </p><h2 class="text-3xl font-extrabold text-primary-900 sm:text-4xl">${ssrInterpolate(section.title === "Case Studies" ? "Campaigns that moved the numbers." : section.title)}</h2></div>`);
          if ((_a2 = __props.data.formatted_projects) == null ? void 0 : _a2.length) {
            _push(`<div class="grid gap-6 sm:grid-cols-2"><!--[-->`);
            ssrRenderList(__props.data.formatted_projects, (project, idx) => {
              _push(ssrRenderComponent(_component_PortfolioProjectLink, {
                key: project.title + idx,
                project,
                index: idx
              }, {
                default: withCtx(({ hasLink }, _push2, _parent2, _scopeId) => {
                  var _a3, _b3;
                  if (_push2) {
                    _push2(`<div class="h-full rounded-xl border border-primary-200 bg-white p-6 shadow-sm transition-all group-hover:-translate-y-1 group-hover:border-primary-500/50 group-hover:shadow-lg"${_scopeId}><div class="mb-3 flex items-center justify-between"${_scopeId}><p class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary-600"${_scopeId}><span class="material-symbols-outlined text-sm"${_scopeId}>campaign</span> Case Study ${ssrInterpolate(String(idx + 1).padStart(2, "0"))}</p>`);
                    if (hasLink) {
                      _push2(`<span class="material-symbols-outlined text-primary-600" aria-hidden="true"${_scopeId}> open_in_new </span>`);
                    } else {
                      _push2(`<span class="rounded-full bg-primary-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-600"${_scopeId}> Outcome </span>`);
                    }
                    _push2(`</div><h3 class="text-lg font-bold text-primary-900"${_scopeId}>${ssrInterpolate(project.title)}</h3>`);
                    if (project.description) {
                      _push2(`<p class="mt-2 text-sm leading-relaxed text-primary-600"${_scopeId}>${ssrInterpolate(project.description)}</p>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    if ((_a3 = project.tech_stack) == null ? void 0 : _a3.length) {
                      _push2(`<div class="mt-5 flex flex-wrap gap-2"${_scopeId}><!--[-->`);
                      ssrRenderList(project.tech_stack, (tech) => {
                        _push2(`<span class="rounded-full bg-primary-500/10 px-3 py-1 text-xs font-bold text-primary-700"${_scopeId}>${ssrInterpolate(tech)}</span>`);
                      });
                      _push2(`<!--]--></div>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    if (hasLink) {
                      _push2(`<p class="mt-4 text-sm font-bold text-primary-600"${_scopeId}> Open project \u2192 </p>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(`</div>`);
                  } else {
                    return [
                      createVNode("div", { class: "h-full rounded-xl border border-primary-200 bg-white p-6 shadow-sm transition-all group-hover:-translate-y-1 group-hover:border-primary-500/50 group-hover:shadow-lg" }, [
                        createVNode("div", { class: "mb-3 flex items-center justify-between" }, [
                          createVNode("p", { class: "flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary-600" }, [
                            createVNode("span", { class: "material-symbols-outlined text-sm" }, "campaign"),
                            createTextVNode(" Case Study " + toDisplayString(String(idx + 1).padStart(2, "0")), 1)
                          ]),
                          hasLink ? (openBlock(), createBlock("span", {
                            key: 0,
                            class: "material-symbols-outlined text-primary-600",
                            "aria-hidden": "true"
                          }, " open_in_new ")) : (openBlock(), createBlock("span", {
                            key: 1,
                            class: "rounded-full bg-primary-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-600"
                          }, " Outcome "))
                        ]),
                        createVNode("h3", { class: "text-lg font-bold text-primary-900" }, toDisplayString(project.title), 1),
                        project.description ? (openBlock(), createBlock("p", {
                          key: 0,
                          class: "mt-2 text-sm leading-relaxed text-primary-600"
                        }, toDisplayString(project.description), 1)) : createCommentVNode("", true),
                        ((_b3 = project.tech_stack) == null ? void 0 : _b3.length) ? (openBlock(), createBlock("div", {
                          key: 1,
                          class: "mt-5 flex flex-wrap gap-2"
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(project.tech_stack, (tech) => {
                            return openBlock(), createBlock("span", {
                              key: tech,
                              class: "rounded-full bg-primary-500/10 px-3 py-1 text-xs font-bold text-primary-700"
                            }, toDisplayString(tech), 1);
                          }), 128))
                        ])) : createCommentVNode("", true),
                        hasLink ? (openBlock(), createBlock("p", {
                          key: 2,
                          class: "mt-4 text-sm font-bold text-primary-600"
                        }, " Open project \u2192 ")) : createCommentVNode("", true)
                      ])
                    ];
                  }
                }),
                _: 2
              }, _parent));
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></section>`);
        } else if (section.kind === "skills") {
          _push(`<section id="skills" class="border-b border-primary-200 bg-primary-50 px-6 py-24"><div class="mx-auto max-w-6xl"><p class="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-primary-600"> Capabilities </p><h2 class="text-3xl font-extrabold text-primary-900 sm:text-4xl">${ssrInterpolate(section.title)}</h2>`);
          if ((_b2 = __props.data.core_skills) == null ? void 0 : _b2.length) {
            _push(`<div class="mt-10 flex flex-wrap gap-3"><!--[-->`);
            ssrRenderList(__props.data.core_skills, (skill) => {
              _push(`<span class="flex items-center gap-2 rounded-full border border-primary-200 bg-white px-4 py-2 text-sm font-bold text-primary-700 shadow-sm transition-colors hover:border-primary-500 hover:text-primary-600"><span class="material-symbols-outlined text-sm text-primary-500">check_circle</span> ${ssrInterpolate(skill)}</span>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></section>`);
        } else if (section.custom && ((_c2 = section.custom.content) == null ? void 0 : _c2.trim())) {
          _push(`<section${ssrRenderAttr("id", `section-${section.key}`)} class="border-b border-primary-200 px-6 py-24"><div class="mx-auto max-w-6xl"><p class="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-primary-600">${ssrInterpolate(section.title)}</p><h2 class="text-3xl font-extrabold text-primary-900 sm:text-4xl">${ssrInterpolate(section.title)}</h2><div class="mt-8 max-w-3xl space-y-4 text-sm leading-relaxed text-primary-600"><!--[-->`);
          ssrRenderList(section.custom.content.split(/\n{2,}/), (paragraph, pIdx) => {
            _push(`<p>${ssrInterpolate(paragraph.trim())}</p>`);
          });
          _push(`<!--]--></div></div></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--]-->`);
      });
      _push(`<!--]--><footer id="contact" class="relative overflow-hidden bg-primary-500 px-6 py-24 text-white"><div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-400/40 via-transparent to-primary-600/30"></div><div class="relative mx-auto max-w-3xl text-center"><p class="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-white/80"> Let&#39;s grow together </p><h2 class="text-3xl font-extrabold sm:text-4xl"> Ready to dominate your market? </h2><p class="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/90"> Open to growth strategy, demand generation, and go-to-market engagements \u2014 let&#39;s put a plan in motion. </p><a${ssrRenderAttr("href", unref(primaryCta).href)}${ssrRenderAttr("target", unref(primaryCta).external ? "_blank" : void 0)}${ssrRenderAttr("rel", unref(primaryCta).external ? "noopener noreferrer" : void 0)} class="mt-8 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-bold text-primary-600 shadow-lg transition-transform hover:scale-105"><span class="material-symbols-outlined text-base">mail</span> Get in touch </a>`);
      _push(ssrRenderComponent(_component_PortfolioContactLinks, {
        data: __props.data,
        variant: "pills",
        "class-name": "mt-10 justify-center text-white [&_a]:border-white/40 [&_a]:bg-white/15"
      }, null, _parent));
      _push(`<div class="mt-16 flex items-center justify-center gap-3 text-xs text-white/80"><span class="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[11px] font-bold text-primary-600">${ssrInterpolate(unref(initials))}</span><span>${ssrInterpolate(__props.data.full_name)} \u2014 Growth &amp; Marketing</span></div></div></footer></div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/portfolio/templates/TheCatalyst.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "PortfolioRenderer",
  __ssrInlineRender: true,
  props: {
    slug: {},
    data: {}
  },
  setup(__props) {
    const props = __props;
    const registry = {
      "the-visionary": _sfc_main$a,
      "the-minimalist": _sfc_main$9,
      "the-architect": _sfc_main$8,
      "the-director": TheDirector,
      "the-leader": _sfc_main$6,
      "the-strategist": _sfc_main$5,
      "the-creator": TheCreator,
      "the-investigator": _sfc_main$3,
      "the-builder": _sfc_main$2,
      "the-catalyst": _sfc_main$1
    };
    const resolved = computed(
      () => {
        var _a;
        return (_a = registry[props.slug]) != null ? _a : registry[DEFAULT_TEMPLATE_SLUG];
      }
    );
    const themeClass = computed(() => `theme-${props.data.theme_color || "emerald"}`);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: unref(themeClass) }, _attrs))}>`);
      ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(resolved)), { data: __props.data }, null), _parent);
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/portfolio/PortfolioRenderer.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as _, portfolioContactKey as p };
//# sourceMappingURL=PortfolioRenderer-KMW0Hdx0.mjs.map
