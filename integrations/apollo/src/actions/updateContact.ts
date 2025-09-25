import { getApolloClient } from '../client'
import { ContactPayloadSchema } from '../definitions/schemas'
import * as bp from '.botpress'
import * as sdk from '@botpress/sdk'
import { ZodError } from '@botpress/sdk'

export const updateContact: bp.IntegrationProps['actions']['updateContact'] = async ({ input, logger, ctx }) => {
  try {
    const apolloClient = getApolloClient(ctx.configuration)

    // Make API call to Apollo
    const validatedInput = { ...ContactPayloadSchema.parse(input), contact_id: input.contact_id }
    const apolloResponse = await apolloClient.updateContact(validatedInput)

    logger.info('Contact updated in Apollo.io', { apolloResponse })

    // Transform Apollo response to Botpress output format
    return {
      apiResponse: apolloResponse,
      message: 'Contact updated successfully.',
    }
  } catch (error) {
    if (error instanceof ZodError) {
      throw new sdk.RuntimeError(
        `Error updating contact in Apollo.io: ${error.errors.map((error) => error.message).join(', ')}`,
        error
      )
    }
    throw new sdk.RuntimeError('Error updating contact in Apollo.io')
  }
}
