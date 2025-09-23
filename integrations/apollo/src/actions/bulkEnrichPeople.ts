import { getApolloClient } from '../client'
import * as bp from '.botpress'

export const bulkEnrichPeople: bp.IntegrationProps['actions']['bulkEnrichPeople'] = async ({ input, ctx }) => {
  const apolloClient = getApolloClient(ctx.configuration)

  // Make API call to Apollo
  const apolloResponse = await apolloClient.bulkEnrichPeople(input)

  console.log('People bulk enriched in Apollo.io', apolloResponse.matches)
  console.log('Credits consumed in Apollo.io', apolloResponse.credits_consumed)
  // Transform Apollo response to Botpress output format
  return {
    ...apolloResponse,
    success: true,
    message: 'Contacts found successfully in Apollo.io',
  }
}
