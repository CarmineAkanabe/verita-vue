import { defineStore } from 'pinia';
import { caseToken, staffToken } from '@/shared/api/auth';
import { type User } from '@/shared/types';

const CASE_ID_STORAGE_KEY = 'verita.caseId'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null as User | null,
        caseId: (typeof localStorage !== 'undefined' ? localStorage.getItem(CASE_ID_STORAGE_KEY) : null) as string | null,
    }),
    getters: {
        isStaffAuthenticated: (s) => !!s.user && !!staffToken.get(),
        isCaseAuthenticated: (s) => !!s.caseId && !!caseToken.get(),
    },
    actions: {
        setStaffSession(token: string, user: User) { staffToken.set(token); this.user = user },
        setCaseSession(token: string, caseId: string) {
            caseToken.set(token)
            this.caseId = caseId
            if (typeof localStorage !== 'undefined') localStorage.setItem(CASE_ID_STORAGE_KEY, caseId)
        },
        logoutStaff() { staffToken.clear(); this.user = null },
        logoutCase() {
            caseToken.clear()
            this.caseId = null
            if (typeof localStorage !== 'undefined') localStorage.removeItem(CASE_ID_STORAGE_KEY)
        },
    },
})