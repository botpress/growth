import { z } from '@botpress/sdk'

export const AxiosBasicCredentialsSchema = z.object({
  username: z.string().optional(),
  password: z.string().optional(),
})

export const AxiosProxyConfigSchema = z.object({
  host: z.string().optional(),
  port: z.number().optional(),
  auth: AxiosBasicCredentialsSchema.optional(),
  protocol: z.string().optional(),
})

export const SFMessagingConfigSchema = z.object({
  endpoint: z.string({
    invalid_type_error: 'Endpoint must be a string',
    required_error: 'Saleforce endpoint is required, example: https://something.salesforceliveagent.com/chat',
  }),
  organizationId: z.string(),
  DeveloperName: z.string(),
  showAgentName: z.boolean().optional().describe('Show agent name or not on Agent messages'),
  agentAvatarUrl: z
      .string()
      .title('Default Agent Avatar URL')
      .optional()
      .describe(
          'Default URL for the agent avatar, if not provided, the first letter of the agent name will be used (Webchat Only)'
      ),
  conversationNotAssignedMessage: z.string().default('No agent assigned yet, please wait or type /end to cancel the escalation.').describe('Message that will be presented when the user types something but no agent is handling the conversation'),
})

export type SFMessagingConfig = z.infer<typeof SFMessagingConfigSchema>

export const MessagingSessionSchema = z.object({
  accessToken: z.string().optional(),
  conversationId: z.string().optional(),
})

export type Messaging = z.infer<typeof MessagingSessionSchema>

export const SSESessionSchema = z.object({
  sseKey: z.string().optional(),
})

export type SSESession = z.infer<typeof SSESessionSchema>

export const LiveAgentSessionSchema = MessagingSessionSchema.merge(SSESessionSchema)

export type LiveAgentSession = z.infer<typeof LiveAgentSessionSchema>

export const CreateTokenResponseSchema = z.object({
  accessToken: z.string(),
  lastEventId: z.string(),
  context: z.any(), // A complex object
})

export type CreateTokenResponse = z.output<typeof CreateTokenResponseSchema>

export const CreateTTSessionResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    key: z.string(),
  }),
})

export type CreateTTSessionResponse = z.output<typeof CreateTTSessionResponseSchema>

export const ConversationSchema = z.object({
  id: z.string(),
})
