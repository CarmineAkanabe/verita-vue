import { describe, it, expect } from 'vitest'
import { useFormErrors } from './form-errors'
import { ZodError } from 'zod'

describe('useFormErrors', () => {
  it('initializes with empty errors', () => {
    const { errors } = useFormErrors()
    expect(errors.value).toEqual({})
  })

  it('sets server errors', () => {
    const { errors, setServerErrors } = useFormErrors()
    setServerErrors({ field: ['Error message'] })
    expect(errors.value).toEqual({ field: ['Error message'] })
  })

  it('sets zod errors', () => {
    const { errors, setZodErrors } = useFormErrors()
    const zodError = new ZodError([
      {
        code: 'custom',
        path: ['user', 'name'],
        message: 'Name is required'
      }
    ])
    setZodErrors(zodError)
    expect(errors.value).toEqual({ 'user.name': ['Name is required'] })
  })
})
