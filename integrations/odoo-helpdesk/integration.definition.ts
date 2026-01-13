import { z, IntegrationDefinition } from '@botpress/sdk'
import { integrationName } from './package.json'
import { actions } from './definitions/actions'

export default new IntegrationDefinition({
  version: '0.1.0',
  name: integrationName,
  title: 'Odoo Helpdesk',
  description: 'Connect with Odoo Helpdesk to manage tickets and customers',
  readme: 'hub.md',
  icon: 'icon.svg',

  configuration: {
    schema: z.object({
      odooApiUrl: z.string().describe('The Odoo API URL. This is the url the botpress user sends messages to.'),
      odooDb: z.string().describe('The Odoo database name (Case sensitive).'),
      odooEmail: z.string().describe('The Odoo email address.'),
      odooPassword: z.string().describe('The Odoo password.').secret(),
      odooTicketStatuses: z.array(z.string()).describe('The Odoo ticket statuses.'),
    }),
  },
  user: {
    tags: {
      id: { title: 'User ID', description: 'The ID of the user' },
      email: { title: 'Email', description: 'The email of the user' },
      odooUserId: { title: 'Odoo User ID', description: 'The ID of the Odoo user' },
      conversationId: { title: 'Conversation ID', description: 'The ID of the conversation' },
    },
  },
  actions,
})
