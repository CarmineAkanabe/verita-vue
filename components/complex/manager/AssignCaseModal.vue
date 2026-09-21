<!-- components/complex/manager/AssignCaseModal.vue -->
<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { StaffCase } from '@/features/cases/types'
import type { DepartmentHeadUser } from '@/features/manager/types'
import { assignCase } from '@/features/manager/api'
import { toast } from '@/plugins/toast'
import AppButton from '@/components/common/AppButton.vue'
import StatusPill from '@/components/common/StatusPill.vue'
import {
  UserCheckIcon,
  XIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
} from '@lucide/vue'

const props = defineProps<{
  isOpen: boolean
  caseItem: StaffCase | null
  departmentHeads: DepartmentHeadUser[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'assigned', payload: { caseId: string; departmentHeadId: string; departmentHeadName: string }): void
}>()

const selectedHeadId = ref<string>('')
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      errorMessage.value = null
      selectedHeadId.value = ''
      // If only one department head exists, pre-select
      if (props.departmentHeads.length === 1) {
        selectedHeadId.value = props.departmentHeads[0].id
      }
    }
  }
)

const selectedOfficer = computed(() => {
  return props.departmentHeads.find((h) => h.id === selectedHeadId.value)
})

function formatAmount(amount: string | number | undefined): string {
  if (amount === undefined || amount === null) return '0 FCFA'
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numeric)) return `${amount} FCFA`
  return `${numeric.toLocaleString('fr-FR')} FCFA`
}

async function handleAssign() {
  if (!props.caseItem) return
  if (!selectedHeadId.value) {
    errorMessage.value = 'Please select a Department Head officer to assign this case.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  try {
    await assignCase(props.caseItem.id, selectedHeadId.value)
    const officerName = selectedOfficer.value
      ? `${selectedOfficer.value.firstName} ${selectedOfficer.value.lastName}`.trim()
      : 'Officer'

    toast.success(`Case assigned to ${officerName}. Investigation status updated.`)
    emit('assigned', {
      caseId: props.caseItem.id,
      departmentHeadId: selectedHeadId.value,
      departmentHeadName: officerName,
    })
    emit('close')
  } catch (err: any) {
    errorMessage.value =
      err?.message || 'Failed to assign case. Please check network connection and try again.'
    toast.error('Failed to assign case.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    v-if="isOpen && caseItem"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-xs"
    role="dialog"
    aria-modal="true"
    aria-labelledby="assign-modal-title"
  >
    <!-- Modal Card -->
    <div
      class="w-full max-w-lg bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 card-creamy"
    >
      <!-- Header -->
      <div class="px-6 py-5 border-b border-border flex items-start justify-between gap-4 bg-muted/40">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
            <UserCheckIcon class="size-5" />
          </div>
          <div>
            <h3 id="assign-modal-title" class="text-base font-bold text-foreground">
              Assign Case to Officer
            </h3>
            <p class="text-xs text-muted-foreground">
              Delegate case investigation to an authorized Department Head
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

      <!-- Body -->
      <div class="p-6 space-y-4 text-sm text-foreground">
        <!-- Case Summary Strip -->
        <div class="p-3.5 rounded-lg bg-muted/30 border border-border space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-mono font-bold text-foreground">
              {{ caseItem.id.slice(0, 8) }}...{{ caseItem.id.slice(-6) }}
            </span>
            <StatusPill :status="caseItem.status" />
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 border-t border-border/60">
            <div>
              <span class="font-medium text-foreground">Category:</span> {{ caseItem.category }}
            </div>
            <div>
              <span class="font-medium text-foreground">Amount:</span> {{ formatAmount(caseItem.amountInvolved) }}
            </div>
          </div>
          <p v-if="caseItem.purposeOfTransaction" class="text-xs text-muted-foreground line-clamp-1 italic">
            "{{ caseItem.purposeOfTransaction }}"
          </p>
        </div>

        <!-- Officer Picker Form -->
        <div class="space-y-2">
          <label for="officer-select" class="block text-xs font-bold uppercase tracking-wider text-foreground">
            Select Department Head <span class="text-destructive">*</span>
          </label>
          <select
            id="officer-select"
            v-model="selectedHeadId"
            class="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            :disabled="isSubmitting || departmentHeads.length === 0"
          >
            <option value="" disabled>-- Choose an authorized officer --</option>
            <option
              v-for="officer in departmentHeads"
              :key="officer.id"
              :value="officer.id"
            >
              {{ officer.firstName }} {{ officer.lastName }} ({{ officer.email }}) — {{ officer.department?.name || 'General Department' }} [{{ officer.presenceStatus === 'ONLINE' ? 'ONLINE' : 'OFFLINE' }}]
            </option>
          </select>
          <p v-if="departmentHeads.length === 0" class="text-xs text-destructive flex items-center gap-1">
            <AlertTriangleIcon class="size-3.5" />
            No Department Head accounts found. Please provision personnel accounts first.
          </p>
          <p v-else class="text-[11px] text-muted-foreground">
            Once assigned, this case will be moved to the officer's active investigation docket.
          </p>
        </div>

        <!-- Error alert -->
        <div v-if="errorMessage" class="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          {{ errorMessage }}
        </div>
      </div>

      <!-- Actions -->
      <div class="px-6 py-4 border-t border-border bg-muted/20 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
        <AppButton
          variant="outline"
          size="sm"
          :disabled="isSubmitting"
          @click="emit('close')"
        >
          Cancel
        </AppButton>

        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-primary hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          :disabled="isSubmitting || !selectedHeadId"
          @click="handleAssign"
        >
          <CheckCircle2Icon v-if="!isSubmitting" class="size-4" />
          <span v-if="isSubmitting">Assigning Case...</span>
          <span v-else>Confirm Assignment</span>
        </button>
      </div>
    </div>
  </div>
</template>
