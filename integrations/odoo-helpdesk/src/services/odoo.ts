import axios, { AxiosResponse } from 'axios'
import * as bp from '.botpress'

// Cache cookies per configuration to avoid re-authenticating
const cookieCache = new Map<string, string>()

/**
 * Extracts cookies from Set-Cookie headers and returns them as a Cookie header string
 */
const extractCookies = (headers: Record<string, string>): string => {
  // Axios normalizes headers to lowercase
  const setCookieHeaders = headers['set-cookie'] || headers['Set-Cookie']

  if (!setCookieHeaders) {
    return ''
  }

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
}): Promise<string> => {
  // Create a cache key from configuration
  const cacheKey = `${odooApiUrl}-${odooDb}-${odooEmail}`

  // Return cached cookie if it exists
  if (cookieCache.has(cacheKey)) {
    logger.forBot().info(`Returning cached Odoo authentication cookie for: ${cacheKey}`)
    return cookieCache.get(cacheKey)!
  }

  // Authenticate using axios.post directly
  logger.forBot().info(`Authenticating with Odoo: ${odooApiUrl}`)
  const response = (await axios.post(
    `${odooApiUrl}/web/session/authenticate`,
    {
      jsonrpc: '2.0',
      params: {
        db: odooDb,
        login: odooEmail,
        password: odooPassword,
      },
      id: Math.floor(Date.now() / 1000), // id field for JSON-RPC compliance
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )) as AxiosResponse<{ result: { uid: number }; error?: { message: string } }>

  logger.forBot().info(`Authentication response: ${JSON.stringify(response.data)}`)

  // Check for errors first
  if (response.data?.error) {
    logger.forBot().error(`Authentication error: ${JSON.stringify(response.data.error)}`)
    throw new Error(`Authentication failed: ${JSON.stringify(response.data.error)}`)
  }

  // Then check for uid
  if (!response.data.result?.uid) {
    logger.forBot().error(`Authentication failed - no uid in response: ${JSON.stringify(response.data)}`)
    throw new Error('Authentication failed - no uid in response')
  }

  // Extract cookies from response headers
  const cookie = extractCookies(response.headers as Record<string, string>)
  if (!cookie) {
    logger.forBot().warn('No cookies found in authentication response')
  }

  logger.forBot().info(`Authentication successful. UID: ${response.data.result.uid}`)

  // Cache the cookie
  cookieCache.set(cacheKey, cookie)

  logger.forBot().info(`Odoo authentication cookie cached for: ${cacheKey}`)

  return cookie
}

export const executeOdooMethod = async ({
  odooApiUrl,
  cookie,
  model,
  method,
  args,
  kwargs,
  logger,
}: {
  odooApiUrl: string
  cookie: string
  model: 'helpdesk.ticket' | 'helpdesk.stage' | 'helpdesk.team' | 'res.partner'
  method: 'create' | 'read' | 'write' | 'search' | 'search_read'
  args?:
    | (string | number)[][]
    | (string | boolean)[][]
    | Record<string, string>[]
    | number[]
    | (number | Record<string, string>)[]
  kwargs?: Record<string, string | number>
  logger: bp.Logger
}): Promise<Array<Record<string, any>> | number | boolean | string> => {
  logger
    .forBot()
    .info(
      `Executing Odoo method: ${method} on model: ${model} with args: ${JSON.stringify(args)} and kwargs: ${JSON.stringify(kwargs)}`
    )

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
  logger
    .forBot()
    .info(
      `Odoo method: ${method} on model: ${model} executing with URL: ${url} and body: ${JSON.stringify(body)} and headers: ${JSON.stringify(headers)}`
    )
  const response = await axios.post(url, body, { headers })

  logger.forBot().info(`Odoo Request response data: ${JSON.stringify(response.data)}`)

  if (response.data.error) {
    logger.forBot().error(`Odoo API error: ${JSON.stringify(response.data.error)}`)
    throw new Error(`Odoo API error: ${JSON.stringify(response.data.error)}`)
  }

  logger.forBot().info(`Odoo Request response data result: ${JSON.stringify(response.data.result)}`)

  return response.data.result
}
