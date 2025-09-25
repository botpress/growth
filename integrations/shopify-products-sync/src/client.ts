// Shopify API client for syncing products to Botpress
// Required configuration: shopDomain, apiKey
import axios, { AxiosInstance } from 'axios'
import * as bp from '.botpress'
import { ShopifyProduct } from './schemas/products'
import { SHOPIFY_API_VERSION } from './constants'
import { retry } from './misc/utils'

export class ShopifyClient {
  private _client: AxiosInstance
  private _baseUrl: string

  public constructor(private _config: bp.configuration.Configuration) {
    this._baseUrl = `https://${_config.shopDomain}/admin/api/${SHOPIFY_API_VERSION}`
    this._client = axios.create({
      headers: {
        'X-Shopify-Access-Token': _config.apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
  }

  public async getProducts(logger: bp.Logger, params?: Record<string, any>) {
    try {
      const fetchProducts = async () => {
        const response = await this._client.get(`${this._baseUrl}/products.json`, { params })
        return response.data.products as ShopifyProduct[]
      }
      return await retry(fetchProducts, 3, 500)
    } catch (error) {
      logger.forBot().error(`Error fetching products: ${JSON.stringify(error)}`)
      throw this._handleError(error)
    }
  }

  public async createWebhook({
    topic,
    webhookUrl,
    topicReadable,
    botId,
    logger,
  }: {
    topic: string
    webhookUrl: string
    topicReadable: string
    botId: string
    logger: bp.Logger
  }) {
    try {
      let response = await this._client.get(`${this._baseUrl}/webhooks.json?topic=${topic}&address=${webhookUrl}`)

      if (response.data.webhooks.length > 0) {
        logger
          .forBot()
          .warn(
            `Shopify webhook for "${topicReadable}" already exists with ID ${response.data.webhooks[0].id.toString()} for bot ID ${botId}. No new webhook was created.`
          )
        return
      }

      response = await this._client.post(`${this._baseUrl}/webhooks.json`, {
        webhook: {
          topic,
          address: webhookUrl,
          format: 'json',
        },
      })

      return response.data.webhook.id.toString()
    } catch (error) {
      throw this._handleError(error)
    }
  }

  public async deleteWebhook(webhookId: string, logger: bp.Logger) {
    try {
      const response = await this._client.delete(`${this._baseUrl}/webhooks/${webhookId}.json`)
      logger.forBot().info(`Shopify webhook: "${webhookId}" deleted successfully`)
      return response.data
    } catch (error) {
      throw this._handleError(error)
    }
  }

  public async getWebhooks(webhookUrl: string) {
    try {
      const response = await this._client.get(`${this._baseUrl}/webhooks.json?address=${webhookUrl}`)
      return response.data
    } catch (error) {
      throw this._handleError(error)
    }
  }

  private _handleError(error: unknown) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.errors || error.message
      return new Error(`Shopify API Error: ${message}`)
    }
    return error instanceof Error ? error : new Error(String(error))
  }
}

export const getShopifyClient = (config: bp.configuration.Configuration): ShopifyClient => new ShopifyClient(config)
