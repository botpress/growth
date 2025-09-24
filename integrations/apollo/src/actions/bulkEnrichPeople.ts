import { BulkEnrichmentPayloadSchema } from 'src/definitions/schemas/'
import { getApolloClient } from '../client'
import * as bp from '.botpress'
import { ZodError } from '@botpress/sdk'
import * as sdk from '@botpress/sdk'

export const bulkEnrichPeople: bp.IntegrationProps['actions']['bulkEnrichPeople'] = async ({ input, logger, ctx }) => {
  try {
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
  } catch (error) {
    if (error instanceof ZodError) {
      throw new sdk.RuntimeError(
        `Error bulk enriching people in Apollo.io: ${error.errors.map((error) => error.message).join(', ')}`,
        error
      )
    }
    throw new sdk.RuntimeError('Error bulk enriching people in Apollo.io')
  }
}
