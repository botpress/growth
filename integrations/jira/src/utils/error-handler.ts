import { ZodError, ZodIssue } from '@botpress/sdk'

const formatZodErrors = (issues: ZodIssue[]) =>
  'Validation Error: ' +
  issues
    .map((issue) => {
      const path = issue.path?.length ? `${issue.path.join('.')}: ` : ''
      return path ? `${path}${issue.message}` : issue.message
    })
    .join('\n')

export const getErrorMessage = (err: unknown): string => {
  if (err && typeof err === 'object') {
    const error = err as Record<string, unknown>

    if ('statusCode' in error || 'response' in error) {
      const status = error.statusCode as number | undefined
      const response = error.response as { body?: unknown; data?: unknown } | undefined
      const message = error.message as string | undefined

      const data = response?.body || response?.data

      if (typeof data === 'string' && data.trim()) {
        return status ? `${data} (Status: ${status})` : data
      }
      return status ? `${message || 'Jira API error'} (Status: ${status})` : message || 'Jira API error'
    }
  }

  if (err instanceof ZodError) {
    return formatZodErrors(err.errors)
  }

  if (err instanceof Error) {
    return err.message
  }

  if (typeof err === 'string') {
    return err
  }

  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message: unknown }).message
    if (typeof message === 'string') {
      return message
    }
  }

  return 'An unexpected error occurred'
}
