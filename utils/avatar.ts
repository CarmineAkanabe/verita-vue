const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN as string) || 'http://localhost:8000'

export function getAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:')
  ) {
    return path
  }
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  if (cleanPath.startsWith('storage/')) {
    return `${API_ORIGIN}/${cleanPath}`
  }
  return `${API_ORIGIN}/storage/${cleanPath}`
}
