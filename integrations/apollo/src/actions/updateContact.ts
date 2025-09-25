import { getApolloClient } from '../client'
import * as bp from '.botpress'
import * as sdk from '@botpress/sdk'
import { getErrorMessage } from 'src/errorHandler'

export const updateContact: bp.IntegrationProps['actions']['updateContact'] = async ({ input, logger, ctx }) => {
  try {
    const apolloClient = getApolloClient(ctx.configuration)

    const apolloResponse = await apolloClient.updateContact(input)

    logger.info('Contact updated in Apollo.io', { apolloResponse: apolloResponse.data })

    return {
      apiResponse: apolloResponse.data,
      message: 'Contact updated successfully.',
    }
  } catch (error) {
    throw new sdk.RuntimeError(getErrorMessage(error))
  }
}
