import { ref } from 'vue'
import type { ZodError } from 'zod'

export type FormErrors = Record<string, string[]>

export function useFormErrors() {
  const errors = ref<FormErrors>({})

  function clearErrors() {
    errors.value = {}
  }

  function setZodErrors(error: ZodError) {
    const formatted: FormErrors = {}
    for (const issue of error.issues) {
      const path = issue.path.join('.')
      if (!formatted[path]) formatted[path] = []
      formatted[path].push(issue.message)
    }
    errors.value = formatted
  }

  function setServerErrors(serverErrors: Record<string, string[]>) {
    errors.value = serverErrors
  }

  return {
    errors,
    clearErrors,
    setZodErrors,
    setServerErrors,
  }
}
