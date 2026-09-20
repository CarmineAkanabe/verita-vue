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
