type PipedriveErrorBody = { error?: string; message?: string }
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
  if (typeof body.error === 'string' && body.error.length > 0) return body.error
  if (typeof body.message === 'string' && body.message.length > 0) return body.message
  return undefined
}

export const toErrorMessage = (error: unknown): string => {
  const fromResponse = hasResponseBody(error) ? extractBodyError(error.response?.body) : undefined
  if (fromResponse) return fromResponse

  const fromBody = hasBody(error) ? extractBodyError(error.body) : undefined
  if (fromBody) return fromBody

  if (isErrorWithMessage(error)) return error.message
  if (typeof error === 'string') return error

  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

export type { PipedriveErrorBody }

