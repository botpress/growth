import { z } from '@botpress/sdk'

export const CreateConversationResponseSchema = z.object({
  conversation_id: z.string(),
  channel_id: z.string(),
})

export const LiveChatConfigurationSchema = z.object({
  clientId: z.string().describe('LiveChat Client ID'),
  organizationId: z.string().describe('LiveChat Organization ID'),
  webhookSecret: z.string().describe('Webhook Secret'),
  agentToken: z.string().describe('LiveChat Agent Token (Base64 encoded)'),
  groupId: z.number().describe('LiveChat Group ID for HITL conversations and chat transfers'),
  ignoreNonHitlConversations: z
    .boolean()
    .default(false)
    .title('Ignore non-HITL conversations')
    .describe('Ignore conversations that were not created by the startHitl action'),
  startChatAsCustomer: z
    .boolean()
    .default(false)
    .title('Start chats as the customer')
    .describe(
      'Start the LiveChat chat as the customer so it arrives as a new incoming chat, instead of being started by the agent token owner and transferred to the group'
    ),
})

export type LiveChatConfiguration = z.infer<typeof LiveChatConfigurationSchema>
