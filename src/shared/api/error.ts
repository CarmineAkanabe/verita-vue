import { type AxiosError } from 'axios';

export interface ProblemDetails {
    type: string
    title: string
    status: number
    detail: string
    instance?: string
    errors?: Record<string, string[]>
}

export class ApiError extends Error {
    status: number
    title: string
    errors?: Record<string, string[]>

    constructor(problem: ProblemDetails) {
        super(problem.detail || problem.title)
        this.status = problem.status
        this.title = problem.title
        this.errors = problem.errors
    }
}

export function mapProblemDetails(error: AxiosError<ProblemDetails>): ApiError {
    const body = error.response?.data
    if (body?.title) return new ApiError(body)
    return new ApiError({
        type: 'about:blank',
        title: 'Network error',
        status: error.response?.status ?? 0,
        detail: error.message,
    })
}