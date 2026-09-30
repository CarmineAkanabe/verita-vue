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
} from '@/features/cases/types'
import { toast } from '@/plugins/toast'
import AppButton from '@/components/common/AppButton.vue'
import StatusPill from '@/components/common/StatusPill.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import AssignCaseModal from '@/components/complex/manager/AssignCaseModal.vue'
import { getCaseAuditLogs, type CaseAuditLog } from '@/features/cases/audit'
import { getDepartmentHeads } from '@/features/manager/api'
import type { DepartmentHeadUser } from '@/features/manager/types'
import {
  ArrowLeftIcon,
  CopyIcon,
  CheckIcon,
  FileTextIcon,
  DownloadIcon,
  EyeIcon,
  HandHelpingIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  MessageSquareIcon,
  SparklesIcon,
  ClockIcon,
  CalendarIcon,
  XIcon,
  HistoryIcon,
  GitCommitIcon,
  RefreshCwIcon,
  ShieldIcon,
  BotIcon,
  UserCheckIcon,
  BriefcaseIcon,
  ShieldAlertIcon,
} from '@lucide/vue'

const route = useRoute()
const auth = useAuthStore()

const isManager = computed(() => auth.user?.role === 'MANAGER')
const departmentHeads = ref<DepartmentHeadUser[]>([])
const isAssignModalOpen = ref(false)

const caseId = computed(() => route.params.id as string)
const isLoading = ref(true)
const error = ref<string | null>(null)
const caseData = ref<StaffCase | null>(null)
const copiedId = ref(false)

const assignedOfficerName = computed(() => {
  if (!caseData.value?.assignedTo) return 'Unassigned'
  const head = departmentHeads.value.find((h) => h.id === caseData.value?.assignedTo)
  if (head) {
    return [head.firstName, head.lastName].filter(Boolean).join(' ') || head.email
  }
  return 'Assigned Officer'
})

function handleCaseAssigned(payload: { caseId: string; departmentHeadId: string; departmentHeadName: string }) {
  if (caseData.value) {
    caseData.value.assignedTo = payload.departmentHeadId
    caseData.value.status = 'UNDER_INVESTIGATION'
  }
  fetchAuditLogs()
}

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

// Audit logs
const auditLogs = ref<CaseAuditLog[]>([])
const isLoadingAudit = ref(false)
const auditError = ref<string | null>(null)

async function fetchAuditLogs() {
  if (!caseId.value) return
  isLoadingAudit.value = true
  auditError.value = null
  try {
    auditLogs.value = await getCaseAuditLogs(caseId.value)
  } catch (err: any) {
    auditError.value = err?.message || 'Failed to load case audit history.'
  } finally {
    isLoadingAudit.value = false
  }
}

function formatAuditAction(action: string): string {
  switch (action) {
    case 'STATUS_CHANGED':
      return 'Status Updated'
    case 'AI_PROCESSED':
      return 'AI Assessment Completed'
    case 'EVIDENCE_REVIEWED':
      return 'Evidence File Inspected'
    case 'EVIDENCE_ADDED':
      return 'Evidence File Uploaded'
    case 'MESSAGE_SENT':
      return 'Consultation Message Sent'
    case 'ESCALATED':
      return 'Case Escalated to Manager'
    default:
      return action.replaceAll('_', ' ')
  }
}

function getActorBadge(actorType: string) {
  switch (actorType) {
    case 'DEPARTMENT_HEAD':
      return { label: 'Department Head', class: 'bg-[#22293A] text-white border-[#22293A]', icon: UserCheckIcon }
    case 'AI':
      return { label: 'AI Intelligence Engine', class: 'bg-purple-100 text-purple-800 border-purple-300', icon: BotIcon }
    default:
      return { label: 'System Automation', class: 'bg-slate-100 text-slate-700 border-slate-300', icon: ShieldIcon }
  }
}

