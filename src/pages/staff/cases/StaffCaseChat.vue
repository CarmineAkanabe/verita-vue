<!-- pages/staff/cases/StaffCaseChat.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import {
  getStaffCaseDetail,
  claimCase,
} from '@/features/cases/api'
import {
  getStaffCaseMessages,
  sendStaffCaseMessage,
} from '@/features/chat/api'
import type { StaffCase } from '@/features/cases/types'
import type { ChatMessage } from '@/features/chat/types'
import { toast } from '@/plugins/toast'
import { getEcho } from '@/shared/realtime/socket-client'
import { staffToken } from '@/shared/api/auth'

import ChatHeader from '@/components/complex/chat/ChatHeader.vue'
import MessageBubble from '@/components/complex/chat/MessageBubble.vue'
import MessageComposer from '@/components/complex/chat/MessageComposer.vue'
import StatusPill from '@/components/common/StatusPill.vue'
import AppButton from '@/components/common/AppButton.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'

import {
  FileTextIcon,
  LockIcon,
  HandHelpingIcon,
  MessageSquareIcon,
  InfoIcon,
} from '@lucide/vue'

const route = useRoute()
const auth = useAuthStore()

const caseId = computed(() => route.params.id as string)

// Case details
const caseData = ref<StaffCase | null>(null)
const isCaseLoading = ref(true)
const caseError = ref<string | null>(null)

// Claiming state
const isClaiming = ref(false)

// Messages state
const messages = ref<ChatMessage[]>([])
const isMessagesLoading = ref(true)
const messagesError = ref<string | null>(null)
const isSending = ref(false)
const isReconnecting = ref(false)
const pollErrorCount = ref(0)
let pollTimer: any = null
let isPollingActive = false

// Auto-scroll
const messageScrollRef = ref<HTMLDivElement | null>(null)
const shouldAutoScroll = ref(true)

// Quick inquiry suggestion chips
const INQUIRY_SUGGESTIONS = [
  'Could you clarify the exact timeframe and location of the incident?',
  'Do you possess any additional transaction records, memos, or emails?',
  'Can you describe any other individuals present or who witnessed the event?',
  'We have safely received your submission and are verifying with port records.',
]

const isAssignedToMe = computed(() => {
  return caseData.value?.assignedTo === auth.user?.id
})

const isManager = computed(() => {
  return auth.user?.role === 'MANAGER'
})

const isCaseClosed = computed(() => {
  return caseData.value?.status === 'RESOLVED' || caseData.value?.status === 'DISMISSED'
})

const canSendMessage = computed(() => {
  // Only assigned department heads can transmit messages, on active cases
  return !isManager.value && isAssignedToMe.value && !isCaseClosed.value
})

function scrollToBottom(smooth = false) {
  nextTick(() => {
    const el = messageScrollRef.value
    if (!el) return
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    })
  })
}

function handleScroll() {
  const el = messageScrollRef.value
  if (!el) return
  const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  shouldAutoScroll.value = distanceFromBottom < 80
}

watch(
  () => messages.value.length,
  () => {
    if (shouldAutoScroll.value) {
      scrollToBottom(true)
    }
  }
)

async function fetchCaseDetails() {
  isCaseLoading.value = true
  caseError.value = null

  try {
    const data = await getStaffCaseDetail(caseId.value)
    caseData.value = data
  } catch (err: any) {
    caseError.value = err?.message || 'Failed to load case docket information.'
  } finally {
    isCaseLoading.value = false
  }
}

async function fetchMessages(silent = false) {
  if (!silent) {
    isMessagesLoading.value = true
  }

  try {
    const list = await getStaffCaseMessages(caseId.value)

    // Preserve local pending and failed messages during sync
    const localUnconfirmed = messages.value.filter(
      (m) => m.status === 'pending' || m.status === 'failed'
    )

    const confirmedList: ChatMessage[] = list.map((m) => ({
      ...m,
      status: 'sent',
    }))

    const incomingIds = new Set(confirmedList.map((m) => m.id))
    const pendingToKeep = localUnconfirmed.filter(
      (m) => !incomingIds.has(m.id) && (!m.tempId || !incomingIds.has(m.tempId))
    )

    const merged = [...confirmedList, ...pendingToKeep]
    merged.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())

    messages.value = merged
    pollErrorCount.value = 0
    isReconnecting.value = false
    messagesError.value = null
  } catch (err: any) {
    pollErrorCount.value++
    if (pollErrorCount.value >= 2) {
      isReconnecting.value = true
    }
    if (!silent) {
      messagesError.value = err?.message || 'Unable to sync consultation messages.'
    }
  } finally {
    if (!silent) {
      isMessagesLoading.value = false
    }
  }
}

