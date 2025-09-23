import { getApolloClient } from '../client'
import { Person } from '../definitions/schemas'
import * as bp from '.botpress'

export const enrichPerson: bp.IntegrationProps['actions']['enrichPerson'] = async ({ input, ctx }) => {
  const apolloClient = getApolloClient(ctx.configuration)

  // Make API call to Apollo
  const apolloResponse = await apolloClient.enrichPerson(input)

  const person: Person = apolloResponse.person;

  console.log('Person enriched in Apollo.io', person)
  // Transform Apollo response to Botpress output format
  return {
    person,
    success: true,
    message: 'Contacts found successfully in Apollo.io',
  }
}
