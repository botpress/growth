import { getApolloClient } from '../client'
import * as bp from '.botpress'
import * as sdk from '@botpress/sdk'
import { getErrorMessage } from 'src/errorHandler'

export const createContact: bp.IntegrationProps['actions']['createContact'] = async ({ input, logger, ctx }) => {
  try {
    const apolloClient = getApolloClient(ctx.configuration)
    
    // Make API call to Apollo
    const apolloResponse = await apolloClient.createContact(input)

    logger.info('Contact created in Apollo.io', { apolloResponse })

    // Transform Apollo response to Botpress output format
    return {
      apiResponse: apolloResponse,
      message: 'Contact created successfully.',
    }
  } catch (error) {
    throw new sdk.RuntimeError(getErrorMessage(error))
  }
}
