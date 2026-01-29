import { IntegrationLogger } from '@botpress/sdk'
import axios, { AxiosError } from 'axios'

import * as bp from '.botpress'
import { JsonValue } from './definitions/literals'
import {
  type AppConfigData,
  type CreateConversationData,
  OAuthTokenResponseSchema,
  ZohoAppConfigResponseSchema,
  ZohoCreateConversationResponseSchema,
} from './definitions/schemas'

type ZohoApiResponse = {
  success: boolean
  message: string
  data: JsonValue
}

const logger = new IntegrationLogger()

const zohoAuthUrls = new Map<string, string>([
  ['us', 'https://accounts.zoho.com'],
  ['eu', 'https://accounts.zoho.eu'],
  ['in', 'https://accounts.zoho.in'],
  ['au', 'https://accounts.zoho.com.au'],
  ['cn', 'https://accounts.zoho.com.cn'],
  ['jp', 'https://accounts.zoho.jp'],
  ['ca', 'https://accounts.zohocloud.ca'],
])

const zohoSalesIQUrls = new Map<string, string>([
  ['us', 'https://salesiq.zoho.com'],
  ['ca', 'https://salesiq.zohocloud.ca'],
  ['eu', 'https://salesiq.zoho.eu'],
  ['in', 'https://salesiq.zoho.in'],
  ['au', 'https://salesiq.zoho.com.au'],
  ['cn', 'https://salesiq.zoho.com.cn'],
  ['jp', 'https://salesiq.zoho.jp'],
])

const getZohoAuthUrl = (region: string): string => zohoAuthUrls.get(region) ?? 'https://accounts.zoho.ca'

const getZohoSalesIQUrl = (region: string): string => zohoSalesIQUrls.get(region) ?? 'https://salesiq.zoho.com'

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

  async getStoredCredentials(): Promise<{ accessToken: string; accessTokenExpiresAt: number } | null> {
    try {
      const { state } = await this.bpClient.getState({
        id: this.ctx.integrationId,
        name: 'credentials',
        type: 'integration',
      })

      if (!state?.payload?.accessToken || typeof state?.payload?.accessTokenExpiresAt !== 'number') {
        logger.forBot().error('No credentials found in state')
        return null
      }

      return {
        accessToken: state.payload.accessToken,
        accessTokenExpiresAt: state.payload.accessTokenExpiresAt,
      }
    } catch (error) {
      logger.forBot().error('Error retrieving credentials from state:', error)
      return null
    }
  }

  private async makeHitlRequest(
    endpoint: string,
    method: string = 'GET',
    data: JsonValue | null = null,
    params: JsonValue = {}
  ): Promise<ZohoApiResponse> {
    let creds = await this.getStoredCredentials()

    if (!creds) {
      logger.forBot().info('Credentials missing, attempting refresh...')
      const refreshResult = await this.refreshAccessToken()
      if (!refreshResult.success) {
        return { success: false, message: refreshResult.error ?? 'Authentication failed', data: null }
      }
      creds = await this.getStoredCredentials()
      if (!creds) {
        return { success: false, message: 'Failed to retrieve credentials after refresh', data: null }
      }
    }

    try {
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
        const axiosError = error as AxiosError<{ message?: string }>
        logger.forBot().error(axiosError.response)

        if (axiosError.response?.status === 401 || axiosError.response?.status === 400) {
          logger.forBot().warn('Access token expired. Refreshing...', error)

          const refreshResult = await this.refreshAccessToken()
          if (!refreshResult.success) {
            return { success: false, message: refreshResult.error ?? 'Authentication failed', data: null }
          }
          return this.makeHitlRequest(endpoint, method, data, params)
        }

        const errorMessage = axiosError.response?.data?.message ?? axiosError.message
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

  async refreshAccessToken(): Promise<{ success: boolean; error?: string }> {
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
        return { success: false, error: 'Invalid OAuth token response from Zoho' }
      }

      // NOTE: Zoho refresh tokens never expire, only access tokens do
      await this.bpClient.setState({
        id: this.ctx.integrationId,
        type: 'integration',
        name: 'credentials',
        payload: {
          accessToken: parsed.data.access_token,
          accessTokenExpiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
        },
      })
      return { success: true }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.forBot().error('Error refreshing access token:', error.response?.data ?? error.message)
      } else {
        logger
          .forBot()
          .error('Error refreshing access token:', error instanceof Error ? error.message : 'Unknown error')
      }
      return { success: false, error: 'Authentication error. Please reauthorize the integration.' }
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
    const response = await this.makeHitlRequest(endpoint, 'POST', { text: message })

    if (!response.success) {
      logger.forBot().error('Failed to send message:', response.message)
    }
    return response
  }

  public async getApp(): Promise<{ success: boolean; data: AppConfigData | null; message: string }> {
    const response = await this.makeHitlRequest(
      `${this.zohoSalesIqServerURI}/api/v2/${this.ctx.configuration.screenName}/apps/${this.ctx.configuration.appId}`
    )

    if (!response.success) {
      return { success: false, data: null, message: response.message }
    }

    const parsed = ZohoAppConfigResponseSchema.safeParse(response.data)
    if (!parsed.success) {
      logger.forBot().error('Invalid app config response:', parsed.error)
      return { success: false, data: null, message: 'Invalid app config response from Zoho SalesIQ' }
    }
    return { success: true, data: parsed.data.data, message: 'App config retrieved' }
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
