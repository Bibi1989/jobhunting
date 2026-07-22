<script setup lang="ts">
import type {
  BuilderAccentTargets,
  BuilderDesignSettings,
  BuilderDetailsLayout,
  BuilderDetailsSeparator,
  BuilderTextAlign,
  BuilderIconStyle,
  BuilderPhotoShape,
  BuilderResumeData,
} from '~/shared/types/builder'
import {
  DEFAULT_ACCENT_TARGETS,
  DEFAULT_DESIGN_SETTINGS,
  DESIGN_COLOR_SWATCHES,
} from '~/shared/types/builder'
import { GOOGLE_FONT_OPTIONS } from '~/shared/pdf/googleFonts'

const props = defineProps<{
  modelValue: BuilderResumeData
  showHeaderControls?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [BuilderResumeData]
}>()

const showHeaderControls = computed(() => props.showHeaderControls !== false)

function ensureDesign(): BuilderDesignSettings {
  const current = props.modelValue.design || {}
  return {
    ...DEFAULT_DESIGN_SETTINGS,
    ...current,
    accentTargets: { ...DEFAULT_ACCENT_TARGETS, ...(current.accentTargets || {}) },
  }
}

function patchDesign(patch: Partial<BuilderDesignSettings>) {
  const design = { ...ensureDesign(), ...patch }
  if (patch.accentTargets) {
    design.accentTargets = { ...ensureDesign().accentTargets, ...patch.accentTargets }
  }
  if (patch.headerColor !== undefined) {
    design.headerBackgroundColor = patch.headerColor
  }
  const next: BuilderResumeData = {
    ...props.modelValue,
    design,
  }
  if (patch.accentColor !== undefined) {
    next.themeColor = patch.accentColor || next.themeColor
  }
  if (patch.bodyFontSize !== undefined && patch.bodyFontSize != null) {
    next.fontSize = patch.bodyFontSize
  }
  emit('update:modelValue', next)
}

function patchAccentTarget(key: keyof BuilderAccentTargets, value: boolean) {
  patchDesign({ accentTargets: { [key]: value } })
}

const design = computed(() => ensureDesign())

const accentTargets = computed(() => ({
  ...DEFAULT_ACCENT_TARGETS,
  ...(design.value.accentTargets || {}),
}))

type ColorField =
  | 'accentColor'
  | 'headerColor'
  | 'headerTextColor'
  | 'backgroundColor'
  | 'sectionTitleColor'
  | 'bodyTextColor'
  | 'lineBorderColor'

const customPickers = reactive<Record<ColorField, string>>({
  accentColor: '#6366f1',
  headerColor: '#312e81',
  headerTextColor: '#0f172a',
  backgroundColor: '#ffffff',
  sectionTitleColor: '#0f766e',
  bodyTextColor: '#0f172a',
  lineBorderColor: '#e2e8f0',
})

function fieldValue(field: ColorField): string | null {
  const v = design.value[field]
  return v == null || v === '' ? null : String(v)
}

function isSelected(field: ColorField, swatch: string | null) {
  return fieldValue(field) === swatch
}

function selectColor(field: ColorField, color: string | null) {
  patchDesign({ [field]: color } as Partial<BuilderDesignSettings>)
}

function applyCustom(field: ColorField) {
  patchDesign({ [field]: customPickers[field] } as Partial<BuilderDesignSettings>)
}

const photoInput = ref<HTMLInputElement | null>(null)

function onPhotoPick(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.type)) return
  const reader = new FileReader()
  reader.onload = () => {
    const dataUrl = String(reader.result || '')
    resizeDataUrl(dataUrl, 640).then((resized) => {
      emit('update:modelValue', {
        ...props.modelValue,
        personalInfo: {
          ...props.modelValue.personalInfo,
          photoDataUrl: resized,
        },
        design: {
          ...ensureDesign(),
          showPhoto: true,
        },
      })
    })
  }
  reader.readAsDataURL(file)
}

