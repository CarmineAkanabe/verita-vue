<!-- pages/staff/cases/StaffCaseChat.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import {
  getStaffCaseDetail,
  claimCase,
  downloadStaffEvidenceFile,
} from '@/features/cases/api'
import {
  getStaffCaseMessages,
  sendStaffCaseMessage,
} from '@/features/chat/api'
import type { StaffCase, StaffEvidenceItem } from '@/features/cases/types'
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
  ShieldCheckIcon,
  FileTextIcon,
  DownloadIcon,
  LockIcon,
  HandHelpingIcon,
  MessageSquareIcon,
  InfoIcon,
} from '@lucide/vue'

const route = useRoute()
const auth = useAuthStore()

const caseId = computed(() => route.params.id as string)

// Case dossier details
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
    toast.success('Docket claimed successfully. You can now communicate directly.')
    await fetchMessages(false)
  } catch (err: any) {
    toast.error(err?.message || 'Failed to claim docket.')
  } finally {
    isClaiming.value = false
  }
}

async function handleDownloadEvidence(item: StaffEvidenceItem, index: number) {
  const ext = item.fileType === 'IMAGE' ? 'png' : 'pdf'
  const filename = `Exhibit-${index + 1}-${caseId.value.slice(0, 8)}.${ext}`
  try {
    await downloadStaffEvidenceFile(caseId.value, item.id, filename)
    toast.success(`Downloaded ${filename}`)
  } catch (err: any) {
    toast.error(err?.message || 'Failed to download evidence exhibit.')
  }
}

function populateSuggestion(text: string) {
  handleSendMessage(text)
}

