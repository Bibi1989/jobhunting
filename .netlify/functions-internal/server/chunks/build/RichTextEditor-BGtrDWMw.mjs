import { defineComponent, ref, provide, createElementBlock, watch, withCtx, createVNode, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrRenderClass } from 'vue/server-renderer';
import { _ as _export_sfc } from './server.mjs';

const __nuxt_component_5 = defineComponent({
  name: "ServerPlaceholder",
  render() {
    return createElementBlock("div");
  }
});
const clientOnlySymbol = /* @__PURE__ */ Symbol.for("nuxt:client-only");
const __nuxt_component_4 = defineComponent({
  name: "ClientOnly",
  inheritAttrs: false,
  props: ["fallback", "placeholder", "placeholderTag", "fallbackTag"],
  setup(_, { slots, attrs }) {
    const mounted = ref(false);
    provide(clientOnlySymbol, true);
    return (props) => {
      var _a;
      if (mounted.value) {
        return (_a = slots.default) == null ? void 0 : _a.call(slots);
      }
      const slot = slots.fallback || slots.placeholder;
      if (slot) {
        return slot();
      }
      const fallbackStr = props.fallback || props.placeholder || "";
      const fallbackTag = props.fallbackTag || props.placeholderTag || "span";
      return createElementBlock(fallbackTag, attrs, fallbackStr);
    };
  }
});
function sanitizeRichTextHtml(html) {
  if (!html) return "";
  let out = html.replace(/\u00a0/g, " ").replace(/—/g, ", ").replace(/–/g, ", ");
  out = out.replace(/<span[^>]*class="[^"]*ql-ui[^"]*"[^>]*><\/span>/gi, "");
  out = out.replace(/<ol([^>]*)>([\s\S]*?)<\/ol>/gi, (_match, attrs, inner) => {
    const hasBullet = /data-list\s*=\s*["']bullet["']/i.test(inner);
    const hasOrdered = /data-list\s*=\s*["']ordered["']/i.test(inner);
    if (hasBullet && !hasOrdered) {
      const cleaned = inner.replace(/\sdata-list\s*=\s*["']bullet["']/gi, "").replace(/\sclass\s*=\s*["'][^"']*["']/gi, "");
      return `<ul${attrs}>${cleaned}</ul>`;
    }
    return `<ol${attrs}>${inner}</ol>`;
  });
  out = out.replace(/(<(?:li|p)[^>]*>)(\s*(?:<[^>]+>)*\s*)[•●▪◦‧∙·]\s+/gi, "$1$2");
  out = out.replace(/(<(?:li|p)[^>]*>)(\s*(?:<[^>]+>)*\s*)[-–—*]\s+/gi, "$1$2");
  out = out.replace(/\sstyle=(["'])(.*?)\1/gi, (match, quote, styleContent) => {
    const cleaned = styleContent.split(";").map((part) => part.trim()).filter(Boolean).filter((part) => !/^(background|background-color|color)\s*:/i.test(part)).join("; ");
    return cleaned ? ` style=${quote}${cleaned}${quote}` : "";
  });
  return out;
}
function prepareEditorHtml(html) {
  let text = String(html || "").trim();
  text = text.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim();
  if (!text) return "";
  if (!/<[a-z][\s\S]*>/i.test(text)) {
    const lines = text.split(/\n+/).map((line) => line.replace(/^[-*•●▪◦]\s*/, "").trim()).filter(Boolean);
    if (lines.length > 1) {
      text = `<ul>${lines.map((line) => `<li>${line}</li>`).join("")}</ul>`;
    } else {
      text = `<p>${text.replace(/^[-*•●▪◦]\s*/, "")}</p>`;
    }
  }
  return sanitizeRichTextHtml(text);
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "RichTextEditor",
  __ssrInlineRender: true,
  props: {
    modelValue: { default: "" },
    editorClass: { default: "min-h-[150px]" }
  },
  emits: ["update:modelValue"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const quillRef = ref(null);
    const ready = ref(false);
    const syncing = ref(false);
    function normalize(html) {
      const value = String(html || "").replace(/<p><br\s*\/?><\/p>/gi, "").replace(/<p>\s*<\/p>/gi, "").trim();
      return value;
    }
    function applyHtml(html, emitCleaned = false) {
      const editor = quillRef.value;
      if (!editor || !ready.value) return;
      const cleaned = prepareEditorHtml(html);
      syncing.value = true;
      try {
        if (typeof editor.pasteHTML === "function") {
          editor.pasteHTML(cleaned || "", "api");
        } else {
          editor.setHTML(cleaned || "");
        }
        if (emitCleaned && normalize(cleaned) !== normalize(props.modelValue)) {
          emit("update:modelValue", cleaned);
        }
      } finally {
        (void 0).setTimeout(() => {
          syncing.value = false;
        }, 0);
      }
    }
    watch(
      () => props.modelValue,
      (value) => {
        var _a;
        if (!ready.value || syncing.value) return;
        let current = "";
        try {
          current = ((_a = quillRef.value) == null ? void 0 : _a.getHTML()) || "";
        } catch {
          return;
        }
        if (normalize(current) === normalize(value)) return;
        applyHtml(value || "");
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ClientOnly = __nuxt_component_4;
      _push(ssrRenderComponent(_component_ClientOnly, _attrs, {
        fallback: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="${ssrRenderClass([__props.editorClass, "rounded border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-500"])}" data-v-c91cf3d4${_scopeId}> Loading editor\u2026 </div>`);
          } else {
            return [
              createVNode("div", {
                class: ["rounded border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-500", __props.editorClass]
              }, " Loading editor\u2026 ", 2)
            ];
          }
        })
      }, _parent));
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/builder/RichTextEditor.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_3 = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-c91cf3d4"]]);

export { __nuxt_component_3 as _, __nuxt_component_4 as a, __nuxt_component_5 as b, sanitizeRichTextHtml as s };
//# sourceMappingURL=RichTextEditor-BGtrDWMw.mjs.map
