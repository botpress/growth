import axios, { AxiosRequestConfig } from "axios";
import * as crypto from "crypto";
import OAuth from "oauth-1.0a";
import * as bp from ".botpress";
import {
  MagentoConfiguration,
  OAuthClient,
  OAuthToken,
} from "../types/magento";
import { ProductListSchema } from "../misc/zod-schemas";
import { sleep } from "../utils/common";

/**
 * Creates OAuth client with HMAC-SHA256 signature method
 */
function createOAuthClientInternal(config: MagentoConfiguration): OAuthClient {
  return new OAuth({
    consumer: {
      key: config.consumer_key,
      secret: config.consumer_secret,
    },
    signature_method: "HMAC-SHA256",
    hash_function(baseString: string, key: string) {
      return crypto
        .createHmac("sha256", key)
        .update(baseString)
        .digest("base64");
    },
  });
}

/**
 * Creates OAuth token from configuration
 */
function createOAuthTokenInternal(config: MagentoConfiguration): OAuthToken {
  return {
    key: config.access_token,
    secret: config.access_token_secret,
  };
}

/**
 * Centralized Magento API client that handles OAuth authentication and API requests
 */
export class MagentoClient {
  private config: MagentoConfiguration;
  private oauth: OAuthClient;
  private token: OAuthToken;
  private logger: bp.Logger;

  constructor(config: MagentoConfiguration, logger: bp.Logger) {
    this.config = {
      ...config,
      user_agent: config.user_agent || "Botpress",
      store_code: config.store_code || "default",
    };
    this.logger = logger;
    this.oauth = createOAuthClientInternal(this.config);
    this.token = createOAuthTokenInternal(this.config);
  }

