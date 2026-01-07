import { IntegrationDefinition, z } from '@botpress/sdk'
import hitl from './bp_modules/hitl'
import { events, configuration, channels as baseChannels, states, user } from './src/definitions'

export default new IntegrationDefinition({
  name: 'genesys-hitl',
  title: 'Genesys HITL',
  version: '0.1.0',
  readme: 'hub.md',
  description: 'Genesys Cloud HITL Integration for Open Message',
  icon: 'icon.svg',
  configuration,
  states,
  channels: baseChannels,
  events,
  user,
}).extend(hitl, () => ({
  entities: {},
  channels: {
    hitl: {
      title: 'Genesys HITL',
      description: 'Genesys Cloud Open Message HITL Channel',
      conversation: {
        tags: {
          id: {
            title: 'Genesys Conversation ID',
            description: 'The external user ID used in Genesys Open Message.',
          },
        },
      },
    },
  },
}))
