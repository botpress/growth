import axios, { AxiosError } from 'axios'
import * as bp from '.botpress'
import * as bpclient from '@botpress/client'

import { IntegrationLogger } from '@botpress/sdk'
import {
  OAuthTokenResponseSchema,
  ZohoAppConfigResponseSchema,
  ZohoCreateConversationResponseSchema,
  type CreateConversationData,
  type AppConfigData,
} from './definitions/schemas'

type JsonValue = string | number | boolean | null | JsonObject | JsonArray
type JsonObject = { [key: string]: JsonValue }
type JsonArray = JsonValue[]

type ZohoApiResponse = {
  success: boolean
  message: string
  data: JsonValue
}

const logger = new IntegrationLogger()

// Zoho Data Centers
const zohoAuthUrls = new Map<string, string>([
  ['us', 'https://accounts.zoho.com'],
  ['eu', 'https://accounts.zoho.eu'],
  ['in', 'https://accounts.zoho.in'],
  ['au', 'https://accounts.zoho.com.au'],
  ['cn', 'https://accounts.zoho.com.cn'],
  ['jp', 'https://accounts.zoho.jp'],
  ['ca', 'https://accounts.zohocloud.ca'],
])

// Define a Map for Zoho SalesIQ Server URIs
const zohoSalesIQUrls = new Map<string, string>([
  ['us', 'https://salesiq.zoho.com'],
  ['ca', 'https://salesiq.zohocloud.ca'],
  ['eu', 'https://salesiq.zoho.eu'],
  ['in', 'https://salesiq.zoho.in'],
  ['au', 'https://salesiq.zoho.com.au'],
  ['cn', 'https://salesiq.zoho.com.cn'],
  ['jp', 'https://salesiq.zoho.jp'],
])

// Function to get the Zoho Auth URL
const getZohoAuthUrl = (region: string): string => zohoAuthUrls.get(region) ?? 'https://accounts.zoho.ca'

// Function to get the Zoho SalesIQ Server URL
const getZohoSalesIQUrl = (region: string): string => zohoSalesIQUrls.get(region) ?? 'https://salesiq.zoho.com' // Default to US if region not found

/**
 * Extracts error message from various error response structures
 * Handles different API error formats including:
 * - response.data.message
 * - response.data.error
 * - response.data.error_description
 * - response.data.error_message
 * - response.data.errors (array)
 * Falls back to axiosError.message if no response data is available
 */
const extractErrorMessage = (axiosError: AxiosError): string => {
  const data = axiosError.response?.data as Record<string, unknown> | undefined

  if (!data) {
    return axiosError.message
  }

  // Check for common error message fields
  if (typeof data.message === 'string' && data.message) {
    return data.message
  }

  if (typeof data.error === 'string' && data.error) {
    return data.error
  }

  if (typeof data.error_description === 'string' && data.error_description) {
    return data.error_description
  }

  if (typeof data.error_message === 'string' && data.error_message) {
    return data.error_message
  }

  // Handle error arrays
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const errorMessages: string[] = []

    for (const errorItem of data.errors) {
      if (typeof errorItem === 'string') {
        errorMessages.push(errorItem)
      } else if (typeof errorItem === 'object' && errorItem !== null) {
        const errorObj = errorItem as Record<string, unknown>
        // Check for the same error field names as at the top level
        if (typeof errorObj.message === 'string' && errorObj.message) {
          errorMessages.push(errorObj.message)
        } else if (typeof errorObj.error === 'string' && errorObj.error) {
          errorMessages.push(errorObj.error)
        } else if (typeof errorObj.error_description === 'string' && errorObj.error_description) {
          errorMessages.push(errorObj.error_description)
        } else if (typeof errorObj.error_message === 'string' && errorObj.error_message) {
          errorMessages.push(errorObj.error_message)
        }
      }
    }

    if (errorMessages.length > 0) {
      return errorMessages.join('; ')
    }
  }

  // If data exists but no recognizable error field, fall back to axiosError.message
  // This ensures we don't lose the default error message from axios
  return axiosError.message
}

export class ZohoApi {
  private refreshToken: string
  private clientId: string
  private clientSecret: string
  private dataCenter: string
  private ctx: bp.Context
  private bpClient: bp.Client
  private zohoSalesIqServerURI: string

  constructor(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
    dataCenter: string,
    ctx: bp.Context,
    bpClient: bp.Client
  ) {
    this.refreshToken = refreshToken
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.dataCenter = dataCenter
    this.ctx = ctx
    this.bpClient = bpClient
    this.zohoSalesIqServerURI = getZohoSalesIQUrl(this.dataCenter)
  }

  async getStoredCredentials(): Promise<{ accessToken: string } | null> {
    try {
      const { state } = await this.bpClient.getState({
        id: this.ctx.integrationId,
        name: 'credentials',
        type: 'integration',
      })

      if (!state?.payload?.accessToken) {
        logger.forBot().error('No credentials found in state')
        return null
      }

      return {
        accessToken: state.payload.accessToken,
      }
    } catch (error) {
      logger.forBot().error('Error retrieving credentials from state:', error)
      return null
    }
  }

