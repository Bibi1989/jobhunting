<script setup lang="ts">
/**
 * Lightweight section manager — shifts indices in sectionsOrder so the live
 * vue-pdf canvas and the Nitro download pipeline stay in sync.
 */
import type { BuilderCustomSection } from '~/shared/types/builder'
import {
  moveSection,
  sectionLabel,
  type ResumeSectionId,
} from '~/shared/pdf/schema'

const order = defineModel<ResumeSectionId[]>({ required: true })

const props = defineProps<{
  customSections?: BuilderCustomSection[]
}>()

function move(index: number, direction: -1 | 1) {
  order.value = moveSection(order.value, index, direction)
}

// --- Drag and drop reordering ---
const dragIndex = ref<number | null>(null)
const overIndex = ref<number | null>(null)

function onDragStart(index: number, event: DragEvent) {
  dragIndex.value = index
  event.dataTransfer?.setData('text/plain', String(index))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}
function onDragOver(index: number) {
  if (dragIndex.value === null) return
  overIndex.value = index
}
function onDrop(index: number) {
  const from = dragIndex.value
  dragIndex.value = null
  overIndex.value = null
  if (from === null || from === index) return
  const next = [...order.value]
  const [moved] = next.splice(from, 1)
  if (moved === undefined) return
  next.splice(index, 0, moved)
  order.value = next
}
function onDragEnd() {
  dragIndex.value = null
  overIndex.value = null
}
</script>

<template>
  <div class="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
    <div class="px-4 py-3 border-b border-white/10">
      <h2 class="text-sm font-semibold text-white">Section order</h2>
      <p class="text-xs text-slate-400 mt-0.5">
        Drag the handle or use the arrows — preview and PDF download both follow this order.
      </p>
    </div>
    <TransitionGroup
      name="section-reorder"
      tag="ul"
      class="divide-y divide-white/5"
    >
      <li
        v-for="(id, index) in order"
        :key="id"
        draggable="true"
        class="flex items-center gap-3 px-4 py-2.5 transition-colors"
        :class="[
          dragIndex === index ? 'opacity-40' : '',
          overIndex === index && dragIndex !== index ? 'bg-blue-500/15 ring-1 ring-inset ring-blue-400/40' : 'bg-transparent',
        ]"
        @dragstart="onDragStart(index, $event)"
        @dragover.prevent="onDragOver(index)"
        @drop.prevent="onDrop(index)"
        @dragend="onDragEnd"
      >
        <span class="material-symbols-outlined text-slate-500 text-[18px] cursor-grab active:cursor-grabbing" title="Drag to reorder">drag_indicator</span>
        <span class="flex-1 text-sm text-slate-200 truncate">
          {{ sectionLabel(id, customSections || []) }}
        </span>
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            :disabled="index === 0"
            aria-label="Move section up"
            @click="move(index, -1)"
          >
            <span class="material-symbols-outlined text-[18px]">keyboard_arrow_up</span>
          </button>
          <button
            type="button"
            class="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            :disabled="index === order.length - 1"
            aria-label="Move section down"
            @click="move(index, 1)"
          >
            <span class="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
          </button>
        </div>
      </li>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.section-reorder-move {
  transition: transform 0.2s ease;
}
</style>
