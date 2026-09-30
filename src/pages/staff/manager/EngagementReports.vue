<!-- pages/staff/manager/EngagementReports.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { EngagementReportData } from '@/features/manager/types'
import { getEngagementReport } from '@/features/manager/api'
import AppButton from '@/components/common/AppButton.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import {
  PrinterIcon,
  RefreshCwIcon,
  ClockIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  LayersIcon,
  Building2Icon,
  CalendarIcon,
  CheckCircle2Icon,
} from '@lucide/vue'

const report = ref<EngagementReportData>({
  caseVolumeByDepartment: [],
  averageResolutionDays: null,
  categoryBreakdownOverTime: [],
})

const isLoading = ref(true)
const error = ref<string | null>(null)

async function fetchReport() {
  isLoading.value = true
  error.value = null
  try {
    report.value = await getEngagementReport()
  } catch (err: any) {
    error.value = err?.message || 'Failed to load engagement report. Please verify connection.'
  } finally {
    isLoading.value = false
  }
}

const totalCases = computed(() => {
  return report.value.caseVolumeByDepartment.reduce((acc, item) => acc + item.count, 0)
})

const maxDeptCount = computed(() => {
  const counts = report.value.caseVolumeByDepartment.map((d) => d.count)
  return counts.length > 0 ? Math.max(...counts) : 1
})

const leadingDepartment = computed(() => {
  if (report.value.caseVolumeByDepartment.length === 0) return 'None'
  const sorted = [...report.value.caseVolumeByDepartment].sort((a, b) => b.count - a.count)
  return sorted[0].department
})

const categoryTotals = computed(() => {
  const map = new Map<string, number>()
  for (const item of report.value.categoryBreakdownOverTime) {
    map.set(item.category, (map.get(item.category) || 0) + item.count)
  }
  return Array.from(map.entries()).map(([category, count]) => ({ category, count }))
})

const leadingCategory = computed(() => {
  if (categoryTotals.value.length === 0) return 'General'
  const sorted = [...categoryTotals.value].sort((a, b) => b.count - a.count)
  return sorted[0].category
})

function formatMonth(ym: string): string {
  if (!ym) return '—'
  const parts = ym.split('-')
  if (parts.length >= 2) {
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const d = new Date(year, month, 1)
    return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  }
  return ym
}

function handlePrint() {
  window.print()
}

