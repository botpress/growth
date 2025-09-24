import { getApolloClient } from '../client'
import { EnrichmentPayloadSchema, Person } from '../definitions/schemas/'
import * as bp from '.botpress'

export const enrichPerson: bp.IntegrationProps['actions']['enrichPerson'] = async ({ input, logger, ctx }) => {
  const apolloClient = getApolloClient(ctx.configuration)

  // Make API call to Apollo
  const validatedInput = EnrichmentPayloadSchema.parse(input)
  const apolloResponse = await apolloClient.enrichPerson(validatedInput)

  const person: Person = apolloResponse.person

  logger.info('Person enriched in Apollo.io', person)
  // Transform Apollo response to Botpress output format
  return {
    person,
    success: true,
    message: 'Person enriched successfully in Apollo.io',
  }
}
