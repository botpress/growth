import { IntegrationDefinition, z } from '@botpress/sdk'
import { integrationName } from './package.json'
import hitl from './bp_modules/hitl';
import { events, configuration, states, channels, user } from './src/definitions'


export default new IntegrationDefinition({
  name: integrationName,
  title: 'Intercom HITL',
  version: '1.0.0',
  icon: 'icon.svg',
  description: 'This integration allows your bot to use Intercom as a HITL provider. Messages will appear in Intercom.',
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
      title: 'Intercom',
      description: 'Intercom HITL',
      conversation: {
        tags: {
          id: { title: 'Intercom Conversation Id', description: 'Intercom Conversation Id' },
          userId: { title: 'User ID', description: 'The ID of the user in Botpress' },
        },
      },
    },
  },
}))