function startPolling(baseIntervalMs = 3000) {
  stopPolling()
  isPollingActive = true

  fetchMessages(false)

  const scheduleNext = () => {
    if (!isPollingActive) return
    const multiplier = Math.min(Math.pow(1.5, pollErrorCount.value), 4)
    const delay = Math.round(baseIntervalMs * multiplier)

    pollTimer = setTimeout(async () => {
      if (!isPollingActive) return
      await fetchMessages(true)
      scheduleNext()
    }, delay)
  }

  scheduleNext()
}

function stopPolling() {
  isPollingActive = false
  if (pollTimer) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
}

async function handleSendMessage(content: string) {
  if (!content.trim() || !canSendMessage.value) return

  const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  const optimisticMessage: ChatMessage = {
    id: tempId,
    tempId,
    senderType: 'DEPARTMENT_HEAD',
    content: content.trim(),
    sentAt: new Date().toISOString(),
    status: 'pending',
  }

  messages.value.push(optimisticMessage)
  shouldAutoScroll.value = true
  scrollToBottom(true)

  isSending.value = true
  try {
    const serverMessage = await sendStaffCaseMessage(caseId.value, content)
    const idx = messages.value.findIndex((m) => m.id === tempId || m.tempId === tempId)
    if (idx !== -1) {
      messages.value[idx] = {
        ...serverMessage,
        status: 'sent',
      }
    }
  } catch (err: any) {
    const idx = messages.value.findIndex((m) => m.id === tempId || m.tempId === tempId)
    if (idx !== -1) {
      messages.value[idx] = {
        ...optimisticMessage,
        status: 'failed',
      }
    }
    toast.error(err?.message || 'Failed to dispatch message to whistleblower.')
  } finally {
    isSending.value = false
  }
}

async function handleRetryMessage(tempId: string) {
  const target = messages.value.find((m) => m.id === tempId || m.tempId === tempId)
  if (!target) return

  target.status = 'pending'
  try {
    const serverMessage = await sendStaffCaseMessage(caseId.value, target.content)
    const idx = messages.value.findIndex((m) => m.id === tempId || m.tempId === tempId)
    if (idx !== -1) {
      messages.value[idx] = {
        ...serverMessage,
        status: 'sent',
      }
    }
  } catch (err: any) {
    target.status = 'failed'
    toast.error(err?.message || 'Retry transmission failed.')
  }
}

async function handleClaimCase() {
  if (!caseData.value) return
  isClaiming.value = true

  try {
    const updated = await claimCase(caseData.value.id)
    caseData.value.status = updated.status
    caseData.value.assignedTo = updated.assignedTo
    toast.success('Case claimed successfully. You can now communicate directly.')
    await fetchMessages(false)
  } catch (err: any) {
    toast.error(err?.message || 'Failed to claim case.')
  } finally {
    isClaiming.value = false
  }
}

function populateSuggestion(text: string) {
  handleSendMessage(text)
}

let currentChannel: any = null

function connectStaffWebSocket() {
  const token = staffToken.get()
  if (!token || !caseId.value) return

  try {
    const echo = getEcho(token)
    const channelName = `case.${caseId.value}`
    currentChannel = echo.private(channelName)

    const onIncomingMessage = (data: any) => {
      if (!data || !data.id) return

      const exists = messages.value.some((m) => m.id === data.id)
      if (exists) return

      const pendingIdx = messages.value.findIndex(
        (m) => m.status === 'pending' && m.content === data.content && m.senderType === data.senderType
      )
      if (pendingIdx !== -1) {
        messages.value[pendingIdx] = {
          id: data.id,
          senderType: data.senderType,
          content: data.content,
          sentAt: data.sentAt,
          status: 'sent',
        }
        return
      }

      messages.value.push({
        id: data.id,
        senderType: data.senderType,
        content: data.content,
        sentAt: data.sentAt,
        status: 'sent',
      })
      messages.value.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
      if (shouldAutoScroll.value) {
        scrollToBottom(true)
      }
    }

    currentChannel.listen('.message.sent', onIncomingMessage)
    currentChannel.listen('MessageSent', onIncomingMessage)

    if ((echo as any).connector?.pusher?.connection) {
      const conn = (echo as any).connector.pusher.connection
      conn.bind('connected', () => {
        isReconnecting.value = false
      })
      conn.bind('unavailable', () => {
        isReconnecting.value = true
      })
      conn.bind('failed', () => {
        isReconnecting.value = true
      })
    }
  } catch (err) {
    console.warn('Staff Reverb socket connection error:', err)
  }
}

