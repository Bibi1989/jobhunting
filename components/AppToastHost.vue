<script setup lang="ts">
const { toasts, dismissToast } = useAppToast()

const kindClass: Record<string, string> = {
  success: 'border-emerald-500/40 bg-emerald-950/90 text-emerald-100',
  error: 'border-red-500/40 bg-red-950/90 text-red-100',
  info: 'border-blue-500/40 bg-slate-900/95 text-slate-100',
}

function runAction(toast: { id: number; action?: { onClick: () => void } }) {
  toast.action?.onClick()
  dismissToast(toast.id)
}
</script>

<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed right-4 top-4 z-[9999] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur"
        :class="kindClass[toast.kind] || kindClass.info"
        role="status"
      >
        <div class="flex items-start justify-between gap-3">
          <p class="leading-snug">{{ toast.message }}</p>
          <div class="flex shrink-0 items-center gap-2">
            <button
              v-if="toast.action"
              type="button"
              class="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider hover:bg-white/20"
              @click="runAction(toast)"
            >
              {{ toast.action.label }}
            </button>
            <button
              type="button"
              class="text-xs uppercase tracking-wider opacity-70 hover:opacity-100"
              @click="dismissToast(toast.id)"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
