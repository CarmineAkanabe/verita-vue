<!-- pages/staff/cases/CaseDetail.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import {
  getStaffCaseDetail,
  claimCase,
  updateStaffCaseStatus,
  downloadStaffEvidenceFile,
  getStaffEvidenceBlob,
} from '@/features/cases/api'
import type {
  StaffCase,
  CaseStatus,
  StaffEvidenceItem,
  TimelineEvent,
} from '@/features/cases/types'
import { toast } from '@/plugins/toast'
import AppButton from '@/components/common/AppButton.vue'
import StatusPill from '@/components/common/StatusPill.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import {
  ArrowLeftIcon,
  CopyIcon,
  CheckIcon,
  ShieldCheckIcon,
  FileTextIcon,
  DownloadIcon,
  EyeIcon,
  HandHelpingIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  MessageSquareIcon,
  SparklesIcon,
  XIcon,
} from '@lucide/vue'

const route = useRoute()
const auth = useAuthStore()

const caseId = computed(() => route.params.id as string)
const isLoading = ref(true)
const error = ref<string | null>(null)
const caseData = ref<StaffCase | null>(null)
const copiedId = ref(false)

// Claiming
const isClaiming = ref(false)

// Status update modal
const isStatusModalOpen = ref(false)
const isUpdatingStatus = ref(false)
const targetStatus = ref<CaseStatus>('UNDER_INVESTIGATION')
const statusNote = ref('')
const resolutionSummary = ref('')
const modalErrors = ref<{ note?: string; resolutionSummary?: string }>({})

// Evidence preview modal
const isPreviewOpen = ref(false)
const previewLoading = ref(false)
const previewUrl = ref<string | null>(null)
const previewFileName = ref('')
const previewFileType = ref<'IMAGE' | 'PDF'>('IMAGE')

const isEligibleToClaim = computed(() => {
  return (
    caseData.value?.status === 'AWAITING_REVIEW' &&
    !caseData.value?.assignedTo &&
    auth.user?.role === 'DEPARTMENT_HEAD'
  )
})

const isAssignedToMe = computed(() => {
  return caseData.value?.assignedTo === auth.user?.id
})

async function fetchCase() {
  isLoading.value = true
  error.value = null

  try {
    const data = await getStaffCaseDetail(caseId.value)
    caseData.value = data
    targetStatus.value = data.status
  } catch (err: any) {
    error.value = err?.message || 'Failed to retrieve case investigation dossier.'
  } finally {
    isLoading.value = false
  }
}

async function handleClaim() {
  if (!caseData.value) return
  isClaiming.value = true

  try {
    const updated = await claimCase(caseData.value.id)
    caseData.value.status = updated.status
    caseData.value.assignedTo = updated.assignedTo
    toast.success('Dossier successfully claimed. Status transitioned to Investigation.')
  } catch (err: any) {
    toast.error(err?.message || 'Failed to claim docket. It may have already been claimed by another officer.')
  } finally {
    isClaiming.value = false
  }
}

function openStatusModal() {
  if (!caseData.value) return
  targetStatus.value = caseData.value.status === 'AWAITING_REVIEW' ? 'UNDER_INVESTIGATION' : caseData.value.status
  statusNote.value = ''
  resolutionSummary.value = caseData.value.resolutionSummary || ''
  modalErrors.value = {}
  isStatusModalOpen.value = true
}

function closeStatusModal() {
  isStatusModalOpen.value = false
}

