import { getErrorMessage } from 'src/errorHandler'
import { getApolloClient } from '../client'
import * as bp from '.botpress'
import * as sdk from '@botpress/sdk'

export const searchContacts: bp.IntegrationProps['actions']['searchContacts'] = async ({ input, logger, ctx }) => {
  try {
    const apolloClient = getApolloClient(ctx.configuration)

    const apolloResponse = await apolloClient.searchContacts(input)

    logger.info('Contacts found in Apollo.io', { apolloResponse: apolloResponse.data })

    return {
      apiResponse: apolloResponse.data,
      message: 'Contacts found successfully.',
    }
  } catch (error) {
    throw new sdk.RuntimeError(getErrorMessage(error))
  }
}
