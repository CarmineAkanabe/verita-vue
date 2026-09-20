<!-- pages/cases/CaseDashboard.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import {
  getReporterDashboard,
  addReporterEvidence,
  downloadEvidenceFile,
} from '@/features/cases/api'
import type { ReporterCaseDashboard, EvidenceItem } from '@/features/cases/types'
import { toast } from '@/plugins/toast'

import AppButton from '@/components/common/AppButton.vue'
import StatusPill from '@/components/common/StatusPill.vue'
import EscalateConfirmModal from '@/components/complex/cases/EscalateConfirmModal.vue'
import EvidencePreviewModal from '@/components/complex/cases/EvidencePreviewModal.vue'

import {
  ShieldCheckIcon,
  ShieldAlertIcon,
  FileTextIcon,
  ImageIcon,
  DownloadIcon,
  EyeIcon,
  UploadCloudIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  SparklesIcon,
  LogOutIcon,
  CopyIcon,
  RefreshCwIcon,
  CalendarIcon,
  UserIcon,
  DollarSignIcon,
  Building2Icon,
  MessageSquareIcon,
  PlusIcon,
  ChevronRightIcon,
  XIcon,
} from '@lucide/vue'

const router = useRouter()
const authStore = useAuthStore()

// State
const isLoading = ref(true)
const isRefreshing = ref(false)
const errorMessage = ref<string | null>(null)
const caseData = ref<ReporterCaseDashboard | null>(null)

// Modal states
const isEscalateModalOpen = ref(false)
const isPreviewModalOpen = ref(false)
const selectedPreviewEvidence = ref<{
  id: string
  fileName?: string
  fileType?: string
} | null>(null)

// Evidence upload state
const isUploadBoxOpen = ref(false)
const isUploadingEvidence = ref(false)
const uploadFiles = ref<File[]>([])
const uploadError = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Formatters
function formatCurrency(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined || amount === '' || Number(amount) === 0) {
    return 'None declared'
  }
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numeric)) return String(amount)
  return `${numeric.toLocaleString('fr-FR')} FCFA`
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

async function copyCaseId() {
  if (!caseData.value?.caseId) return
  try {
    await navigator.clipboard.writeText(caseData.value.caseId)
    toast.success('Case ID copied to clipboard.')
  } catch {
    toast.error('Failed to copy Case ID.')
  }
}

