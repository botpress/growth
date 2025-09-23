import { IntegrationDefinition, z } from '@botpress/sdk'
import { integrationName } from './package.json'
import { actions } from './src/definitions/actions'
import { configuration } from './src/definitions/index'

export default new IntegrationDefinition({
  name: integrationName,
  title: 'Apollo.io',
  version: '1.0.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  description: 'Search for and enrich people from your team\'s Apollo.io account',
  configuration,
  actions,
})

//   {
//     schema: z.object({
//       apiKey: z.string().describe('Your Apollo.io API Key'),
//     }),
//   },
//   actions: {
//     createContact: createContactSchema,
//     updateContact: updateContactSchema,
//     searchContact: searchContactSchema,
//     enrichPerson: enrichPersonSchema,
//     bulkEnrichPeople: bulkEnrichPeopleSchema,
//   },
// })
