<!-- pages/staff/manager/ManageDepartments.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Department } from '@/features/manager/types'
import { getDepartments, deleteDepartment } from '@/features/manager/api'
import { toast } from '@/plugins/toast'
import AppButton from '@/components/common/AppButton.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import DepartmentModal from '@/components/complex/manager/DepartmentModal.vue'
import ConfirmDeleteModal from '@/components/complex/manager/ConfirmDeleteModal.vue'
import {
  Building2Icon,
  PlusIcon,
  SearchIcon,
  PencilIcon,
  Trash2Icon,
  RefreshCwIcon,
  ShieldCheckIcon,
  CopyIcon,
  CheckIcon,
} from '@lucide/vue'

const departments = ref<Department[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const searchQuery = ref('')
const copiedId = ref<string | null>(null)

// Modal States
const isModalOpen = ref(false)
const selectedDept = ref<Department | null>(null)

// Delete State
const isDeleteModalOpen = ref(false)
const deptToDelete = ref<Department | null>(null)
const isDeleting = ref(false)

async function fetchDepartments() {
  isLoading.value = true
  error.value = null
  try {
    departments.value = await getDepartments()
  } catch (err: any) {
    error.value = err?.message || 'Failed to load departments. Please check connectivity.'
  } finally {
    isLoading.value = false
  }
}

const filteredDepartments = computed(() => {
  if (!searchQuery.value.trim()) return departments.value
  const q = searchQuery.value.trim().toLowerCase()
  return departments.value.filter(
    (d) => d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)
  )
})

function openCreateModal() {
  selectedDept.value = null
  isModalOpen.value = true
}

function openEditModal(dept: Department) {
  selectedDept.value = dept
  isModalOpen.value = true
}

function handleDepartmentSaved(saved: Department) {
  const index = departments.value.findIndex((d) => d.id === saved.id)
  if (index !== -1) {
    departments.value[index] = saved
  } else {
    departments.value.unshift(saved)
  }
}

function confirmDelete(dept: Department) {
  deptToDelete.value = dept
  isDeleteModalOpen.value = true
}

async function handleDelete() {
  if (!deptToDelete.value) return
  isDeleting.value = true

  try {
    await deleteDepartment(deptToDelete.value.id)
    toast.success(`Department "${deptToDelete.value.name}" deleted.`)
    departments.value = departments.value.filter((d) => d.id !== deptToDelete.value?.id)
    isDeleteModalOpen.value = false
    deptToDelete.value = null
  } catch (err: any) {
    toast.error(err?.response?.data?.message || err?.message || 'Failed to delete department.')
  } finally {
    isDeleting.value = false
  }
}

