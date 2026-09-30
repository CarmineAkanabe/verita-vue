<!-- pages/staff/AccountDashboard.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/shared/stores/auth'
import { getAccountDashboard, getNotifications } from '@/features/account/api'
import type {
  AccountDashboardData,
  ManagerDashboardData,
  DepartmentHeadDashboardData,
  NotificationItem,
} from '@/features/account/types'
import AppButton from '@/components/common/AppButton.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import {
  ShieldCheckIcon,
  Building2Icon,
  UsersIcon,
  FileTextIcon,
  BellIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  FolderLockIcon,
  ArrowRightIcon,
  RefreshCwIcon,
  BarChart3Icon,
  PlusIcon,
  UserPlusIcon,
  BriefcaseIcon,
} from '@lucide/vue'

const auth = useAuthStore()

const isLoading = ref(true)
const error = ref<string | null>(null)
const dashboardData = ref<AccountDashboardData | null>(null)
const recentNotifications = ref<NotificationItem[]>([])
const isLoadingNotifications = ref(false)

const isManager = computed(() => auth.user?.role === 'MANAGER')
const managerData = computed(() => dashboardData.value as ManagerDashboardData | null)
const deptHeadData = computed(() => dashboardData.value as DepartmentHeadDashboardData | null)

const departmentDisplayName = computed(() => {
  if (!deptHeadData.value?.department) return 'Assigned Directorate'
  if (typeof deptHeadData.value.department === 'string') return deptHeadData.value.department
  return deptHeadData.value.department.name || 'Assigned Directorate'
})

async function loadData() {
  isLoading.value = true
  error.value = null

  try {
    const data = await getAccountDashboard()
    dashboardData.value = data
  } catch (err: any) {
    error.value = err?.message || 'Unable to retrieve staff dashboard metrics. Please check connection to the API.'
  } finally {
    isLoading.value = false
  }

  // Load recent notifications for the quick telemetry widget
  try {
    isLoadingNotifications.value = true
    const res = await getNotifications(1)
    recentNotifications.value = (res.data || []).slice(0, 3)
  } catch {
    // Non-critical background telemetry
  } finally {
    isLoadingNotifications.value = false
  }
}

