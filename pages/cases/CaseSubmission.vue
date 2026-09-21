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
  FileCheck2Icon,
  BuildingIcon,
  CalendarIcon,
  FileTextIcon,
  SendIcon,
} from '@lucide/vue'

const router = useRouter()
const authStore = useAuthStore()

// State
const idempotencyKey = ref<string>(generateUUID())
const departments = ref<DepartmentOption[]>([])
const currentStep = ref<number>(1)
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

// Step-specific validation
function validateStep(step: number): boolean {
  errors.general = ''

  if (step === 1) {
    errors.departmentId = ''
    if (!form.departmentId) {
      errors.departmentId = 'Please select the affected department.'
      return false
    }
    return true
  }

  if (step === 2) {
    let valid = true
    errors.purposeOfTransaction = ''
    errors.amountInvolved = ''
    errors.transactionDate = ''
    errors.personInvolved = ''

    if (!form.transactionDate) {
      errors.transactionDate = 'Please select the date of the incident or transaction.'
      valid = false
    }

    if (!form.purposeOfTransaction.trim()) {
      errors.purposeOfTransaction = 'Please enter the nature or purpose of the transaction.'
      valid = false
    } else if (form.purposeOfTransaction.length > 255) {
      errors.purposeOfTransaction = 'Must not exceed 255 characters.'
      valid = false
    }

    const numericAmount = parseFloat(form.amountInvolved)
    if (form.amountInvolved === '' || isNaN(numericAmount) || numericAmount < 0) {
      errors.amountInvolved = 'Please enter an amount in FCFA (enter 0 if non-financial).'
      valid = false
    }

    if (!form.personInvolved.trim()) {
      errors.personInvolved = 'Please specify the person or role involved.'
      valid = false
    }

    return valid
  }

  if (step === 3) {
    let valid = true
    errors.description = ''
    errors.evidence = ''

    if (!form.description.trim()) {
      errors.description = 'Please provide details of what occurred.'
      valid = false
    } else if (form.description.trim().length < 10) {
      errors.description = 'Please write at least 10 characters explaining what happened.'
      valid = false
    }

    if (!form.evidence || form.evidence.length === 0) {
      errors.evidence = 'At least one supporting file (JPG, PNG, or PDF) is required.'
      valid = false
    }

    return valid
  }

  return true
}

function nextStep() {
  if (validateStep(currentStep.value)) {
    if (currentStep.value < 4) {
      currentStep.value++
      window.scrollTo({ top: 120, behavior: 'smooth' })
    }
  } else {
    toast.error('Please complete the required fields to continue.')
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
    window.scrollTo({ top: 120, behavior: 'smooth' })
  }
}

function goToStep(step: number) {
  if (step < currentStep.value) {
    currentStep.value = step
  } else {
    // Validate prior steps before jumping forward
    for (let i = 1; i < step; i++) {
      if (!validateStep(i)) {
        toast.error(`Please complete Step ${i} first.`)
        currentStep.value = i
        return
      }
    }
    currentStep.value = step
  }
}

function formatAmountDisplay(val: string): string {
  const num = parseFloat(val)
  if (isNaN(num) || num === 0) return '0 FCFA (Non-financial)'
  return `${num.toLocaleString('fr-FR')} FCFA`
}

