<script setup lang="ts">
const { state, accept, cancel } = useAppConfirm()

function onKeydown(event: KeyboardEvent) {
  if (!state.value.open) return
  if (event.key === 'Escape') {
    event.preventDefault()
    cancel()
  }
}

onMounted(() => {
  if (import.meta.client) window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  if (import.meta.client) window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="state.open"
      class="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="'app-confirm-title'"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
        aria-label="Dismiss"
        @click="cancel"
      />
      <div
        class="relative w-full max-w-md rounded-2xl border border-[color:var(--app-border)] bg-[color:var(--app-bg-elevated)] shadow-2xl overflow-hidden"
      >
        <div class="h-0.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400" />
        <div class="p-5">
          <h2 id="app-confirm-title" class="text-lg font-bold text-[color:var(--app-fg)]">
            {{ state.title }}
          </h2>
          <p class="mt-2 text-sm text-[color:var(--app-muted)] leading-relaxed whitespace-pre-wrap">
            {{ state.message }}
          </p>
          <div class="mt-6 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              class="px-4 py-2 rounded-xl border border-slate-700 bg-slate-950/60 text-sm font-semibold text-slate-200 hover:bg-slate-800 cursor-pointer transition-colors"
              @click="cancel"
            >
              {{ state.cancelLabel }}
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer transition-colors"
              :class="
                state.danger
                  ? 'bg-red-600 hover:bg-red-500'
                  : 'bg-indigo-600 hover:bg-indigo-500'
              "
              @click="accept"
            >
              {{ state.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
