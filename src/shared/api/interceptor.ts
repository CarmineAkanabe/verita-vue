// shared/api/interceptor.ts
import { type InternalAxiosRequestConfig, type AxiosInstance } from 'axios';
import { caseToken, staffToken } from './auth';
import { mapProblemDetails } from './error';

function isPublicRoute(config: InternalAxiosRequestConfig): boolean {
    const rawUrl = config.url
    if (!rawUrl) return false

    // Normalize url: strip query string and leading slash
    const cleanUrl = rawUrl.split('?')[0].replace(/^\//, '')
    const method = (config.method || 'get').toLowerCase()

    if (cleanUrl === 'ping') return true
    if (cleanUrl === 'auth/login') return true

    // ONLY anonymous case intake submission is public
    if (cleanUrl === 'cases' && method === 'post') {
        return true
    }

    // Reporter PIN verification is public
    if (cleanUrl.endsWith('/verify-pin') && method === 'post') {
        return true
    }

    // Public directory of departments for case intake routing
    if (cleanUrl === 'departments' && method === 'get') {
        return true
    }

    return false
}

function isCaseReporterRoute(url?: string): boolean {
    if (!url) return false
    return url.includes('/cases/me') || url.startsWith('cases/me') || url.startsWith('/cases/me')
}

export function registerInterceptors(client: AxiosInstance): void {
    client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
        if (!isPublicRoute(config)) {
            const token = isCaseReporterRoute(config.url) ? caseToken.get() : staffToken.get()
            if (token && !config.headers.Authorization) {
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