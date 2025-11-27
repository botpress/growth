import { isAxiosError } from 'axios'
import { ZodError, ZodIssue } from '@botpress/sdk'

/**
 * A helper function to format the private key in the RS256 format
 * @param privateKey
 * @returns
 */
export const formatPrivateKey = (privateKey: string) => {
  // Remove any existing PEM headers/footers if present
  let cleanKey = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/-----BEGIN RSA PRIVATE KEY-----/g, '')
    .replace(/-----END RSA PRIVATE KEY-----/g, '')
    .trim()

  // Remove all whitespace and newlines
  cleanKey = cleanKey.replace(/\s+/g, '')

  // Split into 64-character lines (standard PEM format)
  const lines = []
  for (let i = 0; i < cleanKey.length; i += 64) {
    lines.push(cleanKey.slice(i, i + 64))
  }

  // Return properly formatted PEM private key
  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`
}

const formatZodErrors = (issues: ZodIssue[]) =>
  'Validation Error: ' +
  issues
    .map((issue) => {
      const path = issue.path?.length ? `${issue.path.join('.')}: ` : ''
      return path ? `${path}${issue.message}` : issue.message
    })
    .join('\n')

/**
 * Extracts a meaningful error message from various error types
 * @param err - The error object to extract message from
 * @returns A formatted error message string
 */
export const getErrorMessage = (err: unknown): string => {
  if (isAxiosError(err)) {
    // server dependent error
    const status = err.response?.status
    const data = err.response?.data
    // always present
    const message = err.message

    if (typeof data === 'string' && data.trim()) {
      return status ? `${data} (Status: ${status})` : data
    }
    return status ? `${message} (Status: ${status})` : message
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
