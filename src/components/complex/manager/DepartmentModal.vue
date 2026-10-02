<!-- components/complex/manager/DepartmentModal.vue -->
<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Department } from '@/features/manager/types'
import { createDepartment, updateDepartment } from '@/features/manager/api'
import { toast } from '@/plugins/toast'
import AppButton from '@/components/common/AppButton.vue'
import {
  Building2Icon,
  XIcon,
  CheckCircle2Icon,
} from '@lucide/vue'

const props = defineProps<{
  isOpen: boolean
  department: Department | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', department: Department): void
}>()

const name = ref('')
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const isEditMode = computed(() => Boolean(props.department))

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      errorMessage.value = null
      name.value = props.department ? props.department.name : ''
    }
  }
)

async function handleSubmit() {
  const trimmed = name.value.trim()
  if (!trimmed) {
    errorMessage.value = 'Department name is required.'
    return
  }
  if (trimmed.length > 255) {
    errorMessage.value = 'Department name must not exceed 255 characters.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  try {
    let saved: Department
    if (isEditMode.value && props.department) {
      saved = await updateDepartment(props.department.id, { name: trimmed })
      toast.success(`Department "${trimmed}" updated successfully.`)
    } else {
      saved = await createDepartment({ name: trimmed })
      toast.success(`Department "${trimmed}" created successfully.`)
    }

    emit('saved', saved)
    emit('close')
  } catch (err: any) {
    errorMessage.value =
      err?.response?.data?.message ||
      err?.message ||
      'Failed to save department. Please verify details and try again.'
    toast.error('Department operation failed.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-xs"
    role="dialog" aria-modal="true" aria-labelledby="dept-modal-title">
    <!-- Modal Card -->
    <div
      class="w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 card-creamy">
      <!-- Header -->
      <div class="px-6 py-5 border-b border-border flex items-start justify-between gap-4 bg-muted/40">
        <div class="flex items-center gap-3">
          <div
            class="h-10 w-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
            <Building2Icon class="size-5" />
          </div>
          <div>
            <h3 id="dept-modal-title" class="text-base font-bold text-foreground">
              {{ isEditMode ? 'Edit Department' : 'Create New Department' }}
            </h3>
            <p class="text-xs text-muted-foreground">
              {{ isEditMode ? 'Update department designation' : 'Register an operational unit for triage' }}
            </p>
          </div>
        </div>

        <button type="button"
          class="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
          :disabled="isSubmitting" @click="emit('close')" aria-label="Close modal">
          <XIcon class="size-5" />
        </button>
      </div>

      <!-- Form Body -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <div>
          <label for="dept-name" class="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
            Department Name <span class="text-destructive">*</span>
          </label>
          <input id="dept-name" v-model="name" type="text" maxlength="255"
            placeholder="e.g. Finance & Procurement, Logistics & Security"
            class="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            :disabled="isSubmitting" autofocus />
          <p class="text-[11px] text-muted-foreground mt-1">
            Official business unit name shown to anonymous case reporters during report intake.
          </p>
        </div>

        <!-- Error alert -->
        <div v-if="errorMessage"
          class="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          {{ errorMessage }}
        </div>

        <p class="text-[11px] text-muted-foreground leading-relaxed">
          Departmental case allocations and investigator oversight operate under Verita's
          <router-link to="/terms" target="_blank" class="text-primary hover:underline font-semibold">Terms of Service</router-link>.
        </p>

        <!-- Actions -->
        <div class="pt-4 border-t border-border flex items-center justify-end gap-2.5">
          <AppButton variant="outline" size="sm" type="button" :disabled="isSubmitting" @click="emit('close')">
            Cancel
          </AppButton>

          <button type="submit"
            class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            :disabled="isSubmitting || !name.trim()">
            <CheckCircle2Icon v-if="!isSubmitting" class="size-4" />
            <span v-if="isSubmitting">Saving...</span>
            <span v-else>{{ isEditMode ? 'Update Department' : 'Create Department' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
