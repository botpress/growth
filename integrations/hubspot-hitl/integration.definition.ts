import { IntegrationDefinition, z } from '@botpress/sdk'
import { integrationName } from './package.json'
import hitl from './bp_modules/hitl'
import { events, configuration, states, channels, user } from './src/definitions'

export default new IntegrationDefinition({
  name: integrationName,
  title: 'HubSpot Inbox HITL',
  version: '5.0.2',
  icon: 'icon.svg',
  description:
    'This integration allows your bot to use HubSpot as a HITL provider. Messages will appear in HubSpot Inbox.',
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
      title: 'HubSpot Inbox',
      description: 'HubSpot Inbox HITL',
      conversation: {
        tags: {
          id: {
            title: 'HubSpot Inbox Conversation Id',
            description: 'HubSpot Inbox Conversation Id',
          },
          userId: {
            title: 'User ID',
            description: 'The ID of the user in Botpress',
          },
        },
      },
    },
  },
}))
