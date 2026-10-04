<!-- components/complex/chat/ChatHeader.vue -->
<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { DepartmentHeadInfo } from '@/features/chat/types'
import { toast } from '@/plugins/toast'
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  UserIcon,
  CopyIcon,
  RefreshCwIcon,
  WifiOffIcon,
} from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    caseId: string
    departmentHead?: DepartmentHeadInfo | null
    isReconnecting?: boolean
    isSocketConnected?: boolean
    socketStatus?: string
    viewer?: 'REPORTER' | 'STAFF'
    backTo?: string
  }>(),
  {
    departmentHead: null,
    isReconnecting: false,
    isSocketConnected: true,
    socketStatus: 'connected',
    viewer: 'REPORTER',
  }
)

const emit = defineEmits<{
  (e: 'reconnect'): void
}>()

const router = useRouter()

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
  <div class="border-b border-[#EADBCE] bg-[#FFFDF8]">
    <!-- Offline WebSocket Alert Bar -->
    <div
      v-if="!isSocketConnected"
      class="bg-[#FFF4E5] border-b border-[#F8D4A6] text-[#8C430E] px-4 py-2 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150"
    >
      <div class="flex items-center gap-2 font-medium">
        <WifiOffIcon class="size-4 shrink-0 text-[#C05621]" />
        <span>Real-time channel offline (Reverb is not running). Connect WebSocket to transmit or view incoming messages.</span>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#A2561B] hover:bg-[#8C430E] text-white text-[11px] font-semibold transition-colors cursor-pointer shrink-0 shadow-2xs"
        @click="emit('reconnect')"
      >
        <RefreshCwIcon class="size-3" />
        <span>Reconnect</span>
      </button>
    </div>

    <!-- Reconnecting Alert Banner -->
    <div
      v-else-if="isReconnecting"
      class="bg-[#FFFBEB] border-b border-[#FDE68A] text-[#92400E] px-4 py-2 text-xs flex items-center justify-center gap-2 animate-in fade-in duration-150"
    >
      <RefreshCwIcon class="size-3.5 animate-spin text-[#D97706]" />
      <span>Consultation stream syncing... Reconnecting in background.</span>
    </div>

    <!-- Main Header Bar -->
    <div class="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <!-- Left: Back Button & Case ID -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#EADBCE] bg-[#FAF7F2] hover:bg-[#F4EFE6] text-xs font-semibold text-[#22293A] transition-colors cursor-pointer shadow-2xs"
          @click="handleBack"
        >
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
            {{ viewer === 'STAFF' ? 'Direct Consultation Stream' : 'Confidential Case Consultation' }}
          </p>
        </div>
      </div>

      <!-- Right: Channel Live Status & Counterpart Identity Card -->
      <div class="flex items-center gap-2.5">
        <!-- Live Real-Time Socket Status Pill -->
        <div
          v-if="isSocketConnected"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium shadow-2xs"
          title="Reverb WebSocket connected"
        >
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Live Channel</span>
        </div>
        <button
          v-else
          type="button"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
          title="Click to reconnect WebSocket"
          @click="emit('reconnect')"
        >
          <span class="h-2 w-2 rounded-full bg-amber-500"></span>
          <span>Reverb Offline</span>
        </button>

        <!-- If Viewer is STAFF: Counterpart is Anonymous Case Reporter -->
        <div
          v-if="viewer === 'STAFF'"
          class="flex items-center gap-2.5 bg-[#FAF7F2] border border-[#EADBCE] rounded-xl px-3 py-1.5 shadow-2xs"
        >
          <div class="h-8 w-8 rounded-lg bg-[#FCF4EE] border border-[#A2561B]/30 flex items-center justify-center text-[#A2561B]">
            <ShieldCheckIcon class="size-4" />
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold text-[#22293A]">
                Reporter #{{ caseId.slice(0, 6) }}
              </span>
              <span class="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-[#FCF4EE] text-[#A2561B] border border-[#A2561B]/20">
                Anonymous
              </span>
            </div>
            <p class="text-[10px] text-[#6B7280]">
              Protected &amp; Confidential
            </p>
          </div>
        </div>

        <!-- If Viewer is REPORTER: Counterpart is Department Head Officer -->
        <!-- Rule 2.D Privacy Compliance: Do not leak investigator online/offline telemetry to the reporter -->
        <div
          v-else
          class="flex items-center gap-2.5 bg-[#FAF7F2] border border-[#EADBCE] rounded-xl px-3 py-1.5 shadow-2xs"
        >
          <div class="h-8 w-8 rounded-lg bg-[#FCF4EE] border border-[#A2561B]/30 flex items-center justify-center text-[#A2561B]">
            <UserIcon class="size-4" />
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold text-[#22293A]">
                {{ departmentHead?.name || 'Awaiting Assignment' }}
              </span>
              <span
                v-if="departmentHead"
                class="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-[#F4EFE6] text-[#575E71] border border-[#E2D5C3]"
              >
                Investigator
              </span>
              <span
                v-else
                class="text-[9px] uppercase font-semibold px-1.5 py-0.2 rounded bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]"
              >
                Unassigned
              </span>
            </div>
            <p class="text-[10px] text-[#6B7280]">
              {{ departmentHead ? 'Assigned Department Head' : 'Pending Review' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Security Assurance Ribbon -->
    <div class="px-4 sm:px-6 py-1.5 bg-[#FAF7F2] border-t border-[#EADBCE] flex items-center justify-between text-[11px] text-[#6B7280]">
      <div class="flex items-center gap-1.5">
        <ShieldCheckIcon class="size-3.5 text-[#A2561B]" />
        <span>End-to-End Secure &amp; Confidential Channel</span>
      </div>
      <span class="hidden md:inline text-[10px] text-[#8C8F9A]">
        Messages are encrypted and confidential
      </span>
    </div>
  </div>
</template>

