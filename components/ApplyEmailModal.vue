<script setup lang="ts">
import { Mail } from 'lucide-vue-next'
import ApplyEmailForm from '~/components/apply/ApplyEmailForm.vue'
import type { BuilderResumeData } from '~/shared/types/builder'

const props = defineProps<{
  modelValue: boolean
  resumeData: BuilderResumeData
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { t } = useI18n()

const formRef = ref<{ initForm: () => Promise<void> } | null>(null)

watch(
  () => props.modelValue,
  (open) => {
    if (open) void formRef.value?.initForm()
  },
)

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-email-modal-title"
    >
      <button
        type="button"
        class="absolute inset-0 bg-slate-950/75 backdrop-blur-sm cursor-pointer"
        :aria-label="t('extension.dismiss')"
        @click="close"
      />

      <div
        class="relative w-full max-w-2xl rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/40 overflow-hidden flex flex-col max-h-[92vh]"
      >
        <div class="h-0.5 w-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-emerald-400" />

        <div class="p-6 overflow-y-auto flex-1">
          <div class="flex items-center gap-2 mb-5">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Mail :size="20" />
            </div>
            <div>
              <h2 id="apply-email-modal-title" class="text-lg font-bold text-white">{{ t('applyEmail.title') }}</h2>
              <p class="text-xs text-slate-400">{{ t('applyEmail.subtitle') }}</p>
            </div>
          </div>

          <ApplyEmailForm
            ref="formRef"
            variant="modal"
            :resume-data="resumeData"
            @close="close"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>
