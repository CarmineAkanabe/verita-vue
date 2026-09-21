<!-- components/complex/manager/DepartmentHeadModal.vue -->
<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Department, DepartmentHeadUser } from '@/features/manager/types'
import { createDepartmentHead, updateDepartmentHead } from '@/features/manager/api'
import { toast } from '@/plugins/toast'
import AppButton from '@/components/common/AppButton.vue'
import {
  UserPlusIcon,
  UserCogIcon,
  XIcon,
  CheckCircle2Icon,
  EyeIcon,
  EyeOffIcon,
} from '@lucide/vue'

const props = defineProps<{
  isOpen: boolean
  officer: DepartmentHeadUser | null
  departments: Department[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', officer: DepartmentHeadUser): void
}>()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const departmentId = ref('')
const password = ref('')
const showPassword = ref(false)

const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const isEditMode = computed(() => Boolean(props.officer))

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      errorMessage.value = null
      showPassword.value = false
      if (props.officer) {
        firstName.value = props.officer.firstName || ''
        lastName.value = props.officer.lastName || ''
        email.value = props.officer.email || ''
        departmentId.value = props.officer.departmentId || props.officer.department?.id || ''
        password.value = ''
      } else {
        firstName.value = ''
        lastName.value = ''
        email.value = ''
        departmentId.value = props.departments.length > 0 ? props.departments[0].id : ''
        password.value = ''
      }
    }
  }
)

function validate(): boolean {
  if (!firstName.value.trim()) {
    errorMessage.value = 'First name is required.'
    return false
  }
  if (!lastName.value.trim()) {
    errorMessage.value = 'Last name is required.'
    return false
  }
  if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    errorMessage.value = 'A valid work email is required.'
    return false
  }
  if (!departmentId.value) {
    errorMessage.value = 'Department assignment is required.'
    return false
  }
  if (!isEditMode.value && (!password.value || password.value.length < 8)) {
    errorMessage.value = 'Password is required and must be at least 8 characters.'
    return false
  }
  if (isEditMode.value && password.value && password.value.length < 8) {
    errorMessage.value = 'New password must be at least 8 characters.'
    return false
  }

  return true
}

async function handleSubmit() {
  if (!validate()) return

  isSubmitting.value = true
  errorMessage.value = null

  try {
    let saved: DepartmentHeadUser
    if (isEditMode.value && props.officer) {
      saved = await updateDepartmentHead(props.officer.id, {
        firstName: firstName.value.trim(),
        lastName: lastName.value.trim(),
        email: email.value.trim().toLowerCase(),
        departmentId: departmentId.value,
        password: password.value ? password.value : undefined,
      })
      toast.success(`Officer ${saved.firstName} ${saved.lastName} updated successfully.`)
    } else {
      saved = await createDepartmentHead({
        firstName: firstName.value.trim(),
        lastName: lastName.value.trim(),
        email: email.value.trim().toLowerCase(),
        password: password.value,
        departmentId: departmentId.value,
      })
      toast.success(`Account created for ${saved.firstName} ${saved.lastName}.`)
    }

    emit('saved', saved)
    emit('close')
  } catch (err: any) {
    errorMessage.value =
      err?.response?.data?.message ||
      err?.message ||
      'Failed to save officer account. Please check details and try again.'
    toast.error('Officer account operation failed.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-xs"
    role="dialog"
    aria-modal="true"
    aria-labelledby="officer-modal-title"
  >
    <!-- Modal Card -->
    <div
      class="w-full max-w-lg bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 card-creamy"
    >
      <!-- Header -->
      <div class="px-6 py-5 border-b border-border flex items-start justify-between gap-4 bg-muted/40">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
            <UserCogIcon v-if="isEditMode" class="size-5" />
            <UserPlusIcon v-else class="size-5" />
          </div>
          <div>
            <h3 id="officer-modal-title" class="text-base font-bold text-foreground">
              {{ isEditMode ? 'Edit Personnel Account' : 'Provision Officer Account' }}
            </h3>
            <p class="text-xs text-muted-foreground">
              {{ isEditMode ? 'Update officer profile and department assignment' : 'Create Department Head credentials for investigation triage' }}
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

      <!-- Form Body -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <!-- First Name -->
          <div>
            <label for="officer-first-name" class="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
              First Name <span class="text-destructive">*</span>
            </label>
            <input
              id="officer-first-name"
              v-model="firstName"
              type="text"
              placeholder="e.g. Jean-Paul"
              class="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              :disabled="isSubmitting"
            />
          </div>

          <!-- Last Name -->
          <div>
            <label for="officer-last-name" class="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
              Last Name <span class="text-destructive">*</span>
            </label>
            <input
              id="officer-last-name"
              v-model="lastName"
              type="text"
              placeholder="e.g. Biya"
              class="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              :disabled="isSubmitting"
            />
          </div>
        </div>

        <!-- Work Email -->
        <div>
          <label for="officer-email" class="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
            Work Email Address <span class="text-destructive">*</span>
          </label>
          <input
            id="officer-email"
            v-model="email"
            type="email"
            placeholder="officer@digimark.cm"
            class="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
            :disabled="isSubmitting"
          />
        </div>

        <!-- Department Picker -->
        <div>
          <label for="officer-dept" class="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
            Assigned Department <span class="text-destructive">*</span>
          </label>
          <select
            id="officer-dept"
            v-model="departmentId"
            class="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            :disabled="isSubmitting"
          >
            <option value="" disabled>-- Select department --</option>
            <option
              v-for="dept in departments"
              :key="dept.id"
              :value="dept.id"
            >
              {{ dept.name }}
            </option>
          </select>
        </div>

        <!-- Password Field -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label for="officer-password" class="block text-xs font-bold uppercase tracking-wider text-foreground">
              {{ isEditMode ? 'Rotate Password (Optional)' : 'Initial Password' }}
              <span v-if="!isEditMode" class="text-destructive">*</span>
            </label>
            <span class="text-[10px] text-muted-foreground font-mono">Min. 8 characters</span>
          </div>
          <div class="relative">
            <input
              id="officer-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="isEditMode ? 'Leave blank to keep unchanged' : 'Secure temporary passphrase'"
              class="w-full h-9 pl-3 pr-10 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
              :disabled="isSubmitting"
            />
            <button
              type="button"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
              @click="showPassword = !showPassword"
              tabindex="-1"
            >
              <EyeOffIcon v-if="showPassword" class="size-3.5" />
              <EyeIcon v-else class="size-3.5" />
            </button>
          </div>
        </div>

        <!-- Error alert -->
        <div v-if="errorMessage" class="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          {{ errorMessage }}
        </div>

        <!-- Actions -->
        <div class="pt-4 border-t border-border flex items-center justify-end gap-2.5">
          <AppButton
            variant="outline"
            size="sm"
            type="button"
            :disabled="isSubmitting"
            @click="emit('close')"
          >
            Cancel
          </AppButton>

          <button
            type="submit"
            class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            :disabled="isSubmitting"
          >
            <CheckCircle2Icon v-if="!isSubmitting" class="size-4" />
            <span v-if="isSubmitting">Saving Officer...</span>
            <span v-else>{{ isEditMode ? 'Update Officer Account' : 'Provision Officer' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
