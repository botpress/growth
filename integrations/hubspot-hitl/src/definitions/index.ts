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
    phoneNumber: { description: 'HubSpot Inbox Phone Number', title: 'HubSpot Inbox Phone Number' },
    agentId: { description: 'HubSpot Inbox Agent Id', title: 'HubSpot Inbox Agent Id' },
    integrationThreadId: { description: 'HubSpot Inbox Integration Thread Id', title: 'HubSpot Inbox Integration Thread Id' },
    hubspotConversationId: { description: 'HubSpot Inbox Conversation Id', title: 'HubSpot Inbox Conversation Id' },
  },
} satisfies IntegrationDefinitionProps['user']
