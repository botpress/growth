import axios from 'axios'
import crypto from 'crypto'
import OAuth from 'oauth-1.0a'
import * as bp from '.botpress'
import { ProductListSchema } from '../misc/zod-schemas'

export const getProducts: bp.IntegrationProps['actions']['getProducts'] = async ({ ctx, input, logger }) => {
  logger.forBot().info(`Input received: ${JSON.stringify(input)}`)

  const { magento_domain, consumer_key, consumer_secret, access_token, access_token_secret, user_agent } =
    ctx.configuration

  logger.forBot().info(`Magento domain: ${magento_domain}`)
  logger.forBot().info(`User agent: ${user_agent}`)

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

  let filtersInput = (input as any).searchCriteria;
  
  if (typeof filtersInput === 'string') {
    logger.forBot().info('Input is a string, attempting to parse as JSON')
    try {
      filtersInput = JSON.parse(filtersInput);
      logger.forBot().info(`Successfully parsed JSON input: ${JSON.stringify(filtersInput)}`)
    } catch (err) {
      logger.forBot().error(`Failed to parse JSON input: ${err}`)
      return { result: { items: [], search_criteria: {}, total_count: 0 }, error: 'Invalid JSON input', details: input };
    }
  }

  if (!Array.isArray(filtersInput)) {
    logger.forBot().error(`Input is not an array: ${typeof filtersInput}`)
    return { result: { items: [], search_criteria: {}, total_count: 0 }, error: 'Input must be an array of filters', details: filtersInput };
  }

  logger.forBot().info(`Processing ${filtersInput.length} filters`)
  logger.forBot().info(`filtersInput: ${JSON.stringify(filtersInput)}`)

  let filterCriteria = ''
  try {
    const filters = filtersInput;
    if (Array.isArray(filters)) {
      logger.forBot().info(`Building filter criteria for ${filters.length} filters`)
      const filterGroups: string[] = []
      filters.forEach((filter: any, idx: number) => {
        logger.forBot().info(`Processing filter ${idx + 1}: ${JSON.stringify(filter)}`)
        if (!filter.field || !filter.condition) {
          logger.forBot().warn(`Skipping filter ${idx + 1} - missing field or condition`)
          return
        }
        const filterGroup = `searchCriteria[filterGroups][${idx}][filters][0][field]=${encodeURIComponent(filter.field)}&searchCriteria[filterGroups][${idx}][filters][0][conditionType]=${filter.condition}`
        if (filter.value && filter.condition !== 'notnull' && filter.condition !== 'null') {
          const fullFilterGroup = `${filterGroup}&searchCriteria[filterGroups][${idx}][filters][0][value]=${encodeURIComponent(filter.value)}`
          filterGroups.push(fullFilterGroup)
          logger.forBot().info(`Added filter group ${idx + 1}: ${fullFilterGroup}`)
        } else {
          filterGroups.push(filterGroup)
          logger.forBot().info(`Added filter group ${idx + 1} (no value): ${filterGroup}`)
        }
      })
      if (filterGroups.length > 0) {
        filterCriteria = filterGroups.join('&')
        logger.forBot().info(`Built filter criteria with ${filterGroups.length} groups`)
      } else {
        logger.forBot().warn('No valid filter groups were created')
      }
    }
  } catch (err) {
    logger.forBot().error(`Error building filter criteria: ${err}`)
    return { result: { items: [], search_criteria: {}, total_count: 0 }, error: 'Invalid filter array', details: err instanceof Error ? err.message : err };
  }

  logger.forBot().info(`Final filterCriteria: ${filterCriteria}`)

  if (!filterCriteria) {
    logger.forBot().error('No filter criteria generated')
    return { result: { items: [], search_criteria: {}, total_count: 0 }, error: 'Invalid or unsupported filter array', details: filtersInput };
  }

  const searchCriteriaString = filterCriteria;
  const url = `https://${magento_domain}/rest/all/V1/products?${searchCriteriaString}`;

  logger.forBot().info(`Constructed API URL: ${url}`)

  const requestData = {
    url,
    method: 'GET',
  }

  const authHeader = oauth.toHeader(oauth.authorize(requestData, token))
  logger.forBot().info('OAuth authorization header generated')

  const config = {
    method: requestData.method,
    url: requestData.url,
    maxBodyLength: Infinity,
    headers: {
      ...authHeader,
      'User-Agent': user_agent,
    },
  }

  logger.forBot().info(`Making API request to: ${url}`)
  
  try {
    logger.forBot().info('Sending HTTP request...')
    const response = await axios(config)
    logger.forBot().info(`API response received - Status: ${response.status}`)
    logger.forBot().info(`Response data: ${typeof response.data}`)
    
    if (response.data && typeof response.data === 'object') {
      logger.forBot().info(`Response has ${Object.keys(response.data).length} top-level keys: ${Object.keys(response.data).join(', ')}`)
      if (response.data.items) {
        logger.forBot().info(`Found ${response.data.items.length} products in response`)
      }
    }

    try {
      logger.forBot().info('Validating response with Zod schema...')
      const parsed = ProductListSchema.parse(response.data)
      logger.forBot().info('Response validation successful')
      logger.forBot().info(`Returning ${parsed.items?.length || 0} products`)
      return { result: { ...parsed, search_criteria: {} } }
    } catch (err) {
      logger.forBot().error(`Zod validation failed: ${err}`)
      logger.forBot().error(`Raw response data: ${JSON.stringify(response.data)}`)
      return { result: { items: [], search_criteria: {}, total_count: 0 }, error: 'Invalid product list response', details: err instanceof Error ? err.message : err }
    }
  } catch (error) {
    logger.forBot().error(`API request failed: ${error}`)
    if (axios.isAxiosError(error)) {
      logger.forBot().error(`HTTP status: ${error.response?.status}`)
      logger.forBot().error(`Response data: ${JSON.stringify(error.response?.data)}`)
      logger.forBot().error(`Request URL: ${error.config?.url}`)
    }
    logger.forBot().error(`API request failed: ${error}`)
    return { result: { items: [], search_criteria: {}, total_count: 0 }, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
