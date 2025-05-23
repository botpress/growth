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
    type: "integration",
    schema: z.object({
      phoneNumber: z.string().optional(),
      name: z.string(),
      email: z.string().optional(),
    }),
  },
  channelInfo: {
    type: "integration",
    schema: z.object({
      channelId: z.string(),
      channelAccountId: z.string(),
      integrationThreadId: z.string(),
    })
  }
} satisfies IntegrationDefinitionProps['states']

export const user = {
  tags: {
    id: { description: 'Hubspot User Id', title: 'Hubspot User Id' },
    email: { description: 'User Email', title: 'User Email' },
    phone: { description: 'User Phone Number', title: 'User Phone Number' }
  },
} satisfies IntegrationDefinitionProps['user']
