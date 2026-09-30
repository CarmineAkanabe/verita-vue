<!-- pages/staff/ProfileSettings.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/shared/stores/auth'
import { updateProfile } from '@/features/account/api'
import { toast } from '@/plugins/toast'
import { getAvatarUrl } from '@/utils/avatar'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import {
  ShieldCheckIcon,
  UploadIcon,
  Trash2Icon,
  CheckCircle2Icon,
  LockIcon,
  UserIcon,
  InfoIcon,
} from '@lucide/vue'

const auth = useAuthStore()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const imageLoadError = ref(false)

const isSubmitting = ref(false)
const generalError = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})

const userInitials = computed(() => {
  const f = firstName.value || auth.user?.firstName || 'S'
  const l = lastName.value || auth.user?.lastName || ''
  return (f[0] || 'S') + (l[0] || '')
})

function populateForm() {
  if (auth.user) {
    firstName.value = auth.user.firstName || ''
    lastName.value = auth.user.lastName || ''
    email.value = auth.user.email || ''
    previewUrl.value = getAvatarUrl(auth.user.profilePicture)
    imageLoadError.value = false
  }
}

onMounted(() => {
  populateForm()
})

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  fieldErrors.value.profile_picture = ''

  if (!file) return

  // Validate type
  if (!file.type.startsWith('image/')) {
    fieldErrors.value.profile_picture = 'File must be an image (JPEG, PNG, WEBP).'
    return
  }

  // Validate size <= 2MB
  if (file.size > 2 * 1024 * 1024) {
    fieldErrors.value.profile_picture = 'Profile picture must not exceed 2 MB.'
    return
  }

  selectedFile.value = file
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = URL.createObjectURL(file)
  imageLoadError.value = false
}

function removeSelectedFile() {
  selectedFile.value = null
  fieldErrors.value.profile_picture = ''
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = getAvatarUrl(auth.user?.profilePicture)
  imageLoadError.value = false
}