// Fetch dashboard data
async function loadDashboard(showToast = false) {
  if (!authStore.isCaseAuthenticated) {
    router.push({ name: 'case-entry' })
    return
  }

  isRefreshing.value = true
  errorMessage.value = null

  try {
    const data = await getReporterDashboard()
    caseData.value = data
    if (showToast) {
      toast.success('Dossier refreshed with latest data.')
    }
  } catch (err: any) {
    const status = err?.status ?? err?.response?.status
    if (status === 401) {
      toast.error('Your anonymous session has expired. Please re-enter your PIN.')
      authStore.logoutCase()
      router.push({ name: 'case-entry' })
      return
    }
    errorMessage.value =
      err?.message || 'Unable to retrieve case dossier. Please check your network connection.'
    toast.error('Failed to load case data.')
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

onMounted(() => {
  loadDashboard()
})

// Evidence Preview trigger
function openPreview(item: EvidenceItem) {
  selectedPreviewEvidence.value = {
    id: item.id,
    fileName: `Exhibit-${item.id.slice(0, 8)}.${item.fileType === 'IMAGE' ? 'jpg' : 'pdf'}`,
    fileType: item.fileType,
  }
  isPreviewModalOpen.value = true
}

// Evidence Download trigger
async function handleDownloadItem(item: EvidenceItem) {
  try {
    const name = `Exhibit-${item.id.slice(0, 8)}.${item.fileType === 'IMAGE' ? 'jpg' : 'pdf'}`
    await downloadEvidenceFile(item.id, name)
    toast.success(`Downloading ${name}...`)
  } catch {
    toast.error('Failed to download file.')
  }
}

// Escalation handlers
function openEscalateModal() {
  isEscalateModalOpen.value = true
}

function handleCaseEscalated(escalatedAt: string) {
  if (caseData.value) {
    caseData.value.escalatedAt = escalatedAt
  }
}

// Evidence upload handlers
function handleFileSelection(e: Event) {
  const target = e.target as HTMLInputElement
  if (!target.files) return

  uploadError.value = null
  const selected = Array.from(target.files)

  // Validation
  const validFiles: File[] = []
  for (const f of selected) {
    if (f.size > 10 * 1024 * 1024) {
      uploadError.value = `File "${f.name}" exceeds the 10MB limit.`
      return
    }
    const validMimes = ['image/jpeg', 'image/png', 'application/pdf']
    if (!validMimes.includes(f.type) && !/\.(jpg|jpeg|png|pdf)$/i.test(f.name)) {
      uploadError.value = `File "${f.name}" has an unsupported format. Use JPG, PNG, or PDF.`
      return
    }
    validFiles.push(f)
  }

  uploadFiles.value = [...uploadFiles.value, ...validFiles]
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function removeSelectedFile(index: number) {
  uploadFiles.value.splice(index, 1)
}

async function handleUploadEvidence() {
  if (uploadFiles.value.length === 0) return

  isUploadingEvidence.value = true
  uploadError.value = null

  try {
    await addReporterEvidence(uploadFiles.value)
    toast.success('Evidence uploaded. Case queued for automated intake reprocessing.')
    uploadFiles.value = []
    isUploadBoxOpen.value = false
    await loadDashboard()
  } catch (err: any) {
    uploadError.value =
      err?.message || 'Failed to upload additional evidence exhibits.'
    toast.error('Evidence upload failed.')
  } finally {
    isUploadingEvidence.value = false
  }
}

// Session Exit
function handleExitSession() {
  authStore.logoutCase()
  toast.info('Anonymous session cleared. Keep your PIN safe to track future updates.')
  router.push({ name: 'case-entry' })
}

// Computed
const isPendingAiProcessing = computed(() => {
  if (!caseData.value) return false
  const status = caseData.value.status
  return (status === 'SUBMITTED' || status === 'AI_PROCESSING') && !caseData.value.aiSummary
})

const normalizedFindings = computed<string[]>(() => {
  if (!caseData.value?.aiFindings) return []
  if (Array.isArray(caseData.value.aiFindings)) {
    return caseData.value.aiFindings.filter(Boolean) as string[]
  }
  if (typeof caseData.value.aiFindings === 'string') {
    return [caseData.value.aiFindings]
  }
  return []
})

interface NormalizedTimelineItem {
  id: string
  eventDate: string
  description: string
  source?: string
}

const normalizedTimeline = computed<NormalizedTimelineItem[]>(() => {
  if (!caseData.value?.aiTimeline) return []
  if (Array.isArray(caseData.value.aiTimeline)) {
    return caseData.value.aiTimeline.map((item, idx) => {
      if (typeof item === 'string') {
        return {
          id: `timeline-${idx}`,
          eventDate: '',
          description: item,
          source: '',
        }
      }
      return {
        id: item.id || `timeline-${idx}`,
        eventDate: item.eventDate || item.date || item.timestamp || '',
        description: item.description || item.event || item.title || '',
        source: item.source || '',
      }
    })
  }
  return []
})

const hasAiReviewData = computed(() => {
  if (!caseData.value) return false
  return Boolean(
    caseData.value.aiSummary ||
      normalizedFindings.value.length > 0 ||
      normalizedTimeline.value.length > 0
  )
})
</script>

<template>
  <div class="min-h-screen bg-[#F2F4F7] text-[#22293A] pb-16">
    <!-- Top Session Ribbon -->
    <div class="w-full bg-[#22293A] text-white py-2 px-4 sm:px-6 lg:px-8 border-b border-[#333C4D]">
      <div class="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#A2561B] text-white font-medium text-[11px]">
            <ShieldCheckIcon class="size-3" />
            Anonymous Reporter Session
          </span>
          <span class="text-[#9CA3AF] hidden sm:inline">|</span>
          <span class="text-[#D1D5DB] text-[11px]">
            Air-Gapped Identity · Zero IP Logging · Cameroon Enterprise Vault
          </span>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            class="text-[#D1D5DB] hover:text-white inline-flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
            :disabled="isRefreshing"
            @click="loadDashboard(true)"
          >
            <RefreshCwIcon :class="['size-3', isRefreshing && 'animate-spin']" />
            <span>{{ isRefreshing ? 'Refreshing...' : 'Refresh Status' }}</span>
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#333C4D] hover:bg-[#4B5563] text-white text-[11px] font-medium transition-colors cursor-pointer"
            @click="handleExitSession"
          >
            <LogOutIcon class="size-3" />
            <span>Exit Session</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Container -->
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <!-- Loading Skeleton State -->
      <div v-if="isLoading" class="space-y-6">
        <div class="p-6 bg-white rounded-xl border border-[#E2E5EE] shadow-xs animate-pulse space-y-4">
          <div class="h-6 w-48 bg-[#E2E5EE] rounded"></div>
          <div class="h-4 w-96 bg-[#E2E5EE]/60 rounded"></div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 p-6 bg-white rounded-xl border border-[#E2E5EE] shadow-xs animate-pulse space-y-4">
            <div class="h-5 w-36 bg-[#E2E5EE] rounded"></div>
            <div class="h-20 bg-[#E2E5EE]/40 rounded"></div>
            <div class="h-20 bg-[#E2E5EE]/40 rounded"></div>
          </div>
          <div class="p-6 bg-white rounded-xl border border-[#E2E5EE] shadow-xs animate-pulse space-y-4">
            <div class="h-5 w-28 bg-[#E2E5EE] rounded"></div>
            <div class="h-32 bg-[#E2E5EE]/40 rounded"></div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="errorMessage && !caseData"
        class="p-8 bg-white border border-[#E2E5EE] rounded-xl text-center max-w-lg mx-auto space-y-4"
      >
        <div class="h-12 w-12 rounded-full bg-[#FEF2F2] border border-[#FCA5A5] flex items-center justify-center text-[#991B1B] mx-auto">
          <AlertTriangleIcon class="size-6" />
        </div>
        <h3 class="text-base font-bold text-[#22293A]">Unable to Load Dossier</h3>
        <p class="text-xs text-[#6B7280]">{{ errorMessage }}</p>
        <AppButton variant="default" size="sm" @click="loadDashboard()">
          Try Again
        </AppButton>
      </div>

      <!-- Loaded Dashboard -->
      <template v-else-if="caseData">
        <!-- ========================================================================= -->
        <!-- HEADER / ACTION BAR                                                       -->
        <!-- ========================================================================= -->
        <div class="bg-white border border-[#E2E5EE] rounded-xl p-5 sm:p-6 shadow-xs">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <!-- Left Info: Case ID & Status -->
            <div class="space-y-2">
              <div class="flex flex-wrap items-center gap-2.5">
                <span class="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                  Incident Dossier
                </span>
                <StatusPill :status="caseData.status" />

                <!-- Escalated badge if applicable -->
                <span
                  v-if="caseData.escalatedAt"
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5]"
                >
                  <ShieldAlertIcon class="size-3" />
                  Escalated to General Management ({{ formatDate(caseData.escalatedAt) }})
                </span>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-[#22293A] font-mono">
                  {{ caseData.caseId }}
                </h1>
                <button
                  type="button"
                  class="p-1.5 rounded-md hover:bg-[#F2F4F7] text-[#6B7280] hover:text-[#22293A] transition-colors cursor-pointer"
                  title="Copy Case ID"
                  @click="copyCaseId"
                >
                  <CopyIcon class="size-4" />
                </button>
              </div>

              <p class="text-xs text-[#6B7280]">
                Submitted for investigation under Cameroonian corporate governance policies · Digimark Consulting
              </p>
            </div>

            <!-- Right Actions: Add Evidence + Escalate -->
            <div class="flex flex-wrap items-center gap-3">
              <AppButton
                variant="outline"
                size="sm"
                @click="isUploadBoxOpen = !isUploadBoxOpen"
              >
                <PlusIcon class="size-4 mr-1.5" />
                Add Evidence
              </AppButton>

              <!-- Escalate button (only enabled if not already escalated) -->
              <button
                v-if="!caseData.escalatedAt"
                type="button"
                class="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-[#A2561B] hover:bg-[#843F01] transition-colors cursor-pointer"
                @click="openEscalateModal"
              >
                <ShieldAlertIcon class="size-4" />
                <span>Escalate Incident</span>
              </button>

              <div
                v-else
                class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#F2F4F7] text-[#6B7280] border border-[#E2E5EE]"
              >
                <CheckCircle2Icon class="size-4 text-emerald-600" />
                <span>Under Executive Escalation</span>
              </div>
            </div>
          </div>

          <!-- Inline Add Evidence Box (Collapsible) -->
          <div
            v-if="isUploadBoxOpen"
            class="mt-6 pt-6 border-t border-[#E2E5EE] space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-sm font-bold text-[#22293A]">Add Supplemental Evidence</h4>
                <p class="text-xs text-[#6B7280]">
                  Upload additional receipts, invoices, screenshots, or official communications (JPG, PNG, PDF up to 10MB).
                </p>
              </div>
              <button
                type="button"
                class="text-[#6B7280] hover:text-[#22293A] p-1 cursor-pointer"
                @click="isUploadBoxOpen = false"
              >
                <XIcon class="size-4" />
              </button>
            </div>

            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <input
                ref="fileInputRef"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                class="hidden"
                @change="handleFileSelection"
              />
              <button
                type="button"
                class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-dashed border-[#A2561B] text-[#A2561B] hover:bg-[#FCF4EE] text-xs font-semibold cursor-pointer transition-colors"
                :disabled="isUploadingEvidence"
                @click="fileInputRef?.click()"
              >
                <UploadCloudIcon class="size-4" />
                <span>Choose Files...</span>
              </button>

              <span class="text-xs text-[#6B7280]">
                {{ uploadFiles.length === 0 ? 'No files selected yet.' : `${uploadFiles.length} file(s) selected.` }}
              </span>
            </div>

            <!-- Selected Files Badge List -->
            <div v-if="uploadFiles.length > 0" class="flex flex-wrap gap-2 pt-2">
              <div
                v-for="(f, idx) in uploadFiles"
                :key="idx"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F2F4F7] border border-[#E2E5EE] text-xs text-[#22293A]"
              >
                <FileTextIcon class="size-3.5 text-[#A2561B]" />
                <span class="max-w-[180px] truncate font-medium">{{ f.name }}</span>
                <span class="text-[10px] text-[#6B7280]">({{ (f.size / 1024).toFixed(0) }} KB)</span>
                <button
                  type="button"
                  class="text-[#6B7280] hover:text-red-600 ml-1 cursor-pointer"
                  @click="removeSelectedFile(idx)"
                >
                  <XIcon class="size-3" />
                </button>
              </div>
            </div>

            <div v-if="uploadError" class="p-2.5 rounded-md bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs">
              {{ uploadError }}
            </div>

            <div v-if="uploadFiles.length > 0" class="flex justify-end gap-2 pt-2">
              <AppButton
                variant="outline"
                size="sm"
                :disabled="isUploadingEvidence"
                @click="uploadFiles = []; isUploadBoxOpen = false"
              >
                Cancel
              </AppButton>
              <button
                type="button"
                class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#A2561B] hover:bg-[#843F01] transition-colors disabled:opacity-50 cursor-pointer"
                :disabled="isUploadingEvidence"
                @click="handleUploadEvidence"
              >
                <UploadCloudIcon v-if="!isUploadingEvidence" class="size-3.5" />
                <span>{{ isUploadingEvidence ? 'Uploading...' : 'Transmit Exhibits' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- STATUS-AWARE AI INTAKE REVIEW OR PENDING STATE BANNER                     -->
        <!-- ========================================================================= -->

        <!-- Case 1: Pending Automated Intake Synthesis -->
        <div
          v-if="isPendingAiProcessing"
          class="bg-white border border-[#E2E5EE] rounded-xl p-6 shadow-xs relative overflow-hidden"
        >
          <div class="flex items-start gap-4">
            <div class="h-10 w-10 rounded-lg bg-[#FCF4EE] border border-[#A2561B]/30 flex items-center justify-center text-[#A2561B] shrink-0">
              <SparklesIcon class="size-5 animate-pulse text-[#A2561B]" />
            </div>

            <div class="space-y-2 flex-1">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h3 class="text-sm sm:text-base font-bold text-[#22293A]">
                  Automated Intake Review in Progress
                </h3>
                <span class="inline-flex items-center gap-1 text-[11px] font-medium text-[#A2561B] bg-[#FCF4EE] px-2 py-0.5 rounded border border-[#A2561B]/20">
                  <ClockIcon class="size-3" />
                  Synthesizing Dossier
                </span>
              </div>

              <p class="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                Verita's automated intake engine is reviewing the provided transaction details, cross-indexing exhibits, and structuring an executive timeline. The executive findings and chronology will automatically appear in this section once synthesis completes.
              </p>

              <div class="pt-2 flex items-center gap-3 text-xs">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 font-semibold text-[#A2561B] hover:text-[#843F01] transition-colors cursor-pointer"
                  :disabled="isRefreshing"
                  @click="loadDashboard(true)"
                >
                  <RefreshCwIcon :class="['size-3.5', isRefreshing && 'animate-spin']" />
                  <span>Check Intake Status</span>
                </button>
                <span class="text-[#D1D5DB]">·</span>
                <span class="text-[#9CA3AF] text-[11px]">
                  Your case remains fully registered and secure.
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Case 2: AI Processing Failed Alert -->
        <div
          v-else-if="caseData.aiProcessingFailed"
          class="bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl p-5 text-[#991B1B] flex items-start gap-3.5"
        >
          <AlertTriangleIcon class="size-5 text-[#DC2626] shrink-0 mt-0.5" />
          <div class="text-xs space-y-1">
            <h4 class="font-bold text-[#991B1B] text-sm">Automated Synthesis Alert</h4>
            <p class="leading-relaxed">
              Automated intake analysis could not be fully compiled for this submission. However, your incident report remains securely logged and has been routed directly to the Department Head and General Management for manual review.
            </p>
          </div>
        </div>

        <!-- Case 3: Populated AI Review Section -->
        <div
          v-else-if="hasAiReviewData"
          class="bg-white border border-[#E2E5EE] rounded-xl p-6 shadow-xs space-y-6"
        >
          <div class="flex items-center justify-between border-b border-[#E2E5EE] pb-4">
            <div class="flex items-center gap-2.5">
              <div class="h-8 w-8 rounded-lg bg-[#FCF4EE] border border-[#A2561B]/30 flex items-center justify-center text-[#A2561B]">
                <SparklesIcon class="size-4" />
              </div>
              <div>
                <h3 class="text-base font-bold text-[#22293A]">
                  Automated Intake Review &amp; Synthesis
                </h3>
                <p class="text-xs text-[#6B7280]">
                  Objective intake extraction for investigative prioritization
                </p>
              </div>
            </div>

            <span class="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider hidden sm:inline">
              Verified Intake Summary
            </span>
          </div>

          <!-- Executive AI Summary -->
          <div v-if="caseData.aiSummary" class="space-y-2">
            <h4 class="text-xs font-bold text-[#22293A] uppercase tracking-wider">
              Executive Incident Summary
            </h4>
            <div class="p-4 rounded-lg bg-[#F8F9FA] border border-[#E2E5EE] text-xs sm:text-sm text-[#22293A] leading-relaxed">
              {{ caseData.aiSummary }}
            </div>
          </div>

          <!-- Key Findings Tags -->
          <div v-if="normalizedFindings.length > 0" class="space-y-2">
            <h4 class="text-xs font-bold text-[#22293A] uppercase tracking-wider">
              Key Incident Findings &amp; Risk Flags
            </h4>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="(finding, idx) in normalizedFindings"
                :key="idx"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FCF4EE] border border-[#A2561B]/20 text-[#A2561B] text-xs font-medium"
              >
                <CheckCircle2Icon class="size-3.5 shrink-0" />
                <span>{{ finding }}</span>
              </div>
            </div>
          </div>

          <!-- Structured Chronological Timeline -->
          <div v-if="normalizedTimeline.length > 0" class="space-y-3">
            <h4 class="text-xs font-bold text-[#22293A] uppercase tracking-wider">
              Chronological Incident Timeline
            </h4>

            <div class="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E5EE]">
              <div
                v-for="event in normalizedTimeline"
                :key="event.id"
                class="relative space-y-1"
              >
                <div class="absolute -left-6 top-1.5 h-4 w-4 rounded-full bg-white border-2 border-[#A2561B]"></div>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-xs font-bold text-[#22293A]">
                    {{ formatDate(event.eventDate) }}
                  </span>
                  <span
                    v-if="event.source"
                    class="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-[#F2F4F7] text-[#6B7280] border border-[#E2E5EE]"
                  >
                    {{ event.source.replaceAll('_', ' ') }}
                  </span>
                </div>
                <p class="text-xs text-[#4B5563] leading-relaxed">
                  {{ event.description }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- TWO-COLUMN GRID: CASE PARTICULARS & EVIDENCE VAULT                        -->
        <!-- ========================================================================= -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- LEFT 2 COLS: Case Particulars -->
          <div class="lg:col-span-2 space-y-8">
            <!-- Incident Details Card -->
            <div class="bg-white border border-[#E2E5EE] rounded-xl p-6 shadow-xs space-y-6">
              <div class="border-b border-[#E2E5EE] pb-4 flex items-center justify-between">
                <h3 class="text-base font-bold text-[#22293A]">
                  Submitted Incident Particulars
                </h3>
                <span class="text-xs text-[#6B7280]">
                  Confidential Submission
                </span>
              </div>

              <!-- Metadata Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Purpose / Nature -->
                <div class="p-3.5 rounded-lg bg-[#F8F9FA] border border-[#E2E5EE] space-y-1">
                  <div class="flex items-center gap-1.5 text-xs text-[#6B7280]">
                    <Building2Icon class="size-3.5 text-[#A2561B]" />
                    <span>Transaction Nature / Purpose</span>
                  </div>
                  <p class="text-xs sm:text-sm font-semibold text-[#22293A]">
                    {{ caseData.purposeOfTransaction || '—' }}
                  </p>
                </div>

                <!-- Financial Amount -->
                <div class="p-3.5 rounded-lg bg-[#F8F9FA] border border-[#E2E5EE] space-y-1">
                  <div class="flex items-center gap-1.5 text-xs text-[#6B7280]">
                    <DollarSignIcon class="size-3.5 text-[#A2561B]" />
                    <span>Amount Involved</span>
                  </div>
                  <p class="text-xs sm:text-sm font-semibold text-[#22293A]">
                    {{ formatCurrency(caseData.amountInvolved) }}
                  </p>
                </div>

                <!-- Transaction Date -->
                <div class="p-3.5 rounded-lg bg-[#F8F9FA] border border-[#E2E5EE] space-y-1">
                  <div class="flex items-center gap-1.5 text-xs text-[#6B7280]">
                    <CalendarIcon class="size-3.5 text-[#A2561B]" />
                    <span>Date of Incident / Transaction</span>
                  </div>
                  <p class="text-xs sm:text-sm font-semibold text-[#22293A]">
                    {{ formatDate(caseData.transactionDate) }}
                  </p>
                </div>

                <!-- Person(s) Involved -->
                <div class="p-3.5 rounded-lg bg-[#F8F9FA] border border-[#E2E5EE] space-y-1">
                  <div class="flex items-center gap-1.5 text-xs text-[#6B7280]">
                    <UserIcon class="size-3.5 text-[#A2561B]" />
                    <span>Person(s) Implicated</span>
                  </div>
                  <p class="text-xs sm:text-sm font-semibold text-[#22293A]">
                    {{ caseData.personInvolved || 'None explicitly specified' }}
                  </p>
                </div>
              </div>

              <!-- Full Narrative Statement -->
              <div class="space-y-2">
                <h4 class="text-xs font-bold text-[#22293A] uppercase tracking-wider">
                  Detailed Incident Narrative
                </h4>
                <div class="p-4 rounded-lg bg-[#F8F9FA] border border-[#E2E5EE] text-xs sm:text-sm text-[#22293A] leading-relaxed whitespace-pre-wrap">
                  {{ caseData.description }}
                </div>
              </div>
            </div>

            <!-- Consultation Channel Link (Phase 6) -->
            <div class="bg-white border border-[#E2E5EE] rounded-xl p-6 shadow-xs space-y-4">
              <div class="flex items-start justify-between gap-4">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 rounded-lg bg-[#FCF4EE] border border-[#A2561B]/30 flex items-center justify-center text-[#A2561B] shrink-0">
                    <MessageSquareIcon class="size-5" />
                  </div>
                  <div>
                    <h3 class="text-base font-bold text-[#22293A]">
                      Investigative Consultation Channel
                    </h3>
                    <p class="text-xs text-[#6B7280]">
                      End-to-end encrypted dialogue with assigned supervisor
                    </p>
                  </div>
                </div>

                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Channel Active
                </span>
              </div>

              <p class="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                Connect directly with the investigation supervisor handling this report. Exchange encrypted inquiries and provide supplemental details while retaining absolute anonymity.
              </p>

              <div class="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs border-t border-[#E2E5EE]">
                <span class="text-[#6B7280] text-[11px]">
                  Text &amp; emojis only · Submitter identity cryptographically sealed.
                </span>
                <router-link
                  :to="{ name: 'case-chat' }"
                  class="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#A2561B] hover:bg-[#843F01] text-white font-semibold transition-colors cursor-pointer"
                >
                  <MessageSquareIcon class="size-3.5" />
                  <span>Open Consultation Channel</span>
                  <ChevronRightIcon class="size-3.5" />
                </router-link>
              </div>
            </div>
          </div>

          <!-- RIGHT 1 COL: Evidence Vault -->
          <div class="space-y-6">
            <div class="bg-white border border-[#E2E5EE] rounded-xl p-6 shadow-xs space-y-4">
              <div class="flex items-center justify-between border-b border-[#E2E5EE] pb-3">
                <div class="flex items-center gap-2">
                  <FileTextIcon class="size-4 text-[#A2561B]" />
                  <h3 class="text-sm font-bold text-[#22293A]">Evidence Exhibits</h3>
                </div>
                <span class="text-xs font-semibold text-[#6B7280] px-2 py-0.5 rounded bg-[#F2F4F7]">
                  {{ caseData.evidence?.length || 0 }} file(s)
                </span>
              </div>

              <!-- Evidence List -->
              <div
                v-if="caseData.evidence && caseData.evidence.length > 0"
                class="divide-y divide-[#E2E5EE] max-h-[480px] overflow-y-auto"
              >
                <div
                  v-for="(item, index) in caseData.evidence"
                  :key="item.id"
                  class="py-3 flex items-center justify-between gap-3 group"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div class="h-8 w-8 rounded bg-[#F8F9FA] border border-[#E2E5EE] flex items-center justify-center text-[#A2561B] shrink-0">
                      <ImageIcon v-if="item.fileType === 'IMAGE'" class="size-4" />
                      <FileTextIcon v-else class="size-4" />
                    </div>
                    <div class="min-w-0">
                      <p class="text-xs font-bold text-[#22293A] truncate">
                        Exhibit {{ index + 1 }} · {{ item.fileType }}
                      </p>
                      <p class="text-[10px] text-[#6B7280] font-mono truncate">
                        {{ item.id.slice(0, 12) }}... · {{ formatDate(item.uploadedAt) }}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      class="p-1.5 text-[#6B7280] hover:text-[#A2561B] rounded hover:bg-[#F2F4F7] transition-colors cursor-pointer"
                      title="Preview Document"
                      @click="openPreview(item)"
                    >
                      <EyeIcon class="size-4" />
                    </button>
                    <button
                      type="button"
                      class="p-1.5 text-[#6B7280] hover:text-[#22293A] rounded hover:bg-[#F2F4F7] transition-colors cursor-pointer"
                      title="Download Document"
                      @click="handleDownloadItem(item)"
                    >
                      <DownloadIcon class="size-4" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Empty state -->
              <div
                v-else
                class="text-center py-8 px-4 border border-dashed border-[#E2E5EE] rounded-lg"
              >
                <FileTextIcon class="size-8 text-[#9CA3AF] mx-auto mb-2" />
                <p class="text-xs font-medium text-[#22293A]">No exhibits uploaded yet</p>
                <p class="text-[11px] text-[#6B7280] mt-0.5">
                  You can attach documentation at any time using the button below.
                </p>
              </div>

              <!-- Add Evidence quick button -->
              <button
                type="button"
                class="w-full py-2 px-3 rounded-lg border border-[#E2E5EE] bg-[#F8F9FA] hover:bg-[#F2F4F7] text-xs font-semibold text-[#22293A] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                @click="isUploadBoxOpen = true"
              >
                <PlusIcon class="size-3.5 text-[#A2561B]" />
                <span>Upload New Exhibit</span>
              </button>
            </div>

            <!-- Chain of Custody Security Badge -->
            <div class="bg-white border border-[#E2E5EE] rounded-xl p-5 shadow-xs text-xs space-y-3">
              <div class="flex items-center gap-2 text-[#22293A] font-bold">
                <ShieldCheckIcon class="size-4 text-[#A2561B]" />
                <span>Cameroon Enterprise Assurance</span>
              </div>
              <p class="text-[11px] text-[#6B7280] leading-relaxed">
                All evidence files are cryptographically stamped with SHA-256 integrity hashes upon receipt. Metadata stripping removes EXIF data, IP origins, and hardware markers before storage.
              </p>
              <div class="text-[10px] text-[#9CA3AF] font-mono">
                AES-256-GCM Vault Storage · Digimark Audit Standard
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Escalate Confirmation Modal -->
    <EscalateConfirmModal
      v-if="caseData"
      :is-open="isEscalateModalOpen"
      :case-id="caseData.caseId"
      @close="isEscalateModalOpen = false"
      @escalated="handleCaseEscalated"
    />

    <!-- Evidence Preview Modal -->
    <EvidencePreviewModal
      v-if="selectedPreviewEvidence"
      :is-open="isPreviewModalOpen"
      :evidence-id="selectedPreviewEvidence.id"
      :file-name="selectedPreviewEvidence.fileName"
      :file-type="selectedPreviewEvidence.fileType"
      @close="isPreviewModalOpen = false; selectedPreviewEvidence = null"
    />
  </div>
</template>
