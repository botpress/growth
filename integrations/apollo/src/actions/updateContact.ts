import { getApolloClient } from '../client'
import * as bp from '.botpress'

export const updateContact: bp.IntegrationProps['actions']['updateContact'] = async ({ input, logger, ctx }) => {
  const apolloClient = getApolloClient(ctx.configuration)

  // Make API call to Apollo
  const apolloResponse = await apolloClient.updateContact(input)

  logger.info('Contact updated in Apollo.io', { apolloResponse })

  // Transform Apollo response to Botpress output format
  return {
    contact: apolloResponse.contact,
    success: true,
    message: 'Contact updated successfully in Apollo.io',
  }
}
