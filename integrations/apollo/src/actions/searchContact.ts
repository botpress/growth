import { getErrorMessage } from 'src/errorHandler'
import { getApolloClient } from '../client'
import * as bp from '.botpress'
import * as sdk from '@botpress/sdk'

export const searchContact: bp.IntegrationProps['actions']['searchContact'] = async ({ input, logger, ctx }) => {
  try {
    const apolloClient = getApolloClient(ctx.configuration)

    const apolloResponse = await apolloClient.searchContact(input)

    logger.info('Contacts found in Apollo.io', { apolloResponse })
    return {
      apiResponse: apolloResponse,
      message: 'Contacts found successfully.',
    }
  } catch (error) {
    throw new sdk.RuntimeError(getErrorMessage(error))
  }
}
