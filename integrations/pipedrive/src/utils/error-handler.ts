import { ZodError, ZodIssue } from '@botpress/sdk'

type PipedriveErrorBodyObject = {
  error?: string
  message?: string
  error_info?: string
  data?: { error?: string; message?: string }
}
type PipedriveErrorBody = string | PipedriveErrorBodyObject
type ErrorWithBody = { body?: PipedriveErrorBody }
type ErrorWithResponseBody = { response?: { body?: PipedriveErrorBody } }
type ErrorWithMessage = { message: string }

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const hasBody = (value: unknown): value is ErrorWithBody =>
  isObject(value) && 'body' in value

const hasResponseBody = (value: unknown): value is ErrorWithResponseBody =>
  isObject(value) && 'response' in value && isObject((value as { response?: unknown }).response)

const isErrorWithMessage = (value: unknown): value is ErrorWithMessage =>
  isObject(value) && 'message' in value && typeof (value as { message?: unknown }).message === 'string'

const extractBodyError = (body: PipedriveErrorBody | undefined): string | undefined => {
  if (!body) return undefined
  if (typeof body === 'string') {
    const trimmed = body.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }
  if (typeof body.error === 'string' && body.error.length > 0) return body.error
  if (typeof body.message === 'string' && body.message.length > 0) return body.message
  if (typeof body.error_info === 'string' && body.error_info.length > 0) return body.error_info
  if (body.data) {
    const { error, message } = body.data
    if (typeof error === 'string' && error.length > 0) return error
    if (typeof message === 'string' && message.length > 0) return message
  }
  return undefined
}

export const toErrorMessage = (error: unknown): string => {
  const fromResponse = hasResponseBody(error) ? extractBodyError(error.response?.body) : undefined
  if (fromResponse) return fromResponse

  const fromBody = hasBody(error) ? extractBodyError(error.body) : undefined
  if (fromBody) return fromBody

  if (error instanceof ZodError) {
    return formatZodErrors(error.errors)
  }

  if (isErrorWithMessage(error)) return error.message
  if (typeof error === 'string') return error

  if (isObject(error) && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }

  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

const formatZodErrors = (issues: ZodIssue[]) =>
  'Validation Error: ' +
  issues
    .map((issue) => {
      const path = issue.path?.length ? `${issue.path.join('.')}\u003a ` : ''
      return path ? `${path}${issue.message}` : issue.message
    })
    .join('\n')

export const getErrorMessage = (err: unknown): string => {
  const message = toErrorMessage(err)
  return message
}

