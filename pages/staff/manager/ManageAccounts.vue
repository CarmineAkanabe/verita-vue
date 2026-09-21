<!-- pages/staff/manager/ManageAccounts.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Department, DepartmentHeadUser } from '@/features/manager/types'
import {
  getDepartmentHeads,
  getDepartments,
  deleteDepartmentHead,
} from '@/features/manager/api'
import { getAvatarUrl } from '@/utils/avatar'
import { toast } from '@/plugins/toast'
import AppButton from '@/components/common/AppButton.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import DepartmentHeadModal from '@/components/complex/manager/DepartmentHeadModal.vue'
import ConfirmDeleteModal from '@/components/complex/manager/ConfirmDeleteModal.vue'
import {
  UsersIcon,
  UserPlusIcon,
  SearchIcon,
  PencilIcon,
  Trash2Icon,
  RefreshCwIcon,
  Building2Icon,
  RadioIcon,
} from '@lucide/vue'

const departmentHeads = ref<DepartmentHeadUser[]>([])
const departments = ref<Department[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const searchQuery = ref('')

// Modal States
const isModalOpen = ref(false)
const selectedOfficer = ref<DepartmentHeadUser | null>(null)

// Delete State
const isDeleteModalOpen = ref(false)
const officerToDelete = ref<DepartmentHeadUser | null>(null)
const isDeleting = ref(false)

async function loadData() {
  isLoading.value = true
  error.value = null

  try {
    const [heads, depts] = await Promise.all([
      getDepartmentHeads(),
      getDepartments(),
    ])
    departmentHeads.value = heads
    departments.value = depts
  } catch (err: any) {
    error.value = err?.message || 'Failed to load personnel accounts. Please check connectivity.'
  } finally {
    isLoading.value = false
  }
}

const onlineCount = computed(() => {
  return departmentHeads.value.filter((h) => h.presenceStatus === 'ONLINE').length
})

const uniqueDeptCount = computed(() => {
  const set = new Set(
    departmentHeads.value
      .map((h) => h.departmentId || h.department?.id)
      .filter(Boolean)
  )
  return set.size
})

const filteredOfficers = computed(() => {
  if (!searchQuery.value.trim()) return departmentHeads.value
  const q = searchQuery.value.trim().toLowerCase()
  return departmentHeads.value.filter((h) => {
    const fullName = `${h.firstName} ${h.lastName}`.toLowerCase()
    const email = h.email.toLowerCase()
    const deptName = (h.department?.name || '').toLowerCase()
    return fullName.includes(q) || email.includes(q) || deptName.includes(q)
  })
})

function getInitials(officer: DepartmentHeadUser): string {
  const f = officer.firstName?.charAt(0) || ''
  const l = officer.lastName?.charAt(0) || ''
  return (f + l).toUpperCase() || 'DH'
}

function resolveDeptName(officer: DepartmentHeadUser): string {
  if (officer.department?.name) return officer.department.name
  const match = departments.value.find((d) => d.id === officer.departmentId)
  return match?.name || 'General Department'
}

function openCreateModal() {
  selectedOfficer.value = null
  isModalOpen.value = true
}

function openEditModal(officer: DepartmentHeadUser) {
  selectedOfficer.value = officer
  isModalOpen.value = true
}

function handleOfficerSaved(saved: DepartmentHeadUser) {
  const index = departmentHeads.value.findIndex((h) => h.id === saved.id)
  if (index !== -1) {
    departmentHeads.value[index] = saved
  } else {
    departmentHeads.value.unshift(saved)
  }
}

function confirmDelete(officer: DepartmentHeadUser) {
  officerToDelete.value = officer
  isDeleteModalOpen.value = true
}

async function handleDelete() {
  if (!officerToDelete.value) return
  isDeleting.value = true

  try {
    await deleteDepartmentHead(officerToDelete.value.id)
    const name = `${officerToDelete.value.firstName} ${officerToDelete.value.lastName}`
    toast.success(`Officer account for ${name} has been removed.`)
    departmentHeads.value = departmentHeads.value.filter(
      (h) => h.id !== officerToDelete.value?.id
    )
    isDeleteModalOpen.value = false
    officerToDelete.value = null
  } catch (err: any) {
    toast.error(err?.response?.data?.message || err?.message || 'Failed to remove officer account.')
  } finally {
    isDeleting.value = false
  }
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
      <div>
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
            Governance Console · Personnel
          </span>
          <span class="text-xs text-muted-foreground font-mono">
            Douala &amp; Yaoundé Regional Nodes
          </span>
        </div>
        <h1 class="text-2xl font-bold text-foreground mt-1 tracking-tight">
          Manage Personnel Accounts
        </h1>
        <p class="text-xs text-muted-foreground mt-0.5">
          Provision authorized Department Head credentials, assign directorates, and monitor real-time presence.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <AppButton
          variant="outline"
          size="sm"
          :disabled="isLoading"
          @click="loadData"
        >
          <RefreshCwIcon class="size-3.5 mr-1.5" :class="{ 'animate-spin': isLoading }" />
          Refresh
        </AppButton>

        <button
          type="button"
          class="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary-700 transition-colors shadow-xs cursor-pointer"
          @click="openCreateModal"
        >
          <UserPlusIcon class="size-4" />
          <span>Provision Officer</span>
        </button>
      </div>
    </div>

    <!-- Error Banner -->
    <ErrorBanner
      v-if="error"
      :message="error"
      @retry="loadData"
    />

    <!-- Telemetry Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-card border border-border rounded-lg p-4 flex items-center justify-between card-creamy">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Officers
          </span>
          <p class="text-2xl font-extrabold text-foreground font-mono mt-0.5">
            {{ departmentHeads.length }}
          </p>
          <span class="text-[11px] text-muted-foreground">Authorized Department Heads</span>
        </div>
        <div class="p-2.5 rounded bg-primary/10 text-primary">
          <UsersIcon class="size-5" />
        </div>
      </div>

      <div class="bg-card border border-border rounded-lg p-4 flex items-center justify-between card-creamy">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Online Presence
          </span>
          <div class="flex items-center gap-2 mt-0.5">
            <p class="text-2xl font-extrabold text-foreground font-mono">
              {{ onlineCount }}
            </p>
            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span class="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </span>
          </div>
          <span class="text-[11px] text-muted-foreground">Connected to investigation channel</span>
        </div>
        <div class="p-2.5 rounded bg-emerald-500/10 text-emerald-700">
          <RadioIcon class="size-5" />
        </div>
      </div>

      <div class="bg-card border border-border rounded-lg p-4 flex items-center justify-between card-creamy">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Covered Directorates
          </span>
          <p class="text-2xl font-extrabold text-foreground font-mono mt-0.5">
            {{ uniqueDeptCount }} / {{ departments.length }}
          </p>
          <span class="text-[11px] text-muted-foreground">Departments with active lead</span>
        </div>
        <div class="p-2.5 rounded bg-ink-900/10 text-ink-900">
          <Building2Icon class="size-5" />
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="flex items-center justify-between gap-3 border-b border-border pb-3">
      <div class="relative w-full sm:w-72">
        <SearchIcon class="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Filter by name, email, or department..."
          class="w-full h-8 pl-8 pr-3 text-xs rounded border border-border bg-card text-foreground focus:outline-none focus:border-primary"
        />
      </div>
      <span class="text-xs text-muted-foreground font-mono">
        Showing {{ filteredOfficers.length }} of {{ departmentHeads.length }}
      </span>
    </div>

    <!-- Content Table -->
    <div v-if="isLoading" class="space-y-3 animate-pulse">
      <div v-for="i in 4" :key="i" class="h-16 bg-muted/40 rounded-lg border border-border"></div>
    </div>

    <EmptyState
      v-else-if="filteredOfficers.length === 0"
      title="No personnel accounts found"
      :description="searchQuery ? 'No officers match your search criteria.' : 'No Department Head officers have been provisioned yet.'"
    >
      <template #action>
        <button
          v-if="!searchQuery"
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary-700 transition-colors"
          @click="openCreateModal"
        >
          <UserPlusIcon class="size-4" />
          <span>Provision First Officer</span>
        </button>
      </template>
    </EmptyState>

    <div v-else class="bg-card border border-border rounded-lg overflow-x-auto shadow-xs card-creamy">
      <table class="w-full text-left text-xs">
        <thead class="bg-muted/60 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
          <tr>
            <th class="p-3.5">Investigator Name</th>
            <th class="p-3.5">Corporate Email</th>
            <th class="p-3.5">Assigned Department</th>
            <th class="p-3.5">Presence</th>
            <th class="p-3.5">Registered</th>
            <th class="p-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="officer in filteredOfficers"
            :key="officer.id"
            class="hover:bg-muted/20 transition-colors"
          >
            <!-- Name + Avatar -->
            <td class="p-3.5">
              <div class="flex items-center gap-3">
                <div class="size-9 rounded-full overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  <img
                    v-if="officer.profilePicture"
                    :src="getAvatarUrl(officer.profilePicture) ?? undefined"
                    alt="Avatar"
                    class="w-full h-full object-cover"
                  />
                  <span v-else>{{ getInitials(officer) }}</span>
                </div>
                <div>
                  <span class="font-bold text-foreground text-sm">
                    {{ officer.firstName }} {{ officer.lastName }}
                  </span>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-ink-900/10 text-ink-900">
                      Department Head
                    </span>
                  </div>
                </div>
              </div>
            </td>

            <!-- Email -->
            <td class="p-3.5 font-mono text-xs text-muted-foreground">
              {{ officer.email }}
            </td>

            <!-- Department -->
            <td class="p-3.5">
              <div class="flex items-center gap-1.5">
                <Building2Icon class="size-3.5 text-primary" />
                <span class="font-medium text-foreground">
                  {{ resolveDeptName(officer) }}
                </span>
              </div>
            </td>

            <!-- Presence Status -->
            <td class="p-3.5 whitespace-nowrap">
              <span
                class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold"
                :class="
                  officer.presenceStatus === 'ONLINE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-muted text-muted-foreground border border-border'
                "
              >
                <span
                  class="size-1.5 rounded-full"
                  :class="officer.presenceStatus === 'ONLINE' ? 'bg-emerald-500' : 'bg-muted-foreground/50'"
                ></span>
                {{ officer.presenceStatus === 'ONLINE' ? 'ONLINE' : 'OFFLINE' }}
              </span>
            </td>

            <!-- Date -->
            <td class="p-3.5 text-muted-foreground font-mono">
              {{ formatDate(officer.createdAt) }}
            </td>

            <!-- Actions -->
            <td class="p-3.5 text-right whitespace-nowrap">
              <div class="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  class="p-1.5 rounded border border-border hover:bg-muted text-foreground transition-colors cursor-pointer"
                  title="Edit Officer Profile"
                  @click="openEditModal(officer)"
                >
                  <PencilIcon class="size-3.5" />
                </button>

                <button
                  type="button"
                  class="p-1.5 rounded border border-destructive/30 hover:bg-destructive/10 text-destructive transition-colors cursor-pointer"
                  title="Remove Officer Account"
                  @click="confirmDelete(officer)"
                >
                  <Trash2Icon class="size-3.5" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create / Edit Officer Modal -->
    <DepartmentHeadModal
      :is-open="isModalOpen"
      :officer="selectedOfficer"
      :departments="departments"
      @close="isModalOpen = false"
      @saved="handleOfficerSaved"
    />

    <!-- Confirm Delete Modal -->
    <ConfirmDeleteModal
      :is-open="isDeleteModalOpen"
      title="Remove Officer Account"
      message="Are you sure you want to deactivate and remove this Department Head account? This officer will lose access to active case investigations."
      :item-name="officerToDelete ? `${officerToDelete.firstName} ${officerToDelete.lastName} (${officerToDelete.email})` : ''"
      :is-deleting="isDeleting"
      @close="isDeleteModalOpen = false"
      @confirm="handleDelete"
    />
  </div>
</template>
