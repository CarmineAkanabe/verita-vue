// features/cases/audit.ts
import { apiClient } from '@/shared/api/client'

export type AuditAction =
  | 'STATUS_CHANGED'
  | 'AI_PROCESSED'
  | 'EVIDENCE_REVIEWED'
  | 'EVIDENCE_ADDED'
  | 'MESSAGE_SENT'
  | 'ESCALATED'
  | string

export type AuditActorType = 'AI' | 'DEPARTMENT_HEAD' | 'SYSTEM' | string

export interface CaseAuditLog {
  id: string
  caseRecordId: string
  actorType: AuditActorType
  action: AuditAction
  previousValue: string | null
  newValue: string | null
  note: string | null
  loggedAt: string
}

export async function getCaseAuditLogs(caseId: string): Promise<CaseAuditLog[]> {
  const response = await apiClient.get<{ data: CaseAuditLog[] }>(`/cases/${caseId}/audit-logs`)
  return response.data.data
}

export async function getAllAuditLogs(): Promise<CaseAuditLog[]> {
  const response = await apiClient.get<{ data: CaseAuditLog[] }>('/audit-logs')
  return response.data.data
}
