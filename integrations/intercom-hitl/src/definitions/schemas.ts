import { z } from '@botpress/sdk'

export const CreateConversationResponseSchema = z.object({
  conversation_id: z.string(),
  channel_id: z.string(),
})

export const IntercomConfigurationSchema = z.object({
  accessToken: z.string().describe('Intercom Access Token'),
})

export type IntercomConfiguration = z.infer<typeof IntercomConfigurationSchema>
