<!-- components/complex/cases/EscalateConfirmModal.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { escalateCase } from '@/features/cases/api'
import { toast } from '@/plugins/toast'
import AppButton from '@/components/common/AppButton.vue'
import {
  AlertTriangleIcon,
  ShieldAlertIcon,
  XIcon,
  CheckCircle2Icon,
} from '@lucide/vue'

const props = defineProps<{
  isOpen: boolean
  caseId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'escalated', escalatedAt: string): void
}>()

const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

async function handleConfirmEscalation() {
  isSubmitting.value = true
  errorMessage.value = null

  try {
    const result = await escalateCase()
    toast.success('Incident successfully escalated to General Management.')
    emit('escalated', result.escalatedAt)
    emit('close')
  } catch (err: any) {
    errorMessage.value =
      err?.message ||
      'Failed to escalate case. Please check your connection and try again.'
    toast.error('Escalation request failed.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-xs"
    role="dialog"
    aria-modal="true"
    aria-labelledby="escalate-modal-title"
  >
    <!-- Modal Card -->
    <div
      class="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Header with alert tone -->
      <div class="px-6 py-5 border-b border-border flex items-start justify-between gap-4 bg-[#FCF4EE]">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
            <ShieldAlertIcon class="size-5" />
          </div>
          <div>
            <h3 id="escalate-modal-title" class="text-base font-bold text-foreground">
              Escalate to Manager
            </h3>
            <p class="text-xs text-muted-foreground">
              Send this case directly to the Manager for independent review
            </p>
          </div>
        </div>

        <button
          type="button"
          class="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
          :disabled="isSubmitting"
          @click="emit('close')"
          aria-label="Close modal"
        >
          <XIcon class="size-5" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 space-y-4 text-sm text-foreground">
        <div class="p-3.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] flex items-start gap-3">
          <AlertTriangleIcon class="size-5 shrink-0 mt-0.5 text-[#D97706]" />
          <div class="text-xs space-y-1">
            <p class="font-semibold text-[#78350F]">Notice on Escalation</p>
            <p>
              Escalating routes this case directly to the Manager. The Department Head will no longer handle this case alone.
            </p>
          </div>
        </div>

        <p class="leading-relaxed text-xs sm:text-sm text-[#4B5563]">
          Use this when:
        </p>
        <ul class="list-disc pl-5 space-y-1 text-xs text-[#4B5563]">
          <li>The incident involves or mentions the Department Head.</li>
          <li>There is a conflict of interest in the department.</li>
          <li>You need direct Manager oversight.</li>
        </ul>

        <div v-if="errorMessage" class="p-3 rounded-md bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs">
          {{ errorMessage }}
        </div>
      </div>

      <!-- Actions -->
      <div class="px-6 py-4 border-t border-border bg-[#FAF7F2] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
        <AppButton
          variant="outline"
          size="sm"
          :disabled="isSubmitting"
          @click="emit('close')"
        >
          Cancel &amp; Keep in Department
        </AppButton>

        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-primary hover:bg-[#843F01] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          :disabled="isSubmitting"
          @click="handleConfirmEscalation"
        >
          <CheckCircle2Icon v-if="!isSubmitting" class="size-4" />
          <span v-if="isSubmitting">Transmitting escalation...</span>
          <span v-else>Confirm Escalation</span>
        </button>
      </div>
    </div>
  </div>
</template>