async function fetchCase() {
  isLoading.value = true
  error.value = null

  try {
    const promises: Promise<any>[] = [getStaffCaseDetail(caseId.value)]
    if (isManager.value) {
      promises.push(getDepartmentHeads())
    }

    const results = await Promise.allSettled(promises)
    if (results[0].status === 'fulfilled') {
      caseData.value = results[0].value
      targetStatus.value = results[0].value.status
      fetchAuditLogs()
    } else {
      throw results[0].reason
    }

    if (isManager.value && results[1] && results[1].status === 'fulfilled') {
      departmentHeads.value = results[1].value
    }
  } catch (err: any) {
    error.value = err?.message || 'Failed to retrieve case details.'
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
    toast.success('Case successfully claimed. Status transitioned to Investigation.')
    fetchAuditLogs()
  } catch (err: any) {
    toast.error(err?.message || 'Failed to claim case. It may have already been claimed by another officer.')
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
    modalErrors.value.note = 'Investigation note is required for any status update.'
    return
  }

  if (statusNote.value.length > 2000) {
    modalErrors.value.note = 'Investigation note must not exceed 2,000 characters.'
    return
  }

  if ((targetStatus.value === 'RESOLVED' || targetStatus.value === 'DISMISSED') && !resolutionSummary.value.trim()) {
    modalErrors.value.resolutionSummary = `Resolution summary is required when marking a case as ${targetStatus.value}.`
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

    toast.success(`Case status successfully updated to ${targetStatus.value}.`)
    closeStatusModal()
    fetchAuditLogs()
  } catch (err: any) {
    toast.error(err?.message || 'Failed to update case status.')
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

function copyQuestion(text: string) {
  navigator.clipboard.writeText(text)
  toast.success('Investigation question copied.')
}

const structuredFindings = computed<{
  discrepancies: string[]
  completeness: string[]
  clarifications: string[]
  totalCount: number
}>(() => {
  const result = {
    discrepancies: [] as string[],
    completeness: [] as string[],
    clarifications: [] as string[],
    totalCount: 0,
  }
  if (!caseData.value?.aiFindings) return result

  let raw: any = caseData.value.aiFindings
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw)
    } catch {
      result.discrepancies.push(String(raw))
      result.totalCount = 1
      return result
    }
  }

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    // 1. Consistency / Discrepancies
    if (Array.isArray(raw.consistency)) {
      result.discrepancies.push(...raw.consistency.map(String).filter(Boolean))
    } else if (raw.consistency && typeof raw.consistency === 'object') {
      for (const [k, v] of Object.entries(raw.consistency)) {
        if (typeof v === 'string') {
          result.discrepancies.push(v)
        } else if (v === false) {
          result.discrepancies.push(`Discrepancy identified in ${k.replace(/_/g, ' ')}`)
        }
      }
    }

    // 2. Completeness / Gaps
    if (Array.isArray(raw.completeness)) {
      result.completeness.push(...raw.completeness.map(String).filter(Boolean))
    } else if (raw.completeness && typeof raw.completeness === 'object') {
      for (const [k, v] of Object.entries(raw.completeness)) {
        if (typeof v === 'string') {
          result.completeness.push(v)
        } else if (v === false) {
          result.completeness.push(`Missing verification for ${k.replace(/_/g, ' ')}`)
        }
      }
    }

    // 3. Clarifications / Recommended inquiry questions
    const cl = raw.clarifications || raw.clarification
    if (Array.isArray(cl)) {
      result.clarifications.push(...cl.map(String).filter(Boolean))
    } else if (typeof cl === 'string') {
      result.clarifications.push(cl)
    }
  } else if (Array.isArray(raw)) {
    result.discrepancies.push(...raw.map(String).filter(Boolean))
  }

  result.totalCount =
    result.discrepancies.length +
    result.completeness.length +
    result.clarifications.length

  return result
})

interface NormalizedTimelineItem {
  date: string
  time?: string
  event: string
  description?: string
  source?: 'ai' | 'milestone'
}

const parsedTimeline = computed<NormalizedTimelineItem[]>(() => {
  const items: NormalizedTimelineItem[] = []

  let raw: any = caseData.value?.aiTimeline
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw)
    } catch {
      raw = null
    }
  }

  if (Array.isArray(raw) && raw.length > 0) {
    for (const entry of (raw as any[])) {
      if (typeof entry === 'string') {
        const colonIdx = entry.indexOf(':')
        if (colonIdx > 0 && colonIdx < 25) {
          items.push({
            date: entry.slice(0, colonIdx).trim(),
            event: entry.slice(colonIdx + 1).trim(),
            source: 'ai',
          })
        } else {
          items.push({
            date: 'Milestone',
            event: entry,
            source: 'ai',
          })
        }
      } else if (entry && typeof entry === 'object') {
        items.push({
          date: entry.date || entry.eventDate || 'Milestone',
          time: entry.time || '',
          event: entry.event || entry.title || 'Case Event',
          description: entry.description || entry.detail || '',
          source: 'ai',
        })
      }
    }
  }

  // Baseline timeline synthesis: if no AI timeline exists, synthesize from case timestamps
  if (items.length === 0 && caseData.value) {
    if (caseData.value.transactionDate) {
      items.push({
        date: formatDate(caseData.value.transactionDate),
        event: 'Incident Date',
        description: `Incident occurred: ${caseData.value.purposeOfTransaction || 'Reported transaction'} (${formatAmount(caseData.value.amountInvolved)}).`,
        source: 'milestone',
      })
    }

    if (caseData.value.evidence && caseData.value.evidence.length > 0) {
      items.push({
        date: formatDate(caseData.value.createdAt),
        event: 'Evidence Attached',
        description: `${caseData.value.evidence.length} file(s) attached and preserved for forensic review.`,
        source: 'milestone',
      })
    }

    if (caseData.value.createdAt) {
      items.push({
        date: formatDate(caseData.value.createdAt),
        event: 'Confidential Case Intake',
        description: 'Case registered anonymously. Intake verified.',
        source: 'milestone',
      })
    }

    if (caseData.value.assignedTo) {
      items.push({
        date: 'Active',
        event: 'Investigation In Progress',
        description: 'Assigned to Department Head for examination and consultation.',
        source: 'milestone',
      })
    }
  }

  return items
})

