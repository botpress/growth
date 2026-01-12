import axios from 'axios'
import * as bp from '.botpress'
import { IntegrationLogger } from '@botpress/sdk'
import { genesysTokenResponseSchema } from './definitions/genesys-schemas'
import { GENESYS_INTEGRATION_ID } from './constants'

const logger = new IntegrationLogger()

export class GenesysApi {
  private clientId: string
  private clientSecret: string
  private regionDomain: string
  private integrationId: string
  private accessToken: string | null = null
  private tokenExpiresAt: number = 0

  constructor(ctx: bp.Context) {
    this.clientId = ctx.configuration.clientId
    this.clientSecret = ctx.configuration.clientSecret
    this.regionDomain = ctx.configuration.regionDomain
    this.integrationId = GENESYS_INTEGRATION_ID
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken
    }

    // Get a new token using Basic Authentication
    try {
      const response = await axios({
        method: 'POST',
        url: `https://login.${this.regionDomain}/oauth/token`,
        auth: {
          username: this.clientId,
          password: this.clientSecret,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: 'grant_type=client_credentials',
      })

      const tokenData = genesysTokenResponseSchema.parse(response.data)
      this.accessToken = tokenData.access_token
      // Set expiration time with 5 minute buffer
      this.tokenExpiresAt = Date.now() + (tokenData.expires_in - 300) * 1000

      logger.forBot().info('Successfully obtained Genesys access token')
      return this.accessToken
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.forBot().error(`Genesys OAuth Error: ${error.response?.data?.error_description || error.message}`)
      } else {
        logger.forBot().error(`Genesys OAuth Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
      throw error
    }
  }

  async sendMessage(externalUserId: string, nickname: string | undefined, text: string) {
    const token = await this.getAccessToken()

    const payload = {
      channel: {
        from: {
          id: externalUserId,
          nickname: nickname || externalUserId,
          idType: 'Opaque',
        },
        time: new Date().toISOString(),
        messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
      text,
    }

    logger.forBot().info('Sending message to Genesys:', payload)

    try {
      const response = await axios({
        method: 'POST',
        url: `https://api.${this.regionDomain}/api/v2/conversations/messages/${this.integrationId}/inbound/open/message`,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: payload,
      })

      logger.forBot().info('Successfully sent message to Genesys', response.data)
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.forBot().error(`Genesys API Error: ${error.response?.data?.message || error.message}`)
      } else {
        logger.forBot().error(`Genesys API Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
      throw error
    }
  }

  async validateConfiguration() {
    // Test the authentication by getting a token
    try {
      await this.getAccessToken()
      logger.forBot().info('Genesys configuration validated successfully')
      return true
    } catch (error) {
      logger.forBot().error('Genesys configuration validation failed:', error)
      return false
    }
  }
}

export const getClient = (ctx: bp.Context) => {
  return new GenesysApi(ctx)
}