  private async makeHitlRequest(
    endpoint: string,
    method: string = 'GET',
    data: JsonObject | null = null,
    params: JsonObject = {}
  ): Promise<ZohoApiResponse> {
    try {
      const creds = await this.getStoredCredentials()
      if (!creds) {
        logger.forBot().error('Error retrieving credentials.')
        throw new bpclient.RuntimeError('Error grabbing credentials.')
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${creds.accessToken}`,
        Accept: 'application/json',
      }
      if (method !== 'GET' && method !== 'DELETE') {
        headers['Content-Type'] = 'application/json'
      }

      const response = await axios({
        method,
        url: `${endpoint}`,
        headers,
        data,
        params,
      })

      return {
        success: true,
        message: 'Request successful',
        data: response.data,
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError: AxiosError = error
        logger.forBot().error(axiosError.response)

        if (axiosError.response?.status === 401 || axiosError.response?.status === 400) {
          logger.forBot().warn('Access token expired. Refreshing...', error)

          await this.refreshAccessToken()
          return this.makeHitlRequest(endpoint, method, data, params)
        }

        const errorMessage = extractErrorMessage(axiosError)
        logger.forBot().error(`Error in ${method} ${endpoint}:`, axiosError.response?.data ?? axiosError.message)

        return {
          success: false,
          message: errorMessage,
          data: null,
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.forBot().error(`Error in ${method} ${endpoint}:`, errorMessage)

      return {
        success: false,
        message: errorMessage,
        data: null,
      }
    }
  }

  async refreshAccessToken() {
    try {
      const requestData = new URLSearchParams()
      requestData.append('client_id', this.clientId)
      requestData.append('client_secret', this.clientSecret)
      requestData.append('refresh_token', this.refreshToken)
      requestData.append('grant_type', 'refresh_token')

      const response = await axios.post(
        `${getZohoAuthUrl(this.ctx.configuration.dataCenter)}/oauth/v2/token`,
        requestData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      const parsed = OAuthTokenResponseSchema.safeParse(response.data)
      if (!parsed.success) {
        logger.forBot().error('Invalid OAuth token response:', parsed.error)
        throw new bpclient.RuntimeError('Invalid OAuth token response from Zoho')
      }

      await this.bpClient.setState({
        id: this.ctx.integrationId,
        type: 'integration',
        name: 'credentials',
        payload: {
          accessToken: parsed.data.access_token,
        },
      })
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = extractErrorMessage(error)
        logger.forBot().error('Error refreshing access token:', errorMessage)
      } else {
        logger
          .forBot()
          .error('Error refreshing access token:', error instanceof Error ? error.message : 'Unknown error')
      }
      throw new bpclient.RuntimeError('Authentication error. Please reauthorize the integration.')
    }
  }

  public async createConversation(
    name: string,
    email: string,
    title: string,
    description: string
  ): Promise<{ success: boolean; data: CreateConversationData | null; message: string }> {
    const response = await this.makeHitlRequest(
      `${this.zohoSalesIqServerURI}/api/visitor/v1/${this.ctx.configuration.screenName}/conversations`,
      'POST',
      {
        visitor: {
          user_id: email,
          name: name,
          email: email,
        },
        app_id: this.ctx.configuration.appId,
        department_id: this.ctx.configuration.departmentId,
        question: `Botpress - ${title} - ${description}`,
      }
    )

    if (!response.success) {
      return { success: false, data: null, message: response.message }
    }

    const parsed = ZohoCreateConversationResponseSchema.safeParse(response.data)
    if (!parsed.success) {
      logger.forBot().error('Invalid create conversation response:', parsed.error)
      return { success: false, data: null, message: 'Invalid response from Zoho SalesIQ' }
    }

    return { success: true, data: parsed.data.data, message: 'Conversation created successfully' }
  }

  public async sendMessage(conversationId: string, message: string) {
    const endpoint = `${this.zohoSalesIqServerURI}/api/visitor/v1/${this.ctx.configuration.screenName}/conversations/${conversationId}/messages`

    const payload = { text: message }

    try {
      const response = await this.makeHitlRequest(endpoint, 'POST', payload)

      if (!response.success) {
        logger.forBot().error('Failed to send message:', response.message)
      }

      return response
    } catch (error) {
      logger.forBot().error('Error sending message to Zoho SalesIQ:', error)
      throw error
    }
  }

  public async getApp(): Promise<AppConfigData | null> {
    const response = await this.makeHitlRequest(
      `${this.zohoSalesIqServerURI}/api/v2/${this.ctx.configuration.screenName}/apps/${this.ctx.configuration.appId}`
    )

    const parsed = ZohoAppConfigResponseSchema.safeParse(response.data)
    if (!parsed.success) {
      logger.forBot().error('Invalid app config response:', parsed.error)
      return null
    }
    return parsed.data.data
  }

  public async getDepartment(): Promise<AppConfigData | null> {
    const response = await this.makeHitlRequest(
      `${this.zohoSalesIqServerURI}/api/v2/${this.ctx.configuration.screenName}/departments/${this.ctx.configuration.departmentId}`
    )

    const parsed = ZohoAppConfigResponseSchema.safeParse(response.data)
    if (!parsed.success) {
      logger.forBot().error('Invalid department config response:', parsed.error)
      return null
    }
    return parsed.data.data
  }
}

export const getClient = (
  refreshToken: string,
  clientId: string,
  clientSecret: string,
  dataCenter: string,
  ctx: bp.Context,
  bpClient: bp.Client
) => {
  return new ZohoApi(refreshToken, clientId, clientSecret, dataCenter, ctx, bpClient)
}
