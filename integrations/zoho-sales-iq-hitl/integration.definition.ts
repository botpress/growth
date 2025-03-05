import { IntegrationDefinition, z } from '@botpress/sdk';
import { INTEGRATION_NAME } from './src/const'
import hitl from './bp_modules/hitl';
import { events, configuration, channels, states, user } from './src/definitions'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  title: 'Zoho Sales IQ HITL',
  version: '1.0.2',
  icon: 'icon.svg',
  description: 'This integration allows your bot to use Zoho Sales IQ as a HITL Provider',
  readme: 'hub.md',
  configuration,
  states,
  channels,
  events,
  user,
}).extend(hitl, () => ({
  entities: {},
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
