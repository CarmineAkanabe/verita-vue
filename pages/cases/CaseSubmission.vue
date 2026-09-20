<!-- pages/cases/CaseSubmission.vue -->
<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { generateUUID } from '@/shared/utils/uuid'
import { getPublicDepartments, submitCase } from '@/features/cases/api'
import { verifyCasePin } from '@/features/auth/api'
import { useAuthStore } from '@/shared/stores/auth'
import type { DepartmentOption, SubmitCaseResponse } from '@/features/cases/types'
import { toast } from '@/plugins/toast'

import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import AppTextarea from '@/components/common/AppTextarea.vue'
import AppSwitch from '@/components/common/AppSwitch.vue'
import EvidenceUploader from '@/components/complex/cases/EvidenceUploader.vue'

import {
  ShieldCheckIcon,
  LockIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CopyIcon,
  PrinterIcon,
  DownloadIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileCheck2Icon,
  BuildingIcon,
  WorkflowIcon,
} from '@lucide/vue'

const router = useRouter()
const authStore = useAuthStore()

// State
const idempotencyKey = ref<string>(generateUUID())
const departments = ref<DepartmentOption[]>([])
const isSubmitting = ref(false)
const isRateLimited = ref(false)
const isSubmitted = ref(false)
const isEnteringDashboard = ref(false)
const recentSavedCase = ref<{
  caseId: string
  trackingPin: string
  status: string
  timestamp: string
  departmentName: string
} | null>(null)

// Submission Result
const submittedResult = ref<SubmitCaseResponse['data'] | null>(null)
const submittedTimestamp = ref<string>('')

// Form Model
const form = reactive({
  departmentId: '',
  concernsDepartmentHead: false,
  purposeOfTransaction: '',
  amountInvolved: '',
  transactionDate: new Date().toISOString().split('T')[0],
  personInvolved: '',
  description: '',
  evidence: [] as File[],
})

// Errors Model
const errors = reactive({
  departmentId: '',
  purposeOfTransaction: '',
  amountInvolved: '',
  transactionDate: '',
  personInvolved: '',
  description: '',
  evidence: '',
  general: '',
})

// Options for department select
const departmentSelectOptions = computed(() =>
  departments.value.map((dept) => ({
    value: dept.id,
    label: dept.name,
  }))
)

// Selected Department Name for summary
const selectedDepartmentName = computed(() => {
  const match = departments.value.find((d) => d.id === form.departmentId)
  return match ? match.name : 'Selected Department'
})

// Today's date string for input max attribute
const todayDateString = new Date().toISOString().split('T')[0]

onMounted(async () => {
  try {
    departments.value = await getPublicDepartments()
  } catch {
    // Fallback handled in API function
  }

  try {
    const saved = localStorage.getItem('verita_last_case')
    if (saved) {
      recentSavedCase.value = JSON.parse(saved)
    }
  } catch {
    // Ignore parse failure
  }
})

function validateForm(): boolean {
  // Reset previous errors
  errors.departmentId = ''
  errors.purposeOfTransaction = ''
  errors.amountInvolved = ''
  errors.transactionDate = ''
  errors.personInvolved = ''
  errors.description = ''
  errors.evidence = ''
  errors.general = ''
  isRateLimited.value = false

  let isValid = true

  if (!form.departmentId) {
    errors.departmentId = 'Please select the affected department.'
    isValid = false
  }

  if (!form.purposeOfTransaction.trim()) {
    errors.purposeOfTransaction = 'Please enter the nature or purpose of the transaction.'
    isValid = false
  } else if (form.purposeOfTransaction.length > 255) {
    errors.purposeOfTransaction = 'Transaction purpose must not exceed 255 characters.'
    isValid = false
  }

  const numericAmount = parseFloat(form.amountInvolved)
  if (form.amountInvolved === '' || isNaN(numericAmount) || numericAmount < 0) {
    errors.amountInvolved = 'Please enter a valid amount in FCFA (enter 0 if none).'
    isValid = false
  }

  if (!form.transactionDate) {
    errors.transactionDate = 'Please select the date of the incident or transaction.'
    isValid = false
  }

  if (!form.personInvolved.trim()) {
    errors.personInvolved = 'Please specify the person or role involved.'
    isValid = false
  } else if (form.personInvolved.length > 255) {
    errors.personInvolved = 'This field must not exceed 255 characters.'
    isValid = false
  }

  if (!form.description.trim()) {
    errors.description = 'Please provide details of what occurred.'
    isValid = false
  } else if (form.description.trim().length < 10) {
    errors.description = 'Please write at least 10 characters explaining what happened.'
    isValid = false
  }

  if (!form.evidence || form.evidence.length === 0) {
    errors.evidence = 'At least one supporting file (JPG, PNG, or PDF) is required.'
    isValid = false
  }

  return isValid
}

