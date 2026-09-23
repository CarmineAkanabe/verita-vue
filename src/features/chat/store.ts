// features/chat/store.ts
import { defineStore } from 'pinia'
import { getReporterMessages, sendReporterMessage } from './api'
import type { ChatMessage, DepartmentHeadInfo } from './types'
import { getEcho, disconnectEcho } from '@/shared/realtime/socket-client'

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [] as ChatMessage[],
    departmentHead: null as DepartmentHeadInfo | null,
    isLoading: false,
    isSending: false,
    isReconnecting: false,
    pollTimer: null as any | null,
    pollErrorCount: 0,
    isPollingActive: false,
    currentChannelName: null as string | null,
  }),

  getters: {
    hasMessages: (state) => state.messages.length > 0,
    isAssigned: (state) => state.departmentHead !== null,
    departmentHeadName: (state) => state.departmentHead?.name ?? 'Awaiting Department Head Assignment',
    presenceStatus: (state) => state.departmentHead?.presenceStatus ?? 'OFFLINE',
    isOfficerOnline: (state) => state.departmentHead?.presenceStatus === 'ONLINE',
  },

  actions: {
    async fetchMessages(silent = false) {
      if (!silent) {
        this.isLoading = true
      }

      try {
        const response = await getReporterMessages()
        this.departmentHead = response.departmentHead

        const incomingList: ChatMessage[] = Array.isArray(response.messages)
          ? response.messages
          : response.messages && Array.isArray((response.messages as any).data)
          ? (response.messages as any).data
          : []

        // Preserve local pending and failed messages during sync
        const localUnconfirmed = this.messages.filter(
          (m) => m.status === 'pending' || m.status === 'failed'
        )

        // Incoming server messages are confirmed ('sent')
        const confirmedList = incomingList.map((m) => ({
          ...m,
          status: 'sent' as const,
        }))

        // Merge: take server messages, plus any local pending that hasn't been confirmed yet
        const incomingIds = new Set(confirmedList.map((m) => m.id))
        const pendingToKeep = localUnconfirmed.filter(
          (m) => !incomingIds.has(m.id) && (!m.tempId || !incomingIds.has(m.tempId))
        )

        const merged = [...confirmedList, ...pendingToKeep]
        // Sort chronologically by sentAt
        merged.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())

        this.messages = merged
        this.pollErrorCount = 0
        this.isReconnecting = false
      } catch (err) {
        this.pollErrorCount++
        if (this.pollErrorCount >= 2) {
          this.isReconnecting = true
        }
      } finally {
        if (!silent) {
          this.isLoading = false
        }
      }
    },

    startPolling(baseIntervalMs = 3000) {
      this.stopPolling()
      this.isPollingActive = true

      // Initial fetch
      this.fetchMessages(false)

      const scheduleNextPoll = () => {
        if (!this.isPollingActive) return

        // Exponential backoff if consecutive errors occur
        const backoffMultiplier = Math.min(Math.pow(1.5, this.pollErrorCount), 5)
        const nextDelay = Math.round(baseIntervalMs * backoffMultiplier)

        this.pollTimer = setTimeout(async () => {
          if (!this.isPollingActive) return
          await this.fetchMessages(true)
          scheduleNextPoll()
        }, nextDelay)
      }

      scheduleNextPoll()
    },

    stopPolling() {
      this.isPollingActive = false
      if (this.pollTimer) {
        clearTimeout(this.pollTimer)
        this.pollTimer = null
      }
    },

    async sendMessage(rawContent: string) {
      const content = rawContent.trim()
      if (!content) return

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      const optimisticMessage: ChatMessage = {
        id: tempId,
        tempId,
        senderType: 'CASE_REPORTER',
        content,
        sentAt: new Date().toISOString(),
        status: 'pending',
      }

      // Optimistically append locally
      this.messages.push(optimisticMessage)
      this.isSending = true

      try {
        const confirmed = await sendReporterMessage(content)

        // Replace optimistic placeholder with confirmed server object
        const index = this.messages.findIndex((m) => m.id === tempId || m.tempId === tempId)
        if (index !== -1) {
          this.messages[index] = {
            ...confirmed,
            status: 'sent',
          }
        }
      } catch (err) {
        // Tag as failed to permit user retry
        const index = this.messages.findIndex((m) => m.id === tempId || m.tempId === tempId)
        if (index !== -1) {
          this.messages[index] = {
            ...this.messages[index],
            status: 'failed',
          }
        }
      } finally {
        this.isSending = false
      }
    },

    async retryMessage(tempId: string) {
      const target = this.messages.find((m) => m.id === tempId || m.tempId === tempId)
      if (!target) return

      target.status = 'pending'
      try {
        const confirmed = await sendReporterMessage(target.content)
        const index = this.messages.findIndex((m) => m.id === tempId || m.tempId === tempId)
        if (index !== -1) {
          this.messages[index] = {
            ...confirmed,
            status: 'sent',
          }
        }
      } catch {
        target.status = 'failed'
      }
    },

    connectWebSocket(caseId: string, token: string) {
      try {
        const echo = getEcho(token)
        const channelName = `case.${caseId}`

        if (this.currentChannelName === channelName) {
          return
        }

        if (this.currentChannelName) {
          try {
            echo.leave(this.currentChannelName)
          } catch {
            // ignore
          }
        }

        this.currentChannelName = channelName
        const channel = echo.private(channelName)

        const onMessage = (data: any) => {
          if (!data || !data.id) return
          this.receiveSocketMessage({
            id: data.id,
            senderType: data.senderType,
            content: data.content,
            sentAt: data.sentAt,
            status: 'sent',
          })

          if (data.senderType === 'DEPARTMENT_HEAD' || data.presenceStatus === 'ONLINE') {
            if (this.departmentHead) {
              this.departmentHead.presenceStatus = 'ONLINE'
            }
          }
        }

        channel.listen('.message.sent', onMessage)
        channel.listen('MessageSent', onMessage)
        channel.listen('.department-head.presence', (data: any) => {
          if (this.departmentHead && data?.presenceStatus) {
            this.departmentHead.presenceStatus = data.presenceStatus
          }
        })

        if ((echo as any).connector?.pusher?.connection) {
          const conn = (echo as any).connector.pusher.connection
          conn.bind('connected', () => {
            this.isReconnecting = false
          })
          conn.bind('unavailable', () => {
            this.isReconnecting = true
          })
          conn.bind('failed', () => {
            this.isReconnecting = true
          })
        }
      } catch (err) {
        console.warn('Reverb socket connection warning:', err)
      }
    },

    disconnectWebSocket() {
      if (this.currentChannelName) {
        try {
          const echo = getEcho()
          echo.leave(this.currentChannelName)
        } catch {
          // ignore
        }
        this.currentChannelName = null
      }
      disconnectEcho()
    },

    receiveSocketMessage(msg: ChatMessage) {
      const exists = this.messages.some((m) => m.id === msg.id)
      if (exists) return

      const pendingIdx = this.messages.findIndex(
        (m) => m.status === 'pending' && m.content === msg.content && m.senderType === msg.senderType
      )
      if (pendingIdx !== -1) {
        this.messages[pendingIdx] = msg
        return
      }

      this.messages.push(msg)
      this.messages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
    },
  },
})
