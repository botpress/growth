import { z, IntegrationDefinition } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'plus/chatwoot',
  title: 'ChatWoot',
  description: 'Connect your Botpress bot to ChatWoot',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',

  configuration: {
    schema: z.object({
      apiAccessToken: z.string().min(1).describe('Your ChatWoot API access token'),
    }),
  },

  states: {
    integration: {
      schema: z.object({
        accountId: z.string(),
      }),
    },
  },

  channels: {
    channel: {
      messages: {},
      message: {
        tags: {
          id: {},
          conversationId: {},
        },
      },
      conversation: {
        tags: {
          id: {},
          contactId: {},
        },
      },
    },
  },

  user: {
    tags: {
      id: {},
      name: {},
      email: {},
    },
  },
})