onMounted(() => {
  fetchCase()
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Back & Header Bar -->
    <div class="p-4 sm:p-5 rounded-2xl bg-[#FFFDF8] border border-[#EADBCE] shadow-xs space-y-3">
      <div class="flex items-center justify-between">
        <router-link to="/app/cases"
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#22293A] transition-colors">
          <ArrowLeftIcon class="size-4" />
          <span>Back to Cases</span>
        </router-link>

        <div class="flex items-center gap-2 flex-wrap">
          <span v-if="isManager"
            class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#A2561B]/10 text-[#A2561B] border border-[#A2561B]/20">
            Manager View · Case Summary
          </span>
          <span v-if="caseData?.concernsDepartmentHead"
            class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5]">
            Department Head Bypassed
          </span>
        </div>
      </div>

      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-xl sm:text-2xl font-bold text-[#22293A] font-mono tracking-tight">
              Case #{{ caseId.slice(0, 14) }}...
            </h1>
            <button type="button"
              class="p-1 rounded hover:bg-[#FAF7F2] text-[#6B7280] hover:text-[#22293A] cursor-pointer"
              title="Copy Full Case ID" @click="copyCaseId">
              <CheckIcon v-if="copiedId" class="size-4 text-emerald-600" />
              <CopyIcon v-else class="size-4" />
            </button>
            <StatusPill v-if="caseData" :status="caseData.status" />
          </div>
          <p class="text-xs text-[#6B7280] mt-1">
            Submitted on <strong class="text-[#22293A]">{{ formatDate(caseData?.createdAt || caseData?.transactionDate)
            }}</strong>
            · Category: <span class="font-bold text-[#A2561B]">{{ caseData?.category }}</span>
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <!-- Manager: Assign Case Button (when unassigned) -->
          <AppButton v-if="isManager && !caseData?.assignedTo && caseData?.status === 'AWAITING_REVIEW'" size="sm" @click="isAssignModalOpen = true">
            <UserCheckIcon class="size-4 mr-1.5" />
            Assign Case
          </AppButton>

          <!-- Claim Button (department head only, if unclaimed) -->
          <AppButton v-if="!isManager && isEligibleToClaim" size="sm" :loading="isClaiming" @click="handleClaim">
            <HandHelpingIcon class="size-4 mr-1.5" />
            Claim Case
          </AppButton>

          <!-- Update Status Button (assigned department head only) -->
          <AppButton v-if="!isManager && isAssignedToMe" variant="outline" size="sm" @click="openStatusModal">
            <CheckCircle2Icon class="size-4 mr-1.5" />
            Update Status
          </AppButton>

          <!-- Consultation Channel Link (Department Head only - strictly hidden for Manager) -->
          <router-link v-if="!isManager" :to="`/app/cases/${caseData?.id}/chat`"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#A2561B] text-white hover:bg-[#854310] transition-colors shadow-xs">
            <MessageSquareIcon class="size-3.5" />
            <span>Open Case Chat</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Error Banner -->
    <ErrorBanner v-if="error" :message="error" @retry="fetchCase" />

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="space-y-6 animate-pulse">
      <div class="h-44 bg-muted/40 rounded-xl border border-border"></div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 h-72 bg-muted/40 rounded-xl border border-border"></div>
        <div class="h-72 bg-muted/40 rounded-xl border border-border"></div>
      </div>
    </div>

    <!-- Loaded Case Details -->
    <div v-else-if="caseData" class="space-y-6">

      <!-- ========================================================================= -->
      <!-- BRANCH 1: MANAGER EXECUTIVE VIEW (METADATA & WORKING OFFICER ONLY)        -->
      <!-- ========================================================================= -->
      <template v-if="isManager">
        <!-- Privacy Safeguard Notice -->
        <div class="p-4 rounded-xl bg-[#FCF4EE] border border-[#A2561B]/20 text-xs text-[#A2561B] flex items-start gap-3 shadow-xs">
          <ShieldAlertIcon class="size-4 shrink-0 mt-0.5" />
          <div class="space-y-1">
            <p class="font-bold">Manager Privacy Safeguard Active</p>
            <p class="text-[11px] text-[#6B7280] leading-relaxed">
              To protect the Case Reporter's privacy, Managers view case overview details and assigned staff only. Full statements, evidence files, and case chat are handled directly by the Department Head.
            </p>
          </div>
        </div>

        <!-- Resolution Summary Banner (if resolved/dismissed) -->
        <div v-if="caseData.resolutionSummary"
          class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
          <div class="flex items-center gap-2 text-emerald-800 font-bold uppercase tracking-wider text-[10px]">
            <CheckCircle2Icon class="size-3.5" />
            <span>Case Resolution Summary</span>
            <span v-if="caseData.resolvedAt" class="font-mono text-[#6B7280]">({{ formatDate(caseData.resolvedAt) }})</span>
          </div>
          <p class="text-xs text-[#22293A] font-medium leading-relaxed">
            {{ caseData.resolutionSummary }}
          </p>
        </div>

        <!-- Case Details Card (Creamy Card) -->
        <div class="p-6 rounded-2xl bg-[#FFFDF8] border border-[#EADBCE] shadow-xs space-y-5">
          <div class="flex items-center justify-between border-b border-[#EADBCE] pb-3">
            <div class="flex items-center gap-2">
              <BriefcaseIcon class="size-4 text-[#A2561B]" />
              <h2 class="text-xs font-bold uppercase tracking-wider text-[#22293A]">
                Case Details
              </h2>
            </div>
            <span class="text-[11px] font-mono text-[#6B7280]">
              Case Record
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <!-- Reference ID -->
            <div class="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EADBCE]">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Case Reference</span>
              <p class="font-mono font-bold text-[#22293A] text-sm mt-1 truncate" :title="caseData.id">
                {{ caseData.id }}
              </p>
            </div>

            <!-- Date -->
            <div class="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EADBCE]">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Incident Date</span>
              <p class="font-mono font-bold text-[#22293A] text-sm mt-1">
                {{ formatDate(caseData.transactionDate || caseData.createdAt) }}
              </p>
            </div>

            <!-- Category -->
            <div class="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EADBCE]">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Category &amp; Scope</span>
              <p class="font-bold text-[#A2561B] text-sm mt-1">
                {{ caseData.category }}
              </p>
            </div>

            <!-- Disputed Amount -->
            <div class="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EADBCE]">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Disputed Amount</span>
              <p class="font-mono font-extrabold text-[#A2561B] text-base mt-1">
                {{ formatAmount(caseData.amountInvolved) }}
              </p>
            </div>

            <!-- Person Involved -->
            <div class="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EADBCE]">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Person / Unit Cited</span>
              <p class="font-bold text-[#22293A] text-sm mt-1 truncate" :title="caseData.personInvolved">
                {{ caseData.personInvolved || 'Unspecified' }}
              </p>
            </div>

            <!-- Purpose of Transaction -->
            <div class="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EADBCE]">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Report Purpose / Label</span>
              <p class="font-bold text-[#22293A] text-sm mt-1 truncate" :title="caseData.purposeOfTransaction">
                {{ caseData.purposeOfTransaction || 'General Incident Disclosure' }}
              </p>
            </div>

            <!-- Working Officer -->
            <div class="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EADBCE] sm:col-span-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Assigned Working Officer</span>
              <div class="flex items-center justify-between gap-2 mt-1">
                <div class="flex items-center gap-2">
                  <UserCheckIcon v-if="caseData.assignedTo" class="size-4 text-emerald-600 shrink-0" />
                  <ClockIcon v-else class="size-4 text-amber-500 shrink-0" />
                  <span class="font-bold text-[#22293A] text-sm">
                    {{ assignedOfficerName }}
                  </span>
                </div>
                <button
                  v-if="!caseData.assignedTo && caseData.status === 'AWAITING_REVIEW'"
                  type="button"
                  class="px-2.5 py-1 rounded text-xs font-semibold bg-primary text-white hover:bg-primary-700 transition-colors cursor-pointer"
                  @click="isAssignModalOpen = true"
                >
                  Assign Officer
                </button>
              </div>
            </div>

            <!-- Status & Flags -->
            <div class="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EADBCE]">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Status &amp; Flags</span>
              <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <StatusPill :status="caseData.status" />
                <span v-if="caseData.concernsDepartmentHead"
                  class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-destructive/15 text-destructive border border-destructive/20 flex items-center gap-1"
                  title="Conflict: Concerns Department Head">
                  <AlertTriangleIcon class="size-3" />
                  Conflict Flag
                </span>
                <span v-if="caseData.escalatedAt"
                  class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-800 border border-amber-500/20"
                  title="Escalated to Manager">
                  Escalated
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ========================================================================= -->
      <!-- BRANCH 2: DEPARTMENT HEAD FULL INVESTIGATION VIEW                         -->
      <!-- ========================================================================= -->
      <template v-else>
        <!-- Resolution Summary Banner (if resolved/dismissed) -->
        <div v-if="caseData.resolutionSummary"
          class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
          <div class="flex items-center gap-2 text-emerald-800 font-bold uppercase tracking-wider text-[10px]">
            <CheckCircle2Icon class="size-3.5" />
            <span>Case Resolution Summary</span>
            <span v-if="caseData.resolvedAt" class="font-mono text-[#6B7280]">({{ formatDate(caseData.resolvedAt)
            }})</span>
          </div>
          <p class="text-xs text-[#22293A] font-medium leading-relaxed">
            {{ caseData.resolutionSummary }}
          </p>
        </div>

        <!-- Quick Metrics Grid (Creamy Cards) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Amount Involved -->
          <div class="p-4 rounded-xl bg-[#FFFDF8] border border-[#EADBCE] shadow-xs">
            <span class="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
              Amount Involved
            </span>
            <p class="text-xl font-extrabold text-[#A2561B] font-mono mt-1">
              {{ formatAmount(caseData.amountInvolved) }}
            </p>
          </div>

          <!-- Person / Unit Involved -->
          <div class="p-4 rounded-xl bg-[#FFFDF8] border border-[#EADBCE] shadow-xs">
            <span class="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
              Person / Unit Involved
            </span>
            <p class="text-sm font-bold text-[#22293A] truncate mt-1" :title="caseData.personInvolved">
              {{ caseData.personInvolved || 'Unspecified' }}
            </p>
          </div>

          <!-- Date of Incident -->
          <div class="p-4 rounded-xl bg-[#FFFDF8] border border-[#EADBCE] shadow-xs">
            <span class="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
              Date of Incident
            </span>
            <p class="text-sm font-bold text-[#22293A] font-mono mt-1">
              {{ caseData.transactionDate || 'Not specified' }}
            </p>
          </div>

          <!-- Assigned Officer -->
          <div class="p-4 rounded-xl bg-[#FFFDF8] border border-[#EADBCE] shadow-xs">
            <span class="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
              Assigned Officer
            </span>
            <p class="text-sm font-bold text-[#22293A] mt-1">
              {{ isAssignedToMe ? 'Assigned to You' : caseData.assignedTo ? 'Assigned to Staff' : 'Unclaimed' }}
            </p>
          </div>
        </div>

      <!-- PREMIER HERO SECTION: AI Case Analysis -->
      <div
        class="p-6 rounded-2xl bg-gradient-to-br from-[#FAF6FF] via-[#F8F3EA] to-[#F8F3EA] border-2 border-[#DDD6FE] shadow-xs space-y-6">
        <div class="flex items-center justify-between border-b border-[#E2D5C3] pb-3">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-lg bg-[#8B5CF6]/15 text-[#7C3AED]">
              <SparklesIcon class="size-5" />
            </div>
            <div>
              <h2 class="text-base font-bold text-[#22293A]">
                AI Case Analysis &amp; Findings
              </h2>
              <p class="text-xs text-[#6B7280]">
                Automated summary, verified risk indicators, and incident chronology
              </p>
            </div>
          </div>
          <span
            class="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE]">
            AI Generated
          </span>
        </div>

        <!-- AI Executive Summary -->
        <div v-if="caseData.aiSummary" class="space-y-2">
          <h3 class="text-xs font-bold text-[#4B5563] uppercase tracking-wider">
            Incident Summary
          </h3>
          <p
            class="text-xs text-[#22293A] leading-relaxed bg-[#F8F3EA] p-4 rounded-xl border border-[#E2D5C3] shadow-xs">
            {{ caseData.aiSummary }}
          </p>
        </div>
        <div v-else class="text-xs text-[#6B7280] italic py-2">
          AI analysis is pending or processing for this case.
        </div>

        <!-- Structured Key Findings & Red Flags -->
        <div v-if="structuredFindings.totalCount > 0" class="space-y-4 pt-1">
          <!-- 1. Factual Discrepancies & Contradictions -->
          <div v-if="structuredFindings.discrepancies.length > 0" class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="text-[11px] font-bold text-[#BE123C] uppercase tracking-wider">
                Factual Inconsistencies &amp; Contradictions ({{ structuredFindings.discrepancies.length }})
              </span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div v-for="(item, idx) in structuredFindings.discrepancies" :key="'disc-' + idx"
                class="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-xs text-[#881337] flex items-start gap-2.5 shadow-xs">
                <AlertTriangleIcon class="size-4 text-[#E11D48] shrink-0 mt-0.5" />
                <span class="leading-relaxed font-medium">{{ item }}</span>
              </div>
            </div>
          </div>

          <!-- 2. Documentation & Completeness Gaps -->
          <div v-if="structuredFindings.completeness.length > 0" class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="text-[11px] font-bold text-[#B45309] uppercase tracking-wider">
                Documentation &amp; Verification Gaps ({{ structuredFindings.completeness.length }})
              </span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div v-for="(item, idx) in structuredFindings.completeness" :key="'comp-' + idx"
                class="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] flex items-start gap-2.5 shadow-xs">
                <FileTextIcon class="size-4 text-[#D97706] shrink-0 mt-0.5" />
                <span class="leading-relaxed font-medium">{{ item }}</span>
              </div>
            </div>
          </div>

          <!-- 3. Recommended Investigation Clarifications -->
          <div v-if="structuredFindings.clarifications.length > 0" class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-[#4338CA] uppercase tracking-wider">
                Recommended Inquiries for Case Reporter ({{ structuredFindings.clarifications.length }})
              </span>
              <span class="text-[10px] text-[#6B7280]">Click icon to copy question</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div v-for="(item, idx) in structuredFindings.clarifications" :key="'clar-' + idx"
                class="p-3.5 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] text-xs text-[#312E81] flex items-start justify-between gap-2.5 shadow-xs group">
                <div class="flex items-start gap-2">
                  <MessageSquareIcon class="size-4 text-[#4F46E5] shrink-0 mt-0.5" />
                  <span class="leading-relaxed">{{ item }}</span>
                </div>
                <button type="button"
                  class="shrink-0 p-1 rounded hover:bg-[#E0E7FF] text-[#4F46E5] opacity-75 hover:opacity-100 cursor-pointer"
                  title="Copy question" @click="copyQuestion(item)">
                  <CopyIcon class="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Comprehensive Incident Timeline Component -->
        <div v-if="parsedTimeline.length > 0" class="space-y-3 pt-3 border-t border-[#E2D5C3]">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <ClockIcon class="size-4 text-[#A2561B]" />
              <h3 class="text-xs font-bold text-[#22293A] uppercase tracking-wider">
                Incident Chronology &amp; Timeline ({{ parsedTimeline.length }} Milestones)
              </h3>
            </div>
            <span class="text-[10px] text-[#6B7280] font-medium">Reconstructed from statements and evidence</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div v-for="(event, eIdx) in parsedTimeline" :key="eIdx"
              class="p-3.5 rounded-xl bg-[#F8F3EA] border border-[#E2D5C3] shadow-xs flex flex-col justify-between space-y-2 hover:border-[#A2561B]/60 transition-colors">
              <div>
                <div class="flex items-center justify-between gap-1 mb-1.5">
                  <span
                    class="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E2D5C3] text-[#A2561B]">
                    <CalendarIcon class="size-3" />
                    {{ event.date }}
                  </span>
                  <span v-if="event.time" class="font-mono text-[10px] text-[#6B7280]">
                    {{ event.time }}
                  </span>
                </div>
                <h4 class="font-bold text-[#22293A] text-xs leading-snug">
                  {{ event.event }}
                </h4>
              </div>
              <p v-if="event.description"
                class="text-[11px] text-[#6B7280] leading-relaxed pt-1.5 border-t border-[#E2D5C3]/70">
                {{ event.description }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Narrative Particulars & Evidence Files (2 Columns) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Incident Narrative Details (2 cols) -->
        <div class="lg:col-span-2 space-y-6">
          <div class="p-6 rounded-2xl bg-[#F8F3EA] border border-[#E2D5C3] shadow-xs space-y-4">
            <h2 class="text-sm font-bold text-[#22293A] uppercase tracking-wider border-b border-[#E2D5C3] pb-3">
              Report Details &amp; Narrative
            </h2>

            <div class="space-y-4 text-xs">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                  Transaction Nature / Purpose
                </span>
                <p class="font-bold text-[#22293A] text-sm mt-0.5">
                  {{ caseData.purposeOfTransaction || 'Not specified' }}
                </p>
              </div>

              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                  Full Description
                </span>
                <div
                  class="p-3.5 rounded-xl bg-[#F2EAE0] border border-[#E2D5C3] mt-1 whitespace-pre-wrap leading-relaxed text-[#22293A] font-sans text-xs">
                  {{ caseData.description }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Attached Files (1 col) -->
        <div class="space-y-6">
          <div class="p-6 rounded-2xl bg-[#F8F3EA] border border-[#E2D5C3] shadow-xs space-y-4">
            <div class="flex items-center justify-between border-b border-[#E2D5C3] pb-3">
              <h2 class="text-xs font-bold uppercase tracking-wider text-[#22293A] flex items-center gap-2">
                <FileTextIcon class="size-4 text-[#A2561B]" />
                Attached Files ({{ caseData.evidence?.length || 0 }})
              </h2>
            </div>

            <div v-if="!caseData.evidence || caseData.evidence.length === 0"
              class="text-xs text-[#6B7280] py-6 text-center">
              No files were attached with this case.
            </div>

            <div v-else class="space-y-2.5">
              <div v-for="(item, idx) in caseData.evidence" :key="item.id"
                class="p-3 rounded-xl border border-[#E2D5C3] bg-[#F2EAE0] text-xs space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-[#A2561B]/10 text-[#A2561B]">
                      {{ item.fileType }}
                    </span>
                    <span class="font-bold text-[#22293A]">File #{{ idx + 1 }}</span>
                  </div>
                  <span class="text-[10px] font-mono text-[#6B7280]">
                    {{ formatDate(item.uploadedAt) }}
                  </span>
                </div>

                <div class="flex items-center justify-end gap-2 pt-1">
                  <button type="button"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-[#EADBCE] bg-white hover:bg-[#F6F7F9] text-[#22293A] transition-colors cursor-pointer"
                    @click="handlePreviewEvidence(item, idx)">
                    <EyeIcon class="size-3" />
                    <span>Preview</span>
                  </button>

                  <button type="button"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-[#A2561B] text-white hover:bg-[#854310] transition-colors cursor-pointer"
                    @click="handleDownloadEvidence(item, idx)">
                    <DownloadIcon class="size-3" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </template>

      <!-- CASE HISTORY & IMMUTABLE AUDIT TRAIL -->
      <div class="p-6 rounded-2xl bg-[#F8F3EA] border border-[#E2D5C3] shadow-xs space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2D5C3] pb-4">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-lg bg-[#A2561B]/15 text-[#A2561B]">
              <HistoryIcon class="size-5" />
            </div>
            <div>
              <h2 class="text-base font-bold text-[#22293A]">
                Case History &amp; Immutable Audit Trail
              </h2>
              <p class="text-xs text-[#6B7280]">
                Chronological record of status updates, forensic notes, AI evaluations, and evidence interactions
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white border border-[#E2D5C3] text-[#6B7280]">
              ISO 37002 Compliant Ledger
            </span>
            <button type="button"
              class="p-1.5 rounded-lg border border-[#E2D5C3] bg-white text-[#22293A] hover:bg-[#F2EAE0] transition-colors cursor-pointer text-xs flex items-center gap-1"
              :disabled="isLoadingAudit" @click="fetchAuditLogs">
              <RefreshCwIcon class="size-3.5" :class="{ 'animate-spin': isLoadingAudit }" />
              <span class="hidden sm:inline font-semibold">Refresh Trail</span>
            </button>
          </div>
        </div>

        <!-- Audit Loading State -->
        <div v-if="isLoadingAudit" class="space-y-4 py-4">
          <div v-for="i in 3" :key="i" class="flex gap-4 animate-pulse">
            <div class="size-8 rounded-full bg-[#E2D5C3]"></div>
            <div class="flex-1 space-y-2">
              <div class="h-3 w-48 bg-[#E2D5C3] rounded"></div>
              <div class="h-2 w-full max-w-sm bg-[#E2D5C3]/60 rounded"></div>
            </div>
          </div>
        </div>

        <!-- Audit Error State -->
        <div v-else-if="auditError"
          class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
          <span>{{ auditError }}</span>
          <button type="button" class="font-bold underline" @click="fetchAuditLogs">Retry</button>
        </div>

        <!-- Audit Empty State -->
        <div v-else-if="auditLogs.length === 0"
          class="text-xs text-[#6B7280] py-8 text-center bg-white/50 rounded-xl border border-dashed border-[#E2D5C3]">
          No audit entries recorded yet for this case.
        </div>

        <!-- Audit Timeline List -->
        <div v-else
          class="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2D5C3]">
          <div v-for="(log, idx) in auditLogs" :key="log.id || idx" class="relative group">
            <!-- Timeline dot -->
            <div
              class="absolute -left-6 sm:-left-8 top-1.5 size-6 rounded-full bg-white border-2 border-[#A2561B] flex items-center justify-center text-[#A2561B] shadow-2xs group-hover:scale-110 transition-transform">
              <GitCommitIcon class="size-3" />
            </div>

            <div class="p-4 rounded-xl bg-[#FFFDF8] border border-[#EADBCE] shadow-2xs space-y-2 card-hover-lift">
              <div
                class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#F2EAE0] pb-2">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs font-bold text-[#22293A]">
                    {{ formatAuditAction(log.action) }}
                  </span>
                  <!-- Actor Pill -->
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                    :class="getActorBadge(log.actorType).class">
                    <component :is="getActorBadge(log.actorType).icon" class="size-2.5" />
                    {{ getActorBadge(log.actorType).label }}
                  </span>
                </div>
                <span class="text-[10px] font-mono text-[#6B7280] flex items-center gap-1">
                  <ClockIcon class="size-3" />
                  {{ formatDate(log.loggedAt) }}
                </span>
              </div>

              <!-- Status transition detail -->
              <div v-if="log.action === 'STATUS_CHANGED' && (log.previousValue || log.newValue)"
                class="flex items-center gap-2 text-xs pt-1">
                <span v-if="log.previousValue"
                  class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                  {{ log.previousValue }}
                </span>
                <span v-if="log.previousValue" class="text-slate-400">&rarr;</span>
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {{ log.newValue || 'CURRENT' }}
                </span>
              </div>

              <!-- Forensic note -->
              <div v-if="log.note"
                class="p-3 rounded-lg bg-[#F8F3EA] border border-[#E2D5C3] text-xs text-[#22293A] italic leading-relaxed">
                &ldquo;{{ log.note }}&rdquo;
              </div>

              <!-- File ref or other metadata -->
              <div v-else-if="log.newValue && log.action !== 'STATUS_CHANGED'"
                class="text-[11px] font-mono text-[#6B7280]">
                Reference Identifier: {{ log.newValue }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- STATUS UPDATE MODAL DIALOG -->
    <div v-if="isStatusModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60">
      <div class="bg-card border border-border rounded-xl shadow-lg max-w-lg w-full p-6 space-y-5">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <h3 class="text-sm font-bold text-foreground uppercase tracking-wider">
            Update Investigation Status &amp; Findings
          </h3>
          <button type="button" class="text-muted-foreground hover:text-foreground p-1 rounded cursor-pointer"
            @click="closeStatusModal">
            <XIcon class="size-4" />
          </button>
        </div>

        <form @submit.prevent="submitStatusUpdate" class="space-y-4 text-xs">
          <!-- Status Selector -->
          <div class="space-y-1.5">
            <label class="font-semibold text-foreground">Target Investigation Status *</label>
            <select v-model="targetStatus"
              class="w-full h-9 px-3 rounded border border-border bg-card text-foreground focus:outline-none focus:border-primary cursor-pointer text-xs">
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
            <textarea v-model="statusNote" rows="4"
              placeholder="Record forensic findings, interview summaries, or reasons for this status update..."
              class="w-full p-3 rounded border border-border bg-card text-foreground focus:outline-none focus:border-primary text-xs"
              required></textarea>
            <p v-if="modalErrors.note" class="text-destructive text-[11px] font-semibold">
              {{ modalErrors.note }}
            </p>
          </div>

          <!-- Resolution Summary (Conditional) -->
          <div v-if="targetStatus === 'RESOLVED' || targetStatus === 'DISMISSED'"
            class="space-y-1.5 p-3 rounded bg-muted/40 border border-border">
            <div class="flex items-center justify-between">
              <label class="font-bold text-foreground">
                Final Resolution Summary *
              </label>
              <span class="text-[10px] text-primary font-bold">REQUIRED FOR {{ targetStatus }}</span>
            </div>
            <p class="text-[11px] text-muted-foreground">
              Provide a clear summary of corrective actions, sanctions, or reasons for resolution.
            </p>
            <textarea v-model="resolutionSummary" rows="3" placeholder="Describe the resolution or outcome..."
              class="w-full p-2.5 rounded border border-border bg-card text-foreground focus:outline-none focus:border-primary text-xs"
              required></textarea>
            <p v-if="modalErrors.resolutionSummary" class="text-destructive text-[11px] font-semibold">
              {{ modalErrors.resolutionSummary }}
            </p>
          </div>

          <!-- Buttons -->
          <div class="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <AppButton type="button" variant="outline" size="sm" :disabled="isUpdatingStatus" @click="closeStatusModal">
              Cancel
            </AppButton>

            <AppButton type="submit" size="sm" :loading="isUpdatingStatus">
              Submit &amp; Commit Update
            </AppButton>
          </div>
        </form>
      </div>
    </div>

    <!-- EVIDENCE PREVIEW MODAL -->
    <div v-if="isPreviewOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/70">
      <div
        class="bg-card border border-border rounded-xl shadow-xl max-w-3xl w-full p-5 space-y-4 max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <span class="font-bold text-sm text-foreground">{{ previewFileName }}</span>
          <button type="button" class="text-muted-foreground hover:text-foreground p-1 rounded cursor-pointer"
            @click="closePreview">
            <XIcon class="size-4" />
          </button>
        </div>

        <div class="flex-1 overflow-auto flex items-center justify-center min-h-[300px]">
          <div v-if="previewLoading" class="text-xs text-muted-foreground flex items-center gap-2">
            <span class="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
            <span>Streaming authenticated evidence...</span>
          </div>

          <img v-else-if="previewFileType === 'IMAGE' && previewUrl" :src="previewUrl" alt="Evidence preview"
            class="max-w-full max-h-[70vh] object-contain rounded border border-border" />

          <iframe v-else-if="previewFileType === 'PDF' && previewUrl" :src="previewUrl"
            class="w-full h-[70vh] rounded border border-border"></iframe>
        </div>
      </div>
    </div>

    <!-- ASSIGN CASE MODAL (FOR MANAGERS) -->
    <AssignCaseModal
      :is-open="isAssignModalOpen"
      :case-item="caseData"
      :department-heads="departmentHeads"
      @close="isAssignModalOpen = false"
      @assigned="handleCaseAssigned"
    />
  </div>
</template>
