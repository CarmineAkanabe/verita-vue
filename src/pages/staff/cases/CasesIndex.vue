<!-- pages/staff/cases/CasesIndex.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import { getStaffCasesQueue, claimCase } from '@/features/cases/api'
import { getDepartmentHeads } from '@/features/manager/api'
import { getAllAuditLogs, type CaseAuditLog } from '@/features/cases/audit'
import type { StaffCase } from '@/features/cases/types'
import type { DepartmentHeadUser } from '@/features/manager/types'
import { toast } from '@/plugins/toast'
import AppButton from '@/components/common/AppButton.vue'
import StatusPill from '@/components/common/StatusPill.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AssignCaseModal from '@/components/complex/manager/AssignCaseModal.vue'
import {
  BriefcaseIcon,
  RefreshCwIcon,
  SearchIcon,
  CopyIcon,
  CheckIcon,
  ArrowRightIcon,
  ShieldAlertIcon,
  AlertTriangleIcon,
  ClockIcon,
  HistoryIcon,
  HandHelpingIcon,
  UserCheckIcon,
} from '@lucide/vue'

const router = useRouter()
const auth = useAuthStore()

const isManager = computed(() => auth.user?.role === 'MANAGER')

type TabKey = 'QUEUE' | 'CLAIMED' | 'AWAITING_ASSIGNMENT' | 'ALL_CASES' | 'AUDIT_LOG'

const activeTab = ref<TabKey>('QUEUE')
const isLoading = ref(true)
const isClaimingId = ref<string | null>(null)
const error = ref<string | null>(null)
const cases = ref<StaffCase[]>([])
const departmentHeads = ref<DepartmentHeadUser[]>([])
const copiedId = ref<string | null>(null)
const searchQuery = ref('')
const selectedCategory = ref<string>('ALL')

// Assign Case Modal State
const isAssignModalOpen = ref(false)
const caseToAssign = ref<StaffCase | null>(null)

// Live Audit Ledger State
const auditLogs = ref<CaseAuditLog[]>([])
const isLoadingAudit = ref(false)
const auditError = ref<string | null>(null)

async function fetchAuditLogs() {
  isLoadingAudit.value = true
  auditError.value = null
  try {
    auditLogs.value = await getAllAuditLogs()
  } catch (err: any) {
    auditError.value = err?.message || 'Failed to load organization audit ledger.'
  } finally {
    isLoadingAudit.value = false
  }
}

async function fetchCases() {
  isLoading.value = true
  error.value = null

  try {
    const promises: Promise<any>[] = [getStaffCasesQueue()]
    if (isManager.value) {
      promises.push(getDepartmentHeads())
    }

    const results = await Promise.allSettled(promises)
    if (results[0].status === 'fulfilled') {
      cases.value = results[0].value
    } else {
      throw results[0].reason
    }

    if (isManager.value && results[1] && results[1].status === 'fulfilled') {
      departmentHeads.value = results[1].value
    }
  } catch (err: any) {
    error.value = err?.message || 'Failed to retrieve cases queue. Please verify network connectivity.'
  } finally {
    isLoading.value = false
  }
}

// Cases awaiting assignment (unassigned & awaiting review)
const unassignedCases = computed(() => {
  return cases.value.filter((c) => c.status === 'AWAITING_REVIEW' && !c.assignedTo)
})

const myClaimedCases = computed(() => {
  const myId = auth.user?.id
  return cases.value.filter((c) => c.assignedTo === myId || c.status === 'UNDER_INVESTIGATION')
})

const filteredCases = computed(() => {
  let list: StaffCase[] = []

  if (isManager.value) {
    if (activeTab.value === 'AWAITING_ASSIGNMENT') {
      list = unassignedCases.value
    } else {
      list = cases.value
    }
  } else {
    if (activeTab.value === 'QUEUE') {
      list = unassignedCases.value
    } else {
      list = myClaimedCases.value
    }
  }

  if (selectedCategory.value !== 'ALL') {
    list = list.filter((c) => c.category === selectedCategory.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        (c.personInvolved && c.personInvolved.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.purposeOfTransaction && c.purposeOfTransaction.toLowerCase().includes(q))
    )
  }

  return list
})

async function handleClaim(caseItem: StaffCase) {
  isClaimingId.value = caseItem.id

  try {
    const updated = await claimCase(caseItem.id)
    caseItem.status = updated.status
    caseItem.assignedTo = updated.assignedTo
    toast.success('Case claimed successfully. Status transitioned to Investigation.')
    await router.push(`/app/cases/${caseItem.id}`)
  } catch (err: any) {
    toast.error(err?.message || 'Failed to claim case. It may have already been claimed by another officer.')
    await fetchCases()
  } finally {
    isClaimingId.value = null
  }
}

