import axios from 'axios'
import * as bp from '.botpress'
import { MagentoConfiguration } from '../types/magento'
import { parseFilters, buildFilterCriteria } from '../utils/magento'
import { createMagentoClient } from '../services/magento-client'

export const getProducts: bp.IntegrationProps['actions']['getProducts'] = async ({ ctx, input, logger }) => {
  logger.forBot().info('Starting getProducts action')

  const config: MagentoConfiguration = {
    ...ctx.configuration,
    user_agent: ctx.configuration.user_agent || 'Botpress Integration',
    store_code: ctx.configuration.store_code || 'default',
  }

  // Parse and validate input filters
  const filters = parseFilters(input, logger)
  if (!filters) {
    return {
      result: { items: [], search_criteria: {}, total_count: 0 },
      error: 'Invalid input filters',
      details: input,
    }
  }

  // Build filter criteria (empty array means no filters)
  const filterCriteria = filters.length > 0 ? buildFilterCriteria(filters, logger) : undefined
  if (filters.length > 0 && !filterCriteria) {
    return {
      result: { items: [], search_criteria: {}, total_count: 0 },
      error: 'No valid filter criteria generated',
      details: filters,
    }
  }

  try {
    // Create Magento client and make API request
    const client = createMagentoClient(config, logger)
    const responseData = await client.getProducts(filterCriteria)

    // Validate response
    const validation = client.validateResponse(responseData)
    if (!validation.success) {
      return {
        result: { items: [], search_criteria: {}, total_count: 0 },
        error: 'Invalid product list response',
        details: validation.error,
      }
    }

    return {
      result: {
        ...validation.data,
        search_criteria: {},
        items: validation.data?.items || [],
        total_count: validation.data?.total_count || 0,
      },
    }
  } catch (error) {
    logger.forBot().error(`API request failed: ${error}`)

    if (axios.isAxiosError(error)) {
      logger.forBot().error(`HTTP status: ${error.response?.status}`)
      logger.forBot().error(`Response data: ${JSON.stringify(error.response?.data)}`)
    }

    return {
      result: { items: [], search_criteria: {}, total_count: 0 },
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
