import { getApolloClient } from '../client'
import { SearchContact, SearchPayloadSchema } from '../definitions/schemas/'
import * as bp from '.botpress'
import * as sdk from '@botpress/sdk'
import { ZodError } from '@botpress/sdk'

export const searchContact: bp.IntegrationProps['actions']['searchContact'] = async ({ input, logger, ctx }) => {
  try {
    const apolloClient = getApolloClient(ctx.configuration)
    const contacts: SearchContact[] = []

    // Make API call to Apollo
    const validatedInput = SearchPayloadSchema.parse(input)
    const apolloResponse = await apolloClient.searchContact(validatedInput)

    apolloResponse.contacts.forEach((contact) => {
      contacts.push(contact)
    })

    logger.info('Contacts found in Apollo.io', { contacts })
    // Transform Apollo response to Botpress output format
    return {
      ...apolloResponse,
      success: true,
      message: 'Contacts found successfully in Apollo.io',
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
