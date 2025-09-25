import { getErrorMessage } from 'src/errorHandler'
import { getApolloClient } from '../client'
import { SearchPayloadSchema } from '../definitions/schemas'
import * as bp from '.botpress'
import * as sdk from '@botpress/sdk'

export const searchContact: bp.IntegrationProps['actions']['searchContact'] = async ({ input, logger, ctx }) => {
  try {
    const apolloClient = getApolloClient(ctx.configuration)

    // Make API call to Apollo
    const apolloResponse = await apolloClient.searchContact(input)

    logger.info('Contacts found in Apollo.io', { apolloResponse })
    // Transform Apollo response to Botpress output format
    return {
      apiResponse: apolloResponse,
      message: 'Contacts found successfully.',
    }
  } catch (error) {
    throw new sdk.RuntimeError(getErrorMessage(error))
  }
}
