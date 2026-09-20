// shared/api/interceptor.ts
import { type InternalAxiosRequestConfig, type AxiosInstance } from 'axios';
import { caseToken, staffToken } from './auth';
import { mapProblemDetails } from './error';

function isPublicRoute(url?: string): boolean {
    if (!url) return false
    return (
        url === '/ping' ||
        url === '/auth/login' ||
        url === '/cases' ||
        url === 'cases' ||
        url.endsWith('/verify-pin')
    )
}

function isCaseReporterRoute(url?: string): boolean {
    if (!url) return false
    return url.includes('/cases/me') || url.startsWith('cases/me') || url.startsWith('/cases/me')
}

export function registerInterceptors(client: AxiosInstance): void {
    client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
        if (!isPublicRoute(config.url)) {
            const token = isCaseReporterRoute(config.url) ? caseToken.get() : staffToken.get()
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }
        }
        return config
    })

    client.interceptors.response.use(
        (response) => response,
        (error) => Promise.reject(mapProblemDetails(error)),
    )
}