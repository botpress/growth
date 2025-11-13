import { IntegrationDefinition, z } from '@botpress/sdk'
import hitl from './bp_modules/hitl'
import { events, configuration, states, channels, user } from './src/definitions'

export default new IntegrationDefinition({
  name: 'plus/intercom-hitl',
  title: 'Intercom HITL',
  version: '2.0.3',
  icon: 'icon.svg',
  description: 'This integration allows your bot to use Intercom as a HITL provider. Messages will appear in Intercom.',
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
      title: 'Intercom',
      description: 'Intercom HITL',
      conversation: {
        tags: {
          id: {
            title: 'Intercom Conversation Id',
            description: 'Intercom Conversation Id',
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
