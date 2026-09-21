<!-- pages/staff/cases/CasesIndex.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import { getStaffCasesQueue, claimCase } from '@/features/cases/api'
import type { StaffCase, AuditLogEntry } from '@/features/cases/types'
import { toast } from '@/plugins/toast'
import AppButton from '@/components/common/AppButton.vue'
import StatusPill from '@/components/common/StatusPill.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
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
} from '@lucide/vue'

const router = useRouter()
const auth = useAuthStore()

type TabKey = 'QUEUE' | 'CLAIMED' | 'AUDIT_LOG'

const activeTab = ref<TabKey>('QUEUE')
const isLoading = ref(true)
const isClaimingId = ref<string | null>(null)
const error = ref<string | null>(null)
const cases = ref<StaffCase[]>([])
const copiedId = ref<string | null>(null)
const searchQuery = ref('')
const selectedCategory = ref<string>('ALL')

// Mock audit log seam until backend endpoint exists per Plan §2 Gap
// TODO(api): audit log endpoint
const auditLogs = ref<AuditLogEntry[]>([
  {
    id: 'LOG-88219-01',
    actorName: 'Dr. Henriette Moukoko',
    action: 'QUEUE_INGESTION_SYNC',
    details: 'Queried active Douala Directorate departmental triage queue.',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  {
    id: 'LOG-88219-02',
    actorName: 'Automated Tor Gateway',
    action: 'METADATA_EXIF_PURGE',
    details: 'Stripped GPS coordinates and camera serial from evidence attachment.',
    timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    hash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
  },
  {
    id: 'LOG-88219-03',
    actorName: 'Audit Ledger Daemon',
    action: 'ISO37002_RECORD_LOCK',
    details: 'Cryptographic block sealed for maritime demurrage incident report.',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    hash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
  },
])

async function fetchCases() {
  isLoading.value = true
  error.value = null

  try {
    const data = await getStaffCasesQueue()
    cases.value = data
  } catch (err: any) {
    error.value = err?.message || 'Failed to retrieve cases queue. Please verify network connectivity.'
  } finally {
    isLoading.value = false
  }
}

const unclaimedCases = computed(() => {
  return cases.value.filter((c) => c.status === 'AWAITING_REVIEW' && !c.assignedTo)
})

const myClaimedCases = computed(() => {
  const myId = auth.user?.id
  return cases.value.filter((c) => c.assignedTo === myId || c.status === 'UNDER_INVESTIGATION')
})

const filteredCases = computed(() => {
  let list = activeTab.value === 'QUEUE' ? unclaimedCases.value : myClaimedCases.value

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
    // Redirect straight into the case
    await router.push(`/app/cases/${caseItem.id}`)
  } catch (err: any) {
    toast.error(err?.message || 'Failed to claim case. It may have already been claimed by another officer.')
    await fetchCases()
  } finally {
    isClaimingId.value = null
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
  fetchCases()
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
      <div>
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
            Case Management &amp; Triage
          </span>
          <span class="text-xs text-muted-foreground font-mono">
            Douala &amp; Yaoundé Regional Nodes
          </span>
        </div>
        <h1 class="text-2xl font-bold text-foreground mt-1 tracking-tight">
          Department Investigation Queue &amp; Dockets
        </h1>
        <p class="text-xs text-muted-foreground mt-0.5">
          Review incoming whistleblower disclosures, claim active dockets, and conduct forensic assessments.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <AppButton
          variant="outline"
          size="sm"
          :disabled="isLoading"
          @click="fetchCases"
        >
          <RefreshCwIcon class="size-3.5 mr-1.5" :class="{ 'animate-spin': isLoading }" />
          Refresh Queue
        </AppButton>
      </div>
    </div>

    <!-- Error Banner -->
    <ErrorBanner
      v-if="error"
      :message="error"
      @retry="fetchCases"
    />

    <!-- Quick Telemetry Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Awaiting Review
          </span>
          <p class="text-2xl font-extrabold text-foreground font-mono mt-0.5">
            {{ unclaimedCases.length }}
          </p>
          <span class="text-[11px] text-muted-foreground">Eligible for initial claim</span>
        </div>
        <div class="p-2.5 rounded bg-primary/10 text-primary">
          <ClockIcon class="size-5" />
        </div>
      </div>

      <div class="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Claimed by Me
          </span>
          <p class="text-2xl font-extrabold text-foreground font-mono mt-0.5">
            {{ myClaimedCases.length }}
          </p>
          <span class="text-[11px] text-muted-foreground">Active under investigation</span>
        </div>
        <div class="p-2.5 rounded bg-ink-900/10 text-ink-900">
          <BriefcaseIcon class="size-5" />
        </div>
      </div>

      <div class="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Anti-Retaliation Guard
          </span>
          <div class="flex items-center gap-1.5 mt-1">
            <span class="size-2 rounded-full bg-emerald-500"></span>
            <span class="text-xs font-bold text-foreground">ISO 37002 Active</span>
          </div>
          <span class="text-[11px] text-muted-foreground">Air-gapped whistleblower safety</span>
        </div>
        <div class="p-2.5 rounded bg-emerald-500/10 text-emerald-700">
          <ShieldAlertIcon class="size-5" />
        </div>
      </div>
    </div>

    <!-- Filter & Navigation Tabs -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-1">
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5"
          :class="activeTab === 'QUEUE' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'QUEUE'"
        >
          <ClockIcon class="size-3.5" />
          <span>Department Queue ({{ unclaimedCases.length }})</span>
        </button>

        <button
          type="button"
          class="px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5"
          :class="activeTab === 'CLAIMED' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'CLAIMED'"
        >
          <BriefcaseIcon class="size-3.5" />
          <span>My Claimed Cases ({{ myClaimedCases.length }})</span>
        </button>

        <button
          type="button"
          class="px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5"
          :class="activeTab === 'AUDIT_LOG' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'AUDIT_LOG'"
        >
          <HistoryIcon class="size-3.5" />
          <span>Audit Ledger (Seam)</span>
        </button>
      </div>

      <!-- Search & Category Filters (only for cases tabs) -->
      <div v-if="activeTab !== 'AUDIT_LOG'" class="flex items-center gap-2 pb-1 sm:pb-0">
        <div class="relative">
          <SearchIcon class="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Filter reference or entity..."
            class="h-8 pl-8 pr-3 text-xs rounded border border-border bg-card text-foreground focus:outline-none focus:border-primary w-48"
          />
        </div>

        <select
          v-model="selectedCategory"
          class="h-8 px-2.5 text-xs rounded border border-border bg-card text-foreground focus:outline-none focus:border-primary cursor-pointer"
        >
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
      <div class="p-3.5 rounded-lg bg-muted/40 border border-border text-xs flex items-center justify-between">
        <div class="flex items-center gap-2">
          <HistoryIcon class="size-4 text-primary" />
          <span class="font-semibold text-foreground">Immutable Cryptographic Audit Trail</span>
          <span class="text-[10px] px-2 py-0.2 rounded bg-amber-500/10 text-amber-800 border border-amber-500/20 font-mono">
            // TODO(api): audit log endpoint
          </span>
        </div>
        <span class="text-[11px] text-muted-foreground font-mono">
          SHA-256 Ledger Node DLA-01
        </span>
      </div>

      <div class="bg-card border border-border rounded-lg overflow-hidden">
        <table class="w-full text-left text-xs">
          <thead class="bg-muted/60 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th class="p-3">Log Event ID</th>
              <th class="p-3">Timestamp</th>
              <th class="p-3">Investigator / Actor</th>
              <th class="p-3">Action Performed</th>
              <th class="p-3">Audit Details</th>
              <th class="p-3 font-mono">Cryptographic Hash</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="log in auditLogs" :key="log.id" class="hover:bg-muted/20 transition-colors">
              <td class="p-3 font-mono font-bold text-foreground">{{ log.id }}</td>
              <td class="p-3 text-muted-foreground font-mono">{{ formatDate(log.timestamp) }}</td>
              <td class="p-3 font-medium text-foreground">{{ log.actorName }}</td>
              <td class="p-3">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-ink-900/10 text-ink-900 border border-ink-900/20">
                  {{ log.action }}
                </span>
              </td>
              <td class="p-3 text-muted-foreground">{{ log.details }}</td>
              <td class="p-3 font-mono text-[10px] text-muted-foreground/80 truncate max-w-xs">
                {{ log.hash }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- CASES TABLE (QUEUE OR CLAIMED) -->
    <div v-else>
      <!-- Loading Skeleton -->
      <div v-if="isLoading" class="space-y-3 animate-pulse">
        <div v-for="i in 4" :key="i" class="h-16 bg-muted/40 rounded-lg border border-border"></div>
      </div>

      <!-- Empty State -->
      <EmptyState
        v-else-if="filteredCases.length === 0"
        :title="activeTab === 'QUEUE' ? 'No cases awaiting review' : 'No claimed cases found'"
        :description="activeTab === 'QUEUE' ? 'There are currently no unclaimed incident reports in your departmental queue.' : 'You have not claimed any dockets under active investigation.'"
      >
        <template #action>
          <AppButton
            variant="outline"
            size="sm"
            @click="fetchCases"
          >
            Refresh data
          </AppButton>
        </template>
      </EmptyState>

      <!-- Data Table -->
      <div v-else class="bg-card border border-border rounded-lg overflow-x-auto shadow-xs">
        <table class="w-full text-left text-xs">
          <thead class="bg-muted/60 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th class="p-3.5">Reference ID</th>
              <th class="p-3.5">Date</th>
              <th class="p-3.5">Category &amp; Scope</th>
              <th class="p-3.5">Entity / Person Involved</th>
              <th class="p-3.5">Disputed Amount</th>
              <th class="p-3.5">Status &amp; Flags</th>
              <th class="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr
              v-for="item in filteredCases"
              :key="item.id"
              class="hover:bg-muted/20 transition-colors"
            >
              <!-- Case ID -->
              <td class="p-3.5">
                <div class="flex items-center gap-1.5 font-mono font-bold text-foreground">
                  <span class="truncate max-w-[120px]" :title="item.id">{{ item.id }}</span>
                  <button
                    type="button"
                    class="text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded"
                    title="Copy Case UUID"
                    @click="copyCaseId(item.id)"
                  >
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
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                    {{ item.category }}
                  </span>
                  <p class="text-[11px] text-muted-foreground line-clamp-1 max-w-[200px]" :title="item.purposeOfTransaction">
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

              <!-- Status & Conflict Flags -->
              <td class="p-3.5 whitespace-nowrap">
                <div class="flex items-center gap-1.5">
                  <StatusPill :status="item.status" />
                  <span
                    v-if="item.concernsDepartmentHead"
                    class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-destructive/15 text-destructive border border-destructive/20 flex items-center gap-1"
                    title="Conflict: Concerns Department Head"
                  >
                    <AlertTriangleIcon class="size-3" />
                    Conflict
                  </span>
                  <span
                    v-if="item.escalatedAt"
                    class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-800 border border-amber-500/20"
                    title="Escalated to Executive Management"
                  >
                    Escalated
                  </span>
                </div>
              </td>

              <!-- Actions -->
              <td class="p-3.5 text-right whitespace-nowrap">
                <div class="inline-flex items-center gap-2">
                  <button
                    v-if="activeTab === 'QUEUE' && item.status === 'AWAITING_REVIEW' && auth.user?.role === 'DEPARTMENT_HEAD'"
                    type="button"
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold bg-primary text-white hover:bg-primary-700 transition-colors cursor-pointer"
                    :disabled="isClaimingId === item.id"
                    @click="handleClaim(item)"
                  >
                    <HandHelpingIcon class="size-3.5" />
                    <span>{{ isClaimingId === item.id ? 'Claiming...' : 'Claim' }}</span>
                  </button>

                  <router-link
                    :to="`/app/cases/${item.id}`"
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold border border-border bg-background hover:bg-muted text-foreground transition-colors"
                  >
                    <span>View Case</span>
                    <ArrowRightIcon class="size-3" />
                  </router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
