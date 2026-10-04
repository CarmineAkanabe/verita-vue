// shared/realtime/socket-client.ts
import { ref } from 'vue'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { staffToken, caseToken } from '@/shared/api/auth'
import type { ChatMessage, SenderType } from '@/features/chat/types'

declare global {
  interface Window {
    Pusher: typeof Pusher
    Echo: Echo<any>
  }
}

// Pusher diagnostic logging is development-only
Pusher.logToConsole = import.meta.env.DEV
window.Pusher = Pusher

let echoInstance: Echo<any> | null = null
let currentToken: string | null = null

export type SocketStatus =
  | 'initialized'
  | 'connecting'
  | 'connected'
  | 'unavailable'
  | 'failed'
  | 'disconnected'

// Starts 'disconnected': no Echo instance exists until a page that needs live
// updates (chat) creates one. 'connecting' here caused false "reconnecting" alerts.
export const globalSocketStatus = ref<SocketStatus>('disconnected')

/** Development-only logger. Never logs in production (payloads contain private message text). */
export const rtLog: (...args: unknown[]) => void = import.meta.env.DEV
  ? (...args) => console.log(...args)
  : () => {}

/**
 * Robustly normalizes incoming message payloads from various Laravel broadcast formats
 * (e.g. { message: {...} }, { data: {...} }, camelCase or snake_case).
 */
export function extractIncomingMessage(payload: any): ChatMessage | null {
  if (!payload) return null
  const raw = payload.message || payload.data || payload
  const id = raw.id || raw.messageId || raw.tempId
  const content = raw.content || raw.text || raw.body
  if (!id || !content) return null

  const rawSender = raw.senderType || raw.sender_type
  let senderType: SenderType = 'DEPARTMENT_HEAD'
  if (rawSender === 'CASE_REPORTER' || rawSender === 'reporter' || raw.isReporter) {
    senderType = 'CASE_REPORTER'
  } else if (rawSender === 'SYSTEM' || rawSender === 'system') {
    senderType = 'SYSTEM'
  }

  const sentAt =
    raw.sentAt ||
    raw.sent_at ||
    raw.createdAt ||
    raw.created_at ||
    new Date().toISOString()

  return {
    id: String(id),
    senderType,
    content: String(content),
    sentAt: String(sentAt),
    status: 'sent',
  }
}

function setupConnectionListeners(instance: Echo<any>) {
  const conn = (instance as any).connector?.pusher?.connection
  if (!conn) return

  globalSocketStatus.value = (conn.state as SocketStatus) || 'connecting'

  conn.bind('state_change', (states: { previous: string; current: string }) => {
    globalSocketStatus.value = states.current as SocketStatus
  })
  conn.bind('connected', () => {
    globalSocketStatus.value = 'connected'
  })
  conn.bind('unavailable', () => {
    globalSocketStatus.value = 'unavailable'
  })
  conn.bind('failed', () => {
    globalSocketStatus.value = 'failed'
  })
  conn.bind('disconnected', () => {
    globalSocketStatus.value = 'disconnected'
  })
}

