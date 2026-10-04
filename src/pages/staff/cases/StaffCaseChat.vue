<!-- pages/staff/cases/StaffCaseChat.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/shared/stores/auth'
import {
  getStaffCaseDetail,
  claimCase,
} from '@/features/cases/api'
import type { StaffCase } from '@/features/cases/types'
import { toast } from '@/plugins/toast'
import { staffToken } from '@/shared/api/auth'
import { getReporterLabel } from '@/features/chat/labels'
import { useChatStore } from '@/features/chat/store'

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
const router = useRouter()
const auth = useAuthStore()

const caseId = computed(() => route.params.id as string)

// Case details
const caseData = ref<StaffCase | null>(null)
const isCaseLoading = ref(true)
const caseError = ref<string | null>(null)

// Claiming state
const isClaiming = ref(false)

// Messages + live connection come from the shared chat store
const chat = useChatStore()
const {
  messages,
  isLoading: isMessagesLoading,
  error: messagesError,
  isSending,
  isReconnecting,
  socketStatus,
  isSocketConnected,
} = storeToRefs(chat)

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
    caseError.value = err?.message || 'Failed to load case information.'
  } finally {
    isCaseLoading.value = false
  }
}

function fetchMessages(silent = false) {
  return chat.fetchMessages(silent)
}

async function handleSendMessage(content: string) {
  if (!content.trim() || !canSendMessage.value) return
  shouldAutoScroll.value = true
  scrollToBottom(true)
  await chat.sendMessage(content)
}

