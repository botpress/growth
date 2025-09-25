import { BulkEnrichmentPayloadSchema } from 'src/definitions/schemas'
import { getApolloClient } from '../client'
import * as bp from '.botpress'
import { ZodError } from '@botpress/sdk'
import * as sdk from '@botpress/sdk'

export const bulkEnrichPeople: bp.IntegrationProps['actions']['bulkEnrichPeople'] = async ({ input, ctx }) => {
  try {
    const apolloClient = getApolloClient(ctx.configuration)

    // Make API call to Apollo
    const validatedInput = BulkEnrichmentPayloadSchema.parse(input)
    const apolloResponse = await apolloClient.bulkEnrichPeople(validatedInput)

    // Transform Apollo response to Botpress output format
    return {
      apiResponse: apolloResponse,
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
