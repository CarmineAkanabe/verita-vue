// features/chat/types.ts

export type SenderType = 'CASE_REPORTER' | 'DEPARTMENT_HEAD' | 'SYSTEM'

export type PresenceStatus = 'ONLINE' | 'OFFLINE'

export type MessageStatus = 'sent' | 'pending' | 'failed'

export interface ChatMessage {
  id: string
  senderType: SenderType
  content: string
  sentAt: string
  status?: MessageStatus
  tempId?: string
}

export interface DepartmentHeadInfo {
  name: string
  presenceStatus: PresenceStatus
}

export interface ReporterChatResponse {
  departmentHead: DepartmentHeadInfo | null
  messages: ChatMessage[] | { data: ChatMessage[] }
}

export interface SendMessagePayload {
  content: string
}

export interface SendMessageResponse {
  data: ChatMessage
}
