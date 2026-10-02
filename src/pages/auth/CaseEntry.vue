<!-- pages/auth/CaseEntry.vue -->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import { verifyCasePin } from '@/features/auth/api'
import { ApiError } from '@/shared/api/error'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import { toast } from '@/plugins/toast'
import {
  KeyIcon,
  LockIcon,
  HashIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  ClockIcon,
  ArrowRightIcon,
  ShieldAlertIcon,
  SparklesIcon,
} from '@lucide/vue'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  caseId: '',
  pin: '',
})

const errors = reactive({
  caseId: '',
  pin: '',
  general: '',
})

const isRateLimited = ref(false)
const isLoading = ref(false)
const isSuccess = ref(false)
const recentSavedCase = ref<{ caseId: string; trackingPin: string } | null>(null)

onMounted(() => {
  try {
    const saved = localStorage.getItem('verita_last_case')
    if (saved) {
      recentSavedCase.value = JSON.parse(saved)
    }
  } catch {
    // Ignore parse error
  }
})

function useSavedCredentials() {
  if (recentSavedCase.value) {
    form.caseId = recentSavedCase.value.caseId
    form.pin = recentSavedCase.value.trackingPin
    toast.info('Credentials filled from your recent report.')
  }
}

function validate(): boolean {
  errors.caseId = ''
  errors.pin = ''
  errors.general = ''
  isRateLimited.value = false

  let valid = true

  if (!form.caseId.trim()) {
    errors.caseId = 'Case ID is required.'
    valid = false
  }

  if (!form.pin.trim()) {
    errors.pin = '6-digit tracking PIN is required.'
    valid = false
  } else if (!/^\d{6}$/.test(form.pin.trim())) {
    errors.pin = 'PIN must be exactly 6 digits.'
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
    const token = await verifyCasePin(form.caseId, form.pin)
    authStore.setCaseSession(token, form.caseId.trim())
    isSuccess.value = true
    toast.success('Case verified. Access granted to vault.')

    // Redirect to case dashboard (or fallback to pending notice if Phase 5 view not yet registered)
    try {
      await router.push({ name: 'case-dashboard' })
    } catch {
      // If route not registered yet, router might stay or catch
    }
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 429) {
        isRateLimited.value = true
        errors.general =
          'Too many verification attempts (10 per minute rate limit). For your protection, please wait a minute before attempting again.'
      } else if (err.status === 401) {
        errors.general =
          'Invalid Case ID or Tracking PIN. Anonymous credentials cannot be reset or recovered if lost.'
      } else if (err.status === 404) {
        errors.general = 'No case found matching this Case ID. Please check the identifier.'
      } else if (err.errors) {
        if (err.errors.caseId) errors.caseId = err.errors.caseId[0]
        if (err.errors.pin) errors.pin = err.errors.pin[0]
        if (!err.errors.caseId && !err.errors.pin) {
          errors.general = err.message || 'Validation error occurred.'
        }
      } else {
        errors.general = err.message || 'Unable to verify case credentials. Please try again.'
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
    <!-- Success Banner if verified -->
    <div v-if="isSuccess" class="rounded-xl border border-emerald-600/30 bg-emerald-500/10 p-6 text-center space-y-3">
      <div
        class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white mx-auto shadow-sm">
        <ShieldCheckIcon class="size-6" />
      </div>
      <h2 class="text-lg font-bold text-foreground">Credentials Verified</h2>
      <p class="text-xs text-muted-foreground leading-relaxed">
        Session established for Case <span class="font-mono font-bold text-foreground">#{{ form.caseId.slice(0, 8)
          }}...</span>.
        Your session is air-gapped and will expire upon window closure.
      </p>
      <div class="pt-2">
        <AppButton to="/" variant="outline" size="sm">
          Return to platform overview &rarr;
        </AppButton>
      </div>
    </div>

    <!-- Main Card Form -->
    <AppCard v-else cardClass="border-border bg-card shadow-lg" contentClass="space-y-5">
      <template #header>
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <KeyIcon class="size-5" />
          </div>
          <div>
            <h1 class="text-xl font-bold tracking-tight text-foreground">
              Track Case with PIN
            </h1>
            <p class="text-xs text-muted-foreground">
              Air-gapped verification for anonymous case reporters
            </p>
          </div>
        </div>
      </template>

      <!-- Rate Limit Friendly Banner (429) -->
      <div v-if="isRateLimited" class="rounded-lg border border-warning/40 bg-warning/10 p-4 space-y-2 text-left">
        <div class="flex items-center gap-2 text-xs font-bold text-foreground">
          <ClockIcon class="size-4 text-warning shrink-0" />
          <span>Verification Rate Limit Exceeded</span>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed">
          {{ errors.general }}
        </p>
      </div>

      <!-- General Error Banner (401 / Network) -->
      <div v-else-if="errors.general"
        class="rounded-lg border border-destructive/30 bg-destructive/10 p-4 space-y-2 text-left">
        <div class="flex items-center gap-2 text-xs font-bold text-destructive">
          <TriangleAlertIcon class="size-4 shrink-0" />
          <span>Verification Failed</span>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed">
          {{ errors.general }}
        </p>
      </div>

      <!-- Recent Submission Autofill Helper -->
      <div v-if="recentSavedCase && (!form.caseId || !form.pin)"
        class="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center justify-between gap-3 text-xs text-left">
        <div class="truncate">
          <span class="text-muted-foreground">Recent report on this device: </span>
          <span class="font-mono font-bold text-foreground">#{{ recentSavedCase.caseId.slice(0, 8) }}...</span>
        </div>
        <button type="button"
          class="px-2.5 py-1 rounded bg-primary text-white font-semibold hover:bg-primary/90 transition-colors text-[11px] shrink-0 flex items-center gap-1"
          @click="useSavedCredentials">
          <SparklesIcon class="size-3" />
          <span>Fill PIN</span>
        </button>
      </div>

      <!-- Form Inputs -->
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <!-- Case ID -->
        <AppInput id="case-id" v-model="form.caseId" label="Case Identifier"
          placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000" :error="errors.caseId"
          hint="The unique Case UUID displayed upon initial submission" required autocomplete="off">
          <template #prefix>
            <HashIcon class="size-4" />
          </template>
        </AppInput>

        <!-- 6-digit PIN -->
        <AppInput id="case-pin" v-model="form.pin" type="password" label="One-Time Tracking PIN"
          placeholder="6-digit cryptographic PIN" :error="errors.pin" hint="Must be exactly 6 numeric digits" required
          autocomplete="one-time-code">
          <template #prefix>
            <LockIcon class="size-4" />
          </template>
        </AppInput>

        <!-- Submit Button -->
        <div class="pt-2">
          <AppButton type="submit" variant="default" size="lg"
            class="w-full justify-center shadow-xs hover:shadow-md transition-all duration-300" :loading="isLoading"
            :disabled="isLoading">
            <ShieldCheckIcon class="size-4 mr-2" />
            Verify credentials &amp; enter
          </AppButton>
        </div>
      </form>

      <!-- Anonymity Policy Reminder -->
      <div class="rounded-lg border border-border/60 bg-muted/30 p-3.5 text-left flex items-start gap-2.5">
        <ShieldCheckIcon class="size-4 text-emerald-600 shrink-0 mt-0.5" />
        <p class="text-[11px] text-muted-foreground leading-relaxed">
          <strong class="text-foreground">Zero-knowledge security:</strong> Credentials are verified without
          storing tracking cookies or fingerprints, in accordance with Verita's
          <router-link to="/terms" target="_blank" class="text-primary hover:underline font-semibold">Terms of Service</router-link>.
          Lost credentials cannot be retrieved by administrators.
        </p>
      </div>

      <!-- Alternate Options -->
      <div
        class="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <router-link to="/cases/submit"
          class="hover:text-primary transition-colors flex items-center gap-1 font-medium">
          <ShieldAlertIcon class="size-3.5 text-primary" />
          Report new incident
        </router-link>
        <router-link to="/auth/login" class="hover:text-foreground transition-colors flex items-center gap-1">
          Staff sign in
          <ArrowRightIcon class="size-3" />
        </router-link>
      </div>
    </AppCard>
  </div>
</template>