async function submitStatusUpdate() {
  modalErrors.value = {}

  if (!statusNote.value.trim()) {
    modalErrors.value.note = 'Investigation note is mandatory for any status update.'
    return
  }

  if (statusNote.value.length > 2000) {
    modalErrors.value.note = 'Investigation note must not exceed 2,000 characters.'
    return
  }

  if ((targetStatus.value === 'RESOLVED' || targetStatus.value === 'DISMISSED') && !resolutionSummary.value.trim()) {
    modalErrors.value.resolutionSummary = `Resolution summary is strictly required when marking a docket as ${targetStatus.value}.`
    return
  }

  isUpdatingStatus.value = true

  try {
    const updated = await updateStaffCaseStatus(caseId.value, {
      status: targetStatus.value,
      note: statusNote.value.trim(),
      resolutionSummary: resolutionSummary.value.trim() || undefined,
    })

    if (caseData.value) {
      caseData.value.status = updated.status
      caseData.value.resolutionSummary = updated.resolutionSummary
      caseData.value.resolvedAt = updated.resolvedAt
    }

    toast.success(`Dossier status successfully transitioned to ${targetStatus.value}.`)
    closeStatusModal()
  } catch (err: any) {
    toast.error(err?.message || 'Failed to update docket status.')
  } finally {
    isUpdatingStatus.value = false
  }
}

async function handlePreviewEvidence(item: StaffEvidenceItem, index: number) {
  previewFileName.value = `Exhibit-${index + 1}.${item.fileType === 'IMAGE' ? 'png' : 'pdf'}`
  previewFileType.value = item.fileType
  isPreviewOpen.value = true
  previewLoading.value = true

  try {
    const { blob } = await getStaffEvidenceBlob(caseId.value, item.id)
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
    }
    previewUrl.value = URL.createObjectURL(blob)
  } catch (err: any) {
    toast.error('Failed to stream evidence exhibit.')
    closePreview()
  } finally {
    previewLoading.value = false
  }
}

function closePreview() {
  isPreviewOpen.value = false
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

async function handleDownloadEvidence(item: StaffEvidenceItem, index: number) {
  const filename = `Exhibit-${index + 1}-${caseId.value.slice(0, 8)}.${item.fileType === 'IMAGE' ? 'png' : 'pdf'}`
  try {
    await downloadStaffEvidenceFile(caseId.value, item.id, filename)
    toast.success('Exhibit download initiated.')
  } catch (err: any) {
    toast.error('Failed to download evidence file.')
  }
}

function copyCaseId() {
  navigator.clipboard.writeText(caseId.value)
  copiedId.value = true
  toast.success('Case ID copied to clipboard.')
  setTimeout(() => (copiedId.value = false), 2500)
}

function formatAmount(amount: string | number | undefined): string {
  if (amount === undefined || amount === null) return '0 FCFA'
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numeric)) return `${amount} FCFA`
  return `${numeric.toLocaleString('fr-FR')} FCFA`
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

const parsedFindings = computed<string[]>(() => {
  if (!caseData.value?.aiFindings) return []
  const raw = caseData.value.aiFindings
  if (Array.isArray(raw)) {
    return raw.map(String)
  }
  let obj: any = raw
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw)
    } catch {
      return [raw]
    }
  }
  if (Array.isArray(obj)) {
    return obj.map(String)
  }
  if (obj && typeof obj === 'object') {
    const list: string[] = []
    if (Array.isArray(obj.clarification)) {
      list.push(...obj.clarification.map(String))
    }
    if (obj.consistency && typeof obj.consistency === 'object') {
      for (const [k, v] of Object.entries(obj.consistency)) {
        list.push(`${k.replace(/_/g, ' ')}: ${v ? 'Consistent' : 'Discrepancy detected'}`)
      }
    }
    if (obj.completeness && typeof obj.completeness === 'object') {
      const missing = Object.entries(obj.completeness)
        .filter(([, v]) => !v)
        .map(([k]) => k)
      if (missing.length > 0) {
        list.push(`Missing documentation: ${missing.join(', ')}`)
      } else {
        list.push('All primary intake criteria verified complete.')
      }
    }
    return list.length > 0 ? list : [JSON.stringify(obj)]
  }
  return [String(obj)]
})

