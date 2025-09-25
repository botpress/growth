import { ContactPayloadSchema } from 'src/definitions/schemas'
import { getApolloClient } from '../client'
import * as bp from '.botpress'
import { ZodError } from '@botpress/sdk'
import * as sdk from '@botpress/sdk'

export const createContact: bp.IntegrationProps['actions']['createContact'] = async ({ input, logger, ctx }) => {
  try {
    const apolloClient = getApolloClient(ctx.configuration)
    // Make API call to Apollo
    const validatedInput = ContactPayloadSchema.parse(input)
    const apolloResponse = await apolloClient.createContact(validatedInput)

    logger.info('Contact created in Apollo.io', { apolloResponse })

    // Transform Apollo response to Botpress output format
    return {
      apiResponse: apolloResponse,
      message: 'Contact created successfully.',
    }
  } catch (error) {
    if (error instanceof ZodError) {
      throw new sdk.RuntimeError(
        `Error creating contact in Apollo.io: ${error.errors.map((error) => error.message).join(', ')}`,
        error
      )
    }
    throw new sdk.RuntimeError('Error creating contact in Apollo.io')
  }
}