function disconnectStaffWebSocket() {
  if (currentChannel && caseId.value) {
    try {
      const echo = getEcho()
      echo.leave(`case.${caseId.value}`)
    } catch {
      // ignore
    }
    currentChannel = null
  }
}

watch(
  caseId,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      disconnectStaffWebSocket()
      fetchCaseDetails()
      connectStaffWebSocket()
      startPolling(5000)
    }
  }
)

onMounted(async () => {
  await fetchCaseDetails()
  connectStaffWebSocket()
  startPolling(5000)
  scrollToBottom(false)
})

onUnmounted(() => {
  disconnectStaffWebSocket()
  stopPolling()
})
</script>

<template>
  <div class="space-y-4 max-w-5xl mx-auto">
    <!-- Top Case Reference & Quick Action Bar -->
    <div class="p-4 sm:p-5 rounded-2xl bg-[#FFFDF8] border border-[#EADBCE] shadow-xs">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <!-- Left Context -->
        <div class="space-y-1">
          <div class="flex items-center gap-2 text-xs text-[#6B7280]">
            <router-link to="/app/cases" class="hover:text-[#A2561B] transition-colors">
              Cases
            </router-link>
            <span>/</span>
            <router-link :to="`/app/cases/${caseId}`" class="hover:text-[#A2561B] transition-colors font-mono">
              #{{ caseId.slice(0, 14) }}...
            </router-link>
            <span>/</span>
            <span class="text-[#22293A] font-semibold">Consultation</span>
          </div>

          <div class="flex flex-wrap items-center gap-2.5 pt-0.5">
            <h1 class="text-lg sm:text-xl font-bold text-[#22293A] tracking-tight">
              Case Consultation Channel
            </h1>
            <StatusPill v-if="caseData" :status="caseData.status" />
            <span
              v-if="caseData?.concernsDepartmentHead"
              class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5]"
            >
              Department Head Bypassed
            </span>
          </div>
        </div>

        <!-- Right: View Case Details Link -->
        <div class="flex items-center gap-2.5">
          <router-link
            :to="`/app/cases/${caseId}`"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#EADBCE] bg-[#FAF7F2] hover:bg-[#F4EFE6] text-[#22293A] transition-colors shadow-xs"
          >
            <FileTextIcon class="size-4 text-[#A2561B]" />
            <span>View Case Details</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Dedicated Full-View Chat Container -->
    <div class="bg-[#FFFDF8] border border-[#EADBCE] rounded-2xl shadow-xs flex flex-col h-[75vh] min-h-[580px] overflow-hidden">
      <!-- Reusable Chat Header -->
      <ChatHeader
        :case-id="caseId"
        :viewer="'STAFF'"
        :back-to="`/app/cases/${caseId}`"
        :is-reconnecting="isReconnecting"
      />

      <!-- Message History Scroll Area -->
      <div
        ref="messageScrollRef"
        class="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#F8F9FA]/60"
        @scroll="handleScroll"
      >
        <!-- Security Notice -->
        <div class="text-center my-2">
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCF4EE] border border-[#A2561B]/20 text-[11px] font-medium text-[#A2561B]">
            <LockIcon class="size-3 shrink-0" />
            <span>Confidential Channel · Whistleblower identity is protected</span>
          </div>
        </div>

        <!-- Loading State: Skeletons -->
        <div v-if="isMessagesLoading" class="space-y-4 py-4">
          <div class="flex justify-start">
            <div class="max-w-[70%] w-64 h-16 rounded-2xl bg-[#FAF7F2] border border-[#EADBCE] animate-pulse rounded-tl-xs"></div>
          </div>
          <div class="flex justify-end">
            <div class="max-w-[70%] w-72 h-20 rounded-2xl bg-[#FCF4EE] border border-[#A2561B]/20 animate-pulse rounded-tr-xs"></div>
          </div>
          <div class="flex justify-start">
            <div class="max-w-[70%] w-56 h-14 rounded-2xl bg-[#FAF7F2] border border-[#EADBCE] animate-pulse rounded-tl-xs"></div>
          </div>
        </div>

        <!-- Error State Banner -->
        <ErrorBanner
          v-else-if="messagesError"
          :message="messagesError"
          action-text="Retry Sync"
          @action="fetchMessages(false)"
        />

        <!-- Empty State: No messages yet -->
        <div
          v-else-if="messages.length === 0"
          class="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-4"
        >
          <div class="h-12 w-12 rounded-xl bg-[#FCF4EE] border border-[#A2561B]/30 flex items-center justify-center text-[#A2561B]">
            <MessageSquareIcon class="size-6" />
          </div>
          <div class="max-w-md space-y-1">
            <h3 class="text-sm font-bold text-[#22293A]">
              No Consultation Messages Yet
            </h3>
            <p class="text-xs text-[#6B7280]">
              The whistleblower has submitted their report and is awaiting your inquiry. Messages sent here are delivered confidentially to their private dashboard.
            </p>
          </div>

          <!-- Starter Prompts (if authorized) -->
          <div v-if="canSendMessage" class="w-full max-w-lg space-y-2 pt-2 text-left">
            <p class="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider text-center">
              Suggested Inquiries
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                v-for="(prompt, idx) in INQUIRY_SUGGESTIONS"
                :key="idx"
                type="button"
                class="p-2.5 rounded-lg border border-[#EADBCE] bg-white hover:bg-[#FAF7F2] text-left text-xs text-[#22293A] transition-colors cursor-pointer"
                @click="populateSuggestion(prompt)"
              >
                "{{ prompt }}"
              </button>
            </div>
          </div>
        </div>

        <!-- Populated Messages List -->
        <div v-else class="space-y-2">
          <MessageBubble
            v-for="msg in messages"
            :key="msg.id || msg.tempId"
            :message="msg"
            :viewer="'STAFF'"
            @retry="handleRetryMessage"
          />
        </div>
      </div>

      <!-- Bottom Action/Composer Area -->
      <div class="border-t border-[#EADBCE] bg-[#FFFDF8]">
        <!-- Authorized: Active Message Composer -->
        <MessageComposer
          v-if="canSendMessage"
          :is-sending="isSending"
          @send="handleSendMessage"
        />

        <!-- Read-Only: Manager Oversight Mode -->
        <div
          v-else-if="isManager"
          class="p-4 bg-[#FAF7F2] text-xs text-[#6B7280] flex items-center gap-2 border-t border-[#EADBCE]"
        >
          <InfoIcon class="size-4 text-[#A2561B] shrink-0" />
          <span>
            <strong>Executive Oversight Mode:</strong> You are viewing this consultation with administrative oversight permissions. Direct message dispatch is reserved for the assigned Department Head.
          </span>
        </div>

        <!-- Read-Only: Unassigned Case -->
        <div
          v-else-if="!isAssignedToMe && !isCaseClosed"
          class="p-4 bg-[#FFFBEB] text-xs text-[#92400E] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[#FDE68A]"
        >
          <div class="flex items-center gap-2">
            <HandHelpingIcon class="size-4 text-[#D97706] shrink-0" />
            <span>
              <strong>Case Unassigned:</strong> You must claim this case to send messages to the whistleblower.
            </span>
          </div>
          <AppButton
            size="sm"
            :loading="isClaiming"
            @click="handleClaimCase"
          >
            Claim Case &amp; Start Discussion
          </AppButton>
        </div>

        <!-- Read-Only: Case Closed/Resolved -->
        <div
          v-else-if="isCaseClosed"
          class="p-4 bg-[#F2F4F7] text-xs text-[#575E71] flex items-center gap-2 border-t border-[#EADBCE]"
        >
          <LockIcon class="size-4 text-[#575E71] shrink-0" />
          <span>
            <strong>Case Closed:</strong> This case has been marked as {{ caseData?.status }}. This consultation stream is preserved for the official record.
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