function clearPhoto() {
  emit('update:modelValue', {
    ...props.modelValue,
    personalInfo: {
      ...props.modelValue.personalInfo,
      photoDataUrl: undefined,
    },
    design: {
      ...ensureDesign(),
      showPhoto: false,
    },
  })
  if (photoInput.value) photoInput.value.value = ''
}

function resizeDataUrl(dataUrl: string, maxEdge: number): Promise<string> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(dataUrl)
      return
    }
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(dataUrl)
        return
      }
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

const accentChecks: { key: keyof BuilderAccentTargets; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'jobTitle', label: 'Job title' },
  { key: 'headings', label: 'Headings' },
  { key: 'headingsLine', label: 'Headings line' },
  { key: 'headerBackground', label: 'Header background' },
  { key: 'headerIcons', label: 'Header icons' },
  { key: 'dotsBarsBubbles', label: 'Dots/bars/bubbles' },
  { key: 'dates', label: 'Dates' },
  { key: 'entrySubtitle', label: 'Entry subtitle' },
  { key: 'linkIcons', label: 'Link icons' },
]

const colorRows: { field: ColorField; label: string }[] = [
  { field: 'headerColor', label: 'Header background' },
  { field: 'headerTextColor', label: 'Header text' },
  { field: 'backgroundColor', label: 'Background' },
  { field: 'sectionTitleColor', label: 'Section title' },
  { field: 'bodyTextColor', label: 'Body text' },
  { field: 'lineBorderColor', label: 'Line / border' },
]

function setHeaderAlign(align: BuilderTextAlign) {
  patchDesign({ headerAlign: align })
}
function setSectionTitleAlign(align: BuilderTextAlign) {
  patchDesign({ sectionTitleAlign: align })
}
function setDetailsLayout(layout: BuilderDetailsLayout) {
  patchDesign({ detailsLayout: layout })
}
function setDetailsSeparator(sep: BuilderDetailsSeparator) {
  patchDesign({ detailsSeparator: sep })
}
function setIconStyle(style: BuilderIconStyle) {
  patchDesign({ iconStyle: style })
}
function setPhotoShape(shape: BuilderPhotoShape) {
  patchDesign({ photoShape: shape, showPhoto: true })
}

const iconStyles: BuilderIconStyle[] = [
  'plain',
  'filled-circle',
  'filled-rounded',
  'filled-square',
  'outline-circle',
  'outline-rounded',
  'outline-square',
]

function iconStyleClass(style: BuilderIconStyle) {
  if (style === 'filled-circle') return 'rounded-full bg-slate-500 text-white'
  if (style === 'filled-rounded') return 'rounded-lg bg-slate-500 text-white'
  if (style === 'filled-square') return 'rounded-none bg-slate-500 text-white'
  if (style === 'outline-circle') return 'rounded-full border border-slate-400 text-slate-300 bg-transparent'
  if (style === 'outline-rounded') return 'rounded-lg border border-slate-400 text-slate-300 bg-transparent'
  if (style === 'outline-square') return 'rounded-none border border-slate-400 text-slate-300 bg-transparent'
  return 'rounded-md bg-indigo-500/20 text-indigo-300'
}

function swatchStyle(swatch: string | null) {
  if (swatch) return { backgroundColor: swatch }
  return {
    background:
      'linear-gradient(135deg, transparent 46%, #94a3b8 48%, #94a3b8 52%, transparent 54%), #ffffff',
  }
}
</script>