function copyId(id: string) {
  navigator.clipboard.writeText(id)
  copiedId.value = id
  toast.success('Department ID copied.')
  setTimeout(() => {
    if (copiedId.value === id) copiedId.value = null
  }, 2000)
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
  fetchDepartments()
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
      <div>
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
            Governance Console · Directorates
          </span>
          <span class="text-xs text-muted-foreground font-mono">
            Douala &amp; Yaoundé Regional Nodes
          </span>
        </div>
        <h1 class="text-2xl font-bold text-foreground mt-1 tracking-tight">
          Manage Enterprise Departments
        </h1>
        <p class="text-xs text-muted-foreground mt-0.5">
          Configure operational directorates available for confidential case intake and investigator allocation.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <AppButton
          variant="outline"
          size="sm"
          :disabled="isLoading"
          @click="fetchDepartments"
        >
          <RefreshCwIcon class="size-3.5 mr-1.5" :class="{ 'animate-spin': isLoading }" />
          Refresh
        </AppButton>

        <button
          type="button"
          class="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary-700 transition-colors shadow-xs cursor-pointer"
          @click="openCreateModal"
        >
          <PlusIcon class="size-4" />
          <span>Add Department</span>
        </button>
      </div>
    </div>

    <!-- Error Banner -->
    <ErrorBanner
      v-if="error"
      :message="error"
      @retry="fetchDepartments"
    />

    <!-- Telemetry Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="bg-card border border-border rounded-lg p-4 flex items-center justify-between card-creamy">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Operational Units
          </span>
          <p class="text-2xl font-extrabold text-foreground font-mono mt-0.5">
            {{ departments.length }}
          </p>
          <span class="text-[11px] text-muted-foreground">Registered directorates in organization</span>
        </div>
        <div class="p-2.5 rounded bg-primary/10 text-primary">
          <Building2Icon class="size-5" />
        </div>
      </div>

      <div class="bg-card border border-border rounded-lg p-4 flex items-center justify-between card-creamy">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Intake Routing Status
          </span>
          <div class="flex items-center gap-1.5 mt-1">
            <span class="size-2 rounded-full bg-emerald-500"></span>
            <span class="text-xs font-bold text-foreground">Air-Gapped Active</span>
          </div>
          <span class="text-[11px] text-muted-foreground">ISO 37002 compliant dispatch</span>
        </div>
        <div class="p-2.5 rounded bg-emerald-500/10 text-emerald-700">
          <ShieldCheckIcon class="size-5" />
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
          placeholder="Filter by department name or ID..."
          class="w-full h-8 pl-8 pr-3 text-xs rounded border border-border bg-card text-foreground focus:outline-none focus:border-primary"
        />
      </div>
      <span class="text-xs text-muted-foreground font-mono">
        Showing {{ filteredDepartments.length }} of {{ departments.length }}
      </span>
    </div>

    <!-- Content Table -->
    <div v-if="isLoading" class="space-y-3 animate-pulse">
      <div v-for="i in 4" :key="i" class="h-14 bg-muted/40 rounded-lg border border-border"></div>
    </div>

    <EmptyState
      v-else-if="filteredDepartments.length === 0"
      title="No departments found"
      :description="searchQuery ? 'No departments match your search term.' : 'No departments have been configured yet. Add your first department.'"
    >
      <template #action>
        <button
          v-if="!searchQuery"
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary-700 transition-colors"
          @click="openCreateModal"
        >
          <PlusIcon class="size-4" />
          <span>Create Department</span>
        </button>
      </template>
    </EmptyState>

    <div v-else class="bg-card border border-border rounded-lg overflow-x-auto shadow-xs card-creamy">
      <table class="w-full text-left text-xs">
        <thead class="bg-muted/60 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
          <tr>
            <th class="p-3.5">Department Name</th>
            <th class="p-3.5">System Reference ID</th>
            <th class="p-3.5">Created Date</th>
            <th class="p-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="dept in filteredDepartments"
            :key="dept.id"
            class="hover:bg-muted/20 transition-colors"
          >
            <!-- Department Name -->
            <td class="p-3.5">
              <div class="flex items-center gap-2.5">
                <div class="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Building2Icon class="size-4" />
                </div>
                <div>
                  <span class="font-bold text-foreground text-sm">{{ dept.name }}</span>
                  <p class="text-[11px] text-muted-foreground">Available on confidential intake form</p>
                </div>
              </div>
            </td>

            <!-- Reference ID -->
            <td class="p-3.5 font-mono text-xs">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <span class="truncate max-w-[140px]" :title="dept.id">{{ dept.id }}</span>
                <button
                  type="button"
                  class="text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded"
                  title="Copy Department ID"
                  @click="copyId(dept.id)"
                >
                  <CheckIcon v-if="copiedId === dept.id" class="size-3 text-emerald-600" />
                  <CopyIcon v-else class="size-3" />
                </button>
              </div>
            </td>

            <!-- Created Date -->
            <td class="p-3.5 text-muted-foreground font-mono">
              {{ formatDate(dept.createdAt) }}
            </td>

            <!-- Actions -->
            <td class="p-3.5 text-right whitespace-nowrap">
              <div class="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  class="p-1.5 rounded border border-border hover:bg-muted text-foreground transition-colors cursor-pointer"
                  title="Edit Department"
                  @click="openEditModal(dept)"
                >
                  <PencilIcon class="size-3.5" />
                </button>

                <button
                  type="button"
                  class="p-1.5 rounded border border-destructive/30 hover:bg-destructive/10 text-destructive transition-colors cursor-pointer"
                  title="Delete Department"
                  @click="confirmDelete(dept)"
                >
                  <Trash2Icon class="size-3.5" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create / Edit Department Modal -->
    <DepartmentModal
      :is-open="isModalOpen"
      :department="selectedDept"
      @close="isModalOpen = false"
      @saved="handleDepartmentSaved"
    />

    <!-- Confirm Delete Modal -->
    <ConfirmDeleteModal
      :is-open="isDeleteModalOpen"
      title="Delete Department"
      message="Are you sure you want to remove this department? Whistleblower forms will no longer list this unit for incoming incident reporting."
      :item-name="deptToDelete?.name"
      :is-deleting="isDeleting"
      @close="isDeleteModalOpen = false"
      @confirm="handleDelete"
    />
  </div>
</template>
