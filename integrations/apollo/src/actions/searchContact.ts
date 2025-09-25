import { getApolloClient } from '../client'
import { SearchPayloadSchema } from '../definitions/schemas'
import * as bp from '.botpress'
import * as sdk from '@botpress/sdk'
import { ZodError } from '@botpress/sdk'

export const searchContact: bp.IntegrationProps['actions']['searchContact'] = async ({ input, logger, ctx }) => {
  try {
    const apolloClient = getApolloClient(ctx.configuration)

    // Make API call to Apollo
    const validatedInput = SearchPayloadSchema.parse(input)
    const apolloResponse = await apolloClient.searchContact(validatedInput)

    logger.info('Contacts found in Apollo.io', { apolloResponse })
    // Transform Apollo response to Botpress output format
    return {
      apiResponse: apolloResponse,
      message: 'Contacts found successfully.',
    }
  } catch (error) {
    if (error instanceof ZodError) {
      throw new sdk.RuntimeError(
        `Error searching contacts in Apollo.io: ${error.errors.map((error) => error.message).join(', ')}`,
        error
      )
    }
    throw new sdk.RuntimeError('Error searching contacts in Apollo.io')
  }
}
