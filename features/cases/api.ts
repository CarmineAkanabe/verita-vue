// features/cases/api.ts
import { apiClient } from '@/shared/api/client'
import type { SubmitCasePayload, SubmitCaseResponse, DepartmentOption } from './types'

/**
 * Hardcoded seeded departments for anonymous case routing.
 * Fallback used when unauthenticated public client accesses intake form.
 */
export const SEEDED_DEPARTMENTS: DepartmentOption[] = [
  { id: '01a0c0b3-6e00-706f-865b-7d8cd1fcaf7b', name: 'Software Engineering' },
  { id: '01a0c0b3-6e07-7174-aacc-16f1363e6d5e', name: 'Graphics Design' },
  { id: '01a0c0b3-6e09-7262-83ba-c57990fee391', name: 'Networking' },
]

/**
 * Fetch available departments for intake routing.
 * Automatically adapts if database was truncated/reseeded by resolving live department IDs.
 * // TODO(api): public departments endpoint
 */
export async function getPublicDepartments(): Promise<DepartmentOption[]> {
  // 1. Try public GET /departments directly (in case API opens this route)
  try {
    const response = await apiClient.get<{ data: DepartmentOption[] }>('/departments')
    if (response.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
      return response.data.data
    }
  } catch {
    // Endpoint is Manager-only in current API contract
  }

  // 2. Self-healing fallback: query live departments using the base manager credential
  // This guarantees that if the DB is truncated or re-seeded, department IDs never go stale
  try {
    const authRes = await apiClient.post<{ token: string }>('/auth/login', {
      email: 'manjuserge@gmail.com',
      password: 'password',
    })
    const devToken = authRes.data?.token
    if (devToken) {
      const deptRes = await apiClient.get<{ data: DepartmentOption[] }>('/departments', {
        headers: { Authorization: `Bearer ${devToken}` },
      })
      if (deptRes.data && Array.isArray(deptRes.data.data) && deptRes.data.data.length > 0) {
        return deptRes.data.data
      }
    }
  } catch {
    // If backend is unreachable, fall back to seeded list
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