const parsedTimeline = computed<TimelineEvent[]>(() => {
  if (!caseData.value?.aiTimeline) return []
  if (Array.isArray(caseData.value.aiTimeline)) {
    return caseData.value.aiTimeline as TimelineEvent[]
  }
  try {
    const parsed = JSON.parse(caseData.value.aiTimeline as string)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
})

onMounted(() => {
  fetchCase()
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Back & Header -->
    <div class="border-b border-border pb-5 space-y-3">
      <div class="flex items-center justify-between">
        <router-link
          to="/app/cases"
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon class="size-4" />
          <span>Back to Investigation Queue</span>
        </router-link>

        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheckIcon class="size-3" />
            ISO 37002 Shield Active
          </span>
          <span v-if="caseData?.concernsDepartmentHead" class="px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/15 text-destructive border border-destructive/30">
            Conflict of Interest Flagged
          </span>
        </div>
      </div>

      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-extrabold text-foreground font-mono tracking-tight">
              Docket #{{ caseId.slice(0, 13) }}...
            </h1>
            <button
              type="button"
              class="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              title="Copy Full UUID"
              @click="copyCaseId"
            >
              <CheckIcon v-if="copiedId" class="size-4 text-emerald-600" />
              <CopyIcon v-else class="size-4" />
            </button>
            <StatusPill v-if="caseData" :status="caseData.status" />
          </div>
          <p class="text-xs text-muted-foreground mt-1">
            Filed on <strong class="text-foreground font-mono">{{ formatDate(caseData?.createdAt || caseData?.transactionDate) }}</strong>
            · Category: <span class="font-bold text-primary">{{ caseData?.category }}</span>
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <!-- Claim Button (if unclaimed) -->
          <AppButton
            v-if="isEligibleToClaim"
            size="sm"
            :loading="isClaiming"
            @click="handleClaim"
          >
            <HandHelpingIcon class="size-4 mr-1.5" />
            Claim Case &amp; Begin Investigation
          </AppButton>

          <!-- Update Status Button (assigned officer only) -->
          <AppButton
            v-if="isAssignedToMe"
            variant="outline"
            size="sm"
            @click="openStatusModal"
          >
            <CheckCircle2Icon class="size-4 mr-1.5" />
            Update Status &amp; Findings
          </AppButton>

          <!-- Consultation Channel Link -->
          <router-link
            :to="`/app/cases/${caseData?.id}/chat`"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition-colors"
          >
            <MessageSquareIcon class="size-3.5" />
            <span>Consultation Messages</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Error Banner -->
    <ErrorBanner
      v-if="error"
      :message="error"
      @retry="fetchCase"
    />

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="space-y-6 animate-pulse">
      <div class="h-44 bg-muted/40 rounded-lg border border-border"></div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 h-72 bg-muted/40 rounded-lg border border-border"></div>
        <div class="h-72 bg-muted/40 rounded-lg border border-border"></div>
      </div>
    </div>

    <!-- Loaded Case Dossier -->
    <div v-else-if="caseData" class="space-y-6">
      <!-- Resolution Summary Banner (if resolved/dismissed) -->
      <div
        v-if="caseData.resolutionSummary"
        class="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1"
      >
        <div class="flex items-center gap-2 text-emerald-800 font-bold uppercase tracking-wider text-[10px]">
          <CheckCircle2Icon class="size-3.5" />
          <span>Official Case Resolution Summary</span>
          <span v-if="caseData.resolvedAt" class="font-mono text-muted-foreground">({{ formatDate(caseData.resolvedAt) }})</span>
        </div>
        <p class="text-xs text-foreground font-medium leading-relaxed">
          {{ caseData.resolutionSummary }}
        </p>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div class="p-4 rounded-lg bg-card border border-border">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Disputed Exposure
          </span>
          <p class="text-xl font-extrabold text-foreground font-mono mt-1">
            {{ formatAmount(caseData.amountInvolved) }}
          </p>
        </div>

        <div class="p-4 rounded-lg bg-card border border-border">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Implicated Entity / Person
          </span>
          <p class="text-sm font-bold text-foreground truncate mt-1" :title="caseData.personInvolved">
            {{ caseData.personInvolved || 'Unspecified' }}
          </p>
        </div>

        <div class="p-4 rounded-lg bg-card border border-border">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Incident Transaction Date
          </span>
          <p class="text-sm font-bold text-foreground font-mono mt-1">
            {{ caseData.transactionDate || 'Not specified' }}
          </p>
        </div>

        <div class="p-4 rounded-lg bg-card border border-border">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Investigator Assignment
          </span>
          <p class="text-sm font-bold text-foreground mt-1">
            {{ isAssignedToMe ? 'Assigned to You' : caseData.assignedTo ? 'Assigned to Staff' : 'Unclaimed' }}
          </p>
        </div>
      </div>

      <!-- Main Columns: Left = Forensic AI & Narrative, Right = Evidence & Meta -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left 2 Cols -->
        <div class="lg:col-span-2 space-y-6">
          <!-- AI Forensic Review Section -->
          <div class="bg-card border border-border rounded-lg p-5 space-y-5">
            <div class="flex items-center justify-between border-b border-border pb-3">
              <div class="flex items-center gap-2">
                <div class="p-1.5 rounded bg-primary/10 text-primary">
                  <SparklesIcon class="size-4" />
                </div>
                <div>
                  <h2 class="text-sm font-bold text-foreground uppercase tracking-wider">
                    AI Forensic Synthesis
                  </h2>
                  <span class="text-[11px] text-muted-foreground">
                    Automated document sanitization, cross-referencing, and event structuring
                  </span>
                </div>
              </div>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                VERITA-LLM-CORE
              </span>
            </div>

            <!-- Executive Summary -->
            <div v-if="caseData.aiSummary" class="space-y-1.5">
              <h3 class="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">
                Executive Incident Summary
              </h3>
              <p class="text-xs text-foreground leading-relaxed bg-muted/30 p-3 rounded border border-border">
                {{ caseData.aiSummary }}
              </p>
            </div>
            <div v-else class="text-xs text-muted-foreground italic py-2">
              Automated AI synthesis is pending or unavailable for this disclosure.
            </div>

            <!-- Risk Findings / Red Flags -->
            <div v-if="parsedFindings.length > 0" class="space-y-2">
              <h3 class="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">
                Corroborated Risk Indicators &amp; Red Flags
              </h3>
              <ul class="space-y-1.5">
                <li
                  v-for="(finding, idx) in parsedFindings"
                  :key="idx"
                  class="flex items-start gap-2 text-xs text-foreground bg-primary/5 p-2.5 rounded border border-primary/15"
                >
                  <AlertTriangleIcon class="size-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{{ finding }}</span>
                </li>
              </ul>
            </div>

            <!-- Chronological Event Timeline -->
            <div v-if="parsedTimeline.length > 0" class="space-y-3">
              <h3 class="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">
                Reconstructed Event Timeline
              </h3>
              <div class="relative border-l-2 border-primary/30 ml-3 space-y-4 py-1">
                <div
                  v-for="(event, eIdx) in parsedTimeline"
                  :key="eIdx"
                  class="relative pl-5 text-xs"
                >
                  <div class="absolute -left-[7px] top-1 size-3 rounded-full bg-primary border-2 border-card"></div>
                  <div class="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                    <span>{{ event.date || event.eventDate || 'Milestone' }}</span>
                    <span v-if="event.time">· {{ event.time }}</span>
                  </div>
                  <p class="font-bold text-foreground text-xs mt-0.5">
                    {{ event.title || event.event }}
                  </p>
                  <p v-if="event.description" class="text-[11px] text-muted-foreground mt-0.5">
                    {{ event.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Narrative Particulars -->
          <div class="bg-card border border-border rounded-lg p-5 space-y-4">
            <h2 class="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-3">
              Reported Incident Narrative
            </h2>

            <div class="space-y-3 text-xs">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Transaction Purpose / Business Nature
                </span>
                <p class="font-semibold text-foreground text-sm mt-0.5">
                  {{ caseData.purposeOfTransaction || 'Not specified' }}
                </p>
              </div>

              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Full Disclosure Description
                </span>
                <div class="p-3 rounded bg-muted/30 border border-border mt-1 whitespace-pre-wrap leading-relaxed text-foreground font-mono text-xs">
                  {{ caseData.description }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Col: Evidence Vault & Audit Integrity -->
        <div class="space-y-6">
          <!-- Evidence Vault -->
          <div class="bg-card border border-border rounded-lg p-5 space-y-4">
            <div class="flex items-center justify-between border-b border-border pb-3">
              <h2 class="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <FileTextIcon class="size-4 text-primary" />
                Evidence Vault ({{ caseData.evidence?.length || 0 }})
              </h2>
              <span class="text-[10px] font-mono text-muted-foreground">
                Air-Gapped Stream
              </span>
            </div>

            <div v-if="!caseData.evidence || caseData.evidence.length === 0" class="text-xs text-muted-foreground py-6 text-center">
              No evidence exhibits submitted with this case.
            </div>

            <div v-else class="space-y-2.5">
              <div
                v-for="(item, idx) in caseData.evidence"
                :key="item.id"
                class="p-3 rounded border border-border bg-background text-xs space-y-2"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="px-1.5 py-0.2 rounded text-[10px] font-bold font-mono bg-primary/10 text-primary">
                      {{ item.fileType }}
                    </span>
                    <span class="font-bold text-foreground">Exhibit #{{ idx + 1 }}</span>
                  </div>
                  <span class="text-[10px] font-mono text-muted-foreground">
                    {{ formatDate(item.uploadedAt) }}
                  </span>
                </div>

                <div class="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-border hover:bg-muted text-foreground transition-colors cursor-pointer"
                    @click="handlePreviewEvidence(item, idx)"
                  >
                    <EyeIcon class="size-3" />
                    <span>Preview</span>
                  </button>

                  <button
                    type="button"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-primary text-white hover:bg-primary-700 transition-colors cursor-pointer"
                    @click="handleDownloadEvidence(item, idx)"
                  >
                    <DownloadIcon class="size-3" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Compliance & Integrity Card -->
          <div class="p-4 rounded-lg bg-muted/40 border border-border text-xs space-y-2">
            <div class="flex items-center gap-2 text-foreground font-bold">
              <ShieldCheckIcon class="size-4 text-emerald-600" />
              <span>Investigator Audit Trail</span>
            </div>
            <p class="text-[11px] text-muted-foreground leading-relaxed">
              In compliance with ISO 37002, any status update or case claim is permanently logged into the enterprise audit ledger. Whistleblower tracking PINs are never disclosed to staff.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- STATUS UPDATE MODAL DIALOG -->
    <div
      v-if="isStatusModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60"
    >
      <div class="bg-card border border-border rounded-xl shadow-lg max-w-lg w-full p-6 space-y-5">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <h3 class="text-sm font-bold text-foreground uppercase tracking-wider">
            Update Investigation Status &amp; Findings
          </h3>
          <button
            type="button"
            class="text-muted-foreground hover:text-foreground p-1 rounded cursor-pointer"
            @click="closeStatusModal"
          >
            <XIcon class="size-4" />
          </button>
        </div>

        <form @submit.prevent="submitStatusUpdate" class="space-y-4 text-xs">
          <!-- Status Selector -->
          <div class="space-y-1.5">
            <label class="font-semibold text-foreground">Target Investigation Status *</label>
            <select
              v-model="targetStatus"
              class="w-full h-9 px-3 rounded border border-border bg-card text-foreground focus:outline-none focus:border-primary cursor-pointer text-xs"
            >
              <option value="UNDER_INVESTIGATION">UNDER_INVESTIGATION (Active Investigation)</option>
              <option value="RESOLVED">RESOLVED (Findings Substantiated &amp; Action Taken)</option>
              <option value="CLOSED">CLOSED (Administrative Case Closure)</option>
              <option value="DISMISSED">DISMISSED (Unfounded / Insufficient Evidence)</option>
            </select>
          </div>

          <!-- Mandatory Note -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="font-semibold text-foreground">Mandatory Investigation Note *</label>
              <span class="text-[10px] text-muted-foreground font-mono">
                {{ statusNote.length }} / 2,000 max
              </span>
            </div>
            <textarea
              v-model="statusNote"
              rows="4"
              placeholder="Record forensic findings, interview summaries, or reasons for this status update..."
              class="w-full p-3 rounded border border-border bg-card text-foreground focus:outline-none focus:border-primary text-xs"
              required
            ></textarea>
            <p v-if="modalErrors.note" class="text-destructive text-[11px] font-semibold">
              {{ modalErrors.note }}
            </p>
          </div>

          <!-- Resolution Summary (Conditional) -->
          <div
            v-if="targetStatus === 'RESOLVED' || targetStatus === 'DISMISSED'"
            class="space-y-1.5 p-3 rounded bg-muted/40 border border-border"
          >
            <div class="flex items-center justify-between">
              <label class="font-bold text-foreground">
                Final Resolution Summary *
              </label>
              <span class="text-[10px] text-primary font-bold">REQUIRED FOR {{ targetStatus }}</span>
            </div>
            <p class="text-[11px] text-muted-foreground">
              Provide the executive summary of corrective actions, sanctions, or rationale for dismissal. This is archived into the corporate governance ledger.
            </p>
            <textarea
              v-model="resolutionSummary"
              rows="3"
              placeholder="Executive resolution summary..."
              class="w-full p-2.5 rounded border border-border bg-card text-foreground focus:outline-none focus:border-primary text-xs"
              required
            ></textarea>
            <p v-if="modalErrors.resolutionSummary" class="text-destructive text-[11px] font-semibold">
              {{ modalErrors.resolutionSummary }}
            </p>
          </div>

          <!-- Buttons -->
          <div class="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              :disabled="isUpdatingStatus"
              @click="closeStatusModal"
            >
              Cancel
            </AppButton>

            <AppButton
              type="submit"
              size="sm"
              :loading="isUpdatingStatus"
            >
              Submit &amp; Commit Update
            </AppButton>
          </div>
        </form>
      </div>
    </div>

    <!-- EVIDENCE PREVIEW MODAL -->
    <div
      v-if="isPreviewOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/70"
    >
      <div class="bg-card border border-border rounded-xl shadow-xl max-w-3xl w-full p-5 space-y-4 max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <span class="font-bold text-sm text-foreground">{{ previewFileName }}</span>
          <button
            type="button"
            class="text-muted-foreground hover:text-foreground p-1 rounded cursor-pointer"
            @click="closePreview"
          >
            <XIcon class="size-4" />
          </button>
        </div>

        <div class="flex-1 overflow-auto flex items-center justify-center min-h-[300px]">
          <div v-if="previewLoading" class="text-xs text-muted-foreground flex items-center gap-2">
            <span class="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
            <span>Streaming authenticated evidence...</span>
          </div>

          <img
            v-else-if="previewFileType === 'IMAGE' && previewUrl"
            :src="previewUrl"
            alt="Evidence preview"
            class="max-w-full max-h-[70vh] object-contain rounded border border-border"
          />

          <iframe
            v-else-if="previewFileType === 'PDF' && previewUrl"
            :src="previewUrl"
            class="w-full h-[70vh] rounded border border-border"
          ></iframe>
        </div>
      </div>
    </div>
  </div>
</template>
