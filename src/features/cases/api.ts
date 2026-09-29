// features/cases/api.ts
import { apiClient } from '@/shared/api/client'
import type {
  SubmitCasePayload,
  SubmitCaseResponse,
  DepartmentOption,
  ReporterCaseDashboard,
  ReporterDashboardResponse,
  EscalateCaseResponse,
  StaffCase,
  UpdateCaseStatusPayload,
} from './types'

/**
 * Hardcoded seeded departments for anonymous case routing.
 * Fallback used when unauthenticated public client accesses intake form.
 */
export const SEEDED_DEPARTMENTS: DepartmentOption[] = [
  { id: '01a0d0b7-461c-731a-b5d2-edf344afdf1f', name: 'Software Engineering' },
  { id: '01a0d0b7-4625-7230-a060-c721556e8c2e', name: 'Graphics Design' },
  { id: '01a0d0b7-4627-72d9-bdf5-b0e48b164f8b', name: 'Networking' },
  { id: '01a0d0bf-f106-712f-8370-7354d5f0a222', name: 'Maintenance' },
]

/**
 * Fetch available departments for intake routing from the public API directory.
 * Falls back to seeded list only if backend is unreachable.
 */
export async function getPublicDepartments(): Promise<DepartmentOption[]> {
  try {
    const response = await apiClient.get<{ data: DepartmentOption[] }>('/departments')
    if (response.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
      return response.data.data
    }
  } catch (error) {
    console.warn('[Verita] Could not fetch live departments, using fallback list:', error)
  }

  return SEEDED_DEPARTMENTS
}

/**
 * Submit an incident report with multipart evidence and an Idempotency-Key header.
 */
export async function submitCase(
  payload: SubmitCasePayload,
  idempotencyKey: string
): Promise<SubmitCaseResponse['data']> {
  const formData = new FormData()
  formData.append('departmentId', payload.departmentId)
  formData.append('description', payload.description)
  formData.append('purposeOfTransaction', payload.purposeOfTransaction)
  formData.append('amountInvolved', String(payload.amountInvolved))
  formData.append('personInvolved', payload.personInvolved)
  formData.append('transactionDate', payload.transactionDate)
  formData.append('concernsDepartmentHead', payload.concernsDepartmentHead ? '1' : '0')

  for (const file of payload.evidence) {
    formData.append('evidence[]', file)
  }

  const response = await apiClient.post<SubmitCaseResponse>('/cases', formData, {
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
  })

  return response.data.data
}

/**
 * Fetch the current Case Reporter Dashboard.
 * Uses caseToken via interceptor for /cases/me.
 */
export async function getReporterDashboard(): Promise<ReporterCaseDashboard> {
  const response = await apiClient.get<ReporterDashboardResponse>('/cases/me')
  return response.data.data
}

/**
 * Add additional supporting evidence to an existing case.
 */
export async function addReporterEvidence(files: File[]): Promise<ReporterCaseDashboard> {
  const formData = new FormData()
  for (const file of files) {
    formData.append('evidence[]', file)
  }

  const response = await apiClient.post<ReporterDashboardResponse>('/cases/me/evidence', formData)
  return response.data.data
}

/**
 * Escalate a case directly to the Executive Manager.
 */
export async function escalateCase(): Promise<EscalateCaseResponse> {
  const response = await apiClient.post<EscalateCaseResponse>('/cases/me/escalate')
  return response.data
}

/**
 * Fetch private evidence file stream as a Blob (reporter side).
 */
export async function getEvidenceBlob(evidenceId: string): Promise<{ blob: Blob; contentType: string }> {
  const response = await apiClient.get(`/cases/me/evidence/${encodeURIComponent(evidenceId)}`, {
    responseType: 'blob',
  })
  return {
    blob: response.data,
    contentType: (response.headers['content-type'] as string) || 'application/octet-stream',
  }
}

/**
 * Download an attached evidence file (reporter side).
 */
export async function downloadEvidenceFile(evidenceId: string, filename: string): Promise<void> {
  const { blob } = await getEvidenceBlob(evidenceId)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Phase 8: Staff Case Management API (Department Head & Manager)
// ---------------------------------------------------------------------------

/**
 * Fetch the queue of cases for the caller's department (only AWAITING_REVIEW, non-conflict).
 * Uses staffToken via interceptor.
 */
export async function getStaffCasesQueue(): Promise<StaffCase[]> {
  const response = await apiClient.get<{ data: StaffCase[] } | StaffCase[]>('/cases')
  if (Array.isArray(response.data)) {
    return response.data
  }
  return response.data?.data || []
}

/**
 * Fetch full case detail if assigned to caller or still eligible to claim.
 */
export async function getStaffCaseDetail(caseId: string): Promise<StaffCase> {
  const response = await apiClient.get<{ data: StaffCase } | StaffCase>(`/cases/${encodeURIComponent(caseId)}`)
  if ('data' in response.data && response.data.data) {
    return response.data.data
  }
  return response.data as StaffCase
}

/**
 * Atomically claim a case, assigning the caller and changing status to UNDER_INVESTIGATION.
 */
export async function claimCase(caseId: string): Promise<StaffCase> {
  const response = await apiClient.post<{ data: StaffCase } | StaffCase>(`/cases/${encodeURIComponent(caseId)}/claim`)
  if ('data' in response.data && response.data.data) {
    return response.data.data
  }
  return response.data as StaffCase
}

/**
 * Update case status with mandatory note and conditional resolutionSummary.
 * Note is max 2,000 characters.
 * resolutionSummary is required when status is RESOLVED or DISMISSED.
 */
export async function updateStaffCaseStatus(
  caseId: string,
  payload: UpdateCaseStatusPayload
): Promise<StaffCase> {
  const response = await apiClient.patch<{ data: StaffCase } | StaffCase>(
    `/cases/${encodeURIComponent(caseId)}/status`,
    payload
  )
  if ('data' in response.data && response.data.data) {
    return response.data.data
  }
  return response.data as StaffCase
}

/**
 * Fetch authorized staff evidence file stream as a Blob.
 * Uses /cases/{caseId}/evidence/{evidenceId} per API specification.
 */
export async function getStaffEvidenceBlob(
  caseId: string,
  evidenceId: string
): Promise<{ blob: Blob; contentType: string }> {
  const response = await apiClient.get(
    `/cases/${encodeURIComponent(caseId)}/evidence/${encodeURIComponent(evidenceId)}`,
    {
      responseType: 'blob',
    }
  )
  return {
    blob: response.data,
    contentType: (response.headers['content-type'] as string) || 'application/octet-stream',
  }
}

/**
 * Download staff evidence exhibit.
 */
export async function downloadStaffEvidenceFile(
  caseId: string,
  evidenceId: string,
  filename: string
): Promise<void> {
  const { blob } = await getStaffEvidenceBlob(caseId, evidenceId)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
