import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import { createMagentoClient } from '../services/magento-client'

export const register: bp.IntegrationProps['register'] = async ({ ctx, logger }) => {
  logger.forBot().info('Registering Magento2 integration')

  try {
    // Create Magento client and test connection
    const client = createMagentoClient(ctx.configuration, logger)
    await client.makeRequest('/V1/directory/currency')

    logger.forBot().info('Magento2 configuration validation successful')
  } catch (error) {
    logger.forBot().error('Magento2 configuration validation failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new sdk.RuntimeError(`Failed to validate Magento2 configuration: ${errorMessage}`)
  }
}
