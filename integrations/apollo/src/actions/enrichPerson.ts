import { ZodError } from '@botpress/sdk'
import { getApolloClient } from '../client'
import { EnrichmentPayloadSchema, Person } from '../definitions/schemas/'
import * as bp from '.botpress'
import * as sdk from '@botpress/sdk'

export const enrichPerson: bp.IntegrationProps['actions']['enrichPerson'] = async ({ input, logger, ctx }) => {
  try {
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
  } catch (error) {
    if (error instanceof ZodError) {
      throw new sdk.RuntimeError(
        `Error enriching person in Apollo.io: ${error.errors.map((error) => error.message).join(', ')}`,
        error
      )
    }
    throw new sdk.RuntimeError('Error enriching person in Apollo.io')
  }
}
