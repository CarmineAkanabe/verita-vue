// features/chat/store.ts
// One chat store for both viewers. Call start('REPORTER' | 'STAFF', caseId) on page mount, stop() on unmount.
import { defineStore } from 'pinia'
import {
  getReporterMessages,
  sendReporterMessage,
  getStaffCaseMessages,
  sendStaffCaseMessage,
} from './api'
import type { ChatMessage, DepartmentHeadInfo } from './types'
import { openChatSocket, type ChatSocketHandle } from './chat-socket'
import {
  mergeServerMessages,
  applyIncomingMessage,
  replaceByTempId,
  setStatusByTempId,
} from './service'
import { globalSocketStatus } from '@/shared/realtime/socket-client'
import { toast } from '@/plugins/toast'

export type ChatViewer = 'REPORTER' | 'STAFF'

// Kept outside reactive state: a socket handle is not data.
let socketHandle: ChatSocketHandle | null = null

function newTempId() {
  return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    viewer: null as ChatViewer | null,
    caseId: null as string | null,
    token: null as string | null,
    messages: [] as ChatMessage[],
    departmentHead: null as DepartmentHeadInfo | null,
    isLoading: false,
    isSending: false,
    error: null as string | null,
    syncErrorCount: 0,
  }),

  getters: {
    hasMessages: (state) => state.messages.length > 0,
    departmentHeadName: (state) => state.departmentHead?.name ?? 'Awaiting Department Head Assignment',
    socketStatus: () => globalSocketStatus.value,
    isSocketConnected: () => globalSocketStatus.value === 'connected',
    isReconnecting: (state) =>
      globalSocketStatus.value === 'unavailable' ||
      globalSocketStatus.value === 'failed' ||
      state.syncErrorCount >= 2,
  },

  actions: {
    /** Begin a chat session: reset if the case/viewer changed, load history, open the socket. */
    async start(viewer: ChatViewer, caseId: string, token: string) {
      this.stop()
      this.viewer = viewer
      this.caseId = caseId
      this.token = token
      this.messages = []
      this.departmentHead = null
      this.error = null
      this.syncErrorCount = 0

      await this.fetchMessages(false)
      this.openSocket()
    },

    /** End the session and close the socket. */
    stop() {
      socketHandle?.close()
      socketHandle = null
    },

    openSocket() {
      if (!this.caseId || !this.token) return
      socketHandle?.close()
      try {
        socketHandle = openChatSocket(this.caseId, this.token, {
          onMessage: (msg) => this.receive(msg),
          onPresence: (status) => {
            if (this.departmentHead) this.departmentHead.presenceStatus = status as any
          },
          onConnected: () => {
            this.fetchMessages(true)
          },
        })
      } catch (err) {
        console.warn('Live connection could not be opened:', err)
        socketHandle = null
      }
    },

    /** Manual reconnect (header/composer buttons). */
    reconnect() {
      this.openSocket()
    },

    async fetchMessages(silent = false) {
      if (!this.viewer || !this.caseId) return
      if (!silent) this.isLoading = true

      try {
        let incoming: ChatMessage[]
        if (this.viewer === 'REPORTER') {
          const res = await getReporterMessages()
          this.departmentHead = res.departmentHead
          incoming = Array.isArray(res.messages)
            ? res.messages
            : res.messages && Array.isArray((res.messages as any).data)
            ? (res.messages as any).data
            : []
        } else {
          incoming = await getStaffCaseMessages(this.caseId)
        }

        this.messages = mergeServerMessages(this.messages, incoming)
        this.syncErrorCount = 0
        this.error = null
      } catch (err: any) {
        this.syncErrorCount++
        if (!silent) this.error = err?.message || 'Unable to load messages.'
      } finally {
        if (!silent) this.isLoading = false
      }
    },

    async sendMessage(rawContent: string) {
      const content = rawContent.trim()
      if (!content || !this.viewer) return

      const tempId = newTempId()
      this.messages.push({
        id: tempId,
        tempId,
        senderType: this.viewer === 'REPORTER' ? 'CASE_REPORTER' : 'DEPARTMENT_HEAD',
        content,
        sentAt: new Date().toISOString(),
        status: 'pending',
      })

      // Product rule: no live connection, no message.
      if (globalSocketStatus.value !== 'connected') {
        this.messages = setStatusByTempId(this.messages, tempId, 'failed')
        toast.error('Live connection is offline. Reconnect to send your message.')
        return
      }
      await this.dispatch(tempId, content)
    },

    async retryMessage(tempId: string) {
      const target = this.messages.find((m) => m.id === tempId || m.tempId === tempId)
      if (!target) return

      if (globalSocketStatus.value !== 'connected') {
        toast.error('Live connection is offline. Reconnect before retrying.')
        return
      }
      this.messages = setStatusByTempId(this.messages, tempId, 'pending')
      await this.dispatch(tempId, target.content)
    },

    async dispatch(tempId: string, content: string) {
      if (!this.viewer || !this.caseId) return
      this.isSending = true
      try {
        const confirmed =
          this.viewer === 'REPORTER'
            ? await sendReporterMessage(content)
            : await sendStaffCaseMessage(this.caseId, content)
        this.messages = replaceByTempId(this.messages, tempId, { ...confirmed, status: 'sent' })
      } catch (err: any) {
        this.messages = setStatusByTempId(this.messages, tempId, 'failed')
        toast.error(err?.response?.data?.message || err?.message || 'Failed to send message.')
      } finally {
        this.isSending = false
      }
    },

    receive(msg: ChatMessage) {
      this.messages = applyIncomingMessage(this.messages, msg)
    },
  },
})
