<script setup lang="ts">
const { locale, locales, setLocale, t } = useI18n()

const available = computed(() =>
  (locales.value as Array<{ code: string; name?: string }>).map((l) => ({
    code: l.code,
    name: l.name || l.code,
  })),
)

async function onChange(event: Event) {
  const next = (event.target as HTMLSelectElement).value
  if (next === 'en' || next === 'de') {
    await setLocale(next)
  }
}
</script>

<template>
  <label class="inline-flex items-center gap-1.5 text-xs text-[color:var(--app-muted)]">
    <span class="sr-only">{{ t('prefs.language') }}</span>
    <select
      class="rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-input)] text-[color:var(--app-fg)] text-xs font-semibold px-2 py-1.5 outline-none focus:border-indigo-400"
      :value="locale"
      :aria-label="t('prefs.language')"
      @change="onChange"
    >
      <option v-for="item in available" :key="item.code" :value="item.code">
        {{ item.name }}
      </option>
    </select>
  </label>
</template>