function handleRetryMessage(tempId: string) {
  return chat.retryMessage(tempId)
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

function reconnectStaffWebSocket() {
  chat.reconnect()
}

async function startChat() {
  const token = staffToken.get()
  if (!token || !caseId.value) return
  await chat.start('STAFF', caseId.value, token)
}

watch(
  caseId,
  async (newId, oldId) => {
    if (newId && newId !== oldId) {
      await fetchCaseDetails()
      await startChat()
    }
  }
)

onMounted(async () => {
  if (isManager.value) {
    toast.error('Managers do not have access to private case chat. Case chat is between the Case Reporter and the Department Head.')
    router.replace(`/app/cases/${caseId.value}`)
    return
  }
  await fetchCaseDetails()
  await startChat()
  scrollToBottom(false)
})

onUnmounted(() => {
  chat.stop()
})
</script>

<template>
  <div class="space-y-4 max-w-5xl mx-auto">
    <!-- Top Case Reference & Quick Action Bar -->
    <div class="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <!-- Left Context -->
        <div class="space-y-1">
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <router-link to="/app/cases" class="hover:text-primary transition-colors">
              Cases
            </router-link>
            <span>/</span>
            <router-link :to="`/app/cases/${caseId}`" class="hover:text-primary transition-colors font-mono">
              #{{ caseId.slice(0, 14) }}...
            </router-link>
            <span>/</span>
            <span class="text-foreground font-semibold">Consultation</span>
          </div>

          <div class="flex flex-wrap items-center gap-2.5 pt-0.5">
            <h1 class="text-lg sm:text-xl font-bold text-foreground tracking-tight">
              Case Consultation Channel
            </h1>
            <StatusPill v-if="caseData" :status="caseData.status" />
            <span v-if="caseData?.concernsDepartmentHead"
              class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5]">
              Department Head Bypassed
            </span>
          </div>
        </div>

        <!-- Right: View Case Details Link -->
        <div class="flex items-center gap-2.5">
          <router-link :to="`/app/cases/${caseId}`"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-border bg-[#FAF7F2] hover:bg-[#F4EFE6] text-foreground transition-colors shadow-xs">
            <FileTextIcon class="size-4 text-primary" />
            <span>View Case Details</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Dedicated Full-View Chat Container -->
    <div
      class="bg-card border border-border rounded-2xl shadow-xs flex flex-col h-[75vh] min-h-[580px] overflow-hidden">
      <!-- Reusable Chat Header -->
      <ChatHeader
        :case-id="caseId"
        viewer="STAFF"
        :back-to="`/app/cases/${caseId}`"
        :is-reconnecting="isReconnecting"
        :is-socket-connected="isSocketConnected"
        :socket-status="socketStatus"
        @reconnect="reconnectStaffWebSocket"
      />

      <!-- Message History Scroll Area with WhatsApp Wallpaper -->
      <div
        ref="messageScrollRef"
        class="flex-1 p-3 sm:p-5 overflow-y-auto space-y-3 chat-wallpaper-whatsapp chat-scrollbar"
        role="log"
        aria-live="polite"
        aria-label="Conversation messages"
        @scroll="handleScroll"
      >
        <!-- Security Notice Banner -->
        <div class="text-center my-2 sm:my-3">
          <div
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFF9EE]/90 backdrop-blur-xs border border-border text-xs font-medium text-[#8C5D39] shadow-2xs max-w-lg mx-auto">
            <LockIcon class="size-3.5 shrink-0 text-primary" />
            <span>Confidential Channel Â· Case reporter identity is protected under ISO 37002 anonymity rules.</span>
          </div>
        </div>

        <!-- Loading State: Skeletons -->
        <div v-if="isMessagesLoading" class="space-y-4 py-4">
          <div class="flex justify-start">
            <div
              class="max-w-[70%] w-64 h-16 rounded-2xl bg-[#FAF7F2] border border-border animate-pulse rounded-tl-xs">
            </div>
          </div>
          <div class="flex justify-end">
            <div
              class="max-w-[70%] w-72 h-20 rounded-2xl bg-[#FCF4EE] border border-primary/20 animate-pulse rounded-tr-xs">
            </div>
          </div>
          <div class="flex justify-start">
            <div
              class="max-w-[70%] w-56 h-14 rounded-2xl bg-[#FAF7F2] border border-border animate-pulse rounded-tl-xs">
            </div>
          </div>
        </div>

        <!-- Error State Banner -->
        <ErrorBanner v-else-if="messagesError" :message="messagesError" action-text="Retry Sync"
          @action="fetchMessages(false)" />

        <!-- Empty State: No messages yet -->
        <div v-else-if="messages.length === 0"
          class="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-4 bg-[#FFFDF9]/90 backdrop-blur-xs rounded-2xl border border-border shadow-2xs my-6">
          <div
            class="h-12 w-12 rounded-xl bg-[#FCF4EE] border border-primary/30 flex items-center justify-center text-primary">
            <MessageSquareIcon class="size-6" />
          </div>
          <div class="max-w-md space-y-1">
            <h3 class="text-sm font-bold text-foreground">
              No Consultation Messages Yet
            </h3>
            <p class="text-xs text-muted-foreground">
              The case reporter has submitted their report and is awaiting your inquiry. Messages sent here are
              delivered confidentially to their private dashboard.
            </p>
          </div>

          <!-- Starter Prompts (if authorized) -->
          <div v-if="canSendMessage" class="w-full max-w-lg space-y-2 pt-2 text-left">
            <p class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">
              Suggested Inquiries
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button v-for="(prompt, idx) in INQUIRY_SUGGESTIONS" :key="idx" type="button"
                class="p-2.5 rounded-lg border border-border bg-white hover:bg-[#FAF7F2] text-left text-xs text-foreground transition-colors cursor-pointer"
                @click="populateSuggestion(prompt)">
                "{{ prompt }}"
              </button>
            </div>
          </div>
        </div>

        <!-- Populated Messages List -->
        <div v-else class="space-y-2">
          <MessageBubble v-for="msg in messages" :key="msg.id || msg.tempId" :message="msg" :viewer="'STAFF'"
            :reporter-label="getReporterLabel(caseId)" @retry="handleRetryMessage" />
        </div>
      </div>

      <!-- Bottom Action/Composer Area -->
      <div class="border-t border-border bg-card">
        <!-- Authorized: Active Message Composer -->
        <MessageComposer
          v-if="canSendMessage"
          :is-sending="isSending"
          :is-socket-connected="isSocketConnected"
          @send="handleSendMessage"
          @reconnect="reconnectStaffWebSocket"
        />

        <!-- Read-Only: Manager Oversight Mode -->
        <div v-else-if="isManager"
          class="p-4 bg-[#FAF7F2] text-xs text-muted-foreground flex items-center gap-2 border-t border-border">
          <InfoIcon class="size-4 text-primary shrink-0" />
          <span>
            <strong>Manager Notice:</strong> Direct chat is between the assigned Department Head and the Case Reporter.
          </span>
        </div>

        <!-- Read-Only: Unassigned Case -->
        <div v-else-if="!isAssignedToMe && !isCaseClosed"
          class="p-4 bg-[#FFFBEB] text-xs text-[#92400E] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[#FDE68A]">
          <div class="flex items-center gap-2">
            <HandHelpingIcon class="size-4 text-[#D97706] shrink-0" />
            <span>
              <strong>Case Unassigned:</strong> You must claim this case to send messages to the case reporter.
            </span>
          </div>
          <AppButton size="sm" :loading="isClaiming" @click="handleClaimCase">
            Claim Case &amp; Start Discussion
          </AppButton>
        </div>

        <!-- Read-Only: Case Closed/Resolved -->
        <div v-else-if="isCaseClosed"
          class="p-4 bg-[#F2F4F7] text-xs text-muted-foreground flex items-center gap-2 border-t border-border">
          <LockIcon class="size-4 text-muted-foreground shrink-0" />
          <span>
            <strong>Case Closed:</strong> This case has been marked as {{ caseData?.status }}. This consultation stream
            is preserved for the official record.
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
