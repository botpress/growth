import { getApolloClient } from '../client'
import * as bp from '.botpress'
import * as sdk from '@botpress/sdk'
import { getErrorMessage } from 'src/errorHandler'

export const createContact: bp.IntegrationProps['actions']['createContact'] = async ({ input, logger, ctx }) => {
  try {
    const apolloClient = getApolloClient(ctx.configuration)

    const apolloResponse = await apolloClient.createContact(input)

    logger.info('Contact created in Apollo.io', { apolloResponse })

    return {
      apiResponse: apolloResponse.data,
      message: 'Contact created successfully.',
    }
  } catch (error) {
    throw new sdk.RuntimeError(getErrorMessage(error))
  }
}
