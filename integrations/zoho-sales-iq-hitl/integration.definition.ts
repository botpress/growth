import { IntegrationDefinition, z } from '@botpress/sdk'
import hitl from './bp_modules/hitl'
import { events, configuration, channels, states, user } from './src/definitions'
export default new IntegrationDefinition({
  name: 'erichuang/zoho-sales-iq-hitl',
  title: 'Zoho Sales IQ HITL (DEV)',
  version: '0.1.6',
  icon: 'icon.svg',
  description: 'This integration allows your bot to use Zoho Sales IQ as a HITL Provider',
  readme: 'hub.md',
  configuration,
  states,
  channels,
  events,
  user,
  entities: {
    ticket: {
      schema: z.object({}),
    },
  },
}).extend(hitl, (self) => ({
  entities: {
    hitlSession: self.entities.ticket,
  },
  channels: {
    hitl: {
      title: 'Zoho Sales IQ',
      description: 'Zoho Sales IQ HITL',
      conversation: {
        tags: {
          id: { title: 'Zoho Sales IQ Conversation Id', description: 'Zoho Sales IQ Conversation Id' },
        },
      },
    },
  },
}))
