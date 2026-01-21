import { z } from '@botpress/sdk'
import axios, { AxiosInstance } from 'axios'
import axiosRetry from 'axios-retry'
import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import {
  AuthPayloadBody,
  AuthHeaders,
  AuthResponseHeaders,
  Cookie,
  authResponseDataSchema,
  OdooRequestArgs,
  OdooRequestKwargs,
  OdooRequestModel,
  OdooRequestMethod,
  odooApiResponseSchema,
} from 'definitions/schemas'

// Cache cookies per configuration to avoid re-authenticating.
// 30 minutes TTL.
const COOKIE_TTL_MS = 30 * 60 * 1000

const cookieCache = new Map<string, Cookie>()

/**
 * Creates an axios instance with retry logic configured (similar to Zendesk pattern).
 * Uses exponential backoff for retries.
 *
 * @returns Configured axios instance with retry logic
 */
function createAxiosInstance(): AxiosInstance {
  const instance = axios.create()

  axiosRetry(instance, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
      const rateLimitReached = error.response?.status === 429
      return axiosRetry.isNetworkOrIdempotentRequestError(error) || rateLimitReached
    },
  })

  return instance
}

const axiosInstance = createAxiosInstance()

/**
 * Extracts cookies from Set-Cookie headers and returns them as a Cookie header string.
 *
 * @param headers - The response headers containing Set-Cookie headers
 * @returns Cookie header string with name=value pairs
 */
const extractCookiesFromHeaders = (headers: AuthResponseHeaders): Cookie['cookie'] => {
  // Axios normalizes headers to lowercase.
  const setCookieHeaders = headers['set-cookie']

  if (!setCookieHeaders) return ''

  // Handle both array and string formats.
  const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders]

  // Extract cookie name=value pairs from Set-Cookie headers.
  // Set-Cookie format: "name=value; Path=/; HttpOnly"
  // We only need "name=value".
  return cookies
    .map((cookie: string) => {
      const match = cookie.match(/^([^=]+=[^;]+)/)
      return match ? match[1] : null
    })
    .filter(Boolean)
    .join('; ')
}

export const getAuthenticatedCookie = async ({
  odooApiUrl,
  odooDb,
  odooEmail,
  odooPassword,
  logger,
}: {
  odooApiUrl: string
  odooDb: string
  odooEmail: string
  odooPassword: string
  logger: bp.Logger
}): Promise<Cookie['cookie']> => {
  // Create a cache key from configuration.
  const cacheKey = `${odooApiUrl}-${odooDb}-${odooEmail}`

  // Check if cached cookie exists and is still valid.
  const cached = cookieCache.get(cacheKey)
  if (cached) {
    const age = Date.now() - cached.timestamp
    if (age < COOKIE_TTL_MS) {
      logger.forBot().debug(`Returning cached Odoo authentication cookie`)
      return cached.cookie
    } else {
      // Cookie expired, remove from cache.
      cookieCache.delete(cacheKey)
      logger.forBot().debug(`Cached Odoo authentication cookie expired`)
    }
  }

  // Authenticate using axios.post directly.
  logger.forBot().debug(`Authenticating with Odoo`)
  const payloadBody: AuthPayloadBody = {
    jsonrpc: '2.0',
    params: {
      db: odooDb,
      login: odooEmail,
      password: odooPassword,
    },
    id: Math.floor(Date.now() / 1000), // id field for JSON-RPC compliance
  }
  const headers: AuthHeaders = {
    'Content-Type': 'application/json',
  }

  const response = await axiosInstance.post(`${odooApiUrl}/web/session/authenticate`, payloadBody, { headers })

  const validatedResponse = authResponseDataSchema.parse(response.data)

  if (validatedResponse.error) {
    throw new RuntimeError(`Authentication failed: ${validatedResponse.error.message}`)
  }

  if (validatedResponse.result === undefined || validatedResponse.result.uid === undefined) {
    throw new RuntimeError('Authentication failed - no uid in response')
  }

  const cookie = extractCookiesFromHeaders(response.headers)
  if (cookie === '') {
    throw new RuntimeError('No cookies found in authentication response')
  }

  logger.forBot().info(`Authentication successful. UID: ${validatedResponse.result.uid}`)

  cookieCache.set(cacheKey, {
    cookie,
    timestamp: Date.now(),
  })

  return cookie
}

export const executeOdooMethod = async <T extends z.ZodSchema>({
  odooApiUrl,
  cookie,
  model,
  method,
  args,
  schema,
  kwargs,
  logger,
}: {
  odooApiUrl: string
  cookie: string
  model: OdooRequestModel
  method: OdooRequestMethod
  args: OdooRequestArgs
  schema: T
  kwargs?: OdooRequestKwargs
  logger?: bp.Logger
}): Promise<z.infer<T>> => {
  logger?.forBot().debug(`Executing Odoo method: ${method} on model: ${model}`)

  const url = `${odooApiUrl}/web/dataset/call_kw`
  const body = {
    jsonrpc: '2.0',
    params: {
      model,
      method,
      args: args ?? [],
      kwargs: kwargs ?? {},
    },
  }
  const headers = {
    'Content-Type': 'application/json',
    Cookie: cookie,
  }

  const response = await axiosInstance.post(url, body, { headers })

  const validatedResponse = odooApiResponseSchema.parse(response.data)
  if (validatedResponse.error) {
    const errorMessage = validatedResponse.error.message
    logger?.forBot().error(`Odoo API error: ${errorMessage}`)
    throw new RuntimeError(`Odoo API error: ${errorMessage}`)
  }

  return schema.parse(validatedResponse.result)
}

export const clearCookieCache = async ({
  odooApiUrl,
  odooDb,
  odooEmail,
  logger,
}: {
  odooApiUrl: string
  odooDb: string
  odooEmail: string
  logger: bp.Logger
}): Promise<void> => {
  cookieCache.delete(`${odooApiUrl}-${odooDb}-${odooEmail}`)
  logger.forBot().info(`Cleared cookie cache`)
}
