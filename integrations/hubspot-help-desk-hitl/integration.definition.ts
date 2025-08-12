import { IntegrationDefinition } from '@botpress/sdk'
import { integrationName } from './package.json'
import hitl from './bp_modules/hitl';
import { events, configuration, states, channels, user } from './src/definitions'


export default new IntegrationDefinition({
  name: integrationName,
  title: 'HubSpot Help Desk HITL',
  version: '2.0.1',
  icon: 'icon.svg',
  description: 'This integration allows your bot to use HubSpot as a HITL provider. Messages will appear in HubSpot Help Desk.',
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
      title: 'HubSpot',
      description: 'HubSpot Help Desk HITL',
      conversation: {
        tags: {
          id: { title: 'HubSpot Conversation Id', description: 'HubSpot Conversation Id' },
        },
      },
    },
  },
}))
