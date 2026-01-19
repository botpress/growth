import { z, IntegrationDefinition } from '@botpress/sdk'
import { actions, states } from './definitions'
// import { states } from './definitions/states'

export default new IntegrationDefinition({
  version: '1.0.0',
  name: 'plus/odoo-helpdesk',
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
    }),
  },
  user: {
    tags: {
      id: { title: 'User ID', description: 'The ID of the user' },
      email: { title: 'Email', description: 'The email of the user' },
      odooId: { title: 'Odoo ID', description: 'The ID of the Odoo user' },
      conversationId: { title: 'Conversation ID', description: 'The ID of the conversation' },
    },
  },
  actions,
  states,
})
