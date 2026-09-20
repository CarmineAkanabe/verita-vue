import { defineStore } from 'pinia'
import { caseToken, staffToken } from '@/shared/api/auth'
import type { User } from '@/shared/types'

const CASE_ID_STORAGE_KEY = 'verita.caseId'
const STAFF_USER_STORAGE_KEY = 'verita.staffUser'

function getInitialStaffUser(): User | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(STAFF_USER_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    localStorage.removeItem(STAFF_USER_STORAGE_KEY)
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: getInitialStaffUser(),
    caseId: (typeof localStorage !== 'undefined' ? localStorage.getItem(CASE_ID_STORAGE_KEY) : null) as string | null,
  }),
  getters: {
    isStaffAuthenticated: (s) => !!s.user && !!staffToken.get(),
    isCaseAuthenticated: (s) => !!s.caseId && !!caseToken.get(),
  },
  actions: {
    setUser(user: User) {
      this.user = user
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STAFF_USER_STORAGE_KEY, JSON.stringify(user))
      }
    },
    setStaffSession(token: string, user: User) {
      staffToken.set(token)
      this.setUser(user)
    },
    setCaseSession(token: string, caseId: string) {
      caseToken.set(token)
      this.caseId = caseId
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(CASE_ID_STORAGE_KEY, caseId)
      }
    },
    logoutStaff() {
      staffToken.clear()
      this.user = null
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STAFF_USER_STORAGE_KEY)
      }
    },
    logoutCase() {
      caseToken.clear()
      this.caseId = null
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(CASE_ID_STORAGE_KEY)
      }
    },
  },
})