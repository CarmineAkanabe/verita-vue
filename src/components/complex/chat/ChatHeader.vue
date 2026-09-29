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

const props = withDefaults(
  defineProps<{
    caseId: string
    departmentHead?: DepartmentHeadInfo | null
    isReconnecting?: boolean
    viewer?: 'REPORTER' | 'STAFF'
    backTo?: string
  }>(),
  {
    departmentHead: null,
    isReconnecting: false,
    viewer: 'REPORTER',
  }
)

const router = useRouter()

const isOnline = computed(() => String(props.departmentHead?.presenceStatus || '').toUpperCase() === 'ONLINE')

function handleBack() {
  if (props.backTo) {
    router.push(props.backTo)
  } else if (props.viewer === 'STAFF') {
    router.push(`/app/cases/${props.caseId}`)
  } else {
    router.push({ name: 'case-dashboard' })
  }
}

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
    <div v-if="isReconnecting"
      class="bg-[#FFFBEB] border-b border-[#FDE68A] text-[#92400E] px-4 py-2 text-xs flex items-center justify-center gap-2 animate-in fade-in duration-150">
      <RefreshCwIcon class="size-3.5 animate-spin text-[#D97706]" />
      <span>Consultation stream syncing... Reconnecting in background.</span>
    </div>

    <!-- Main Header Bar -->
    <div class="px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#FFFDF8]">
      <!-- Left: Back Button & Case ID -->
      <div class="flex items-center gap-3">
        <button type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#EADBCE] bg-[#FAF7F2] hover:bg-[#F4EFE6] text-xs font-semibold text-[#22293A] transition-colors cursor-pointer"
          @click="handleBack">
          <ArrowLeftIcon class="size-3.5" />
          <span>{{ viewer === 'STAFF' ? 'Back to Case' : 'Back to Dashboard' }}</span>
        </button>

        <div class="h-6 w-px bg-[#EADBCE] hidden sm:block"></div>

        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-[#A2561B] uppercase tracking-wider">
              Case
            </span>
            <span class="text-xs sm:text-sm font-bold font-mono text-[#22293A]">
              {{ caseId.slice(0, 18) }}...
            </span>
            <button type="button" class="p-1 text-[#6B7280] hover:text-[#22293A] cursor-pointer rounded"
              title="Copy full Case ID" @click="copyCaseId">
              <CopyIcon class="size-3.5" />
            </button>
          </div>
          <p class="text-[11px] text-[#6B7280]">
            {{ viewer === 'STAFF' ? 'Direct Consultation Stream' : 'Confidential Case Consultation' }}
          </p>
        </div>
      </div>

      <!-- Right: Counterpart Identity Card -->
      <!-- If Viewer is STAFF: Counterpart is Anonymous Case Reporter -->
      <div v-if="viewer === 'STAFF'"
        class="flex items-center gap-3 bg-[#FAF7F2] border border-[#EADBCE] rounded-xl px-3.5 py-2">
        <div
          class="h-9 w-9 rounded-lg bg-[#FCF4EE] border border-[#A2561B]/30 flex items-center justify-center text-[#A2561B]">
          <ShieldCheckIcon class="size-5" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-[#22293A]">
              Reporter (Reporter #{{ caseId.slice(0, 6) }})
            </span>
            <span
              class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#FCF4EE] text-[#A2561B] border border-[#A2561B]/20">
              Anonymous
            </span>
          </div>
          <p class="text-[10px] text-[#6B7280]">
            Protected &amp; Confidential
          </p>
        </div>
      </div>

      <!-- If Viewer is REPORTER: Counterpart is Department Head Officer -->
      <div v-else class="flex items-center gap-3 bg-[#FAF7F2] border border-[#EADBCE] rounded-xl px-3.5 py-2">
        <div class="relative">
          <div
            class="h-9 w-9 rounded-lg bg-[#FCF4EE] border border-[#A2561B]/30 flex items-center justify-center text-[#A2561B]">
            <UserIcon class="size-4" />
          </div>
          <!-- Presence pulse indicator -->
          <span v-if="departmentHead" :class="[
            'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white',
            isOnline ? 'bg-emerald-500' : 'bg-[#9CA3AF]'
          ]" :title="isOnline ? 'Officer is currently Online' : 'Officer is currently Offline'"></span>
        </div>

        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-[#22293A]">
              {{ departmentHead?.name || 'Awaiting Assignment' }}
            </span>
            <span v-if="departmentHead" :class="[
              'text-[10px] uppercase font-bold px-1.5 py-0.5 rounded',
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            ]">
              {{ isOnline ? 'Online' : 'Offline' }}
            </span>
            <span v-else
              class="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
              Unassigned
            </span>
          </div>
          <p class="text-[10px] text-[#6B7280]">
            {{ departmentHead ? 'Assigned Department Head' : 'Pending Review' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Security Assurance Ribbon -->
    <div
      class="px-4 sm:px-6 py-1.5 bg-[#F6F7F9] border-t border-[#EADBCE] flex items-center justify-between text-[11px] text-[#6B7280]">
      <div class="flex items-center gap-1.5">
        <ShieldCheckIcon class="size-3.5 text-[#A2561B]" />
        <span>End-to-End Secure &amp; Confidential Channel</span>
      </div>
      <span class="hidden md:inline text-[10px] text-[#9CA3AF]">
        Messages are encrypted and confidential
      </span>
    </div>
  </div>
</template>
