import { z, IntegrationDefinitionProps } from '@botpress/sdk'
import { HubSpotConfigurationSchema } from './schemas'

export { channels } from './channels'

export const events = {} satisfies IntegrationDefinitionProps['events']

export const configuration = {
  schema: HubSpotConfigurationSchema,
} satisfies IntegrationDefinitionProps['configuration']

export const states = {
  credentials: {
    type: "integration",
    schema: z.object({
      accessToken: z.string(),
    }),
  },
  userInfo: {
    type: "user",
    schema: z.object({
      phoneNumber: z.string(),
      name: z.string(),
    }),
  },
  channelInfo: {
    type: "integration",
    schema: z.object({
      channelId: z.string(),
      channelAccountId: z.string(),
    })
  }
} satisfies IntegrationDefinitionProps['states']

export const user = {
  tags: {
    phoneNumber: { description: 'HubSpot Phone Number', title: 'HubSpot Phone Number' },
    agentId: { description: 'HubSpot Agent Id', title: 'HubSpot Agent Id' },
    integrationThreadId: { description: 'HubSpot Integration Thread Id', title: 'HubSpot Integration Thread Id' },
    hubspotConversationId: { description: 'HubSpot Conversation Id', title: 'HubSpot Conversation Id' },
  },
} satisfies IntegrationDefinitionProps['user']