async function handleSubmit() {
  generalError.value = null
  fieldErrors.value = {}

  // Client-side validation
  if (password.value) {
    if (password.value.length < 8) {
      fieldErrors.value.password = 'Password must be at least 8 characters.'
      return
    }
    if (password.value !== passwordConfirmation.value) {
      fieldErrors.value.password_confirmation = 'Passwords do not match.'
      return
    }
  }

  isSubmitting.value = true

  try {
    const updatedUser = await updateProfile({
      first_name: firstName.value,
      last_name: lastName.value,
      email: email.value,
      password: password.value || undefined,
      password_confirmation: passwordConfirmation.value || undefined,
      profile_picture: selectedFile.value || undefined,
    })

    auth.setUser(updatedUser)
    populateForm()
    password.value = ''
    passwordConfirmation.value = ''
    selectedFile.value = null
    toast.success('Account profile credentials successfully updated.')
  } catch (err: any) {
    const apiErrors = err?.response?.data?.errors
    if (apiErrors && typeof apiErrors === 'object') {
      const mapped: Record<string, string> = {}
      for (const [key, msgs] of Object.entries(apiErrors)) {
        mapped[key] = Array.isArray(msgs) ? msgs[0] : String(msgs)
      }
      fieldErrors.value = mapped
    } else {
      generalError.value = err?.response?.data?.detail || err?.message || 'Failed to update profile settings.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="border-b border-border pb-5">
      <div class="flex items-center gap-2">
        <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
          Security &amp; Personnel Credentials
        </span>
        <span class="text-xs text-muted-foreground font-mono">
          CEMAC / Douala Regional Hub
        </span>
      </div>
      <h1 class="text-2xl font-bold text-foreground mt-1 tracking-tight">
        Staff Profile Settings
      </h1>
      <p class="text-xs text-muted-foreground mt-0.5">
        Manage authorized investigator identity, contact details, and cryptographic session credentials.
      </p>
    </div>

    <!-- General Error Banner -->
    <ErrorBanner
      v-if="generalError"
      :message="generalError"
      @retry="generalError = null"
    />

    <!-- Main Profile Card -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Identity & Security Badges -->
      <div class="bg-card border border-border rounded-lg p-5">
        <h2 class="text-xs font-bold uppercase tracking-wider text-foreground mb-4 flex items-center gap-2">
          <ShieldCheckIcon class="size-4 text-primary" />
          Institutional Clearance &amp; Identifiers
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div class="p-3 rounded bg-muted/40 border border-border space-y-1">
            <span class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Staff Identifier
            </span>
            <p class="font-mono font-bold text-sm text-foreground">
              {{ auth.user?.staffId || 'STF-0421' }}
            </p>
          </div>

          <div class="p-3 rounded bg-muted/40 border border-border space-y-1">
            <span class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Clearance Role
            </span>
            <p class="font-bold text-sm text-foreground">
              {{ auth.user?.role === 'MANAGER' ? 'Manager' : 'Department Head' }}
            </p>
          </div>

          <div class="p-3 rounded bg-muted/40 border border-border space-y-1">
            <span class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Department Assignment
            </span>
            <p class="font-bold text-sm text-foreground truncate">
              {{ auth.user?.departmentId ? 'Assigned Directorate' : 'Corporate Governance (All)' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Avatar & Basic Info Card -->
      <div class="bg-card border border-border rounded-lg p-5 space-y-6">
        <h2 class="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
          <UserIcon class="size-4 text-primary" />
          Personal &amp; Contact Details
        </h2>

        <!-- Avatar Uploader -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-5 p-4 rounded-lg bg-muted/30 border border-border">
          <div class="relative size-16 rounded-full overflow-hidden bg-ink-900 text-white flex items-center justify-center font-bold text-lg shrink-0 border border-border">
            <img
              v-if="previewUrl && !imageLoadError"
              :src="previewUrl"
              alt="Avatar preview"
              class="w-full h-full object-cover"
              @error="imageLoadError = true"
            />
            <span v-else>{{ userInitials }}</span>
          </div>

          <div class="flex-1 space-y-1.5">
            <div class="flex items-center gap-2">
              <label
                for="avatar-upload"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border cursor-pointer transition-colors"
              >
                <UploadIcon class="size-3.5" />
                <span>Upload corporate photo</span>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="sr-only"
                @change="handleFileChange"
              />

              <button
                v-if="selectedFile"
                type="button"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                @click="removeSelectedFile"
              >
                <Trash2Icon class="size-3.5" />
                <span>Reset selection</span>
              </button>
            </div>

            <p class="text-[11px] text-muted-foreground">
              Maximum file size: 2 MB. Allowed formats: JPG, PNG, WEBP.
            </p>
            <p v-if="fieldErrors.profile_picture" class="text-xs text-destructive font-semibold">
              {{ fieldErrors.profile_picture }}
            </p>
          </div>
        </div>

        <!-- Name & Email Inputs -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppInput
            v-model="firstName"
            label="First Name"
            placeholder="e.g. Henriette"
            :error="fieldErrors.first_name"
            required
          />

          <AppInput
            v-model="lastName"
            label="Last Name"
            placeholder="e.g. Moukoko"
            :error="fieldErrors.last_name"
            required
          />
        </div>

        <AppInput
          v-model="email"
          label="Corporate Email Address"
          type="email"
          placeholder="e.g. h.moukoko@enterprise.com"
          :error="fieldErrors.email"
          hint="Used for case notifications and password resets."
          required
        />
      </div>

      <!-- Password Rotation Card -->
      <div class="bg-card border border-border rounded-lg p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <LockIcon class="size-4 text-primary" />
            Password Rotation
          </h2>
          <span class="text-[11px] text-muted-foreground">
            Leave blank if you do not wish to change your password
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppInput
            v-model="password"
            label="New Password"
            type="password"
            placeholder="••••••••••••"
            :error="fieldErrors.password"
            hint="Minimum 8 characters with letters, numbers, and symbols."
          />

          <AppInput
            v-model="passwordConfirmation"
            label="Confirm New Password"
            type="password"
            placeholder="••••••••••••"
            :error="fieldErrors.password_confirmation"
            hint="Must exactly match the new password entered above."
          />
        </div>

        <div class="p-3 rounded bg-muted/40 border border-border text-[11px] text-muted-foreground flex items-start gap-2">
          <InfoIcon class="size-4 shrink-0 text-primary mt-0.5" />
          <span>
            Per enterprise corporate security policy, passwords must not contain easily guessable organizational names and must be rotated every 90 days.
          </span>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="flex items-center justify-end gap-3 pt-2">
        <AppButton
          type="button"
          variant="outline"
          :disabled="isSubmitting"
          @click="populateForm"
        >
          Cancel Changes
        </AppButton>

        <AppButton
          type="submit"
          :loading="isSubmitting"
        >
          <CheckCircle2Icon class="size-4 mr-1.5" />
          Save Profile Credentials
        </AppButton>
      </div>
    </form>
  </div>
</template>
