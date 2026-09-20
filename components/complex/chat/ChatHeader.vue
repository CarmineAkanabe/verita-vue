<!-- components/complex/chat/ChatHeader.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { DepartmentHeadInfo } from '@/features/chat/types'
import { toast } from '@/plugins/toast'
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  UserIcon,
  CopyIcon,
  RefreshCwIcon,
} from '@lucide/vue'

const props = defineProps<{
  caseId: string
  departmentHead: DepartmentHeadInfo | null
  isReconnecting?: boolean
}>()

const router = useRouter()

const isOnline = computed(() => props.departmentHead?.presenceStatus === 'ONLINE')

async function copyCaseId() {
  try {
    await navigator.clipboard.writeText(props.caseId)
    toast.success('Case ID copied to clipboard.')
  } catch {
    toast.error('Failed to copy Case ID.')
  }
}
</script>

<template>
  <div class="border-b border-[#E2E5EE] bg-white">
    <!-- Reconnecting Alert Banner -->
    <div
      v-if="isReconnecting"
      class="bg-[#FFFBEB] border-b border-[#FDE68A] text-[#92400E] px-4 py-2 text-xs flex items-center justify-center gap-2 animate-in fade-in duration-150"
    >
      <RefreshCwIcon class="size-3.5 animate-spin text-[#D97706]" />
      <span>Consultation stream syncing... Reconnecting in background.</span>
    </div>

    <!-- Main Header Bar -->
    <div class="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <!-- Left: Back Button & Dossier ID -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E5EE] bg-[#F8F9FA] hover:bg-[#F2F4F7] text-xs font-semibold text-[#22293A] transition-colors cursor-pointer"
          @click="router.push({ name: 'case-dashboard' })"
        >
          <ArrowLeftIcon class="size-3.5" />
          <span>Back to Dossier</span>
        </button>

        <div class="h-6 w-px bg-[#E2E5EE] hidden sm:block"></div>

        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              Dossier
            </span>
            <span class="text-xs sm:text-sm font-bold font-mono text-[#22293A]">
              {{ caseId.slice(0, 18) }}...
            </span>
            <button
              type="button"
              class="p-1 text-[#6B7280] hover:text-[#22293A] cursor-pointer rounded"
              title="Copy full Case ID"
              @click="copyCaseId"
            >
              <CopyIcon class="size-3.5" />
            </button>
          </div>
          <p class="text-[11px] text-[#6B7280]">
            Encrypted Two-Way Consultation Channel · Digimark Compliance
          </p>
        </div>
      </div>

      <!-- Right: Department Head Officer Identity Card -->
      <div class="flex items-center gap-3 bg-[#F8F9FA] border border-[#E2E5EE] rounded-xl px-3.5 py-2">
        <div class="relative">
          <div class="h-9 w-9 rounded-lg bg-[#FCF4EE] border border-[#A2561B]/30 flex items-center justify-center text-[#A2561B]">
            <UserIcon class="size-4" />
          </div>
          <!-- Presence pulse indicator -->
          <span
            v-if="departmentHead"
            :class="[
              'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white',
              isOnline ? 'bg-emerald-500' : 'bg-[#9CA3AF]'
            ]"
            :title="isOnline ? 'Officer is currently Online' : 'Officer is currently Offline'"
          ></span>
        </div>

        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-[#22293A]">
              {{ departmentHead?.name || 'Awaiting Assignment' }}
            </span>
            <span
              v-if="departmentHead"
              :class="[
                'text-[10px] uppercase font-bold px-1.5 py-0.5 rounded',
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              ]"
            >
              {{ isOnline ? 'Online' : 'Offline' }}
            </span>
            <span
              v-else
              class="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]"
            >
              Unassigned
            </span>
          </div>
          <p class="text-[10px] text-[#6B7280]">
            {{ departmentHead ? 'Assigned Department Head · Lead Investigator' : 'Queued for General Management triage' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Air-Gap Assurance Ribbon -->
    <div class="px-4 sm:px-6 py-1.5 bg-[#F2F4F7] border-t border-[#E2E5EE] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6B7280]">
      <div class="flex items-center gap-1.5">
        <ShieldCheckIcon class="size-3.5 text-[#A2561B]" />
        <span>Cryptographic Anonymity Enforced · Zero IP Tracking · TLS 1.3</span>
      </div>
      <span class="hidden md:inline">
        Notice: All communications form part of the official corporate compliance record.
      </span>
    </div>
  </div>
</template>
