import * as bp from '.botpress'
import { getApolloClient } from './client'
import { RuntimeError } from '@botpress/client'

export const register: bp.IntegrationProps['register'] = async ({ ctx, logger }) => {
  try {
    const apolloClient = getApolloClient(ctx.configuration)
    await apolloClient.searchContact({ q_keywords: '', page: 1, per_page: 1 })
    logger.forBot().info('Apollo integration registered successfully')
  } catch (error) {
    logger.forBot().error('Failed to register Apollo integration', error)
    throw new RuntimeError('Failed to register Apollo integration')
  }
}
export const unregister: bp.IntegrationProps['unregister'] = async () => {
  console.log('Unregistering Apollo.io integration')
}