export function getEcho(token?: string | null): Echo<any> {
  const isStaffPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/app')
  const effectiveToken =
    token ||
    (isStaffPath ? (staffToken.get() || caseToken.get()) : (caseToken.get() || staffToken.get())) ||
    null

  if (echoInstance && currentToken === effectiveToken) {
    const conn = (echoInstance as any).connector?.pusher?.connection
    if (conn && (conn.state === 'disconnected' || conn.state === 'unavailable' || conn.state === 'failed')) {
      try {
        conn.connect()
      } catch {
        // ignore
      }
    }
    return echoInstance
  }

  if (echoInstance) {
    try {
      echoInstance.disconnect()
    } catch {
      // ignore
    }
    echoInstance = null
  }

  currentToken = effectiveToken

  const appKey = (import.meta.env.VITE_REVERB_APP_KEY as string) || ''
  let host = (import.meta.env.VITE_REVERB_HOST as string) || '127.0.0.1'
  // On local dev, map 'localhost' to '127.0.0.1' to avoid Windows IPv6 (::1) socket failures
  if (host === 'localhost') {
    host = '127.0.0.1'
  }
  const port = Number(import.meta.env.VITE_REVERB_PORT || 8080)
  const scheme = (import.meta.env.VITE_REVERB_SCHEME as string) || 'http'
  const isHttps = scheme === 'https'
  const apiOrigin = (import.meta.env.VITE_API_ORIGIN as string) || 'http://localhost:8000'

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: appKey,
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS: isHttps,
    enabledTransports: ['ws', 'wss'],
    Pusher: Pusher,
    authEndpoint: `${apiOrigin}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: effectiveToken ? `Bearer ${effectiveToken}` : '',
        Accept: 'application/json',
      },
    },
    authorizer: (channel: any) => {
      return {
        authorize: async (socketId: string, callback: (error: any, authData?: any) => void) => {
          const isStaff = typeof window !== 'undefined' && window.location.pathname.startsWith('/app')
          const authToken =
            (isStaff ? (staffToken.get() || currentToken) : (caseToken.get() || currentToken)) ||
            currentToken ||
            staffToken.get() ||
            caseToken.get() ||
            ''

          const headers: Record<string, string> = {
            Accept: 'application/json',
          }
          if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`
          }

          rtLog(`[Echo Authorizer] Authorizing channel '${channel.name}' using ${isStaff ? 'Staff' : 'Reporter'} auth`)

          const endpoints = [
            `${apiOrigin}/broadcasting/auth`,
            `${apiOrigin}/api/v1/broadcasting/auth`,
          ]

          let lastErr: any = null

          for (const endpoint of endpoints) {
            // Attempt 1: JSON body
            try {
              const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                  ...headers,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  socket_id: socketId,
                  channel_name: channel.name,
                }),
                credentials: 'include',
              })

              if (res.ok) {
                const data = await res.json()
                rtLog(`[Echo Authorizer] Authorized '${channel.name}' via JSON at ${endpoint}`)
                callback(null, data)
                return
              }

              // If endpoint exists but rejected JSON, attempt urlencoded format
              if (res.status !== 404) {
                const formBody = new URLSearchParams({
                  socket_id: socketId,
                  channel_name: channel.name,
                })
                const formRes = await fetch(endpoint, {
                  method: 'POST',
                  headers: {
                    ...headers,
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  body: formBody.toString(),
                  credentials: 'include',
                })

                if (formRes.ok) {
                  const data = await formRes.json()
                  rtLog(`[Echo Authorizer] Authorized '${channel.name}' via Form at ${endpoint}`)
                  callback(null, data)
                  return
                }

                const errText = await formRes.text()
                lastErr = new Error(`Broadcast auth failed with status ${formRes.status}: ${errText}`)
                console.warn(`[Echo Authorizer] Failed at ${endpoint} (${formRes.status}):`, errText)
              } else {
                console.warn(`[Echo Authorizer] Endpoint ${endpoint} returned 404, falling back...`)
              }
            } catch (fetchErr: any) {
              lastErr = fetchErr
              console.warn(`[Echo Authorizer] Network/fetch error at ${endpoint}:`, fetchErr?.message || fetchErr)
            }
          }

          console.error(`[Echo Authorizer] All authorization attempts failed for ${channel.name}:`, lastErr)
          callback(lastErr || new Error(`Failed to authorize channel ${channel.name}`))
        },
      }
    },
  })

  setupConnectionListeners(echoInstance)

  window.Echo = echoInstance
  return echoInstance
}

export function getEchoConnectionState(): SocketStatus {
  if (!echoInstance) return 'disconnected'
  const state = (echoInstance as any).connector?.pusher?.connection?.state
  return (state as SocketStatus) || globalSocketStatus.value || 'disconnected'
}

/**
 * Re-attempt the connection of the EXISTING socket without replacing it,
 * so channel subscriptions made by the chat stay valid. No-op when no
 * page is using live updates (public pages, signed out, etc.).
 */
export function reconnectExisting(): void {
  if (!echoInstance) return
  const conn = (echoInstance as any).connector?.pusher?.connection
  if (!conn) return
  if (conn.state === 'connected' || conn.state === 'connecting') return
  try {
    conn.connect()
  } catch {
    // ignore
  }
}

export function disconnectEcho(): void {
  if (echoInstance) {
    try {
      echoInstance.disconnect()
    } catch {
      // ignore
    }
    echoInstance = null
    currentToken = null
  }
  globalSocketStatus.value = 'disconnected'
}


