import { z } from '@botpress/sdk'

export const CreateConversationResponseSchema = z.object({
  conversation_id: z.string(),
  channel_id: z.string(),
})

export type CreateConversationResponse = z.output<typeof CreateConversationResponseSchema>

export type ZohoConfiguration = z.infer<typeof ZohoConfigurationSchema>

export const ZohoConfigurationSchema = z.object({
    clientId: z.string().describe('Your Zoho Client ID'),
    clientSecret: z.string().describe('Your Zoho Client Secret'),
    refreshToken: z.string().describe('Your Zoho Refresh Token'),
    screenName: z.string().describe('Your Zoho Screen Name'),
    appId: z.string().describe('To specify the portals app id of the brand.'),
    departmentId: z.string().describe("To specify the ID of the conversation initiated department."),
    dataCenter: z.enum(['us', 'eu', 'in', 'au', 'cn', 'jp', 'ca']).describe('Zoho Data Center Region'),
})