function formatDate(iso: string) {
  if (!iso) return 'Just now'
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

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
      <div>
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase"
            :class="isManager ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-ink-900/10 text-ink-900 border border-ink-900/20'">
            {{ isManager ? 'Manager' : 'Department Head' }}
          </span>
          <span class="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <span class="size-2 rounded-full bg-emerald-600"></span>
            Active Session
          </span>
        </div>
        <h1 class="text-2xl font-bold text-foreground mt-1 tracking-tight">
          {{ isManager ? 'Manager Dashboard' : 'Department Case Review' }}
        </h1>
        <p class="text-xs text-muted-foreground mt-0.5">
          Logged in as <strong class="text-foreground font-semibold">{{ [auth.user?.firstName,
          auth.user?.lastName].filter(Boolean).join(' ') }}</strong>
          ({{ auth.user?.email }}) · Staff ID: <span class="font-mono text-foreground font-semibold">{{
            auth.user?.staffId || 'STF-0421' }}</span>
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <AppButton variant="outline" size="sm" :disabled="isLoading" @click="loadData">
          <RefreshCwIcon class="size-3.5 mr-1.5" :class="{ 'animate-spin': isLoading }" />
          Refresh
        </AppButton>
        <router-link v-if="isManager" to="/app/reports/user-engagement"
          class="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-primary text-white hover:bg-primary-700 transition-colors shadow-xs">
          <BarChart3Icon class="size-3.5" />
          View Reports
        </router-link>
      </div>
    </div>

    <!-- Error Banner -->
    <ErrorBanner v-if="error" :message="error" @retry="loadData" />

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="space-y-6 animate-pulse">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="i in 3" :key="i" class="h-28 bg-muted/40 rounded-lg border border-border"></div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 h-72 bg-muted/40 rounded-lg border border-border"></div>
        <div class="h-72 bg-muted/40 rounded-lg border border-border"></div>
      </div>
    </div>

    <!-- Dashboard Main Body -->
    <div v-else class="space-y-6">
      <!-- MANAGER DASHBOARD BRANCH -->
      <section v-if="isManager && managerData" class="space-y-6">

        <!-- Quick Actions Row (Fast mobile & desktop shortcuts) -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <router-link
            to="/app/departments?action=add"
            class="p-3.5 rounded-xl bg-card border border-border hover:border-primary/60 transition-all flex items-center gap-3 group shadow-xs"
          >
            <div class="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
              <PlusIcon class="size-4" />
            </div>
            <div class="text-left min-w-0">
              <p class="text-xs font-bold text-foreground truncate">Add Department</p>
              <p class="text-[10px] text-muted-foreground truncate">New unit</p>
            </div>
          </router-link>

          <router-link
            to="/app/department-heads?action=add"
            class="p-3.5 rounded-xl bg-card border border-border hover:border-primary/60 transition-all flex items-center gap-3 group shadow-xs"
          >
            <div class="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
              <UserPlusIcon class="size-4" />
            </div>
            <div class="text-left min-w-0">
              <p class="text-xs font-bold text-foreground truncate">Add Dept Head</p>
              <p class="text-[10px] text-muted-foreground truncate">Assign head</p>
            </div>
          </router-link>

          <router-link
            to="/app/cases"
            class="p-3.5 rounded-xl bg-card border border-border hover:border-primary/60 transition-all flex items-center gap-3 group shadow-xs"
          >
            <div class="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
              <BriefcaseIcon class="size-4" />
            </div>
            <div class="text-left min-w-0">
              <p class="text-xs font-bold text-foreground truncate">All Cases</p>
              <p class="text-[10px] text-muted-foreground truncate">Review &amp; assign</p>
            </div>
          </router-link>

          <router-link
            to="/app/reports/user-engagement"
            class="p-3.5 rounded-xl bg-card border border-border hover:border-primary/60 transition-all flex items-center gap-3 group shadow-xs"
          >
            <div class="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
              <BarChart3Icon class="size-4" />
            </div>
            <div class="text-left min-w-0">
              <p class="text-xs font-bold text-foreground truncate">Reports</p>
              <p class="text-[10px] text-muted-foreground truncate">Activity analytics</p>
            </div>
          </router-link>
        </div>

        <!-- Top Metrics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Department Count -->
          <div class="bg-card border border-border rounded-lg p-5 flex flex-col justify-between shadow-xs">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Departments
              </span>
              <div class="p-2 rounded bg-primary/10 text-primary">
                <Building2Icon class="size-5" />
              </div>
            </div>
            <div class="mt-4">
              <div class="text-3xl font-extrabold text-foreground font-mono">
                {{ managerData.departmentCount }}
              </div>
              <p class="text-[11px] text-muted-foreground mt-1">
                Active organization departments
              </p>
            </div>
            <div class="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
              <router-link to="/app/departments"
                class="text-primary font-semibold hover:underline flex items-center gap-1">
                <span>Manage departments</span>
                <ArrowRightIcon class="size-3" />
              </router-link>
            </div>
          </div>

          <!-- Personnel Count -->
          <div class="bg-card border border-border rounded-lg p-5 flex flex-col justify-between shadow-xs">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Department Heads
              </span>
              <div class="p-2 rounded bg-ink-900/10 text-ink-900">
                <UsersIcon class="size-5" />
              </div>
            </div>
            <div class="mt-4">
              <div class="text-3xl font-extrabold text-foreground font-mono">
                {{ managerData.userCount }}
              </div>
              <p class="text-[11px] text-muted-foreground mt-1">
                Department heads assigned to review cases
              </p>
            </div>
            <div class="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
              <router-link to="/app/department-heads"
                class="text-ink-900 font-semibold hover:underline flex items-center gap-1">
                <span>Manage department heads</span>
                <ArrowRightIcon class="size-3" />
              </router-link>
            </div>
          </div>

          <!-- Security & Audit Telemetry -->
          <div class="bg-card border border-border rounded-lg p-5 flex flex-col justify-between shadow-xs">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Privacy Safeguards
              </span>
              <div class="p-2 rounded bg-emerald-500/10 text-emerald-700">
                <ShieldCheckIcon class="size-5" />
              </div>
            </div>
            <div class="mt-4">
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-foreground">Zero IP Tracking</span>
                <span
                  class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ACTIVE
                </span>
              </div>
              <p class="text-[11px] text-muted-foreground mt-1">
                Aligned with ISO 37002 Case Reporting standards
              </p>
            </div>
            <div class="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
              <span class="text-muted-foreground text-[11px]">Reporter Privacy</span>
              <span class="text-emerald-700 font-mono text-[11px]">Protected</span>
            </div>
          </div>
        </div>

        <!-- Manager Quick Operations Workspace -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-4">
            <div class="bg-card border border-border rounded-lg p-5 shadow-xs">
              <h2 class="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <FolderLockIcon class="size-4 text-primary" />
                Case Assignment &amp; Oversight
              </h2>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div class="p-4 rounded-lg bg-muted/40 border border-border flex flex-col justify-between">
                  <div>
                    <h3 class="text-xs font-bold text-foreground">Case Queue &amp; Assignments</h3>
                    <p class="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      Review incoming cases across departments and assign unassigned cases to Department Heads.
                    </p>
                  </div>
                  <div class="mt-4">
                    <router-link to="/app/cases"
                      class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                      Open Cases Queue &rarr;
                    </router-link>
                  </div>
                </div>

                <div class="p-4 rounded-lg bg-muted/40 border border-border flex flex-col justify-between">
                  <div>
                    <h3 class="text-xs font-bold text-foreground">Activity Analytics</h3>
                    <p class="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      Check reports by department, resolution progress, and case category counts.
                    </p>
                  </div>
                  <div class="mt-4">
                    <router-link to="/app/reports/user-engagement"
                      class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                      View Reports &rarr;
                    </router-link>
                  </div>
                </div>
              </div>
            </div>

            <!-- Operational Guidelines Card -->
            <div class="p-4 rounded-lg bg-primary/5 border border-primary/20 text-xs space-y-1.5">
              <div class="flex items-center gap-2 text-primary font-bold">
                <AlertTriangleIcon class="size-4 shrink-0" />
                <span>Privacy &amp; Role Notice</span>
              </div>
              <p class="text-[11px] text-muted-foreground leading-relaxed">
                As Manager, case assignment actions are logged in the audit ledger. Case reporter identity, full statements, and evidence files remain confidential with the assigned Department Head.
              </p>
            </div>
          </div>

          <!-- Recent Notifications Strip (Manager) -->
          <div class="bg-card border border-border rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <h2 class="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <BellIcon class="size-3.5 text-primary" />
                  System Notifications
                </h2>
                <router-link to="/app/notifications" class="text-[11px] text-primary hover:underline font-semibold">
                  View all
                </router-link>
              </div>

              <div v-if="recentNotifications.length === 0" class="py-8 text-center text-xs text-muted-foreground">
                No recent notifications recorded.
              </div>

              <div v-else class="space-y-2.5">
                <div v-for="item in recentNotifications" :key="item.id"
                  class="p-2.5 rounded border border-border bg-background text-xs space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="px-1.5 py-0.2 rounded text-[10px] font-bold"
                      :class="item.status === 'UNREAD' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'">
                      {{ item.status }}
                    </span>
                    <span class="text-[10px] text-muted-foreground font-mono">
                      {{ formatDate(item.sentAt) }}
                    </span>
                  </div>
                  <p class="font-semibold text-foreground text-xs line-clamp-1">
                    {{ item.title }}
                  </p>
                  <p class="text-[11px] text-muted-foreground line-clamp-2">
                    {{ item.message }}
                  </p>
                </div>
              </div>
            </div>

            <div class="pt-3 border-t border-border mt-3">
              <router-link to="/app/notifications"
                class="w-full inline-flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium">
                Go to notification center &rarr;
              </router-link>
            </div>
          </div>
        </div>
      </section>

      <!-- DEPARTMENT HEAD DASHBOARD BRANCH -->
      <section v-else-if="deptHeadData" class="space-y-6">
        <!-- Top Department Head Metrics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Assigned Department Banner -->
          <div class="md:col-span-2 bg-card border border-border rounded-lg p-5 flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Assigned Operational Directorate
              </span>
              <span
                class="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                AUTHORIZED DIRECT INTAKE
              </span>
            </div>
            <div class="mt-3">
              <h2 class="text-2xl font-bold text-foreground tracking-tight">
                {{ departmentDisplayName }}
              </h2>
              <p class="text-xs text-muted-foreground mt-1">
                Direct statutory authority for initial case claim, timeline analysis, and status progression.
              </p>
            </div>
            <div class="mt-4 pt-3 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
              <span v-if="typeof deptHeadData.department !== 'string' && deptHeadData.department?.id">
                Department ID: <strong class="text-foreground font-mono">{{ deptHeadData.department.id }}</strong>
              </span>
              <span v-else>
                Directorate Node: <strong class="text-foreground font-mono">Douala Central Hub</strong>
              </span>
            </div>
          </div>

          <!-- Assigned Case Workload Metric -->
          <div class="bg-card border border-border rounded-lg p-5 flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active Assigned Cases
              </span>
              <div class="p-2 rounded bg-primary/10 text-primary">
                <FileTextIcon class="size-5" />
              </div>
            </div>
            <div class="mt-3">
              <div class="text-3xl font-extrabold text-foreground font-mono">
                {{ deptHeadData.assignedCaseCount }}
              </div>
              <p class="text-[11px] text-muted-foreground mt-1">
                Cases actively undergoing review or awaiting action
              </p>
            </div>
            <div class="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
              <router-link to="/app/cases" class="text-primary font-semibold hover:underline flex items-center gap-1">
                <span>View claimed cases</span>
                <ArrowRightIcon class="size-3" />
              </router-link>
            </div>
          </div>
        </div>

        <!-- Department Head Workspace -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-4">
            <div class="bg-card border border-border rounded-lg p-5 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2Icon class="size-4 text-primary" />
                  Investigation Queue &amp; Actions
                </h3>
                <router-link to="/app/cases" class="text-xs font-semibold text-primary hover:underline">
                  View full queue &rarr;
                </router-link>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div class="p-4 rounded-lg bg-muted/40 border border-border space-y-2">
                  <h4 class="text-xs font-bold text-foreground">Department Intake Queue</h4>
                  <p class="text-[11px] text-muted-foreground leading-relaxed">
                    Cases filed under {{ departmentDisplayName }} that are awaiting initial claim and investigation.
                  </p>
                  <div class="pt-2">
                    <AppButton to="/app/cases" size="sm" class="w-full">
                      Open Queue
                    </AppButton>
                  </div>
                </div>

                <div class="p-4 rounded-lg bg-muted/40 border border-border space-y-2">
                  <h4 class="text-xs font-bold text-foreground">Secure Case Reporter Channel</h4>
                  <p class="text-[11px] text-muted-foreground leading-relaxed">
                    Respond to confidential inquiries from anonymous reporters on claimed investigations.
                  </p>
                  <div class="pt-2">
                    <AppButton to="/app/cases" variant="outline" size="sm" class="w-full">
                      Check Messages
                    </AppButton>
                  </div>
                </div>
              </div>
            </div>

            <!-- Investigation Protocol Notice -->
            <div class="p-4 rounded-lg bg-ink-900/5 border border-ink-900/20 text-xs space-y-1.5">
              <div class="flex items-center gap-2 text-ink-900 font-bold">
                <ShieldCheckIcon class="size-4 shrink-0 text-primary" />
                <span>Forensic Investigation Protocol</span>
              </div>
              <p class="text-[11px] text-muted-foreground leading-relaxed">
                All status modifications require a mandatory audit note. Cases resolved or dismissed additionally
                require a comprehensive resolution summary permanently stored in the audit trail.
              </p>
            </div>
          </div>

          <!-- Notifications Widget (Dept Head) -->
          <div class="bg-card border border-border rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <h2 class="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <BellIcon class="size-3.5 text-primary" />
                  Case Alerts
                </h2>
                <router-link to="/app/notifications" class="text-[11px] text-primary hover:underline font-semibold">
                  View all
                </router-link>
              </div>

              <div v-if="recentNotifications.length === 0" class="py-8 text-center text-xs text-muted-foreground">
                No recent notifications recorded.
              </div>

              <div v-else class="space-y-2.5">
                <div v-for="item in recentNotifications" :key="item.id"
                  class="p-2.5 rounded border border-border bg-background text-xs space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="px-1.5 py-0.2 rounded text-[10px] font-bold"
                      :class="item.status === 'UNREAD' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'">
                      {{ item.status }}
                    </span>
                    <span class="text-[10px] text-muted-foreground font-mono">
                      {{ formatDate(item.sentAt) }}
                    </span>
                  </div>
                  <p class="font-semibold text-foreground text-xs line-clamp-1">
                    {{ item.title }}
                  </p>
                  <p class="text-[11px] text-muted-foreground line-clamp-2">
                    {{ item.message }}
                  </p>
                </div>
              </div>
            </div>

            <div class="pt-3 border-t border-border mt-3">
              <router-link to="/app/notifications"
                class="w-full inline-flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium">
                Go to notification center &rarr;
              </router-link>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
