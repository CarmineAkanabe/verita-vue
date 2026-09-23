export interface ApiResponse<T> {
    data: T
}

export interface PaginatedResponse<T> {
    data: T[]
    links: { first: string | null; last: string | null; prev: string | null; next: string | null }
    meta: { currentPage: number; lastPage: number; perPage: number; total: number }
}