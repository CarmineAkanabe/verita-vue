<!-- pages/auth/StaffLogin.vue -->
<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import { loginStaff } from '@/features/auth/api'
import { ApiError } from '@/shared/api/error'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import { toast } from '@/plugins/toast'
import {
  ShieldCheckIcon,
  LockIcon,
  MailIcon,
  TriangleAlertIcon,
  ClockIcon,
  ArrowRightIcon,
  KeyIcon,
} from '@lucide/vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: '',
})

const errors = reactive({
  email: '',
  password: '',
  general: '',
})

const isRateLimited = ref(false)
const isLoading = ref(false)

function validate(): boolean {
  errors.email = ''
  errors.password = ''
  errors.general = ''
  isRateLimited.value = false

  let valid = true

  if (!form.email.trim()) {
    errors.email = 'Work email is required.'
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Please enter a valid email address.'
    valid = false
  }

  if (!form.password) {
    errors.password = 'Password is required.'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validate()) return

  isLoading.value = true
  errors.general = ''
  isRateLimited.value = false

  try {
    const { token, user } = await loginStaff(form)
    authStore.setStaffSession(token, user)
    toast.success(`Welcome back, ${user.firstName || 'Staff Member'}.`)

    // Determine destination
    const redirect = route.query.redirect as string | undefined
    if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
      await router.push(redirect)
    } else {
      // Default to /app
      try {
        await router.push('/app')
      } catch {
        // In case /app route has no children yet, handle safely
      }
    }
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 429) {
        isRateLimited.value = true
        errors.general =
          'Too many login attempts (50 per minute limit). Please wait a moment before trying again.'
      } else if (err.status === 401) {
        errors.general = 'Invalid email or password. Please verify your staff credentials.'
      } else if (err.errors) {
        if (err.errors.email) errors.email = err.errors.email[0]
        if (err.errors.password) errors.password = err.errors.password[0]
        if (!err.errors.email && !err.errors.password) {
          errors.general = err.message || 'Validation failed.'
        }
      } else {
        errors.general = err.message || 'Unable to sign in. Please verify your credentials.'
      }
    } else {
      errors.general = 'A network error occurred. Please check your connection and try again.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6 animate-fade-in-up">
    <!-- Main Staff Login Card -->
    <AppCard
      cardClass="border-border bg-card shadow-lg"
      contentClass="space-y-5"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <ShieldCheckIcon class="size-5" />
          </div>
          <div>
            <h1 class="text-xl font-bold tracking-tight text-foreground">
              Staff Portal Sign In
            </h1>
            <p class="text-xs text-muted-foreground">
              Authorized Department Heads &amp; Managers
            </p>
          </div>
        </div>
      </template>

      <!-- Rate Limit Alert (429) -->
      <div
        v-if="isRateLimited"
        class="rounded-lg border border-warning/40 bg-warning/10 p-4 space-y-2 text-left"
      >
        <div class="flex items-center gap-2 text-xs font-bold text-foreground">
          <ClockIcon class="size-4 text-warning shrink-0" />
          <span>Login Rate Limit Exceeded</span>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed">
          {{ errors.general }}
        </p>
      </div>

      <!-- General Error Alert (401 / Network) -->
      <div
        v-else-if="errors.general"
        class="rounded-lg border border-destructive/30 bg-destructive/10 p-4 space-y-2 text-left"
      >
        <div class="flex items-center gap-2 text-xs font-bold text-destructive">
          <TriangleAlertIcon class="size-4 shrink-0" />
          <span>Authentication Error</span>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed">
          {{ errors.general }}
        </p>
      </div>

      <!-- Form Inputs -->
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <!-- Work Email -->
        <AppInput
          id="staff-email"
          v-model="form.email"
          type="email"
          label="Work Email"
          placeholder="e.g. adan@enterprise.com"
          :error="errors.email"
          required
          autocomplete="email"
        >
          <template #prefix>
            <MailIcon class="size-4" />
          </template>
        </AppInput>

        <!-- Password -->
        <AppInput
          id="staff-password"
          v-model="form.password"
          type="password"
          label="Password"
          placeholder="••••••••"
          :error="errors.password"
          required
          autocomplete="current-password"
        >
          <template #prefix>
            <LockIcon class="size-4" />
          </template>
        </AppInput>

        <!-- Submit Button -->
        <div class="pt-2">
          <AppButton
            type="submit"
            variant="default"
            size="lg"
            class="w-full justify-center shadow-xs hover:shadow-md transition-all duration-300"
            :loading="isLoading"
            :disabled="isLoading"
          >
            <ShieldCheckIcon class="size-4 mr-2" />
            Sign in to Staff Portal
          </AppButton>
        </div>
      </form>

      <!-- Security Notice -->
      <div class="rounded-lg border border-border/60 bg-muted/30 p-3.5 text-left flex items-start gap-2.5">
        <LockIcon class="size-4 text-primary shrink-0 mt-0.5" />
        <p class="text-[11px] text-muted-foreground leading-relaxed">
          <strong class="text-foreground">Audited Access:</strong> All staff logins and casework actions are recorded in the compliance audit ledger and bound by Verita's
          <router-link to="/terms" target="_blank" class="text-primary hover:underline font-semibold">Terms of Service</router-link>.
        </p>
      </div>

      <!-- Alternate Options -->
      <div class="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <router-link
          to="/cases/verify-pin"
          class="hover:text-primary transition-colors flex items-center gap-1 font-medium"
        >
          <KeyIcon class="size-3.5 text-primary" />
          Track anonymous case with PIN
        </router-link>
        <router-link
          to="/about"
          class="hover:text-foreground transition-colors flex items-center gap-1"
        >
          Security disclosures
          <ArrowRightIcon class="size-3" />
        </router-link>
      </div>
    </AppCard>
  </div>
</template>
