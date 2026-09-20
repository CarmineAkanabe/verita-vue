// features/cases/api.ts
import { apiClient } from '@/shared/api/client'
import type { SubmitCasePayload, SubmitCaseResponse, DepartmentOption } from './types'

/**
 * Hardcoded seeded departments for anonymous case routing.
 * Fallback used when unauthenticated public client accesses intake form.
 */
export const SEEDED_DEPARTMENTS: DepartmentOption[] = [
  { id: '01a0c03c-afb5-71d4-9241-743e70cc6f35', name: 'Software Engineering' },
  { id: '01a0c03c-afbf-7003-bbd8-671c0fbc80d2', name: 'Graphics Design' },
  { id: '01a0c03c-afc1-70a9-b527-5829cd4398d2', name: 'Networking' },
]

/**
 * Fetch available departments for intake routing.
 * // TODO(api): public departments endpoint
 */
export async function getPublicDepartments(): Promise<DepartmentOption[]> {
  try {
    // Attempt to query departments if an open endpoint becomes available
    const response = await apiClient.get<{ data: DepartmentOption[] }>('/departments')
    if (response.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
      return response.data.data
    }
  } catch {
    // Endpoint is Manager-only in current API contract; fall back gracefully to seeded departments
  }

  return SEEDED_DEPARTMENTS
}

/**
 * Submit an incident report with multipart evidence and an Idempotency-Key header.
 * @param payload Case submission details and files
 * @param idempotencyKey Client-generated UUID retained across retry attempts
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

  // Do NOT explicitly set 'Content-Type': 'multipart/form-data'.
  // Leaving it undefined lets Axios/browser append the crucial multipart boundary parameter.
  const response = await apiClient.post<SubmitCaseResponse>('/cases', formData, {
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
  })

  return response.data.data
}
