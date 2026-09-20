const STAFF_TOKEN_KEY = 'verita.staffToken'
const CASE_TOKEN_KEY = 'verita.caseToken'

export const staffToken = {
    get: () => localStorage.getItem(STAFF_TOKEN_KEY),
    set: (t: string) => localStorage.setItem(STAFF_TOKEN_KEY, t),
    clear: () => localStorage.removeItem(STAFF_TOKEN_KEY),
}

export const caseToken = {
    get: () => localStorage.getItem(CASE_TOKEN_KEY),
    set: (t: string) => localStorage.setItem(CASE_TOKEN_KEY, t),
    clear: () => localStorage.removeItem(CASE_TOKEN_KEY),
}