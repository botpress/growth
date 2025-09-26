import { IntegrationDefinition, z } from '@botpress/sdk'
import hitl from './bp_modules/hitl'
import { events, configuration, channels as baseChannels, states, user } from './src/definitions'

export default new IntegrationDefinition({
  name: 'plus/brevo-hitl',
  title: 'Brevo HITL',
  version: '1.0.1',
  readme: 'hub.md',
  description: 'Brevo HITL Integration',
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
      title: 'Brevo HITL',
      description: 'Brevo HITL Channel',
      conversation: {
        tags: {
          id: {
            title: 'Brevo Conversation ID (Visitor ID)',
            description: 'The visitor ID used consistently in Brevo webhooks.',
          },
        },
      },
    },
  },
}))
