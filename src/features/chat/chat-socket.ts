// features/chat/chat-socket.ts
// The ONLY place that subscribes to a case's chat channel. Used by both
// the reporter and staff views through the chat store.
import {
  getEcho,
  disconnectEcho,
  extractIncomingMessage,
  rtLog,
} from '@/shared/realtime/socket-client'
import type { ChatMessage } from './types'

export interface ChatSocketHandlers {
  onMessage: (msg: ChatMessage) => void
  onPresence?: (presenceStatus: string) => void
  /** Fired each time the socket (re)connects, e.g. to refetch history. */
  onConnected?: () => void
}

export interface ChatSocketHandle {
  close: () => void
}

const MESSAGE_EVENTS = ['.message.sent', 'MessageSent', '.MessageSent', 'message.sent']
const PRESENCE_EVENT = '.department-head.presence'

export function openChatSocket(caseId: string, token: string, h: ChatSocketHandlers): ChatSocketHandle {
  const echo = getEcho(token)
  const channelName = `case.${caseId}`
  const channel: any = echo.private(channelName)

  const handleMessage = (data: any) => {
    rtLog('[Chat Socket Event]:', data)
    const parsed = extractIncomingMessage(data)
    if (parsed) h.onMessage(parsed)
    if (data?.presenceStatus) h.onPresence?.(data.presenceStatus)
  }

  for (const name of MESSAGE_EVENTS) channel.listen(name, handleMessage)
  channel.listen(PRESENCE_EVENT, (data: any) => {
    if (data?.presenceStatus) h.onPresence?.(data.presenceStatus)
  })

  channel.subscription?.bind('pusher:subscription_succeeded', () => rtLog(`[Chat] Joined '${channelName}'`))
  channel.subscription?.bind('pusher:subscription_error', (status: unknown) =>
    console.error(`[Chat] Subscription error on '${channelName}':`, status),
  )

  const conn = (echo as any).connector?.pusher?.connection
  const onConnected = () => h.onConnected?.()
  conn?.bind('connected', onConnected)
  if (conn && conn.state !== 'connected' && conn.state !== 'connecting') {
    try {
      conn.connect()
    } catch {
      // ignore
    }
  }

  return {
    close() {
      try {
        conn?.unbind('connected', onConnected)
        for (const name of MESSAGE_EVENTS) channel.stopListening(name)
        channel.stopListening(PRESENCE_EVENT)
        echo.leave(channelName)
      } catch {
        // ignore
      }
      // The chat is the only consumer of the socket; closing it also clears the global status.
      disconnectEcho()
    },
  }
}
