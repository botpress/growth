// Shopify API client for syncing products to Botpress
// Required configuration: shopDomain, apiKey
import axios from 'axios'
import * as bp from '.botpress'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'

export class MagentoClient {
  private _oauth: OAuth
  private _token: any
  private _baseUrl: string
  private _defaultHeaders: Record<string, string>

  public constructor(private _config: bp.configuration.Configuration) {
    const { consumer_key, consumer_secret, access_token, access_token_secret, user_agent } = _config

    this._oauth = new OAuth({
      consumer: {
        key: consumer_key,
        secret: consumer_secret,
      },
      signature_method: 'HMAC-SHA256',
      hash_function(baseString: string, key: string) {
        return crypto.createHmac('sha256', key).update(baseString).digest('base64')
      },
    })
  
    this._token = {
      key: access_token,
      secret: access_token_secret,
    }
  
    const defaultUserAgent = 'Botpress-Magento2-Integration/1.0'
    this._defaultHeaders = {
      'User-Agent': user_agent || defaultUserAgent,
      accept: 'application/json',
    }

    this._baseUrl = `https://${_config.magento_domain}/rest${_config.store_code || '/all'}`
  }

  private _createAuthHeaders(url: string, method: string = 'GET'): Record<string, string> {
    const authHeader = this._oauth.toHeader(this._oauth.authorize({ url, method }, this._token))
    return { ...authHeader, ...this._defaultHeaders }
  }

  public async getAttribute(attrCode: string, logger: bp.Logger, params?: Record<string, any>) {
    try {
      const attrUrl = `${this._baseUrl}/V1/products/attributes/${attrCode}`
      const headers = this._createAuthHeaders(attrUrl)

      const fetchAttribute = async () => {
        const response = await axios.get(attrUrl, { headers, params })
        return response.data
      }

      return await apiCallWithRetry(fetchAttribute, logger)

    } catch (error) {
      logger.forBot().error(`Error fetching attribute: ${JSON.stringify(error)}`)
      throw this._handleError(error)
    }
  }

  public async getProducts(searchCriteria: string, logger: bp.Logger, params?: Record<string, any>) {
    try {
      const productsUrl = `${this._baseUrl}/V1/products?${searchCriteria}`
      const headers = this._createAuthHeaders(productsUrl)

      const fetchProducts = async () => {
        const response = await axios.get(productsUrl, { headers, params })
        return response.data
      }

      return await apiCallWithRetry(fetchProducts, logger)

    } catch (error) {
      logger.forBot().error(`Error fetching products: ${JSON.stringify(error)}`)
      throw this._handleError(error)
    }
  }

  public async getStockItem(sku: string, logger: bp.Logger, params?: Record<string, any>) {
    try {
      const stockUrl = `${this._baseUrl}/V1/stockItems/${encodeURIComponent(sku)}`
      const headers = this._createAuthHeaders(stockUrl)

      const fetchStockItem = async () => {
        const response = await axios.get(stockUrl, { headers, params })
        return response.data
      }

      return await apiCallWithRetry(fetchStockItem, logger)
    } catch (error) {
      logger.forBot().error(`Error fetching stock item: ${JSON.stringify(error)}`)
      throw this._handleError(error)
    }
  }

  public async getReviews(sku: string, logger: bp.Logger, params?: Record<string, any>) {
    try {
      const reviewsUrl = `${this._baseUrl}/V1/products/${encodeURIComponent(sku)}/reviews`
      const headers = this._createAuthHeaders(reviewsUrl)

      const fetchReviews = async () => {
        const response = await axios.get(reviewsUrl, { headers, params })
        return response.data
      }
      return await apiCallWithRetry(fetchReviews, logger)
    } catch (error) {
      logger.forBot().error(`Error fetching reviews: ${JSON.stringify(error)}`)
      throw this._handleError(error)
    }
  }

  private _handleError(error: unknown) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.response?.data?.errors || error.message
      return new Error(`Magento API Error: ${message}`)
    }
    return error instanceof Error ? error : new Error(String(error))
  }
}

export async function apiCallWithRetry<T>(
  request: () => Promise<T>,
  logger: bp.Logger,
  maxRetries = 5,
  initialDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await request()
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        if (status && (status === 429 || status >= 500) && i < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, i) * (1 + Math.random()) // add jitter
          logger.forBot().warn(`API call failed with status ${status}. Retrying in ${delay.toFixed(0)}ms... (Attempt ${
            i + 1
          }/${maxRetries})`)
          await sleep(delay)
          continue
        }
      }
      logger.forBot().error('API call failed after all retries or with a non-retriable error.', error)
      throw error
    }
  }
  throw new Error('API call failed after all retries.')
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const getMagentoClient = (config: bp.configuration.Configuration): MagentoClient =>
  new MagentoClient(config)
