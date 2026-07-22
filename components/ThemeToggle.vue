<script setup lang="ts">
const colorMode = useColorMode()
const { t } = useI18n()

const isDark = computed(() => colorMode.value === 'dark')

function toggle() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-input)] text-[color:var(--app-muted)] hover:text-[color:var(--app-fg)] transition-colors"
    :title="isDark ? t('prefs.switchToLight') : t('prefs.switchToDark')"
    :aria-label="isDark ? t('prefs.switchToLight') : t('prefs.switchToDark')"
    @click="toggle"
  >
    <span class="material-symbols-outlined text-[20px]">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
  </button>
</template>