<template>
  <div class="space-y-8 pt-2 text-left">
    <!-- Font family dropdown (Google Fonts) -->
    <section class="space-y-3">
      <h3 class="font-bold text-lg text-white">Font family</h3>
      <select
        class="w-full rounded-xl border border-white/15 bg-slate-900/80 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-400 cursor-pointer"
        :value="design.fontFamily || 'Inter'"
        @change="patchDesign({ fontFamily: ($event.target as HTMLSelectElement).value })"
      >
        <option
          v-for="opt in GOOGLE_FONT_OPTIONS"
          :key="opt.id"
          :value="opt.id"
        >
          {{ opt.label }}
        </option>
      </select>
    </section>

    <!-- Header text alignment -->
    <section class="space-y-3">
      <h3 class="font-bold text-lg text-white">Header text alignment</h3>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="opt in ([
            { id: 'left', icon: 'format_align_left', label: 'Left' },
            { id: 'center', icon: 'format_align_center', label: 'Center' },
            { id: 'right', icon: 'format_align_right', label: 'Right' },
          ] as const)"
          :key="`header-${opt.id}`"
          type="button"
          class="flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 cursor-pointer transition"
          :class="(design.headerAlign || 'left') === opt.id
            ? 'border-indigo-400 bg-indigo-500/15 text-indigo-200'
            : 'border-white/10 bg-white/5 text-slate-400'"
          @click="setHeaderAlign(opt.id)"
        >
          <span class="material-symbols-outlined text-[22px]">{{ opt.icon }}</span>
          <span class="text-xs font-semibold">{{ opt.label }}</span>
        </button>
      </div>
    </section>

    <!-- Section title alignment -->
    <section class="space-y-3">
      <h3 class="font-bold text-lg text-white">Section title alignment</h3>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="opt in ([
            { id: 'left', icon: 'format_align_left', label: 'Left' },
            { id: 'center', icon: 'format_align_center', label: 'Center' },
            { id: 'right', icon: 'format_align_right', label: 'Right' },
          ] as const)"
          :key="`section-${opt.id}`"
          type="button"
          class="flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 cursor-pointer transition"
          :class="(design.sectionTitleAlign || 'left') === opt.id
            ? 'border-indigo-400 bg-indigo-500/15 text-indigo-200'
            : 'border-white/10 bg-white/5 text-slate-400'"
          @click="setSectionTitleAlign(opt.id)"
        >
          <span class="material-symbols-outlined text-[22px]">{{ opt.icon }}</span>
          <span class="text-xs font-semibold">{{ opt.label }}</span>
        </button>
      </div>
    </section>

    <!-- Colors: swatch rows matching screenshot -->
    <section class="space-y-5">
      <h3 class="font-bold text-lg text-white">Colors</h3>

      <div
        v-for="row in colorRows"
        :key="row.field"
        class="space-y-2"
      >
        <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{{ row.label }}</p>
        <div class="flex flex-wrap gap-2.5">
          <button
            v-for="(swatch, idx) in DESIGN_COLOR_SWATCHES"
            :key="`${row.field}-${idx}`"
            type="button"
            class="relative h-8 w-8 rounded-full border transition cursor-pointer shrink-0"
            :class="isSelected(row.field, swatch)
              ? 'border-indigo-300 ring-2 ring-indigo-400/50 ring-offset-2 ring-offset-slate-950'
              : 'border-white/15 hover:border-white/40'"
            :style="swatchStyle(swatch)"
            :title="swatch || 'None'"
            @click="selectColor(row.field, swatch)"
          >
            <span
              v-if="isSelected(row.field, swatch)"
              class="absolute inset-0 flex items-center justify-center text-white text-xs font-bold drop-shadow"
            >✓</span>
          </button>
          <label
            class="relative h-8 w-8 rounded-full border border-white/15 overflow-hidden cursor-pointer shrink-0"
            title="Custom color"
            style="background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red)"
          >
            <input
              v-model="customPickers[row.field]"
              type="color"
              class="absolute inset-0 opacity-0 cursor-pointer"
              @change="applyCustom(row.field)"
            >
          </label>
        </div>
      </div>
    </section>

    <!-- Accent palette + apply targets -->
    <section class="space-y-3">
      <h3 class="font-bold text-lg text-white">Accent color</h3>
      <div class="flex flex-wrap gap-2.5">
        <button
          v-for="(swatch, idx) in DESIGN_COLOR_SWATCHES"
          :key="`accent-${idx}`"
          type="button"
          class="relative h-8 w-8 rounded-full border transition cursor-pointer shrink-0"
          :class="isSelected('accentColor', swatch)
            ? 'border-indigo-300 ring-2 ring-indigo-400/50 ring-offset-2 ring-offset-slate-950'
            : 'border-white/15 hover:border-white/40'"
          :style="swatchStyle(swatch)"
          :title="swatch || 'None'"
          @click="selectColor('accentColor', swatch)"
        >
          <span
            v-if="isSelected('accentColor', swatch)"
            class="absolute inset-0 flex items-center justify-center text-white text-xs font-bold drop-shadow"
          >✓</span>
        </button>
        <label
          class="relative h-8 w-8 rounded-full border border-white/15 overflow-hidden cursor-pointer shrink-0"
          title="Custom color"
          style="background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red)"
        >
          <input
            v-model="customPickers.accentColor"
            type="color"
            class="absolute inset-0 opacity-0 cursor-pointer"
            @change="applyCustom('accentColor')"
          >
        </label>
      </div>

      <div>
        <h4 class="font-semibold text-sm text-indigo-200 mb-3">Apply Accent Color</h4>
        <div class="grid grid-cols-2 gap-x-4 gap-y-2">
          <label
            v-for="item in accentChecks"
            :key="item.key"
            class="flex items-center gap-2 text-sm text-slate-200 cursor-pointer"
          >
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-slate-500 text-indigo-500 focus:ring-indigo-400 cursor-pointer"
              :checked="!!accentTargets[item.key]"
              @change="patchAccentTarget(item.key, ($event.target as HTMLInputElement).checked)"
            >
            {{ item.label }}
          </label>
        </div>
      </div>
    </section>

    <!-- Typography sizes -->
    <section class="space-y-4">
      <h3 class="font-bold text-lg text-white">Font sizes</h3>
      <label class="block space-y-1.5">
        <div class="flex items-center justify-between text-[11px]">
          <span class="font-semibold uppercase tracking-wider text-slate-400">Name</span>
          <span class="text-slate-300 tabular-nums">{{ design.nameFontSize ?? 22 }} pt</span>
        </div>
        <input
          type="range"
          min="14"
          max="32"
          step="1"
          class="w-full accent-indigo-500 cursor-pointer"
          :value="design.nameFontSize ?? 22"
          @input="patchDesign({ nameFontSize: Number(($event.target as HTMLInputElement).value) })"
        >
      </label>
      <label class="block space-y-1.5">
        <div class="flex items-center justify-between text-[11px]">
          <span class="font-semibold uppercase tracking-wider text-slate-400">Job title</span>
          <span class="text-slate-300 tabular-nums">{{ design.jobTitleFontSize ?? 11 }} pt</span>
        </div>
        <input
          type="range"
          min="8"
          max="18"
          step="0.5"
          class="w-full accent-indigo-500 cursor-pointer"
          :value="design.jobTitleFontSize ?? 11"
          @input="patchDesign({ jobTitleFontSize: Number(($event.target as HTMLInputElement).value) })"
        >
      </label>
      <label class="block space-y-1.5">
        <div class="flex items-center justify-between text-[11px]">
          <span class="font-semibold uppercase tracking-wider text-slate-400">Section headers</span>
          <span class="text-slate-300 tabular-nums">{{ design.sectionTitleFontSize ?? 11 }} pt</span>
        </div>
        <input
          type="range"
          min="8"
          max="16"
          step="0.5"
          class="w-full accent-indigo-500 cursor-pointer"
          :value="design.sectionTitleFontSize ?? 11"
          @input="patchDesign({ sectionTitleFontSize: Number(($event.target as HTMLInputElement).value) })"
        >
      </label>
      <label class="block space-y-1.5">
        <div class="flex items-center justify-between text-[11px]">
          <span class="font-semibold uppercase tracking-wider text-slate-400">Body text</span>
          <span class="text-slate-300 tabular-nums">{{ (design.bodyFontSize ?? modelValue.fontSize ?? 9.5).toFixed(1) }} pt</span>
        </div>
        <input
          type="range"
          min="8"
          max="12"
          step="0.5"
          class="w-full accent-indigo-500 cursor-pointer"
          :value="design.bodyFontSize ?? modelValue.fontSize ?? 9.5"
          @input="patchDesign({ bodyFontSize: Number(($event.target as HTMLInputElement).value) })"
        >
      </label>
    </section>

    <!-- Profile photo -->
    <section class="space-y-3">
      <h3 class="font-bold text-lg text-white">Profile photo</h3>
      <p class="text-xs text-blue-200/60">Hidden by default. Upload to show in the header (all templates).</p>
      <div class="flex flex-wrap items-center gap-3">
        <div
          v-if="modelValue.personalInfo.photoDataUrl && design.showPhoto"
          class="overflow-hidden border border-white/20 bg-slate-800"
          :style="{
            width: `${Math.round((design.photoSize ?? 56) * 1.1)}px`,
            height: `${Math.round((design.photoSize ?? 56) * 1.1)}px`,
            borderRadius: design.photoShape === 'circle'
              ? '9999px'
              : design.photoShape === 'square'
                ? '0'
                : `${(design.photoBorderRadius ?? 25) / 2}%`,
          }"
        >
          <img :src="modelValue.personalInfo.photoDataUrl" alt="Profile" class="h-full w-full object-cover">
        </div>
        <input ref="photoInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" @change="onPhotoPick">
        <button
          type="button"
          class="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 cursor-pointer"
          @click="photoInput?.click()"
        >
          {{ modelValue.personalInfo.photoDataUrl ? 'Replace photo' : 'Upload photo' }}
        </button>
        <button
          v-if="modelValue.personalInfo.photoDataUrl"
          type="button"
          class="text-sm text-slate-400 hover:text-red-300 cursor-pointer"
          @click="clearPhoto"
        >
          Remove
        </button>
      </div>
      <div v-if="modelValue.personalInfo.photoDataUrl" class="space-y-3">
        <label class="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
          <input
            type="checkbox"
            class="h-4 w-4 rounded text-indigo-500 cursor-pointer"
            :checked="!!design.showPhoto"
            @change="patchDesign({ showPhoto: ($event.target as HTMLInputElement).checked })"
          >
          Show photo on resume / cover letter
        </label>
        <label class="block space-y-1.5">
          <div class="flex items-center justify-between text-[11px]">
            <span class="font-semibold uppercase tracking-wider text-slate-400">Photo size</span>
            <span class="text-slate-300 tabular-nums">{{ design.photoSize ?? 56 }} pt</span>
          </div>
          <input
            type="range"
            min="32"
            max="120"
            step="4"
            class="w-full accent-indigo-500 cursor-pointer"
            :value="design.photoSize ?? 56"
            @input="patchDesign({ photoSize: Number(($event.target as HTMLInputElement).value), showPhoto: true })"
          >
        </label>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="shape in (['circle', 'square', 'rounded'] as BuilderPhotoShape[])"
            :key="shape"
            type="button"
            class="px-3 py-2 rounded-xl text-xs font-semibold border capitalize cursor-pointer"
            :class="(design.photoShape || 'circle') === shape
              ? 'bg-indigo-600/30 text-white border-indigo-400'
              : 'bg-white/5 text-slate-300 border-white/10'"
            @click="setPhotoShape(shape)"
          >
            {{ shape }}
          </button>
        </div>
        <label v-if="design.photoShape === 'rounded'" class="block space-y-1.5">
          <div class="flex items-center justify-between text-[11px]">
            <span class="font-semibold uppercase tracking-wider text-slate-400">Corner radius</span>
            <span class="text-slate-300 tabular-nums">{{ design.photoBorderRadius ?? 25 }}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            class="w-full accent-indigo-500 cursor-pointer"
            :value="design.photoBorderRadius ?? 25"
            @input="patchDesign({ photoBorderRadius: Number(($event.target as HTMLInputElement).value) })"
          >
        </label>
      </div>
    </section>

    <!-- Header details / icons -->
    <section v-if="showHeaderControls" class="space-y-5">
      <h3 class="font-bold text-lg text-white">Header details</h3>

      <div class="space-y-2">
        <p class="text-xs font-semibold text-slate-300">Details Arrangement</p>
        <div class="grid grid-cols-3 gap-2">
          <button
            type="button"
            class="rounded-xl border px-2 py-3 flex items-center justify-center cursor-pointer"
            :class="(design.detailsLayout || 'inline') === 'stacked'
              ? 'border-indigo-400 bg-indigo-500/15 text-indigo-200'
              : 'border-white/10 bg-white/5 text-slate-400'"
            title="Stacked"
            @click="setDetailsLayout('stacked')"
          >
            <span class="material-symbols-outlined">view_agenda</span>
          </button>
          <button
            type="button"
            class="rounded-xl border px-2 py-3 flex items-center justify-center cursor-pointer"
            :class="(design.detailsLayout || 'inline') === 'inline'
              ? 'border-indigo-400 bg-indigo-500/15 text-indigo-200'
              : 'border-white/10 bg-white/5 text-slate-400'"
            title="Inline"
            @click="setDetailsLayout('inline')"
          >
            <span class="material-symbols-outlined">view_week</span>
          </button>
          <button
            type="button"
            class="rounded-xl border px-2 py-3 flex items-center justify-center cursor-pointer"
            :class="(design.detailsLayout || 'inline') === 'columns'
              ? 'border-indigo-400 bg-indigo-500/15 text-indigo-200'
              : 'border-white/10 bg-white/5 text-slate-400'"
            title="Two columns"
            @click="setDetailsLayout('columns')"
          >
            <span class="material-symbols-outlined">view_column</span>
          </button>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <button
            type="button"
            class="rounded-xl border px-2 py-2.5 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
            :class="(design.detailsSeparator || 'bullet') === 'icon'
              ? 'border-indigo-400 bg-indigo-500/15 text-indigo-200'
              : 'border-white/10 bg-white/5 text-slate-400'"
            @click="setDetailsSeparator('icon')"
          >
            <span class="material-symbols-outlined text-[16px]">sentiment_satisfied</span> Icon
          </button>
          <button
            type="button"
            class="rounded-xl border px-2 py-2.5 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
            :class="(design.detailsSeparator || 'bullet') === 'bullet'
              ? 'border-indigo-400 bg-indigo-500/15 text-indigo-200'
              : 'border-white/10 bg-white/5 text-slate-400'"
            @click="setDetailsSeparator('bullet')"
          >
            • Bullet
          </button>
          <button
            type="button"
            class="rounded-xl border px-2 py-2.5 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
            :class="(design.detailsSeparator || 'bullet') === 'bar'
              ? 'border-indigo-400 bg-indigo-500/15 text-indigo-200'
              : 'border-white/10 bg-white/5 text-slate-400'"
            @click="setDetailsSeparator('bar')"
          >
            | Bar
          </button>
        </div>
      </div>

      <div class="space-y-2">
        <p class="text-xs font-semibold text-slate-300">Icon Style</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="style in iconStyles"
            :key="style"
            type="button"
            class="h-9 w-9 flex items-center justify-center border transition cursor-pointer"
            :class="[
              (design.iconStyle || 'plain') === style ? 'border-indigo-400 ring-2 ring-indigo-400/30' : 'border-white/10',
              iconStyleClass(style),
            ]"
            :title="style"
            @click="setIconStyle(style)"
          >
            <span class="material-symbols-outlined text-[16px]">link</span>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
