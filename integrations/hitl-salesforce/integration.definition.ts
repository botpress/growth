import { IntegrationDefinition, IntegrationDefinitionProps, z } from '@botpress/sdk'
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
  version: '0.5.1',
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
  entities: {
    hitlTicket: {
      schema: z.object({
        routingAttributes: z
            .string()
            .title('Routing Attributes')
            .displayAs<any>({
              id: 'text',
              params: {
                allowDynamicVariable: true,
                growVertically: true,
                multiLine: true,
              },
            })
            .placeholder('{ "myAttribute": "myAttributeValue" }')
            .default('{}')
            .optional()
            .describe('Custom properties to be used as routing attributes, use JSON format'),
      }),
    },
  },
}).extend(hitl, (self) => ({
  entities: {
    hitlSession: self.entities.hitlTicket,
  },
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