async function handleSubmit() {
  if (!validateForm()) {
    toast.error('Please fill in all required fields before submitting.')
    return
  }

  isSubmitting.value = true
  errors.general = ''
  isRateLimited.value = false

  try {
    const result = await submitCase(
      {
        departmentId: form.departmentId,
        description: form.description.trim(),
        purposeOfTransaction: form.purposeOfTransaction.trim(),
        amountInvolved: parseFloat(form.amountInvolved) || 0,
        personInvolved: form.personInvolved.trim(),
        transactionDate: form.transactionDate,
        concernsDepartmentHead: form.concernsDepartmentHead,
        evidence: form.evidence,
      },
      idempotencyKey.value
    )

    submittedResult.value = result
    submittedTimestamp.value = new Date().toLocaleString()
    isSubmitted.value = true

    // Save to browser localStorage so the user never gets locked out if they forget to copy
    try {
      const savedPayload = {
        caseId: result.caseId,
        trackingPin: result.trackingPin,
        status: result.status,
        timestamp: submittedTimestamp.value,
        departmentName: selectedDepartmentName.value,
      }
      localStorage.setItem('verita_last_case', JSON.stringify(savedPayload))
      recentSavedCase.value = savedPayload
    } catch {
      // LocalStorage quota or private mode fallback
    }

    toast.success('Incident report submitted successfully.')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (err: any) {
    const status = err?.status ?? err?.response?.status
    const fieldErrors = err?.errors ?? err?.response?.data?.errors ?? {}
    const detailMsg = err?.detail ?? err?.response?.data?.detail ?? err?.message

    if (status === 429) {
      isRateLimited.value = true
      errors.general = 'Too many attempts. Please wait a minute before trying again.'
    } else if (status === 422 || Object.keys(fieldErrors).length > 0) {
      if (fieldErrors.departmentId) errors.departmentId = fieldErrors.departmentId[0]
      if (fieldErrors.purposeOfTransaction) errors.purposeOfTransaction = fieldErrors.purposeOfTransaction[0]
      if (fieldErrors.amountInvolved) errors.amountInvolved = fieldErrors.amountInvolved[0]
      if (fieldErrors.transactionDate) errors.transactionDate = fieldErrors.transactionDate[0]
      if (fieldErrors.personInvolved) errors.personInvolved = fieldErrors.personInvolved[0]
      if (fieldErrors.description) errors.description = fieldErrors.description[0]
      if (fieldErrors.evidence || fieldErrors['evidence.0']) {
        errors.evidence = fieldErrors.evidence?.[0] || fieldErrors['evidence.0']?.[0] || 'Please upload valid files (JPG, PNG, PDF <= 10MB).'
      }
      errors.general = detailMsg || 'Please review the highlighted fields below.'
    } else {
      errors.general = detailMsg || 'Failed to submit the report. Please try again.'
    }
  } finally {
    isSubmitting.value = false
  }
}

function handleReset() {
  form.departmentId = ''
  form.concernsDepartmentHead = false
  form.purposeOfTransaction = ''
  form.amountInvolved = ''
  form.transactionDate = todayDateString
  form.personInvolved = ''
  form.description = ''
  form.evidence = []

  errors.departmentId = ''
  errors.purposeOfTransaction = ''
  errors.amountInvolved = ''
  errors.transactionDate = ''
  errors.personInvolved = ''
  errors.description = ''
  errors.evidence = ''
  errors.general = ''
  isRateLimited.value = false

  // Generate a fresh Idempotency Key for the new clean session
  idempotencyKey.value = generateUUID()
  toast.info('Form cleared.')
}

async function copyToClipboard(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard.`)
  } catch {
    toast.error(`Failed to copy ${label}.`)
  }
}

async function copyAllCredentials() {
  if (!submittedResult.value) return
  const credsText = `VERITA INCIDENT CREDENTIALS
Case ID: ${submittedResult.value.caseId}
Tracking PIN: ${submittedResult.value.trackingPin}
Status: ${submittedResult.value.status}
Date: ${submittedTimestamp.value}
NOTE: Keep these credentials safe. They cannot be recovered if lost.`

  await copyToClipboard(credsText, 'Case credentials')
}

function downloadCredentialsTxt() {
  if (!submittedResult.value) return
  const text = `=================================================
VERITA CONFIDENTIAL INCIDENT CREDENTIALS
=================================================
Case Identifier : ${submittedResult.value.caseId}
Tracking PIN    : ${submittedResult.value.trackingPin}
Status          : ${submittedResult.value.status}
Department      : ${selectedDepartmentName.value}
Date Submitted  : ${submittedTimestamp.value}
=================================================
IMPORTANT:
Keep this text file in a safe location.
Because this reporting system operates with zero-knowledge
anonymity, this PIN cannot be reset, recovered, or emailed.
Use this Case ID and PIN at any time on the tracking page:
/cases/verify-pin
=================================================`
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `verita-case-${submittedResult.value.trackingPin}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  toast.success('Credentials backup file downloaded.')
}

function printReceipt() {
  window.print()
}

async function proceedToDashboard() {
  if (!submittedResult.value) return

  isEnteringDashboard.value = true
  try {
    // Perform one-time PIN exchange to obtain reporter bearer token
    const token = await verifyCasePin(submittedResult.value.caseId, submittedResult.value.trackingPin)
    authStore.setCaseSession(token, submittedResult.value.caseId)
    toast.success('Access confirmed. Loading dashboard...')

    // Navigate to case dashboard route (Phase 5) or fallback to track entry
    try {
      await router.push({ name: 'case-dashboard' })
    } catch {
      await router.push({ name: 'case-entry' })
    }
  } catch (err) {
    toast.error('Could not open dashboard automatically. Please use Track Case with your PIN.')
    router.push({ name: 'case-entry' })
  } finally {
    isEnteringDashboard.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
    <!-- ========================================================================= -->
    <!-- BREADCRUMB & HEADER                                                       -->
    <!-- ========================================================================= -->
    <div class="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
          <router-link to="/" class="hover:text-primary transition-colors flex items-center gap-1 font-medium">
            <ArrowLeftIcon class="size-3.5" />
            <span>Home</span>
          </router-link>
          <span class="text-border">/</span>
          <span class="text-foreground font-semibold">Report Incident</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Submit Incident Report
        </h1>
        <p class="text-sm text-muted-foreground mt-1 max-w-2xl">
          Report financial misconduct, fraud, or policy breaches securely. Your report is confidential and does not require an employee account.
        </p>
      </div>

      <!-- Confidentiality Badge -->
      <div class="flex items-center gap-3 shrink-0">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-600/30 bg-emerald-50 text-emerald-800 text-xs font-semibold">
          <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span>Confidential &amp; Anonymous</span>
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- SUCCESS VIEW: Post-Submission Credentials Certificate                     -->
    <!-- ========================================================================= -->
    <div v-if="isSubmitted && submittedResult" class="space-y-6 animate-fade-in-up">
      <!-- Success Card -->
      <div class="rounded-xl border-2 border-emerald-600/30 bg-card overflow-hidden shadow-md">
        <!-- Header Banner -->
        <div class="bg-emerald-50 border-b border-emerald-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2Icon class="size-6" />
            </div>
            <div>
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200">
                Report Registered
              </span>
              <h2 class="text-xl font-bold text-foreground mt-1">
                Incident Report Submitted Successfully
              </h2>
              <p class="text-xs text-muted-foreground mt-0.5">
                Submitted on: {{ submittedTimestamp }}
              </p>
            </div>
          </div>

          <div class="sm:text-right sm:border-l sm:border-emerald-200 sm:pl-6">
            <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Initial Status</span>
            <div class="font-mono text-sm font-bold text-emerald-800">
              {{ submittedResult.status }}
            </div>
          </div>
        </div>

        <!-- Credentials Body -->
        <div class="p-6 sm:p-8 space-y-6">
          <!-- Credentials Box -->
          <div class="border-2 border-primary/30 bg-primary/5 rounded-lg p-5 sm:p-6 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-primary/20">
              <span class="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <LockIcon class="size-4" />
                <span>Your Confidential Access Credentials</span>
              </span>
              <span class="text-[11px] text-muted-foreground">
                Save these details to track progress
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <!-- Case Identifier -->
              <div class="bg-card p-4 rounded-lg border border-border space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-muted-foreground uppercase">Case ID</span>
                  <span class="text-[10px] font-mono text-muted-foreground">Unique Identifier</span>
                </div>
                <div class="flex items-center justify-between gap-2 pt-1">
                  <span class="font-mono text-xs sm:text-sm font-bold text-foreground break-all select-all">
                    {{ submittedResult.caseId }}
                  </span>
                  <button
                    type="button"
                    class="px-2.5 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-semibold transition-colors flex items-center gap-1 shrink-0"
                    @click="copyToClipboard(submittedResult.caseId, 'Case ID')"
                  >
                    <CopyIcon class="size-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              <!-- 6-Digit Tracking PIN -->
              <div class="bg-card p-4 rounded-lg border border-border space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-muted-foreground uppercase">Tracking PIN</span>
                  <span class="text-[10px] font-mono text-destructive font-bold uppercase">Private</span>
                </div>
                <div class="flex items-center justify-between gap-2 pt-1">
                  <span class="font-mono text-xl sm:text-2xl font-black text-primary tracking-widest select-all">
                    {{ submittedResult.trackingPin }}
                  </span>
                  <button
                    type="button"
                    class="px-2.5 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-semibold transition-colors flex items-center gap-1 shrink-0"
                    @click="copyToClipboard(submittedResult.trackingPin, 'Tracking PIN')"
                  >
                    <CopyIcon class="size-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Warning Box -->
            <div class="p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3">
              <AlertTriangleIcon class="size-5 text-destructive shrink-0 mt-0.5" />
              <div class="text-xs text-destructive leading-relaxed">
                <strong class="font-bold">IMPORTANT:</strong> Please write down or copy your Case ID and 6-digit PIN right now. Because this system is completely anonymous, your name or email is not saved.
                <strong class="font-bold"> If you lose this PIN, it cannot be reset or recovered, and you will not be able to follow up on this case.</strong>
              </div>
            </div>
          </div>

          <!-- Dossier Summary Card -->
          <div class="bg-muted/20 border border-border rounded-lg p-5">
            <h4 class="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
              Summary of Submitted Report
            </h4>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs border-t border-b border-border py-3">
              <div>
                <span class="text-muted-foreground block text-[11px]">Department</span>
                <span class="font-semibold text-foreground mt-0.5 block">{{ selectedDepartmentName }}</span>
              </div>
              <div>
                <span class="text-muted-foreground block text-[11px]">Review Route</span>
                <span
                  class="font-semibold mt-0.5 block"
                  :class="form.concernsDepartmentHead ? 'text-warning font-bold' : 'text-foreground'"
                >
                  {{ form.concernsDepartmentHead ? 'Executive Management (Direct)' : 'Department Head Review' }}
                </span>
              </div>
              <div>
                <span class="text-muted-foreground block text-[11px]">Attached Files</span>
                <span class="font-semibold text-foreground mt-0.5 block">
                  {{ form.evidence.length }} {{ form.evidence.length === 1 ? 'document' : 'documents' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Post-Submission Action CTAs -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div class="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                class="px-3.5 py-2.5 rounded-lg border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
                @click="downloadCredentialsTxt"
              >
                <DownloadIcon class="size-4" />
                <span>Download Credentials (.txt)</span>
              </button>
              <button
                type="button"
                class="px-3.5 py-2.5 rounded-lg border border-border hover:bg-muted text-foreground text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
                @click="copyAllCredentials"
              >
                <CopyIcon class="size-4" />
                <span>Copy</span>
              </button>
              <button
                type="button"
                class="px-3.5 py-2.5 rounded-lg border border-border hover:bg-muted text-foreground text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
                @click="printReceipt"
              >
                <PrinterIcon class="size-4" />
                <span>Print</span>
              </button>
            </div>

            <AppButton
              variant="default"
              size="lg"
              class="w-full sm:w-auto shadow-sm"
              :loading="isEnteringDashboard"
              :disabled="isEnteringDashboard"
              @click="proceedToDashboard"
            >
              <span>Proceed to Case Dashboard</span>
              <ArrowRightIcon class="size-4 ml-1.5" />
            </AppButton>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- FORM VIEW: Two-Column Structured Intake                                   -->
    <!-- ========================================================================= -->
    <div v-else class="space-y-6">
      <!-- Recent Submission Alert on this Device (Recovery Seam) -->
      <div
        v-if="recentSavedCase"
        class="p-4 rounded-xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-left shadow-xs"
      >
        <div class="space-y-1">
          <div class="font-bold text-foreground flex items-center gap-1.5">
            <CheckCircle2Icon class="size-4 text-primary" />
            <span>Saved Credentials from Recent Report</span>
          </div>
          <p class="text-muted-foreground">
            Case ID: <span class="font-mono text-foreground font-semibold">{{ recentSavedCase.caseId }}</span> •
            PIN: <span class="font-mono text-primary font-bold tracking-wider">{{ recentSavedCase.trackingPin }}</span>
            <span v-if="recentSavedCase.timestamp" class="text-muted-foreground/60 hidden md:inline"> ({{ recentSavedCase.timestamp }})</span>
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            class="px-2.5 py-1.5 rounded-md bg-card border border-border hover:bg-muted text-foreground text-xs font-medium transition-colors"
            @click="copyToClipboard(`Case ID: ${recentSavedCase.caseId}\nTracking PIN: ${recentSavedCase.trackingPin}`, 'Saved credentials')"
          >
            Copy
          </button>
          <router-link
            to="/cases/verify-pin"
            class="px-3 py-1.5 rounded-md bg-primary text-white hover:bg-primary/90 text-xs font-semibold transition-colors flex items-center gap-1"
          >
            Track with PIN &rarr;
          </router-link>
        </div>
      </div>

      <!-- Anonymity & Evidence Hygiene Banner -->
      <div class="border-l-4 border-primary bg-primary/5 border border-primary/20 p-5 rounded-lg">
        <div class="flex items-start gap-3.5">
          <div class="p-1 rounded text-primary">
            <ShieldCheckIcon class="size-5" />
          </div>
          <div class="flex-1 text-left">
            <h2 class="text-sm font-bold text-foreground">
              Confidentiality &amp; Evidence Guidelines
            </h2>
            <div class="mt-2 text-xs text-muted-foreground space-y-1.5 leading-relaxed">
              <p class="flex items-baseline gap-2">
                <span class="text-primary font-bold">•</span>
                <span><strong>No Account Needed:</strong> You do not need to log in with company credentials or an email address. Your submission is not linked to your identity.</span>
              </p>
              <p class="flex items-baseline gap-2">
                <span class="text-primary font-bold">•</span>
                <span><strong>Redact Personal Info:</strong> Before attaching files, please remove or blur your personal bank account numbers, private phone numbers, or personal emails if they appear on screenshots or invoices.</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Rate Limit Alert (429) -->
      <div
        v-if="isRateLimited"
        class="rounded-lg border border-warning/40 bg-warning/10 p-4 space-y-2 text-left"
      >
        <div class="flex items-center gap-2 text-xs font-bold text-foreground">
          <ClockIcon class="size-4 text-warning shrink-0" />
          <span>Submission Limit</span>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed">
          {{ errors.general }}
        </p>
      </div>

      <!-- General Error Alert -->
      <div
        v-else-if="errors.general"
        class="rounded-lg border border-destructive/30 bg-destructive/10 p-4 space-y-2 text-left"
      >
        <div class="flex items-center gap-2 text-xs font-bold text-destructive">
          <AlertTriangleIcon class="size-4 shrink-0" />
          <span>Submission Error</span>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed">
          {{ errors.general }}
        </p>
      </div>

      <!-- Main Two-Column Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- ===================================================================== -->
        <!-- LEFT COLUMN: Form Panels (8 Cols)                                     -->
        <!-- ===================================================================== -->
        <form class="lg:col-span-8 space-y-6" @submit.prevent="handleSubmit">
          <!-- PANEL 1: Department & Review Route -->
          <div class="bg-card border border-border rounded-xl p-6 shadow-xs space-y-6 text-left">
            <div class="flex items-center justify-between pb-4 border-b border-border">
              <div class="flex items-center gap-2.5">
                <span class="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-foreground text-xs font-bold">
                  1
                </span>
                <h3 class="text-base font-bold text-foreground">
                  Department &amp; Review Route
                </h3>
              </div>
              <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Step 1 of 4
              </span>
            </div>

            <!-- Department Dropdown -->
            <AppSelect
              id="department-select"
              v-model="form.departmentId"
              label="Affected Department"
              :options="departmentSelectOptions"
              placeholder="Select department..."
              :error="errors.departmentId"
              hint="Select the operational unit where the incident took place."
              required
            />

            <!-- Conflict of Interest Air-Gap Switch -->
            <div class="space-y-2">
              <AppSwitch
                id="airgap-switch"
                v-model="form.concernsDepartmentHead"
                label="Report Concerns the Department Head"
                description="Check this if the incident involves the Head of Department or direct line supervisor."
                :badge="form.concernsDepartmentHead ? 'Management Escalation' : undefined"
              />

              <div
                v-if="form.concernsDepartmentHead"
                class="p-3 rounded-lg bg-warning/10 border border-warning/20 text-xs text-foreground flex items-start gap-2.5 animate-fade-in"
              >
                <LockIcon class="size-4 text-warning shrink-0 mt-0.5" />
                <p class="leading-relaxed">
                  <strong class="font-bold text-foreground">Direct Management Route:</strong> This case will bypass the department head and route directly to the Executive Manager for independent review.
                </p>
              </div>
            </div>
          </div>

          <!-- PANEL 2: Incident Particulars -->
          <div class="bg-card border border-border rounded-xl p-6 shadow-xs space-y-6 text-left">
            <div class="flex items-center justify-between pb-4 border-b border-border">
              <div class="flex items-center gap-2.5">
                <span class="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-foreground text-xs font-bold">
                  2
                </span>
                <h3 class="text-base font-bold text-foreground">
                  Incident Particulars
                </h3>
              </div>
              <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Step 2 of 4
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <!-- Purpose of Transaction -->
              <div class="md:col-span-2">
                <AppInput
                  id="purpose-input"
                  v-model="form.purposeOfTransaction"
                  label="Purpose or Nature of Transaction"
                  placeholder="e.g. Unapproved supplier payment, invoice inflation, unauthorized expense"
                  :error="errors.purposeOfTransaction"
                  hint="Brief summary of the alleged transaction or activity (max 255 characters)."
                  required
                />
              </div>

              <!-- Amount Involved (FCFA) -->
              <div>
                <AppInput
                  id="amount-input"
                  v-model="form.amountInvolved"
                  type="number"
                  min="0"
                  step="any"
                  label="Amount Involved (FCFA)"
                  placeholder="e.g. 2500000"
                  :error="errors.amountInvolved"
                  hint="Estimated amount in FCFA. Enter 0 if no financial amount was involved."
                  required
                >
                  <template #prefix>
                    <span class="text-xs font-mono font-bold text-muted-foreground">FCFA</span>
                  </template>
                </AppInput>
              </div>

              <!-- Transaction Date -->
              <div>
                <AppInput
                  id="date-input"
                  v-model="form.transactionDate"
                  type="date"
                  :max="todayDateString"
                  label="Incident Date"
                  :error="errors.transactionDate"
                  hint="Date when the incident occurred, or approximate date."
                  required
                />
              </div>

              <!-- Primary Person Involved -->
              <div class="md:col-span-2">
                <AppInput
                  id="person-input"
                  v-model="form.personInvolved"
                  label="Person or Role Involved"
                  placeholder="e.g. Procurement Officer, Senior Accountant, Store Manager"
                  :error="errors.personInvolved"
                  hint="Name or official job title of the person involved."
                  required
                />
              </div>
            </div>
          </div>

          <!-- PANEL 3: Incident Details -->
          <div class="bg-card border border-border rounded-xl p-6 shadow-xs space-y-6 text-left">
            <div class="flex items-center justify-between pb-4 border-b border-border">
              <div class="flex items-center gap-2.5">
                <span class="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-foreground text-xs font-bold">
                  3
                </span>
                <h3 class="text-base font-bold text-foreground">
                  Incident Details &amp; Timeline
                </h3>
              </div>
              <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Step 3 of 4
              </span>
            </div>

            <AppTextarea
              id="narrative-textarea"
              v-model="form.description"
              label="Detailed Narrative"
              placeholder="Explain clearly what happened: who was involved, when it occurred, what files or accounts were affected, and any specific facts..."
              :rows="6"
              :maxlength="5000"
              :error="errors.description"
              hint="Provide factual information. Stick to verifiable events."
              required
            />
          </div>

          <!-- PANEL 4: Supporting Evidence Dropzone -->
          <div class="bg-card border border-border rounded-xl p-6 shadow-xs space-y-6 text-left">
            <div class="flex items-center justify-between pb-4 border-b border-border">
              <div class="flex items-center gap-2.5">
                <span class="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-foreground text-xs font-bold">
                  4
                </span>
                <h3 class="text-base font-bold text-foreground">
                  Supporting Evidence &amp; Documents
                </h3>
              </div>
              <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Step 4 of 4
              </span>
            </div>

            <EvidenceUploader
              v-model="form.evidence"
              :maxFileSizeMb="10"
              :error="errors.evidence"
              :disabled="isSubmitting"
            />
          </div>

          <!-- Form Action Footer -->
          <div class="bg-card border border-border rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs">
            <div class="flex items-start gap-2.5 text-left max-w-md">
              <ShieldCheckIcon class="size-5 text-muted-foreground shrink-0 mt-0.5" />
              <p class="text-[11px] text-muted-foreground leading-relaxed">
                Your report is submitted confidentially. Once submitted, keep your Case ID and PIN safe to track progress.
              </p>
            </div>

            <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
              <AppButton
                type="button"
                variant="outline"
                size="default"
                :disabled="isSubmitting"
                @click="handleReset"
              >
                Clear Form
              </AppButton>

              <AppButton
                type="submit"
                variant="default"
                size="lg"
                class="shadow-sm"
                :loading="isSubmitting"
                :disabled="isSubmitting"
              >
                <LockIcon class="size-4 mr-2" />
                <span>Submit Confidential Report</span>
              </AppButton>
            </div>
          </div>
        </form>

        <!-- ===================================================================== -->
        <!-- RIGHT COLUMN: Guidance & Organization Context (4 Cols)                -->
        <!-- ===================================================================== -->
        <aside class="lg:col-span-4 space-y-6 text-left">
          <!-- SIDEBAR 1: Whistleblower Protections -->
          <div class="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
            <div class="flex items-center gap-2 pb-3 border-b border-border">
              <FileCheck2Icon class="size-4 text-primary" />
              <h4 class="text-sm font-bold text-foreground">
                Reporting Protections
              </h4>
            </div>

            <ul class="space-y-3.5">
              <li class="flex items-start gap-3">
                <div class="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2Icon class="size-3.5" />
                </div>
                <div>
                  <p class="text-xs font-bold text-foreground">Strict Anonymity</p>
                  <p class="text-[11px] text-muted-foreground">No account or login required. You are identified only by your unique PIN.</p>
                </div>
              </li>

              <li class="flex items-start gap-3">
                <div class="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2Icon class="size-3.5" />
                </div>
                <div>
                  <p class="text-xs font-bold text-foreground">Conflict-of-Interest Route</p>
                  <p class="text-[11px] text-muted-foreground">Reports involving managers route straight to executive leadership.</p>
                </div>
              </li>

              <li class="flex items-start gap-3">
                <div class="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2Icon class="size-3.5" />
                </div>
                <div>
                  <p class="text-xs font-bold text-foreground">Fair Investigation</p>
                  <p class="text-[11px] text-muted-foreground">Submissions are investigated based on the factual evidence provided.</p>
                </div>
              </li>

              <li class="flex items-start gap-3">
                <div class="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2Icon class="size-3.5" />
                </div>
                <div>
                  <p class="text-xs font-bold text-foreground">Anti-Retaliation</p>
                  <p class="text-[11px] text-muted-foreground">Employees reporting in good faith are protected under enterprise policy.</p>
                </div>
              </li>
            </ul>
          </div>

          <!-- SIDEBAR 2: Cameroonian Enterprise Guidance (Reframed) -->
          <div class="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
            <div class="flex items-center gap-2 pb-3 border-b border-border">
              <BuildingIcon class="size-4 text-primary" />
              <h4 class="text-sm font-bold text-foreground">
                Internal Compliance Desk
              </h4>
            </div>

            <p class="text-xs text-muted-foreground leading-relaxed">
              Operating for Digimark Consulting branches and partner enterprises in Cameroon (Douala, Yaoundé):
            </p>

            <div class="p-3.5 rounded-lg bg-muted/40 border border-border space-y-1.5">
              <span class="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                Office Hours (Mon – Fri, 08:00 – 17:00 WAT)
              </span>
              <div class="text-xs font-medium text-foreground">
                Internal Audit &amp; Governance Unit
              </div>
              <p class="text-[11px] text-muted-foreground leading-snug">
                For in-person inquiries or code of conduct questions, consult the enterprise compliance desk.
              </p>
            </div>
          </div>

          <!-- SIDEBAR 3: What happens after submission? -->
          <div class="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
            <div class="flex items-center gap-2 pb-3 border-b border-border">
              <WorkflowIcon class="size-4 text-primary" />
              <h4 class="text-sm font-bold text-foreground">
                What Happens After Submission?
              </h4>
            </div>

            <ol class="space-y-4 text-xs">
              <li class="space-y-0.5">
                <div class="font-bold text-foreground flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>Save Your PIN</span>
                </div>
                <p class="text-muted-foreground pl-7 text-[11px] leading-relaxed">
                  You will receive a Case ID and 6-digit PIN. Save them immediately to track your report.
                </p>
              </li>

              <li class="space-y-0.5">
                <div class="font-bold text-foreground flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>Investigation Review</span>
                </div>
                <p class="text-muted-foreground pl-7 text-[11px] leading-relaxed">
                  The designated department head or executive manager reviews the facts and supporting files.
                </p>
              </li>

              <li class="space-y-0.5">
                <div class="font-bold text-foreground flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold">3</span>
                  <span>Follow-Up &amp; Dialogue</span>
                </div>
                <p class="text-muted-foreground pl-7 text-[11px] leading-relaxed">
                  You can use your PIN to log in, view the status, check findings, and exchange messages.
                </p>
              </li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>