function openAssignModal(item: StaffCase) {
  caseToAssign.value = item
  isAssignModalOpen.value = true
}

function handleCaseAssigned(payload: { caseId: string; departmentHeadId: string; departmentHeadName: string }) {
  const found = cases.value.find((c) => c.id === payload.caseId)
  if (found) {
    found.assignedTo = payload.departmentHeadId
    found.status = 'UNDER_INVESTIGATION'
  }
}

function copyCaseId(id: string) {
  navigator.clipboard.writeText(id)
  copiedId.value = id
  toast.success('Case ID copied to clipboard.')
  setTimeout(() => {
    if (copiedId.value === id) copiedId.value = null
  }, 2500)
}

function getAssignedOfficerName(assignedToId?: string | null): string {
  if (!assignedToId) return 'Unassigned'
  const head = departmentHeads.value.find((h) => h.id === assignedToId)
  if (head) {
    return [head.firstName, head.lastName].filter(Boolean).join(' ') || head.email
  }
  return 'Assigned Officer'
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
    })
  } catch {
    return iso
  }
}

onMounted(() => {
  if (isManager.value) {
    activeTab.value = 'AWAITING_ASSIGNMENT'
  } else {
    activeTab.value = 'QUEUE'
  }
  fetchCases()
  fetchAuditLogs()
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
      <div>
        <div class="flex items-center gap-2">
          <span
            class="px-2 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
            {{ isManager ? 'Manager Oversight' : 'Department Cases' }}
          </span>
          <span class="text-xs text-muted-foreground font-mono">
            Active Cases
          </span>
        </div>
        <h1 class="text-2xl font-bold text-foreground mt-1 tracking-tight">
          {{ isManager ? 'All Organization Cases' : 'Department Case Queue' }}
        </h1>
        <p class="text-xs text-muted-foreground mt-0.5">
          {{ isManager ? 'Review cases across departments and assign unassigned cases to Department Heads.' : 'Review reports in your department and manage active cases.' }}
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <AppButton variant="outline" size="sm" :disabled="isLoading" @click="fetchCases">
          <RefreshCwIcon class="size-3.5 mr-1.5" :class="{ 'animate-spin': isLoading }" />
          Refresh Queue
        </AppButton>
      </div>
    </div>

    <!-- Error Banner -->
    <ErrorBanner v-if="error" :message="error" @retry="fetchCases" />

    <!-- Quick Telemetry Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <!-- Card 1 -->
      <div class="bg-card border border-border rounded-lg p-4 flex items-center justify-between card-creamy">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {{ isManager ? 'Awaiting Assignment' : 'Awaiting Review' }}
          </span>
          <p class="text-2xl font-extrabold text-foreground font-mono mt-0.5">
            {{ unassignedCases.length }}
          </p>
          <span class="text-[11px] text-muted-foreground">
            {{ isManager ? 'Needs officer delegation' : 'Eligible for initial claim' }}
          </span>
        </div>
        <div class="p-2.5 rounded bg-primary/10 text-primary">
          <ClockIcon class="size-5" />
        </div>
      </div>

      <!-- Card 2 -->
      <div class="bg-card border border-border rounded-lg p-4 flex items-center justify-between card-creamy">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {{ isManager ? 'Total Cases Tracked' : 'Claimed by Me' }}
          </span>
          <p class="text-2xl font-extrabold text-foreground font-mono mt-0.5">
            {{ isManager ? cases.length : myClaimedCases.length }}
          </p>
          <span class="text-[11px] text-muted-foreground">
            {{ isManager ? 'Active across all units' : 'Active under investigation' }}
          </span>
        </div>
        <div class="p-2.5 rounded bg-ink-900/10 text-ink-900">
          <BriefcaseIcon class="size-5" />
        </div>
      </div>

      <!-- Card 3 -->
      <div class="bg-card border border-border rounded-lg p-4 flex items-center justify-between card-creamy">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Anti-Retaliation Guard
          </span>
          <div class="flex items-center gap-1.5 mt-1">
            <span class="size-2 rounded-full bg-emerald-500"></span>
            <span class="text-xs font-bold text-foreground">ISO 37002 Active</span>
          </div>
          <span class="text-[11px] text-muted-foreground">Air-gapped case reporter safety</span>
        </div>
        <div class="p-2.5 rounded bg-emerald-500/10 text-emerald-700">
          <ShieldAlertIcon class="size-5" />
        </div>
      </div>
    </div>

    <!-- Filter & Navigation Tabs -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-1">
      <div class="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
        <!-- MANAGER TABS -->
        <template v-if="isManager">
          <button type="button"
            class="px-3 sm:px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
            :class="activeTab === 'AWAITING_ASSIGNMENT' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
            @click="activeTab = 'AWAITING_ASSIGNMENT'">
            <ClockIcon class="size-3.5" />
            <span>Awaiting Assignment ({{ unassignedCases.length }})</span>
          </button>

          <button type="button"
            class="px-3 sm:px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
            :class="activeTab === 'ALL_CASES' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
            @click="activeTab = 'ALL_CASES'">
            <BriefcaseIcon class="size-3.5" />
            <span>All Cases ({{ cases.length }})</span>
          </button>
        </template>

        <!-- DEPARTMENT HEAD TABS -->
        <template v-else>
          <button type="button"
            class="px-3 sm:px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
            :class="activeTab === 'QUEUE' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
            @click="activeTab = 'QUEUE'">
            <ClockIcon class="size-3.5" />
            <span>Department Queue ({{ unassignedCases.length }})</span>
          </button>

          <button type="button"
            class="px-3 sm:px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
            :class="activeTab === 'CLAIMED' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
            @click="activeTab = 'CLAIMED'">
            <BriefcaseIcon class="size-3.5" />
            <span>My Claimed Cases ({{ myClaimedCases.length }})</span>
          </button>
        </template>

        <!-- COMMON AUDIT LOG TAB -->
        <button type="button"
          class="px-3 sm:px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
          :class="activeTab === 'AUDIT_LOG' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'AUDIT_LOG'; fetchAuditLogs()">
          <HistoryIcon class="size-3.5" />
          <span>Audit Ledger</span>
          <span v-if="auditLogs.length > 0"
            class="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-primary/15 text-primary font-mono">
            {{ auditLogs.length }}
          </span>
        </button>
      </div>

      <!-- Search & Category Filters (only for cases tabs) -->
      <div v-if="activeTab !== 'AUDIT_LOG'" class="flex items-center gap-2 pb-1 sm:pb-0 w-full sm:w-auto">
        <div class="relative flex-1 sm:flex-none">
          <SearchIcon
            class="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input v-model="searchQuery" type="text" placeholder="Filter reference or person..."
            class="h-8 pl-8 pr-3 text-xs rounded border border-border bg-card text-foreground focus:outline-none focus:border-primary w-full sm:w-48" />
        </div>

        <select v-model="selectedCategory"
          class="h-8 px-2 text-xs rounded border border-border bg-card text-foreground focus:outline-none focus:border-primary cursor-pointer shrink-0">
          <option value="ALL">All Categories</option>
          <option value="FRAUD">Fraud</option>
          <option value="HARASSMENT">Harassment</option>
          <option value="SECURITY">Security</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
    </div>

    <!-- AUDIT LOG TAB VIEW -->
    <div v-if="activeTab === 'AUDIT_LOG'" class="space-y-4">
      <div
        class="p-3.5 rounded-lg bg-muted/40 border border-border text-xs flex items-center justify-between card-creamy">
        <div class="flex items-center gap-2">
          <HistoryIcon class="size-4 text-primary" />
          <span class="font-semibold text-foreground">Immutable Cryptographic Audit Trail</span>
          <span
            class="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 font-mono">
            Active Ledger
          </span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-[11px] text-muted-foreground font-mono hidden sm:inline">
            SHA-256 Ledger · ISO 37002 Certified
          </span>
          <button type="button"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-border bg-white hover:bg-muted/40 text-foreground transition-colors cursor-pointer shadow-2xs"
            :disabled="isLoadingAudit" @click="fetchAuditLogs">
            <RefreshCwIcon class="size-3" :class="{ 'animate-spin': isLoadingAudit }" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- Loading Skeleton -->
      <div v-if="isLoadingAudit" class="space-y-3 animate-pulse">
        <div v-for="i in 4" :key="i" class="h-14 bg-muted/40 rounded-lg border border-border"></div>
      </div>

      <!-- Error State -->
      <ErrorBanner v-else-if="auditError" :message="auditError" :retryable="true" @retry="fetchAuditLogs" />

      <!-- Empty State -->
      <EmptyState v-else-if="auditLogs.length === 0" title="No audit events recorded"
        description="The cryptographic audit ledger will record case creations, triage decisions, and status transitions as investigations proceed.">
        <template #action>
          <AppButton variant="outline" size="sm" @click="fetchAuditLogs">
            Refresh Ledger
          </AppButton>
        </template>
      </EmptyState>

      <!-- Audit Table -->
      <div v-else class="bg-card border border-border rounded-lg overflow-x-auto shadow-xs card-creamy">
        <table class="w-full text-left text-xs">
          <thead
            class="bg-muted/60 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th class="p-3">Log Event ID</th>
              <th class="p-3">Case Reference</th>
              <th class="p-3">Timestamp</th>
              <th class="p-3">Actor Role</th>
              <th class="p-3">Action Performed</th>
              <th class="p-3">Audit Details &amp; Notes</th>
              <th class="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="log in auditLogs" :key="log.id" class="hover:bg-muted/20 transition-colors">
              <td class="p-3 font-mono font-bold text-foreground">
                <span :title="log.id">{{ log.id.slice(0, 8) }}...</span>
              </td>
              <td class="p-3 font-mono text-primary font-semibold">
                <router-link :to="`/app/cases/${log.caseRecordId}`" class="hover:underline flex items-center gap-1">
                  <span>#{{ log.caseRecordId.slice(0, 8) }}</span>
                  <ArrowRightIcon class="size-3" />
                </router-link>
              </td>
              <td class="p-3 text-muted-foreground font-mono whitespace-nowrap">
                {{ formatDate(log.loggedAt) }}
              </td>
              <td class="p-3">
                <span class="px-2 py-0.5 rounded text-[10px] font-semibold border"
                  :class="log.actorType === 'DEPARTMENT_HEAD' ? 'bg-[#22293A] text-white border-[#22293A]' : log.actorType === 'AI' ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-slate-100 text-slate-700 border-slate-300'">
                  {{ log.actorType }}
                </span>
              </td>
              <td class="p-3 font-semibold text-foreground">
                {{ log.action.replaceAll('_', ' ') }}
              </td>
              <td class="p-3 text-muted-foreground max-w-sm truncate">
                <span v-if="log.note" class="italic text-foreground">"{{ log.note }}"</span>
                <span v-else-if="log.previousValue || log.newValue">
                  {{ log.previousValue ? `${log.previousValue} → ` : '' }}{{ log.newValue }}
                </span>
                <span v-else>—</span>
              </td>
              <td class="p-3 text-right">
                <router-link :to="`/app/cases/${log.caseRecordId}`"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-white border border-border hover:border-primary text-foreground hover:text-primary transition-colors">
                  {{ isManager ? 'Case Overview' : 'View Case' }}
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- CASES TABLE (AWAITING_ASSIGNMENT, ALL_CASES, QUEUE, CLAIMED) -->
    <div v-else>
      <!-- Loading Skeleton -->
      <div v-if="isLoading" class="space-y-3 animate-pulse">
        <div v-for="i in 4" :key="i" class="h-16 bg-muted/40 rounded-lg border border-border"></div>
      </div>

      <!-- Empty State -->
      <EmptyState v-else-if="filteredCases.length === 0"
        :title="isManager ? (activeTab === 'AWAITING_ASSIGNMENT' ? 'No cases awaiting assignment' : 'No cases found') : (activeTab === 'QUEUE' ? 'No cases awaiting review' : 'No claimed cases found')"
        :description="isManager ? (activeTab === 'AWAITING_ASSIGNMENT' ? 'All submitted incident reports have been assigned to Department Heads.' : 'No matching cases found across the organization.') : (activeTab === 'QUEUE' ? 'There are currently no unclaimed incident reports in your departmental queue.' : 'You have not claimed any active cases yet.')">
        <template #action>
          <AppButton variant="outline" size="sm" @click="fetchCases">
            Refresh data
          </AppButton>
        </template>
      </EmptyState>

      <!-- Data Table -->
      <div v-else class="bg-card border border-border rounded-lg overflow-x-auto shadow-xs card-creamy">
        <table class="w-full text-left text-xs">
          <thead
            class="bg-muted/60 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th class="p-3.5">Reference ID</th>
              <th class="p-3.5">Date</th>
              <th class="p-3.5">Category &amp; Scope</th>
              <th class="p-3.5">Person Involved</th>
              <th class="p-3.5">Disputed Amount</th>
              <th class="p-3.5">Working Officer</th>
              <th class="p-3.5">Status &amp; Flags</th>
              <th class="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="item in filteredCases" :key="item.id" class="hover:bg-muted/20 transition-colors">
              <!-- Case ID -->
              <td class="p-3.5">
                <div class="flex items-center gap-1.5 font-mono font-bold text-foreground">
                  <span class="truncate max-w-[120px]" :title="item.id">{{ item.id }}</span>
                  <button type="button" class="text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded"
                    title="Copy Case UUID" @click="copyCaseId(item.id)">
                    <CheckIcon v-if="copiedId === item.id" class="size-3 text-emerald-600" />
                    <CopyIcon v-else class="size-3" />
                  </button>
                </div>
              </td>

              <!-- Date -->
              <td class="p-3.5 text-muted-foreground font-mono whitespace-nowrap">
                {{ formatDate(item.transactionDate || item.createdAt) }}
              </td>

              <!-- Category -->
              <td class="p-3.5">
                <div class="space-y-0.5">
                  <span
                    class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                    {{ item.category }}
                  </span>
                  <p class="text-[11px] text-muted-foreground line-clamp-1 max-w-[200px]"
                    :title="item.purposeOfTransaction">
                    {{ item.purposeOfTransaction }}
                  </p>
                </div>
              </td>

              <!-- Person Involved -->
              <td class="p-3.5 font-medium text-foreground">
                {{ item.personInvolved || 'Unspecified' }}
              </td>

              <!-- Amount -->
              <td class="p-3.5 font-mono font-bold text-foreground whitespace-nowrap">
                {{ formatAmount(item.amountInvolved) }}
              </td>

              <!-- Working Officer -->
              <td class="p-3.5 whitespace-nowrap text-xs">
                <span v-if="item.assignedTo" class="inline-flex items-center gap-1.5 font-medium text-foreground">
                  <UserCheckIcon class="size-3 text-emerald-600" />
                  <span>{{ getAssignedOfficerName(item.assignedTo) }}</span>
                </span>
                <span v-else class="inline-flex items-center gap-1 text-muted-foreground font-mono text-[11px]">
                  <ClockIcon class="size-3 text-amber-500" />
                  <span>Unassigned</span>
                </span>
              </td>

              <!-- Status & Conflict Flags -->
              <td class="p-3.5 whitespace-nowrap">
                <div class="flex items-center gap-1.5">
                  <StatusPill :status="item.status" />
                  <span v-if="item.concernsDepartmentHead"
                    class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-destructive/15 text-destructive border border-destructive/20 flex items-center gap-1"
                    title="Conflict: Concerns Department Head">
                    <AlertTriangleIcon class="size-3" />
                    Conflict
                  </span>
                  <span v-if="item.escalatedAt"
                    class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-800 border border-amber-500/20"
                    title="Escalated to Manager">
                    Escalated
                  </span>
                </div>
              </td>

              <!-- Actions -->
              <td class="p-3.5 text-right whitespace-nowrap">
                <div class="inline-flex items-center gap-2">
                  <!-- Manager: Assign Case button (when unassigned) -->
                  <button v-if="isManager && !item.assignedTo && item.status === 'AWAITING_REVIEW'" type="button"
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold bg-primary text-white hover:bg-primary-700 transition-colors cursor-pointer"
                    @click="openAssignModal(item)">
                    <UserCheckIcon class="size-3.5" />
                    <span>Assign Case</span>
                  </button>

                  <!-- Department Head: Claim button -->
                  <button v-if="!isManager && activeTab === 'QUEUE' && item.status === 'AWAITING_REVIEW'" type="button"
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold bg-primary text-white hover:bg-primary-700 transition-colors cursor-pointer"
                    :disabled="isClaimingId === item.id" @click="handleClaim(item)">
                    <HandHelpingIcon class="size-3.5" />
                    <span>{{ isClaimingId === item.id ? 'Claiming...' : 'Claim' }}</span>
                  </button>

                  <!-- View Case / Case Overview -->
                  <router-link :to="`/app/cases/${item.id}`"
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold border border-border bg-background hover:bg-muted text-foreground transition-colors"
                    :title="isManager ? 'View Case Summary' : 'View Full Case Record & Evidence'">
                    <span>{{ isManager ? 'Case Overview' : 'View Case' }}</span>
                    <ArrowRightIcon class="size-3" />
                  </router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Assign Case Modal -->
    <AssignCaseModal :is-open="isAssignModalOpen" :case-item="caseToAssign" :department-heads="departmentHeads"
      @close="isAssignModalOpen = false" @assigned="handleCaseAssigned" />
  </div>
</template>
