import { IntegrationDefinition, z } from '@botpress/sdk';
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  title: 'Google Chat Spaces',
  version: '1.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      serviceAccountJson: z
        .string()
        .describe('Google service-account key (JSON) — store as a Secret'),
      defaultSpace: z
        .string()
        .describe('Default Google Chat space to post in'),
      test: z
        .string()
        .describe('Test')
        .default('test'),
    })
  },
  channels: {
    text: {
      conversation: {
        tags: {
          spaceId: { title: 'Space ID', description: 'The ID of the Google Chat space' }
        }
      },
      messages: {
        text: {
          schema: z.object({
            text: z.string()
          })
        }
      }
    }
  },
  user: {
    tags: {
      id: { title: 'User ID', description: 'The ID of the user in Google Chat' }
    }
  }
})
