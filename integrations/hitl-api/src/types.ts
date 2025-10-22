import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z)

export const PingPayload = z
  .object({
    type: z.literal('ping'),
  })
  .openapi('PingPayload')

export const CreateRemoteConversationPayload = z
  .object({
    type: z.literal('createRemoteConversation'),
    payload: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      messages: z
        .array(
          z.object({
            text: z.string(),
            author: z.string().optional(),
            timestamp: z.string().optional(),
          })
        )
        .optional(),
    }),
  })
  .openapi('CreateRemoteConversationPayload')

export const CloseRemoteTicketPayload = z
  .object({
    type: z.literal('closeRemoteTicket'),
    payload: z.object({
      botpressConversationId: z.string(),
    }),
  })
  .openapi('CloseRemoteTicketPayload')

export const CreateRemoteUserPayload = z
  .object({
    type: z.literal('createRemoteUser'),
    payload: z.record(z.string(), z.unknown()).describe('whatever user payload sent from Botpress'),
  })
  .openapi({ title: 'CreateRemoteUserPayload' })

export const BotSendsMessagePayload = z
  .object({
    type: z.literal('botSendsMessage'),
    remoteConversationId: z.string().describe('The ID of the conversation on the live agent platform'),
    remoteUserId: z.string().describe('The ID of the chat-user on the live agent platform'),
    payload: z.record(z.string(), z.unknown()).describe('The message payload in the botpress format'),
  })
  .openapi({ title: 'BotSendsMessagePayload' })

export const AgentMessagePayload = z
  .object({
    remoteConversationId: z.string().describe('The ID of the conversation on the live agent platform'),
    remoteUserId: z.string().describe('The ID of the chat-user on the live agent platform'),
    messageType: z.string(),
    payload: z.record(z.string(), z.unknown()).describe('The message payload in the botpress format'),
  })
  .openapi({ title: 'AgentMessagePayload' })

export const AgentAssignedPayload = z
  .object({
    remoteConversationId: z.string().describe('The ID of the conversation on the live agent platform'),
    remoteUserId: z.string().describe('The ID of the chat-user on the live agent platform'),
  })
  .openapi({ title: 'AgentAssignedPayload' })

export const StopHitlPayload = z
  .object({
    remoteConversationId: z.string().describe('The ID of the conversation on the live agent platform'),
  })
  .openapi({ title: 'StopHitlPayload' })

// Define conversation and user tags
export const ConversationTags = z
  .object({
    externalId: z.string(),
  })
  .openapi({ title: 'ConversationTags' })

export const UserTags = z
  .object({
    externalId: z.string(),
  })
  .openapi({ title: 'UserTags' })

// Define the handler input types
export const HandlerInput = z
  .object({
    ctx: z.object({
      configuration: z.object({
        endpointBaseUrl: z.string(),
      }),
    }),
    client: z.any(), // Replace with specific client type if available
    input: z.any(), // Replace with specific input type if available
  })
  .openapi('HandlerInput')

export const CreateRemoteConversationResponse = z
  .object({
    id: z.string().describe('The ID of the conversation / ticket on the live agent platform'),
  })
  .openapi('CreateRemoteConversationResponse')

export const CreateRemoteUserResponse = z
  .object({
    id: z.string().describe('The ID of the chat-user on the live agent platform'),
  })
  .openapi('CreateRemoteUserResponse')
