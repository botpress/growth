import axios, { AxiosInstance, AxiosResponse } from 'axios'
import * as bp from '.botpress'

// Cache clients per configuration to avoid re-authenticating
const clientCache = new Map<string, AxiosInstance>()

export const getAuthenticatedOdooClient = async ({
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
}): Promise<AxiosInstance> => {
  // Create a cache key from configuration
  const cacheKey = `${odooApiUrl}-${odooDb}-${odooEmail}`

  // Return cached client if it exists
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)!
  }

  // Create new axios instance for this configuration
  const odooClient = axios.create({
    baseURL: odooApiUrl,
    withCredentials: true, // Automatically handles cookies
  })

  // Authenticate
  const response = await odooClient.post('/web/session/authenticate', {
    jsonrpc: '2.0',
    params: {
      db: odooDb,
      login: odooEmail,
      password: odooPassword,
    },
    id: Math.floor(Date.now() / 1000), // id field for JSON-RPC compliance
  }) as AxiosResponse<{ result: { uid: number }, error?: { message: string } }>
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

  logger.forBot().info(`Authentication successful. UID: ${response.data.result.uid}`)

  // Cache the authenticated client
  clientCache.set(cacheKey, odooClient)

  return odooClient
}

export const executeOdooMethod = async ({
  client,
  model,
  method,
  args,
  kwargs,
  logger,
}: {
  client: AxiosInstance
  model: 'helpdesk.ticket' | 'helpdesk.stage' | 'helpdesk.team' | 'res.partner'
  method: 'create' | 'read' | 'write' | 'search' | 'search_read'
  args?: any[]
  kwargs?: Record<string, any>
  logger: bp.Logger
}): Promise<any> => {
  logger
    .forBot()
    .info(
      `Executing Odoo method: ${method} on model: ${model} with args: ${JSON.stringify(args)} and kwargs: ${JSON.stringify(kwargs)}`
    )

  const response = await client.post('/web/dataset/call_kw', {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      model,
      method,
      args: args ?? [],
      kwargs: kwargs ?? {},
    },
    id: Math.floor(Date.now() / 1000),
  })

  logger.forBot().info(`Odoo method: ${method} on model: ${model} executed successfully`)

  if (response.data.error) {
    throw new Error(`Odoo API error: ${JSON.stringify(response.data.error)}`)
  }

  logger
    .forBot()
    .info(
      `Odoo method: ${method} on model: ${model} executed successfully with result: ${JSON.stringify(response.data.result)}`
    )

  return response.data.result
}
