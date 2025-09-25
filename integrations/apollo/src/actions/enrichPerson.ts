import { getApolloClient } from '../client'
import * as bp from '.botpress'
import * as sdk from '@botpress/sdk'
import { getErrorMessage } from 'src/errorHandler'

export const enrichPerson: bp.IntegrationProps['actions']['enrichPerson'] = async ({ input, logger, ctx }) => {
  try {
    const apolloClient = getApolloClient(ctx.configuration)

    const apolloResponse = await apolloClient.enrichPerson(input)

    logger.info('Person enriched in Apollo.io', apolloResponse)

    return {
      apiResponse: apolloResponse,
      message: 'Person enriched successfully.',
    }
  } catch (error) {
    throw new sdk.RuntimeError(getErrorMessage(error))
  }
}
