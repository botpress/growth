import { IntegrationDefinition, messages, interfaces, z } from '@botpress/sdk'
import { name, integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName ?? name,
  version: '0.2.1',
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
