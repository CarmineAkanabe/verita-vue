import { type InternalAxiosRequestConfig } from 'axios';
import { apiClient } from './client';
import { caseToken, staffToken } from './auth';
import { mapProblemDetails } from './error';

function isPublicRoute(url?: string): boolean {
    if (!url) return false
    return (
        url === '/ping' ||
        url === '/auth/login' ||
        url === '/cases' ||
        url.endsWith('/verify-pin')
    )
}

function isCaseReporterRoute(url?: string) {
    return !!url && url.startsWith('/cases/me')
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (!isPublicRoute(config.url)) {
        const token = isCaseReporterRoute(config.url) ? caseToken.get() : staffToken.get()
        if (token) config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

apiClient.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(mapProblemDetails(error)),
)