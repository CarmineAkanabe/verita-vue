// features/chat/service.ts
// Pure message-list rules (no Vue, no network). Shared by reporter and staff chat.
import type { ChatMessage } from './types'

export function sortBySentAt(list: ChatMessage[]): ChatMessage[] {
  return [...list].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
}

/**
 * Merge a fresh server history with local messages that are still pending or failed,
 * so an in-flight or failed send is never wiped by a background refresh.
 */
export function mergeServerMessages(local: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const confirmed = incoming.map((m) => ({ ...m, status: 'sent' as const }))
  const ids = new Set(confirmed.map((m) => m.id))
  const unconfirmed = local.filter(
    (m) => (m.status === 'pending' || m.status === 'failed') && !ids.has(m.id) && (!m.tempId || !ids.has(m.tempId)),
  )
  return sortBySentAt([...confirmed, ...unconfirmed])
}

/**
 * Apply one message received over the socket.
 * - Ignore duplicates (same id).
 * - Replace a matching pending optimistic message (same sender + content).
 * - Otherwise append in chronological order.
 */
export function applyIncomingMessage(list: ChatMessage[], msg: ChatMessage): ChatMessage[] {
  if (list.some((m) => m.id === msg.id)) return list

  const pendingIdx = list.findIndex(
    (m) => m.status === 'pending' && m.content === msg.content && m.senderType === msg.senderType,
  )
  if (pendingIdx !== -1) {
    const next = [...list]
    next[pendingIdx] = msg
    return next
  }
  return sortBySentAt([...list, msg])
}

/** Replace an optimistic message (matched by its temp id) with a new version. */
export function replaceByTempId(list: ChatMessage[], tempId: string, next: ChatMessage): ChatMessage[] {
  return list.map((m) => (m.id === tempId || m.tempId === tempId ? next : m))
}

/** Change only the status of an optimistic message. */
export function setStatusByTempId(
  list: ChatMessage[],
  tempId: string,
  status: ChatMessage['status'],
): ChatMessage[] {
  return list.map((m) => (m.id === tempId || m.tempId === tempId ? { ...m, status } : m))
}
