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
    agentId: { description: 'HubSpot Agent ID', title: 'HubSpot Agent ID' },
    integrationThreadId: { description: 'HubSpot Integration Thread ID', title: 'HubSpot Integration Thread ID' },
    hubspotConversationId: { description: 'HubSpot Conversation ID', title: 'HubSpot Conversation ID' },
  },
} satisfies IntegrationDefinitionProps['user']
