import { IntegrationDefinition, z } from '@botpress/sdk'
import hitl from './bp_modules/hitl'
import { events, configuration, states, channels, user } from './src/definitions'

export default new IntegrationDefinition({
  name: 'plus/livechat-hitl',
  title: 'LiveChat HITL',
  version: '3.0.1',
  icon: 'icon.svg',
  description: 'This integration allows your bot to use LiveChat as a HITL provider. Messages will appear in LiveChat.',
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
      title: 'LiveChat',
      description: 'LiveChat HITL',
      conversation: {
        tags: {
          id: {
            title: 'LiveChat Conversation Id',
            description: 'LiveChat Conversation Id',
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
