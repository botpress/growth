import { IntegrationDefinition, IntegrationDefinitionProps } from '@botpress/sdk'
import { integrationName } from './package.json'
import hitl from './bp_modules/hitl'
import { configuration, channels, states, events, actions } from './src/definitions'

export const user = {
  tags: {
    id: { title: 'Salesforce Subject id' },
    email: { title: 'Email' },
    conversationId: { title: 'Salesforce Conversation id' },
  },
} satisfies IntegrationDefinitionProps['user']

export default new IntegrationDefinition({
  name: integrationName,
  title: 'SalesForce Messaging (Alpha)',
  version: '0.3.1',
  icon: 'icon.svg',
  description:
    'This integration allows your bot to interact with Salesforce Messaging, this version uses the HITL Interface',
  readme: 'hub.md',
  configuration,
  actions,
  events,
  states,
  channels,
  user,
  secrets: {
    TT_URL: {
      description: 'Url from the Transport Translator service',
      optional: false,
    },
    TT_SK: {
      description: 'Secret from the Transport Translator service',
      optional: false,
    },
  },
}).extend(hitl, () => ({
  entities: {},
  channels: {
    hitl: {
      conversation: {
        tags: {
          transportKey: {
            title: 'Key for SSE',
            description: 'Key from the TT service used to identify the SSE session',
          },
          id: {
            title: 'Salesforce Conversation ID',
            description: 'Conversation ID from Salesforce Messaging',
          },
          assignedAt: {
            title: 'Assigned at',
            description: 'When the conversation was assigned to an Agent',
          },
          closedAt: {
            title: 'Closed at',
            description: 'When the conversation was marked as closed',
          },
        },
      },
    },
  },
}))