async function handleSubmit() {
  for (let i = 1; i <= 3; i++) {
    if (!validateStep(i)) {
      currentStep.value = i
      toast.error(`Please complete required fields in Step ${i}.`)
      return
    }
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

    toast.success('Case submitted successfully.')
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
      errors.general = detailMsg || 'Please review the highlighted fields.'
    } else {
      errors.general = detailMsg || 'Failed to submit the case. Please try again.'
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

  currentStep.value = 1
  idempotencyKey.value = generateUUID()
  toast.info('Form reset.')
}

async function copyToClipboard(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard.`)
  } catch {
    toast.error(`Failed to copy ${label}.`)
  }
}

function downloadCredentialsTxt() {
  if (!submittedResult.value) return
  const text = `=================================================
VERITA CONFIDENTIAL CASE CREDENTIALS
=================================================
Case ID     : ${submittedResult.value.caseId}
Tracking PIN: ${submittedResult.value.trackingPin}
Status      : ${submittedResult.value.status}
Department  : ${selectedDepartmentName.value}
Submitted   : ${submittedTimestamp.value}
=================================================
Keep this text file in a safe location.
Use this Case ID and PIN to log in and communicate with investigators.
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
  toast.success('Credentials downloaded.')
}

function printReceipt() {
  window.print()
}

async function proceedToDashboard() {
  if (!submittedResult.value) return

  isEnteringDashboard.value = true
  try {
    const token = await verifyCasePin(submittedResult.value.caseId, submittedResult.value.trackingPin)
    authStore.setCaseSession(token, submittedResult.value.caseId)
    toast.success('Access confirmed. Loading dashboard...')
    await router.push({ name: 'case-dashboard' })
  } catch (err: any) {
    toast.error(err?.message || 'Automatic sign-in failed. Please use your PIN to log in manually.')
    router.push({ name: 'case-entry' })
  } finally {
    isEnteringDashboard.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] bg-[#F6F7F9] py-8 px-4 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-3xl space-y-6">

      <!-- ========================================================================= -->
      <!-- POST-SUBMISSION CREDENTIALS VIEW                                          -->
      <!-- ========================================================================= -->
      <template v-if="isSubmitted && submittedResult">
        <div class="p-6 sm:p-8 rounded-2xl bg-[#FFFDF8] border-2 border-[#EADBCE] shadow-sm space-y-6 animate-fade-in">
          <!-- Header Success Badge -->
          <div class="flex items-center gap-3">
            <div class="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2Icon class="size-7" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-[#22293A]">
                Case Successfully Submitted
              </h2>
              <p class="text-xs text-[#6B7280]">
                Save your Case ID and Tracking PIN below to view progress and message investigators.
              </p>
            </div>
          </div>

          <!-- Important Warning Callout -->
          <div class="p-3.5 rounded-xl bg-[#FCF4EE] border border-[#A2561B]/20 flex items-start gap-2.5 text-xs text-[#A2561B]">
            <LockIcon class="size-4 shrink-0 mt-0.5" />
            <div class="leading-relaxed">
              <span class="font-bold">Save your PIN now.</span> Because reports are anonymous, this PIN cannot be reset or emailed to you.
            </div>
          </div>

          <!-- Credentials Box -->
          <div class="p-5 rounded-xl bg-[#FAF7F2] border border-[#EADBCE] space-y-4">
            <!-- Case ID -->
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Case ID</span>
              <div class="flex items-center justify-between gap-2 mt-1">
                <span class="font-mono font-bold text-sm sm:text-base text-[#22293A] select-all break-all">
                  {{ submittedResult.caseId }}
                </span>
                <button
                  type="button"
                  class="shrink-0 p-1.5 rounded-md border border-[#EADBCE] bg-white hover:bg-[#F6F7F9] text-[#22293A] cursor-pointer"
                  title="Copy Case ID"
                  @click="copyToClipboard(submittedResult.caseId, 'Case ID')"
                >
                  <CopyIcon class="size-4" />
                </button>
              </div>
            </div>

            <div class="h-px bg-[#EADBCE]"></div>

            <!-- Tracking PIN -->
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Tracking PIN</span>
              <div class="flex items-center justify-between gap-2 mt-1">
                <span class="font-mono font-extrabold text-2xl text-[#A2561B] tracking-wider select-all">
                  {{ submittedResult.trackingPin }}
                </span>
                <button
                  type="button"
                  class="shrink-0 p-1.5 rounded-md border border-[#EADBCE] bg-white hover:bg-[#F6F7F9] text-[#22293A] cursor-pointer"
                  title="Copy Tracking PIN"
                  @click="copyToClipboard(submittedResult.trackingPin, 'Tracking PIN')"
                >
                  <CopyIcon class="size-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap items-center gap-3">
            <AppButton
              variant="default"
              size="lg"
              class="flex-1"
              :loading="isEnteringDashboard"
              @click="proceedToDashboard"
            >
              <span>View Case Dashboard</span>
              <ArrowRightIcon class="size-4 ml-1.5" />
            </AppButton>

            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#EADBCE] bg-white hover:bg-[#FAF7F2] text-xs font-semibold text-[#22293A] transition-colors cursor-pointer"
              @click="downloadCredentialsTxt"
            >
              <DownloadIcon class="size-4 text-[#6B7280]" />
              <span>Download Backup</span>
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#EADBCE] bg-white hover:bg-[#FAF7F2] text-xs font-semibold text-[#22293A] transition-colors cursor-pointer"
              @click="printReceipt"
            >
              <PrinterIcon class="size-4 text-[#6B7280]" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </template>

      <!-- ========================================================================= -->
      <!-- STEP-BY-STEP SUBMISSION WIZARD                                            -->
      <!-- ========================================================================= -->
      <template v-else>
        <!-- Page Title & Reassurance Header -->
        <div class="space-y-1 text-center sm:text-left">
          <h1 class="text-2xl sm:text-3xl font-bold text-[#22293A] tracking-tight">
            Submit a Case
          </h1>
          <p class="text-xs sm:text-sm text-[#6B7280]">
            Your submission is encrypted and anonymous. No personal information or IP address is logged.
          </p>
        </div>

        <!-- 4-Step Visual Stepper Bar -->
        <div class="p-3 sm:p-4 rounded-xl bg-[#FFFDF8] border border-[#EADBCE] shadow-xs">
          <div class="grid grid-cols-4 gap-2 text-center text-xs">
            <!-- Step 1 Indicator -->
            <button
              type="button"
              class="flex flex-col items-center gap-1.5 p-1.5 rounded-lg transition-colors cursor-pointer"
              :class="currentStep === 1 ? 'text-[#A2561B] font-bold' : currentStep > 1 ? 'text-emerald-700 font-medium' : 'text-[#9CA3AF]'"
              @click="goToStep(1)"
            >
              <div
                class="size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                :class="currentStep === 1 ? 'bg-[#A2561B] text-white shadow-xs' : currentStep > 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-[#F2F4F7] text-[#6B7280]'"
              >
                <CheckCircle2Icon v-if="currentStep > 1" class="size-4" />
                <span v-else>1</span>
              </div>
              <span class="text-[11px] truncate">Department</span>
            </button>

            <!-- Step 2 Indicator -->
            <button
              type="button"
              class="flex flex-col items-center gap-1.5 p-1.5 rounded-lg transition-colors cursor-pointer"
              :class="currentStep === 2 ? 'text-[#A2561B] font-bold' : currentStep > 2 ? 'text-emerald-700 font-medium' : 'text-[#9CA3AF]'"
              @click="goToStep(2)"
            >
              <div
                class="size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                :class="currentStep === 2 ? 'bg-[#A2561B] text-white shadow-xs' : currentStep > 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-[#F2F4F7] text-[#6B7280]'"
              >
                <CheckCircle2Icon v-if="currentStep > 2" class="size-4" />
                <span v-else>2</span>
              </div>
              <span class="text-[11px] truncate">Incident Details</span>
            </button>

            <!-- Step 3 Indicator -->
            <button
              type="button"
              class="flex flex-col items-center gap-1.5 p-1.5 rounded-lg transition-colors cursor-pointer"
              :class="currentStep === 3 ? 'text-[#A2561B] font-bold' : currentStep > 3 ? 'text-emerald-700 font-medium' : 'text-[#9CA3AF]'"
              @click="goToStep(3)"
            >
              <div
                class="size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                :class="currentStep === 3 ? 'bg-[#A2561B] text-white shadow-xs' : currentStep > 3 ? 'bg-emerald-100 text-emerald-800' : 'bg-[#F2F4F7] text-[#6B7280]'"
              >
                <CheckCircle2Icon v-if="currentStep > 3" class="size-4" />
                <span v-else>3</span>
              </div>
              <span class="text-[11px] truncate">Description &amp; Files</span>
            </button>

            <!-- Step 4 Indicator -->
            <button
              type="button"
              class="flex flex-col items-center gap-1.5 p-1.5 rounded-lg transition-colors cursor-pointer"
              :class="currentStep === 4 ? 'text-[#A2561B] font-bold' : 'text-[#9CA3AF]'"
              @click="goToStep(4)"
            >
              <div
                class="size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                :class="currentStep === 4 ? 'bg-[#A2561B] text-white shadow-xs' : 'bg-[#F2F4F7] text-[#6B7280]'"
              >
                <span>4</span>
              </div>
              <span class="text-[11px] truncate">Review &amp; Submit</span>
            </button>
          </div>
        </div>

        <!-- General Error Banner -->
        <div v-if="errors.general" class="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-xs text-[#991B1B] flex items-center gap-2">
          <AlertTriangleIcon class="size-4 shrink-0" />
          <span>{{ errors.general }}</span>
        </div>

        <!-- Main Wizard Card Container -->
        <div class="p-6 sm:p-8 rounded-2xl bg-[#FFFDF8] border border-[#EADBCE] shadow-xs space-y-6">

          <!-- ========================================================================= -->
          <!-- STEP 1: Department Selection                                              -->
          <!-- ========================================================================= -->
          <div v-if="currentStep === 1" class="space-y-6 animate-fade-in">
            <div class="space-y-1">
              <div class="inline-flex items-center gap-1.5 text-xs font-bold text-[#A2561B] uppercase tracking-wider">
                <BuildingIcon class="size-3.5" />
                <span>Step 1 of 4: Organization</span>
              </div>
              <h2 class="text-lg font-bold text-[#22293A]">
                Which department is affected?
              </h2>
              <p class="text-xs text-[#6B7280]">
                Select the unit where this incident occurred so it can be assigned to the proper reviewer.
              </p>
            </div>

            <!-- Department Select -->
            <div class="space-y-2">
              <label for="dept-select" class="block text-xs font-bold text-[#22293A]">
                Affected Department <span class="text-destructive">*</span>
              </label>
              <AppSelect
                id="dept-select"
                v-model="form.departmentId"
                placeholder="-- Choose a department --"
                :options="departmentSelectOptions"
                :error="errors.departmentId"
              />
            </div>

            <!-- Concerns Department Head Toggle -->
            <AppSwitch
              v-model="form.concernsDepartmentHead"
              label="Does this report concern or involve the Head of this department?"
              description="If checked, this case bypasses the department head completely and routes directly to General Management for independent review."
              badge="Bypass Available"
            />

            <div
              v-if="form.concernsDepartmentHead"
              class="p-2.5 rounded-lg bg-[#FCF4EE] border border-[#A2561B]/30 text-[11px] text-[#A2561B] flex items-center gap-2 font-medium"
            >
              <ShieldCheckIcon class="size-4 shrink-0" />
              <span>Executive Management Bypass Active: Department head will have zero access.</span>
            </div>
          </div>

          <!-- ========================================================================= -->
          <!-- STEP 2: Incident Details                                                  -->
          <!-- ========================================================================= -->
          <div v-else-if="currentStep === 2" class="space-y-6 animate-fade-in">
            <div class="space-y-1">
              <div class="inline-flex items-center gap-1.5 text-xs font-bold text-[#A2561B] uppercase tracking-wider">
                <CalendarIcon class="size-3.5" />
                <span>Step 2 of 4: Details</span>
              </div>
              <h2 class="text-lg font-bold text-[#22293A]">
                When and who was involved?
              </h2>
              <p class="text-xs text-[#6B7280]">
                Provide basic context about the transaction or incident.
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Transaction Date -->
              <div>
                <label for="txn-date" class="block text-xs font-bold text-[#22293A] mb-1.5">
                  Date of Incident <span class="text-destructive">*</span>
                </label>
                <AppInput
                  id="txn-date"
                  v-model="form.transactionDate"
                  type="date"
                  :max="todayDateString"
                  :error="errors.transactionDate"
                />
              </div>

              <!-- Amount Involved -->
              <div>
                <label for="amount-inv" class="block text-xs font-bold text-[#22293A] mb-1.5">
                  Amount Involved (FCFA) <span class="text-destructive">*</span>
                </label>
                <AppInput
                  id="amount-inv"
                  v-model="form.amountInvolved"
                  type="number"
                  min="0"
                  placeholder="e.g. 500000 (enter 0 if non-financial)"
                  :error="errors.amountInvolved"
                />
              </div>
            </div>

            <!-- Person Involved -->
            <div>
              <label for="person-inv" class="block text-xs font-bold text-[#22293A] mb-1.5">
                Person or Unit Involved <span class="text-destructive">*</span>
              </label>
              <AppInput
                id="person-inv"
                v-model="form.personInvolved"
                type="text"
                placeholder="e.g. Finance Officer, Procurement Team, or specific individual"
                :error="errors.personInvolved"
              />
            </div>

            <!-- Purpose of Transaction -->
            <div>
              <label for="purpose-txn" class="block text-xs font-bold text-[#22293A] mb-1.5">
                Nature / Purpose of Transaction <span class="text-destructive">*</span>
              </label>
              <AppInput
                id="purpose-txn"
                v-model="form.purposeOfTransaction"
                type="text"
                placeholder="e.g. IT Equipment Procurement, Travel Allowance Claim"
                :error="errors.purposeOfTransaction"
              />
            </div>
          </div>

          <!-- ========================================================================= -->
          <!-- STEP 3: Description & Evidence Files                                      -->
          <!-- ========================================================================= -->
          <div v-else-if="currentStep === 3" class="space-y-6 animate-fade-in">
            <div class="space-y-1">
              <div class="inline-flex items-center gap-1.5 text-xs font-bold text-[#A2561B] uppercase tracking-wider">
                <FileTextIcon class="size-3.5" />
                <span>Step 3 of 4: Evidence</span>
              </div>
              <h2 class="text-lg font-bold text-[#22293A]">
                What happened?
              </h2>
              <p class="text-xs text-[#6B7280]">
                Describe the event clearly and attach relevant receipts, memos, or images.
              </p>
            </div>

            <!-- Description Textarea -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="case-desc" class="block text-xs font-bold text-[#22293A]">
                  Detailed Description <span class="text-destructive">*</span>
                </label>
                <span class="text-[11px] text-[#6B7280]">
                  {{ form.description.length }} characters
                </span>
              </div>
              <AppTextarea
                id="case-desc"
                v-model="form.description"
                :rows="5"
                placeholder="Explain the incident, who was present, what was said or transacted, and any irregular actions..."
                :error="errors.description"
              />
            </div>

            <!-- Evidence Uploader -->
            <div class="space-y-2">
              <label class="block text-xs font-bold text-[#22293A]">
                Attach Files &amp; Proof <span class="text-destructive">*</span>
              </label>
              <p class="text-xs text-[#6B7280]">
                Upload documents, images, or PDF invoices (up to 10 files, 10MB each). Metadata is automatically scrubbed.
              </p>
              <EvidenceUploader
                v-model="form.evidence"
                :error="errors.evidence"
              />
            </div>
          </div>

          <!-- ========================================================================= -->
          <!-- STEP 4: Review Summary & Submit                                           -->
          <!-- ========================================================================= -->
          <div v-else-if="currentStep === 4" class="space-y-6 animate-fade-in">
            <div class="space-y-1">
              <div class="inline-flex items-center gap-1.5 text-xs font-bold text-[#A2561B] uppercase tracking-wider">
                <FileCheck2Icon class="size-3.5" />
                <span>Step 4 of 4: Review</span>
              </div>
              <h2 class="text-lg font-bold text-[#22293A]">
                Review your report
              </h2>
              <p class="text-xs text-[#6B7280]">
                Confirm that the information below is accurate before submitting.
              </p>
            </div>

            <!-- Summary Card -->
            <div class="p-5 rounded-xl bg-[#FAF7F2] border border-[#EADBCE] space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span class="text-[11px] font-bold uppercase text-[#6B7280]">Department</span>
                  <p class="font-bold text-[#22293A] mt-0.5">{{ selectedDepartmentName }}</p>
                  <span
                    v-if="form.concernsDepartmentHead"
                    class="inline-block mt-1 text-[10px] font-bold text-[#A2561B] bg-[#FCF4EE] px-1.5 py-0.5 rounded border border-[#A2561B]/20"
                  >
                    Department Head Bypassed
                  </span>
                </div>

                <div>
                  <span class="text-[11px] font-bold uppercase text-[#6B7280]">Date of Incident</span>
                  <p class="font-bold text-[#22293A] mt-0.5">{{ form.transactionDate }}</p>
                </div>

                <div>
                  <span class="text-[11px] font-bold uppercase text-[#6B7280]">Amount Involved</span>
                  <p class="font-bold text-[#22293A] mt-0.5 font-mono">{{ formatAmountDisplay(form.amountInvolved) }}</p>
                </div>

                <div>
                  <span class="text-[11px] font-bold uppercase text-[#6B7280]">Person / Role Involved</span>
                  <p class="font-bold text-[#22293A] mt-0.5">{{ form.personInvolved }}</p>
                </div>

                <div class="sm:col-span-2">
                  <span class="text-[11px] font-bold uppercase text-[#6B7280]">Transaction Purpose</span>
                  <p class="font-bold text-[#22293A] mt-0.5">{{ form.purposeOfTransaction }}</p>
                </div>

                <div class="sm:col-span-2">
                  <span class="text-[11px] font-bold uppercase text-[#6B7280]">Description Summary</span>
                  <p class="text-[#22293A] mt-0.5 line-clamp-3 leading-relaxed bg-white p-2.5 rounded border border-[#EADBCE]">
                    {{ form.description }}
                  </p>
                </div>

                <div class="sm:col-span-2">
                  <span class="text-[11px] font-bold uppercase text-[#6B7280]">Attached Files</span>
                  <p class="font-bold text-[#22293A] mt-0.5">
                    {{ form.evidence.length }} {{ form.evidence.length === 1 ? 'file attached' : 'files attached' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Assurance note -->
            <div class="p-3 rounded-xl bg-[#FCF4EE] border border-[#A2561B]/20 flex items-center gap-2 text-xs text-[#A2561B]">
              <ShieldCheckIcon class="size-4 shrink-0" />
              <span>Upon submission, you will receive a unique Case ID and Tracking PIN.</span>
            </div>
          </div>

          <!-- Wizard Navigation Bar -->
          <div class="pt-4 border-t border-[#EADBCE] flex items-center justify-between gap-3">
            <button
              v-if="currentStep > 1"
              type="button"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#EADBCE] bg-[#FAF7F2] hover:bg-[#F4EFE6] text-xs font-semibold text-[#22293A] transition-colors cursor-pointer"
              @click="prevStep"
            >
              <ArrowLeftIcon class="size-3.5" />
              <span>Back</span>
            </button>
            <button
              v-else
              type="button"
              class="text-xs text-[#6B7280] hover:text-[#22293A] transition-colors cursor-pointer"
              @click="handleReset"
            >
              Reset Form
            </button>

            <div class="flex items-center gap-3">
              <AppButton
                v-if="currentStep < 4"
                type="button"
                variant="default"
                size="default"
                @click="nextStep"
              >
                <span>Continue to Step {{ currentStep + 1 }}</span>
                <ArrowRightIcon class="size-3.5 ml-1" />
              </AppButton>

              <AppButton
                v-else
                type="button"
                variant="default"
                size="lg"
                :loading="isSubmitting"
                @click="handleSubmit"
              >
                <SendIcon class="size-4 mr-1.5" />
                <span>Submit Confidential Report</span>
              </AppButton>
            </div>
          </div>

        </div>
      </template>

    </div>
  </div>
</template>