  /**
   * Creates headers for API requests
   */
  private createHeadersInternal(
    url?: string,
    method: string = "GET",
    includeOAuth: boolean = true
  ): Record<string, string> {
    const headers: Record<string, string> = {
      "User-Agent": this.config.user_agent!,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (includeOAuth && url) {
      const requestData = { url, method };
      const authData = this.oauth.authorize(requestData, this.token);

      // Create OAuth header in the exact format that works with this Magento instance
      const oauthParams = [
        `oauth_consumer_key="${authData.oauth_consumer_key}"`,
        `oauth_token="${authData.oauth_token}"`,
        `oauth_signature_method="${authData.oauth_signature_method}"`,
        `oauth_timestamp="${authData.oauth_timestamp}"`,
        `oauth_nonce="${authData.oauth_nonce}"`,
        `oauth_version="${authData.oauth_version}"`,
        `oauth_signature="${authData.oauth_signature}"`,
      ];

      const oauthHeader = `OAuth ${oauthParams.join(",")}`;
      headers.Authorization = oauthHeader;
    }

    return headers;
  }

  /**
   * Makes an authenticated API request to Magento with retry logic
   */
  async makeRequest<T = any>(
    endpoint: string,
    method: string = "GET",
    data?: any
  ): Promise<T> {
    // Ensure URL format matches what works with this Magento instance
    let domain = this.config.magento_domain;
    if (!domain.startsWith("www.") && !domain.includes("://")) {
      domain = `www.${domain}`;
    }

    const url = `https://${domain}/rest/${this.config.store_code}${endpoint}`;

    this.logger.forBot().info(`Making ${method} request to: ${url}`);

    const config: AxiosRequestConfig = {
      method,
      url,
      maxBodyLength: Infinity,
      headers: this.createHeadersInternal(url, method, true),
    };

    if (data && method !== "GET") {
      config.data = data;
    }

    // Retry logic for rate limits and server errors
    const maxRetries = 5;
    const initialDelay = 1000;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await axios(config);
        this.logger
          .forBot()
          .info(`API response received - Status: ${response.status}`);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          if (
            status &&
            (status === 429 || status >= 500) &&
            i < maxRetries - 1
          ) {
            const delay = initialDelay * Math.pow(2, i) * (1 + Math.random());
            this.logger
              .forBot()
              .warn(
                `API call failed with status ${status}. Retrying in ${delay.toFixed(0)}ms... (Attempt ${
                  i + 1
                }/${maxRetries})`
              );
            await sleep(delay);
            continue;
          }
        }

        this.logger.forBot().error(`API request failed: ${error}`);
        if (axios.isAxiosError(error)) {
          this.logger.forBot().error(`HTTP status: ${error.response?.status}`);
          this.logger
            .forBot()
            .error(`Response data: ${JSON.stringify(error.response?.data)}`);
        }

        throw error;
      }
    }
    throw new Error("API call failed after all retries.");
  }

  /**
   * Gets products with optional filter criteria
   */
  async getProducts(filterCriteria?: string): Promise<any> {
    const endpoint = filterCriteria
      ? `/V1/products?${filterCriteria}`
      : "/V1/products";
    return this.makeRequest(endpoint);
  }

  /**
   * Gets a specific product by SKU
   */
  async getProduct(sku: string): Promise<any> {
    return this.makeRequest(`/V1/products/${encodeURIComponent(sku)}`);
  }

  /**
   * Gets stock item for a specific SKU
   */
  async getStockItem(sku: string): Promise<any> {
    return this.makeRequest(`/V1/stockItems/${encodeURIComponent(sku)}`);
  }

  /**
   * Gets product attributes
   */
  async getProductAttributes(): Promise<any> {
    return this.makeRequest("/V1/products/attributes");
  }

  /**
   * Gets attribute options for a specific attribute
   */
  async getAttributeOptions(attributeCode: string): Promise<any> {
    return this.makeRequest(`/V1/products/attributes/${attributeCode}/options`);
  }

  /**
   * Gets product reviews for a specific product
   */
  async getProductReviews(productId: number): Promise<any> {
    const queryParams = [
      "searchCriteria[filterGroups][0][filters][0][field]=entity_id",
      `searchCriteria[filterGroups][0][filters][0][value]=${productId}`,
      "searchCriteria[filterGroups][0][filters][0][conditionType]=eq",
    ].join("&");

    return this.makeRequest(`/V1/reviews?${queryParams}`);
  }

  /**
   * Validates API response data using Zod schema
   */
  validateResponse(data: any) {
    try {
      const parsed = ProductListSchema.parse(data);
      this.logger
        .forBot()
        .info(`Successfully validated ${parsed.items?.length || 0} products`);
      return { success: true, data: parsed };
    } catch (err) {
      this.logger.forBot().error(`Validation failed: ${err}`);
      return {
        success: false,
        error: err instanceof Error ? err.message : err,
      };
    }
  }

  /**
   * Gets the configuration used by this client
   */
  getConfig(): MagentoConfiguration {
    return { ...this.config };
  }

  /**
   * Gets the OAuth client (for advanced usage)
   */
  getOAuthClient(): OAuthClient {
    return this.oauth;
  }

  /**
   * Gets the OAuth token (for advanced usage)
   */
  getToken(): OAuthToken {
    return { ...this.token };
  }

  /**
   * Creates standard headers for Magento API requests (without OAuth)
   */
  createHeaders(): Record<string, string> {
    return this.createHeadersInternal(undefined, "GET", false);
  }

  /**
   * Creates HTTP headers for Botpress API requests
   */
  createHttpHeaders(botId: string): Record<string, string> {
    return {
      Authorization: `bearer ${this.config.botpress_pat}`,
      "x-bot-id": botId,
      "Content-Type": "application/json",
    };
  }

  /**
   * Sends webhook to continue sync processing
   */
  async sendWebhook(
    webhookId: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const webhookUrl = `https://webhook.botpress.cloud/${webhookId}`;

    try {
      const response = await axios.post(webhookUrl, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status !== 200) {
        this.logger
          .forBot()
          .error(`Webhook failed with status ${response.status}`);
      }
    } catch (error) {
      this.logger
        .forBot()
        .error("Failed to send webhook to continue sync:", error);
    }
  }
}

/**
 * Factory function to create a MagentoClient instance
 */
export function createMagentoClient(
  config: MagentoConfiguration,
  logger: bp.Logger
): MagentoClient {
  return new MagentoClient(config, logger);
}

/**
 * Utility function to create OAuth client (for backward compatibility)
 */
export function createOAuthClient(config: MagentoConfiguration): OAuthClient {
  return createOAuthClientInternal(config);
}

/**
 * Utility function to create OAuth token (for backward compatibility)
 */
export function createOAuthToken(config: MagentoConfiguration): OAuthToken {
  return createOAuthTokenInternal(config);
}
