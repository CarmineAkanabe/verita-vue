// features/cases/types.ts

export type CaseStatus =
  | 'SUBMITTED'
  | 'AI_PROCESSING'
  | 'AWAITING_REVIEW'
  | 'UNDER_INVESTIGATION'
  | 'RESOLVED'
  | 'CLOSED'
  | 'DISMISSED'

export type CaseCategory = 'FRAUD' | 'HARASSMENT' | 'SECURITY' | 'OTHER'

export type EvidenceFileType = 'IMAGE' | 'PDF'

export interface EvidenceItem {
  id: string
  fileType: EvidenceFileType
  uploadedAt: string
  downloadUrl: string
}

export interface DepartmentOption {
  id: string
  name: string
}

export interface SubmitCasePayload {
  departmentId: string
  description: string
  purposeOfTransaction: string
  amountInvolved: number
  personInvolved: string
  transactionDate: string // YYYY-MM-DD
  concernsDepartmentHead: boolean
  evidence: File[]
}

export interface SubmitCaseResponse {
  data: {
    caseId: string
    trackingPin: string
    status: CaseStatus
  }
}

export interface TimelineEvent {
  id?: string
  date?: string
  time?: string
  timestamp?: string
  eventDate?: string
  event?: string
  title?: string
  description?: string
  source?: string
}

export interface ReporterCaseDashboard {
  caseId: string
  status: CaseStatus
  description: string
  purposeOfTransaction: string
  amountInvolved: string | number
  personInvolved: string
  transactionDate: string
  evidence: EvidenceItem[]
  aiProcessingFailed?: boolean
  aiSummary?: string | null
  aiTimeline?: TimelineEvent[] | string | null
  aiFindings?: string[] | string | null
  escalatedAt?: string | null
  assignedTo?: string | null
}

export interface ReporterDashboardResponse {
  data: ReporterCaseDashboard
}

export interface EscalateCaseResponse {
  escalatedAt: string
}

