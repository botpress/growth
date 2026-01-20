import { z } from '@botpress/sdk'
import axios from 'axios'
import * as bp from '.botpress'
import {
  AuthResponse,
  AuthPayloadBody,
  AuthHeaders,
  Cookie,
  OdooRequestArgs,
  OdooRequestKwargs,
  OdooRequestModel,
  OdooRequestMethod,
} from 'definitions/schemas'
import { RuntimeError } from '@botpress/sdk'

// Cache cookies per configuration to avoid re-authenticating
// 30 minutes TTL
const COOKIE_TTL_MS = 30 * 60 * 1000

const cookieCache = new Map<string, Cookie>()

/**
 * Extracts cookies from Set-Cookie headers and returns them as a Cookie header string
 */
const extractCookiesFromHeaders = (headers: AuthResponse['headers']): Cookie['cookie'] => {
  // Axios normalizes headers to lowercase
  const setCookieHeaders = headers['set-cookie']

  if (!setCookieHeaders) return ''

  // Handle both array and string formats
  const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders]

  // Extract cookie name=value pairs from Set-Cookie headers
  // Set-Cookie format: "name=value; Path=/; HttpOnly"
  // We only need "name=value"
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
  // Create a cache key from configuration
  const cacheKey = `${odooApiUrl}-${odooDb}-${odooEmail}`

  // Check if cached cookie exists and is still valid
  const cached = cookieCache.get(cacheKey)
  if (cached) {
    const age = Date.now() - cached.timestamp
    if (age < COOKIE_TTL_MS) {
      logger.forBot().debug(`Returning cached Odoo authentication cookie for: ${cacheKey}`)
      return cached.cookie
    } else {
      // Cookie expired, remove from cache
      cookieCache.delete(cacheKey)
      logger.forBot().debug(`Cached Odoo authentication cookie expired for: ${cacheKey}`)
    }
  }

  // Authenticate using axios.post directly
  logger.forBot().info(`Authenticating with Odoo: ${odooApiUrl}`)
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
  const response: AuthResponse = await axios.post(`${odooApiUrl}/web/session/authenticate`, payloadBody, { headers })

  // Check for errors first
  if (response.data.error) {
    logger.forBot().error(`Authentication error: ${JSON.stringify(response.data.error)}`)
    throw new RuntimeError(`Authentication failed: ${JSON.stringify(response.data.error)}`)
  }

  // Then check for uid
  if (response.data.result === undefined || response.data.result.uid === undefined) {
    logger.forBot().error(`Authentication failed - no uid in response: ${JSON.stringify(response.data.result)}`)
    throw new RuntimeError('Authentication failed - no uid in response')
  }

  // Extract cookies from response headers
  const cookie = extractCookiesFromHeaders(response.headers)
  if (cookie === '') {
    logger.forBot().warn('No cookies found in authentication response')
    throw new RuntimeError('No cookies found in authentication response')
  }

  logger.forBot().info(`Authentication successful. UID: ${response.data.result.uid}`)

  // Cache the cookie with timestamp
  cookieCache.set(cacheKey, {
    cookie,
    timestamp: Date.now(),
  })

  return cookie
}

export const executeOdooMethod = async ({
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
  schema: z.ZodSchema
  kwargs?: OdooRequestKwargs
  logger?: bp.Logger
}): Promise<z.infer<typeof schema>> => {
  logger?.forBot().info(`Executing Odoo method: ${method} on model: ${model}`)

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

  const response = await axios.post(url, body, { headers })

  if (response.data.error) {
    throw new RuntimeError(`Odoo API error: ${JSON.stringify(response.data.error)}`)
  }

  return schema.parse(response.data.result)
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
