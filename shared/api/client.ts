import axios from 'axios'

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN as string

export const apiClient = axios.create({
    baseURL: `${API_ORIGIN}/api/v1`,
    headers: { Accept: 'application/json' },
})