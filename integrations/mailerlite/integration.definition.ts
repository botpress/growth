import { IntegrationDefinition, z } from '@botpress/sdk'
import { actions, events, states } from 'definitions'

export default new IntegrationDefinition({
  name: 'mailerlite',
  title: 'MailerLite',
  description: 'Connect with MailerLite to manage subscribers, groups, and email campaigns',
  version: '3.0.2',
  readme: 'hub.md',
  icon: 'icon.svg',

  configuration: {
    schema: z
      .object({
        APIKey: z.string().title('API Key').describe('Developer API token').min(1).secret(),
      })
      .required(),
  },

  actions,
  events,
  states,
})
