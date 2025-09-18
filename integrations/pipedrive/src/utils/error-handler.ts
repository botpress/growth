import { ZodError, ZodIssue } from '@botpress/sdk'

type PipedriveSdkErrorObject = {
  error?: string
  message?: string
  error_info?: string
  data?: { error?: string; message?: string } | unknown
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const extractFromSdkBody = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }
  if (!isObject(value)) return undefined

  const body = value as PipedriveSdkErrorObject

  if (typeof body.error === 'string' && body.error) return body.error
  if (typeof body.message === 'string' && body.message) return body.message
  if (typeof body.error_info === 'string' && body.error_info) return body.error_info

  if (isObject(body.data)) {
    const data = body.data as { error?: unknown; message?: unknown }
    if (typeof data.error === 'string' && data.error) return data.error
    if (typeof data.message === 'string' && data.message) return data.message
  }

  return undefined
}

const formatZodErrors = (issues: ZodIssue[]) =>
  'Validation Error: ' +
  issues
    .map((issue) => {
      const path = issue.path?.length ? `${issue.path.join('.')}: ` : ''
      return path ? `${path}${issue.message}` : issue.message
    })
    .join('\n')

export const getErrorMessage = (err: unknown): string => {
  if (err instanceof ZodError) {
    return formatZodErrors(err.errors)
  }

  const sdkMessage = extractFromSdkBody(err)
  if (sdkMessage) return sdkMessage

  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err

  if (isObject(err) && 'message' in err) {
    const message = (err as { message?: unknown }).message
    if (typeof message === 'string') return message
  }

  return 'An unexpected error occurred'
}

