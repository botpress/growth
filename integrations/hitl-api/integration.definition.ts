import { IntegrationDefinition, messages, interfaces, z } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'plus/hitl-api',
  version: '0.2.2',
  title: 'Human in the Loop API',
  description: 'This integration allows you to connect Botpress to a Human in the Loop / Live Agent API',
  icon: 'icon.svg',
  readme: 'hub.md',
  channels: {
    hitl: {
      messages: { ...messages.defaults },
      conversation: {
        tags: {
          externalId: {
            title: 'Remote Conversation ID',
          },
        },
      },
    },
  },
  configuration: {
    schema: z.object({
      endpointBaseUrl: z.string(),
    }),
  },
  user: {
    tags: {
      externalId: {
        title: 'Remote User ID',
      },
    },
  },
}).extend(interfaces.hitl, () => ({}))
