import { getApolloClient } from '../client'
import * as bp from '.botpress'
import * as sdk from '@botpress/sdk'
import { getErrorMessage } from '../errorHandler'

export const bulkEnrichPeople: bp.IntegrationProps['actions']['bulkEnrichPeople'] = async ({ input, ctx }) => {
  try {
    const apolloClient = getApolloClient(ctx.configuration)

    const apolloResponse = await apolloClient.bulkEnrichPeople(input)

    return {
      apiResponse: apolloResponse,
      message: 'People bulk-enriched successfully.',
    }
  } catch (error) {
    throw new sdk.RuntimeError(getErrorMessage(error))
  }
}
