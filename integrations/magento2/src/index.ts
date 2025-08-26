import * as sdk from '@botpress/sdk'
import { getProducts, getStockItem, syncProducts, executeSyncProducts } from './actions'
import * as bp from '.botpress'
import axios from 'axios'
import crypto from 'crypto'
import OAuth from 'oauth-1.0a'

export default new bp.Integration({
  register: async ({ ctx, logger }) => {
    logger.forBot().info('Registering Magento2 integration')
    
    try {
      const { magento_domain, consumer_key, consumer_secret, access_token, access_token_secret, user_agent, store_code } =
        ctx.configuration

      const oauth = new OAuth({
        consumer: {
          key: consumer_key,
          secret: consumer_secret,
        },
        signature_method: 'HMAC-SHA256',
        hash_function(baseString: string, key: string) {
          return crypto.createHmac('sha256', key).update(baseString).digest('base64')
        },
      })

      const token = {
        key: access_token,
        secret: access_token_secret,
      }

      const testUrl = `https://${magento_domain}/rest/${store_code}/V1/directory/currency`

      const requestData = {
        url: testUrl,
        method: 'GET',
      }

      const authHeader = oauth.toHeader(oauth.authorize(requestData, token))

      const config = {
        method: requestData.method,
        url: requestData.url,
        maxBodyLength: Infinity,
        headers: {
          ...authHeader,
          'User-Agent': user_agent || 'Botpress-Magento2-Integration',
          'accept': 'application/json',
        },
      }

      const response = await axios(config)
      
      if (response.status === 200) {
        logger.forBot().info('Magento2 configuration validation successful')
        logger.forBot().debug('Currency endpoint response:', response.data)
      } else {
        throw new sdk.RuntimeError(`Unexpected response status: ${response.status}`)
      }
    } catch (error) {
      logger.forBot().error('Magento2 configuration validation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      throw new sdk.RuntimeError(`Failed to validate Magento2 configuration: ${errorMessage}`)
    }
  },
  unregister: async ({ logger }) => {
    logger.forBot().info('Unregistering Magento2 integration')
  },
  actions: {
    getProducts,
    getStockItem,
    syncProducts,
  },
  channels: {},
  handler: async ({ req, logger, ctx }) => {
    try {
      if (!req.body) {
        logger.forBot().error(`Request body is missing. Bot: ${ctx.botId}, Integration: ${ctx.integrationId}. The incoming request did not contain a body. Request details: ${JSON.stringify(req)}`);
        return;
      }

      const body = JSON.parse(req.body);

      if (body.type === 'magentoSyncContinue') {
        logger.forBot().info(`Magento sync continue event received: ${JSON.stringify(body)}`)

        try {
          const { table_name, custom_attributes, filters_json, _currentPage, _totalCount, _tableId, _runId, _customAttributeCodes, _attributeMappings, _filterCriteria, _currentPageProductIndex } = body.data
          const result = await executeSyncProducts({
            ctx,
            input: {
              table_name,
              custom_attributes,
              filters_json,
              _currentPage,
              _totalCount,
              _tableId,
              _runId,
              _customAttributeCodes,
              _attributeMappings,
              _filterCriteria,
              _currentPageProductIndex,
            },
            logger,
          })
          
          logger.forBot().info(`Sync result: ${JSON.stringify(result)}`)
        } catch (error) {
          logger.forBot().error(`Error syncing products: ${error}`)
        }
      }
    } catch (error) {
      logger.forBot().error(`Unexpected error in handler: ${error}`)
    }
  },
})
