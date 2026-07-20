import { defineComponent, useModel, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrRenderClass } from 'vue/server-renderer';
import { marked } from 'marked';
import { aH as getCvFormat, aI as buildCvFormatPreview, aJ as CV_FORMATS } from '../nitro/nitro.mjs';
import { _ as _export_sfc } from './server.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "CvFormatPicker",
  __ssrInlineRender: true,
  props: {
    "modelValue": { required: true },
    "modelModifiers": {}
  },
  emits: ["update:modelValue"],
  setup(__props) {
    const model = useModel(__props, "modelValue");
    const cvFormats = CV_FORMATS;
    const selected = computed(() => getCvFormat(model.value));
    const previewMarkdown = computed(() => buildCvFormatPreview(model.value));
    const previewHtml = computed(() => marked(previewMarkdown.value));
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-3" }, _attrs))} data-v-b6aa6f4d><div class="flex flex-wrap items-end justify-between gap-2" data-v-b6aa6f4d><label class="text-xs font-bold uppercase tracking-widest text-slate-500" data-v-b6aa6f4d> CV format (${ssrInterpolate(unref(cvFormats).length)} options) </label><p class="text-[11px] text-slate-500" data-v-b6aa6f4d> Selected: <span class="text-slate-300" data-v-b6aa6f4d>${ssrInterpolate(unref(selected).name)}</span></p></div><div class="grid gap-4 lg:grid-cols-2" data-v-b6aa6f4d><div class="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2" data-v-b6aa6f4d><!--[-->`);
      ssrRenderList(unref(cvFormats), (format) => {
        _push(`<button type="button" class="${ssrRenderClass([
          model.value === format.id ? "border-blue-500 bg-blue-950/40 text-slate-100" : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500",
          "rounded-xl border px-3 py-2.5 text-left transition-colors"
        ])}" data-v-b6aa6f4d><p class="text-xs font-bold" data-v-b6aa6f4d>${ssrInterpolate(format.name)}</p><p class="mt-0.5 text-[11px] leading-snug text-slate-400" data-v-b6aa6f4d>${ssrInterpolate(format.description)}</p><p class="mt-1 text-[10px] uppercase tracking-wider text-slate-500" data-v-b6aa6f4d>${ssrInterpolate(format.bestFor)}</p></button>`);
      });
      _push(`<!--]--></div><div class="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950" data-v-b6aa6f4d><div class="flex items-center justify-between border-b border-slate-800 px-3 py-2" data-v-b6aa6f4d><p class="text-[10px] font-bold uppercase tracking-widest text-slate-500" data-v-b6aa6f4d> Format preview </p><p class="truncate text-[10px] text-slate-400" data-v-b6aa6f4d>${ssrInterpolate(unref(selected).name)}</p></div><div class="max-h-72 overflow-y-auto bg-[#f7f4ef] p-4" data-v-b6aa6f4d><div class="cv-format-preview origin-top scale-[0.92] text-[#1c1c1c]" data-v-b6aa6f4d>${(_a = unref(previewHtml)) != null ? _a : ""}</div></div></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/CvFormatPicker.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_2 = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-b6aa6f4d"]]);

export { __nuxt_component_2 as _ };
//# sourceMappingURL=CvFormatPicker-pXplRX-f.mjs.map