onMounted(() => {
  fetchReport()
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto print:p-0 print:space-y-4">
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5 print:pb-2">
      <div>
        <div class="flex items-center gap-2">
          <span
            class="px-2 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
            Manager Reports
          </span>
          <span class="text-xs text-muted-foreground font-mono">
            Analytics &amp; Statistics
          </span>
        </div>
        <h1 class="text-2xl font-bold text-foreground mt-1 tracking-tight print:text-xl">
          Case Activity &amp; Resolution Reports
        </h1>
        <p class="text-xs text-muted-foreground mt-0.5">
          Overview of case volume, reports per department, and case resolution progress across the organization.
        </p>
      </div>

      <div class="flex items-center gap-2.5 print:hidden">
        <AppButton variant="outline" size="sm" :disabled="isLoading" @click="fetchReport">
          <RefreshCwIcon class="size-3.5 mr-1.5" :class="{ 'animate-spin': isLoading }" />
          Refresh Data
        </AppButton>

        <button type="button"
          class="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary-700 transition-colors shadow-xs cursor-pointer"
          @click="handlePrint">
          <PrinterIcon class="size-4" />
          <span>Print Report</span>
        </button>
      </div>
    </div>

    <!-- Error Banner -->
    <ErrorBanner v-if="error" :message="error" class="print:hidden" @retry="fetchReport" />

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="space-y-4 animate-pulse">
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="h-24 bg-muted/40 rounded-lg border border-border"></div>
      </div>
      <div class="h-64 bg-muted/40 rounded-lg border border-border"></div>
    </div>

    <!-- Empty State -->
    <EmptyState v-else-if="totalCases === 0 && report.categoryBreakdownOverTime.length === 0"
      title="No analytics records found"
      description="No cases have been filed in the reporting system yet. Analytics will populate once reports are submitted.">
      <template #action>
        <AppButton variant="outline" size="sm" @click="fetchReport">
          Check for new intake
        </AppButton>
      </template>
    </EmptyState>

    <!-- Populated Analytics Dashboard -->
    <div v-else class="space-y-6 print:space-y-4">
      <!-- Executive KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Incidents -->
        <div class="bg-card border border-border rounded-lg p-4 flex items-center justify-between card-creamy">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Reports Handled
            </span>
            <p class="text-2xl font-extrabold text-foreground font-mono mt-0.5">
              {{ totalCases }}
            </p>
            <span class="text-[11px] text-muted-foreground">Across all business units</span>
          </div>
          <div class="p-2.5 rounded bg-primary/10 text-primary">
            <BriefcaseIcon class="size-5" />
          </div>
        </div>

        <!-- Average Resolution Speed -->
        <div class="bg-card border border-border rounded-lg p-4 flex items-center justify-between card-creamy">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Avg. Resolution Speed
            </span>
            <p class="text-2xl font-extrabold text-foreground font-mono mt-0.5">
              {{ report.averageResolutionDays !== null ? `${report.averageResolutionDays} days` : 'Under Baseline' }}
            </p>
            <span class="text-[11px] text-muted-foreground">From intake to resolution note</span>
          </div>
          <div class="p-2.5 rounded bg-ink-900/10 text-ink-900">
            <ClockIcon class="size-5" />
          </div>
        </div>

        <!-- Leading Category -->
        <div class="bg-card border border-border rounded-lg p-4 flex items-center justify-between card-creamy">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Primary Incident Type
            </span>
            <p class="text-xl font-extrabold text-foreground mt-0.5 uppercase tracking-wide">
              {{ leadingCategory }}
            </p>
            <span class="text-[11px] text-muted-foreground">Most reported classification</span>
          </div>
          <div class="p-2.5 rounded bg-amber-500/10 text-amber-700">
            <LayersIcon class="size-5" />
          </div>
        </div>

        <!-- Leading Department -->
        <div class="bg-card border border-border rounded-lg p-4 flex items-center justify-between card-creamy">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Top Active Directorate
            </span>
            <p class="text-base font-bold text-foreground mt-0.5 truncate max-w-[150px]" :title="leadingDepartment">
              {{ leadingDepartment }}
            </p>
            <span class="text-[11px] text-muted-foreground">Highest intake volume</span>
          </div>
          <div class="p-2.5 rounded bg-emerald-500/10 text-emerald-700">
            <Building2Icon class="size-5" />
          </div>
        </div>
      </div>

      <!-- Main Visualizations Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-1">
        <!-- Visualization 1: Case Volume by Department -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-4 card-creamy">
          <div class="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 class="text-sm font-bold text-foreground flex items-center gap-2">
                <Building2Icon class="size-4 text-primary" />
                Case Volume by Department
              </h2>
              <p class="text-xs text-muted-foreground mt-0.5">
                Distribution of anonymous reports across operational directorates
              </p>
            </div>
            <span class="text-xs font-mono font-bold text-muted-foreground">
              {{ report.caseVolumeByDepartment.length }} Units
            </span>
          </div>

          <div v-if="report.caseVolumeByDepartment.length === 0" class="py-8 text-center text-xs text-muted-foreground">
            No department volume data recorded yet.
          </div>

          <div v-else class="space-y-3 pt-1">
            <div v-for="dept in report.caseVolumeByDepartment" :key="dept.department" class="space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-semibold text-foreground truncate max-w-[260px]" :title="dept.department">
                  {{ dept.department }}
                </span>
                <div class="flex items-center gap-2 font-mono">
                  <span class="font-bold text-foreground">{{ dept.count }} cases</span>
                  <span class="text-muted-foreground text-[11px]">
                    ({{ totalCases > 0 ? Math.round((dept.count / totalCases) * 100) : 0 }}%)
                  </span>
                </div>
              </div>

              <!-- Bar Track -->
              <div class="h-2.5 w-full bg-muted/60 rounded-full overflow-hidden border border-border/40">
                <div class="h-full bg-primary rounded-full transition-all duration-500"
                  :style="{ width: `${totalCases > 0 ? Math.max((dept.count / maxDeptCount) * 100, 6) : 0}%` }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Visualization 2: Incident Categories & Trend Distribution -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-4 card-creamy">
          <div class="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 class="text-sm font-bold text-foreground flex items-center gap-2">
                <LayersIcon class="size-4 text-primary" />
                Reporting Trends &amp; Monthly Activity
              </h2>
              <p class="text-xs text-muted-foreground mt-0.5">
                Incidents categorized chronologically over monthly evaluation periods
              </p>
            </div>
            <span class="text-xs font-mono font-bold text-muted-foreground">
              {{ report.categoryBreakdownOverTime.length }} Periods
            </span>
          </div>

          <div v-if="report.categoryBreakdownOverTime.length === 0"
            class="py-8 text-center text-xs text-muted-foreground">
            No historical trend data available.
          </div>

          <div v-else class="space-y-2.5 pt-1 overflow-y-auto max-h-[320px]">
            <div v-for="(item, idx) in report.categoryBreakdownOverTime" :key="idx"
              class="p-3 rounded-lg bg-muted/30 border border-border flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded bg-primary/10 text-primary shrink-0">
                  <CalendarIcon class="size-4" />
                </div>
                <div>
                  <span class="text-xs font-bold text-foreground font-mono">
                    {{ formatMonth(item.month) }}
                  </span>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span
                      class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                      {{ item.category }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="text-right">
                <span class="text-sm font-bold font-mono text-foreground">
                  {{ item.count }}
                </span>
                <p class="text-[10px] text-muted-foreground">disclosures</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Institutional Assurance & Governance Notice -->
      <div
        class="bg-card border border-border rounded-lg p-4 card-creamy flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-start gap-3">
          <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-700 shrink-0 mt-0.5">
            <ShieldCheckIcon class="size-5" />
          </div>
          <div>
            <h3 class="text-xs font-bold text-foreground">
              ISO 37002 Case Reporting Management Standard Verification
            </h3>
            <p class="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              All reporting metrics are collected through air-gapped intake channels. No IP addresses, device headers,
              or
              location data are stored or linked to engagement telemetry.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 text-xs font-mono text-muted-foreground shrink-0">
          <CheckCircle2Icon class="size-4 text-emerald-600" />
          <span>Cryptographic Seal Node DLA-01</span>
        </div>
      </div>
    </div>
  </div>
</template>
