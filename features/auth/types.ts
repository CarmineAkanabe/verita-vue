// features/auth/types.ts
import type { User } from '@/shared/types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface VerifyPinPayload {
  pin: string
}

export interface VerifyPinResponse {
  data: {
    token: string
  }
}