function formatAmount(amount: string | number | undefined): string {
  if (amount === undefined || amount === null) return 'Non-financial'
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
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
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
  <div class="space-y-4">
    <!-- Top Dossier Breadcrumb & Quick Reference Header -->
    <div class="bg-white border border-[#E2E5EE] rounded-xl p-4 sm:p-5 shadow-xs">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <!-- Left: Context Titles -->
        <div class="space-y-1">
          <div class="flex items-center gap-2 text-xs text-[#6B7280]">
            <router-link to="/app/cases" class="hover:text-primary transition-colors">
              Investigation Queue
            </router-link>
            <span>/</span>
            <router-link :to="`/app/cases/${caseId}`" class="hover:text-primary transition-colors font-mono">
              #{{ caseId.slice(0, 12) }}...
            </router-link>
            <span>/</span>
            <span class="text-[#22293A] font-medium">Consultation Stream</span>
          </div>

          <div class="flex flex-wrap items-center gap-2.5 pt-0.5">
            <h1 class="text-lg sm:text-xl font-bold text-[#22293A] tracking-tight">
              Whistleblower Consultation Channel
            </h1>
            <StatusPill v-if="caseData" :status="caseData.status" />
            <span
              v-if="caseData?.concernsDepartmentHead"
              class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
            >
              Conflict Safeguard
            </span>
          </div>
          <p class="text-xs text-[#6B7280]">
            Secure air-gapped dialogue relay under ISO 37002 Section 8.4 anti-retaliation privilege.
          </p>
        </div>

        <!-- Right: Actions & Return to Dossier -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <router-link
            :to="`/app/cases/${caseId}`"
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-[#E2E5EE] bg-[#F8F9FA] hover:bg-[#F2F4F7] text-[#22293A] transition-colors"
          >
            <FileTextIcon class="size-4 text-[#6B7280]" />
            <span>Open Case Dossier</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Main Workspace: Chat & Summary Sidebar Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <!-- Main Chat Relay Panel (8 cols on lg) -->
      <div class="lg:col-span-8 bg-white border border-[#E2E5EE] rounded-xl shadow-xs flex flex-col h-[75vh] min-h-[580px] overflow-hidden">
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
          class="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#F8F9FA]/40"
          @scroll="handleScroll"
        >
          <!-- Milestone Safeguard Notice -->
          <div class="text-center my-2">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCF4EE] border border-[#A2561B]/20 text-[11px] font-medium text-[#A2561B]">
              <LockIcon class="size-3 shrink-0" />
              <span>AIR-GAPPED RELAY ACTIVE · IDENTITY OF SUBMITTER PROTECTED BY PLATFORM HARDWARE</span>
            </div>
          </div>

          <!-- Loading State: Skeletons -->
          <div v-if="isMessagesLoading" class="space-y-4 py-4">
            <div class="flex justify-start">
              <div class="max-w-[70%] w-64 h-16 rounded-2xl bg-gray-200 animate-pulse rounded-tl-xs"></div>
            </div>
            <div class="flex justify-end">
              <div class="max-w-[70%] w-72 h-20 rounded-2xl bg-orange-100 animate-pulse rounded-tr-xs"></div>
            </div>
            <div class="flex justify-start">
              <div class="max-w-[70%] w-56 h-14 rounded-2xl bg-gray-200 animate-pulse rounded-tl-xs"></div>
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
                The whistleblower has submitted their docket and is awaiting official investigator inquiry. All messages sent here are delivered confidentially into their private portal.
              </p>
            </div>

            <!-- Starter Prompts (if authorized) -->
            <div v-if="canSendMessage" class="w-full max-w-lg space-y-2 pt-2 text-left">
              <p class="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider text-center">
                Recommended Inquiry Prompts
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  v-for="(prompt, idx) in INQUIRY_SUGGESTIONS"
                  :key="idx"
                  type="button"
                  class="p-2.5 rounded-lg border border-[#E2E5EE] bg-white hover:bg-[#F2F4F7] text-left text-xs text-[#22293A] transition-colors cursor-pointer"
                  @click="populateSuggestion(prompt)"
                >
                  "{{ prompt }}"
                </button>
              </div>
            </div>
          </div>

          <!-- Ideal State: Populated Messages -->
          <div v-else class="space-y-1">
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
        <div class="border-t border-[#E2E5EE] bg-white">
          <!-- Authorized: Active Message Composer -->
          <MessageComposer
            v-if="canSendMessage"
            :is-sending="isSending"
            @send="handleSendMessage"
          />

          <!-- Read-Only: Manager Oversight Mode -->
          <div
            v-else-if="isManager"
            class="p-4 bg-[#F8F9FA] text-xs text-[#6B7280] flex items-center justify-between gap-3 border-t border-[#E2E5EE]"
          >
            <div class="flex items-center gap-2">
              <InfoIcon class="size-4 text-primary shrink-0" />
              <span>
                <strong>Executive Oversight Mode:</strong> You are viewing this consultation stream with administrative oversight permissions. Direct message dispatch is reserved for the assigned Department Head.
              </span>
            </div>
          </div>

          <!-- Read-Only: Unassigned Docket -->
          <div
            v-else-if="!isAssignedToMe && !isCaseClosed"
            class="p-4 bg-[#FFFBEB] text-xs text-[#92400E] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[#FDE68A]"
          >
            <div class="flex items-center gap-2">
              <HandHelpingIcon class="size-4 text-[#D97706] shrink-0" />
              <span>
                <strong>Docket Unassigned:</strong> You must claim this case to open direct dialogue with the whistleblower.
              </span>
            </div>
            <AppButton
              size="sm"
              :loading="isClaiming"
              @click="handleClaimCase"
            >
              Claim Case &amp; Start Dialogue
            </AppButton>
          </div>

          <!-- Read-Only: Case Closed/Resolved -->
          <div
            v-else-if="isCaseClosed"
            class="p-4 bg-[#F2F4F7] text-xs text-[#575E71] flex items-center gap-2 border-t border-[#E2E5EE]"
          >
            <LockIcon class="size-4 text-[#575E71] shrink-0" />
            <span>
              <strong>Consultation Stream Archived:</strong> This docket has been transitioned to {{ caseData?.status }}. The consultation stream is locked for evidentiary retention.
            </span>
          </div>
        </div>
      </div>

      <!-- Right Dossier & Evidence Sidebar (4 cols on lg) -->
      <div class="lg:col-span-4 space-y-4">
        <!-- Particulars Card -->
        <div class="bg-white border border-[#E2E5EE] rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
          <div class="border-b border-[#E2E5EE] pb-3">
            <h3 class="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
              Docket Particulars
            </h3>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <span class="text-[#6B7280] block text-[11px]">Primary Category</span>
              <span class="font-bold text-primary">{{ caseData?.category || '—' }}</span>
            </div>

            <div>
              <span class="text-[#6B7280] block text-[11px]">Implicated Person / Unit</span>
              <span class="font-semibold text-[#22293A]">{{ caseData?.personInvolved || 'Unspecified' }}</span>
            </div>

            <div>
              <span class="text-[#6B7280] block text-[11px]">Reported Exposure</span>
              <span class="font-bold font-mono text-[#22293A]">{{ formatAmount(caseData?.amountInvolved) }}</span>
            </div>

            <div>
              <span class="text-[#6B7280] block text-[11px]">Incident / Transaction Date</span>
              <span class="font-semibold text-[#22293A]">{{ formatDate(caseData?.transactionDate || caseData?.createdAt) }}</span>
            </div>

            <div>
              <span class="text-[#6B7280] block text-[11px]">Transaction Narrative</span>
              <p class="text-xs text-[#22293A] leading-relaxed line-clamp-4 mt-0.5 bg-[#F8F9FA] p-2 rounded-lg border border-[#E2E5EE]">
                {{ caseData?.description || 'No description provided.' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Evidence Exhibits Card -->
        <div class="bg-white border border-[#E2E5EE] rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
          <div class="flex items-center justify-between border-b border-[#E2E5EE] pb-3">
            <h3 class="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
              Evidence Exhibits ({{ caseData?.evidence?.length || 0 }})
            </h3>
            <span class="text-[10px] font-semibold text-[#6B7280]">
              SHA-256 Verified
            </span>
          </div>

          <div v-if="!caseData?.evidence || caseData.evidence.length === 0" class="py-4 text-center text-xs text-[#6B7280]">
            No attachments submitted with this report.
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(item, idx) in caseData.evidence"
              :key="item.id"
              class="flex items-center justify-between p-2.5 rounded-lg border border-[#E2E5EE] bg-[#F8F9FA] hover:bg-[#F2F4F7] transition-colors text-xs"
            >
              <div class="flex items-center gap-2 overflow-hidden pr-2">
                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-white border border-[#E2E5EE] text-primary shrink-0">
                  {{ item.fileType }}
                </span>
                <span class="truncate font-medium text-[#22293A]">
                  Exhibit-{{ idx + 1 }}.{{ item.fileType === 'IMAGE' ? 'png' : 'pdf' }}
                </span>
              </div>

              <button
                type="button"
                class="p-1.5 rounded text-[#6B7280] hover:text-[#22293A] hover:bg-white transition-colors cursor-pointer shrink-0"
                title="Download Exhibit"
                @click="handleDownloadEvidence(item, idx)"
              >
                <DownloadIcon class="size-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Compliance & Anonymity Assurance Notice -->
        <div class="bg-[#FCF4EE] border border-[#A2561B]/20 rounded-xl p-4 space-y-2 text-xs">
          <div class="flex items-center gap-2 font-bold text-[#A2561B]">
            <ShieldCheckIcon class="size-4" />
            <span>Anti-Retaliation Protocol</span>
          </div>
          <p class="text-[11px] text-[#22293A] leading-relaxed">
            All messages exchanged in this channel are co-signed and audited. Whistleblower telemetry is stripped prior to socket delivery per ISO 37002 Section 8.4 guidelines.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
