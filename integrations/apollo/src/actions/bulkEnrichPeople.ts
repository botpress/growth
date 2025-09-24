import { BulkEnrichmentPayloadSchema } from 'src/definitions/schemas'
import { getApolloClient } from '../client'
import * as bp from '.botpress'

export const bulkEnrichPeople: bp.IntegrationProps['actions']['bulkEnrichPeople'] = async ({ input, logger, ctx }) => {
  const apolloClient = getApolloClient(ctx.configuration)

  // Make API call to Apollo
  const validatedInput = BulkEnrichmentPayloadSchema.parse(input)
  const apolloResponse = await apolloClient.bulkEnrichPeople(validatedInput)

  logger.info('People bulk enriched in Apollo.io', apolloResponse.matches)
  logger.info('Credits consumed in Apollo.io', apolloResponse.credits_consumed)
  // Transform Apollo response to Botpress output format
  return {
    ...apolloResponse,
    success: true,
    message: `${apolloResponse.unique_enriched_records} people enriched successfully in Apollo.io`,
  }
}
