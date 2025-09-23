import { z, IntegrationDefinitionProps } from '@botpress/sdk'
import { HubSpotConfigurationSchema } from './schemas'

export { channels } from './channels'

export const events = {} satisfies IntegrationDefinitionProps['events']

export const configuration = {
  schema: HubSpotConfigurationSchema,
} satisfies IntegrationDefinitionProps['configuration']

export const states = {
  credentials: {
    type: 'integration',
    schema: z.object({
      accessToken: z.string(),
    }),
  },
  userInfo: {
    type: 'user',
    schema: z.object({
      phoneNumber: z.string().optional(),
      name: z.string(),
      email: z.string().optional(),
    }),
  },
  channelInfo: {
    type: 'integration',
    schema: z.object({
      channelId: z.string(),
      channelAccountId: z.string(),
    }),
  },
} satisfies IntegrationDefinitionProps['states']

export const user = {
  tags: {
    email: { description: 'User Email', title: 'User Email' },
    phoneNumber: { description: 'Hubspot Phone Number', title: 'Hubspot Phone Number' },
    agentId: { description: 'Hubspot Agent Id', title: 'Hubspot Agent Id' },
    integrationThreadId: { description: 'Hubspot Integration Thread Id', title: 'Hubspot Integration Thread Id' },
    hubspotConversationId: { description: 'Hubspot Conversation Id', title: 'Hubspot Conversation Id' },
    contactType: { description: 'Contact Type (email or phone)', title: 'Contact Type' },
  },
} satisfies IntegrationDefinitionProps['user']
