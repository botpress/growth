import * as bp from '.botpress'
import { getApolloClient } from './client'
import { RuntimeError } from '@botpress/client'

export const register: bp.IntegrationProps['register'] = async ({ ctx, logger }) => {
  try {
    const apolloClient = getApolloClient(ctx.configuration)
    await apolloClient.searchContacts({ q_keywords: '', page: 1, per_page: 1 })
    logger.forBot().info('Apollo integration registered successfully')
  } catch (error) {
    logger.forBot().error('Failed to register Apollo integration. API request failed.', error)
    throw new RuntimeError('Unable to reach Apollo API. Please check the API key in your configuration.')
  }
}
export const unregister: bp.IntegrationProps['unregister'] = async ({ logger }) => {
  logger.forBot().info('Unregistering Apollo.io integration')
}
