import { getApolloClient } from '../client'
import { SearchContact } from '../definitions/schemas'
import * as bp from '.botpress'

export const searchContact: bp.IntegrationProps['actions']['searchContact'] = async ({ input, ctx }) => {
  const apolloClient = getApolloClient(ctx.configuration)
  const contacts: SearchContact[] = [];

  // Make API call to Apollo
  const apolloResponse = await apolloClient.searchContact(input)

  apolloResponse.contacts.forEach(contact => {
    contacts.push(contact);
  })

  console.log('Contacts found in Apollo.io', { contacts })
  // Transform Apollo response to Botpress output format
  return {
    ...apolloResponse,
    success: true,
    message: 'Contacts found successfully in Apollo.io',
  }
}
