import { ContactPayloadSchema } from 'src/definitions/schemas'
import { getApolloClient } from '../client'
import * as bp from '.botpress'

export const createContact: bp.IntegrationProps['actions']['createContact'] = async ({ input, logger, ctx }) => {
  const apolloClient = getApolloClient(ctx.configuration)
  // Make API call to Apollo
  const validatedInput = ContactPayloadSchema.parse(input)
  const apolloResponse = await apolloClient.createContact(validatedInput)

  logger.info('Contact created in Apollo.io', { apolloResponse })

  // Transform Apollo response to Botpress output format
  return {
    contact: apolloResponse.contact,
    success: true,
    message: 'Contact created successfully in Apollo.io',
  }
}
