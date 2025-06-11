import { z } from '@botpress/sdk'

// User object schema
export const liveChatUserSchema = z.object({
  id: z.string(),
  type: z.string()
})

// Queue information schema
export const liveChatQueueSchema = z.object({
  position: z.number(),
  wait_time: z.number(),
  queued_at_us: z.string()
})

// Transfer information schema
export const liveChatTransferSchema = z.object({
  group_ids: z.array(z.number()).optional(),
  agent_ids: z.array(z.string())
}).strict() 

// Define payload schemas for each action
export const liveChatIncomingEventPayloadSchema = z.object({
  chat_id: z.string(),
  thread_id: z.string(),
  event: z.object({
    author_id: z.string(),
    text: z.string(),
    type: z.string(),
    custom_id: z.string().optional(),
    created_at: z.string().optional(),
    visibility: z.string().optional()
  })
})

export const liveChatDeactivatedPayloadSchema = z.object({
  chat_id: z.string(),
  thread_id: z.string(),
  user_id: z.string().optional()
})

export const liveChatTransferredPayloadSchema = z.object({
  chat_id: z.string(),
  thread_id: z.string(),
  requester_id: z.string(),
  reason: z.string().optional(),
  transferred_to: liveChatTransferSchema
}).strict() 

// Common fields for all webhook events
const commonWebhookFields = {
  webhook_id: z.string(),
  secret_key: z.string(),
  organization_id: z.string(),
  additional_data: z.object({
    chat_properties: z.record(z.any()).optional(),
    chat_presence_user_ids: z.array(z.string()).optional()
  }).optional()
}

// Use a discriminated union. .strict() must be applied to each object in the array.
export const liveChatWebhookPayloadSchema = z.discriminatedUnion('action', [
  z.object({
    ...commonWebhookFields,
    action: z.literal('incoming_event'),
    payload: liveChatIncomingEventPayloadSchema
  }).strict(), 

  z.object({
    ...commonWebhookFields,
    action: z.literal('chat_deactivated'),
    payload: liveChatDeactivatedPayloadSchema
  }).strict(), 

  z.object({
    ...commonWebhookFields,
    action: z.literal('chat_transferred'),
    payload: liveChatTransferredPayloadSchema
  }).strict(), 
])


// Type exports for TypeScript
export type LiveChatWebhookPayload = z.infer<typeof liveChatWebhookPayloadSchema>
export type LiveChatUser = z.infer<typeof liveChatUserSchema>
export type LiveChatQueue = z.infer<typeof liveChatQueueSchema>
export type LiveChatTransfer = z.infer<typeof liveChatTransferSchema>
export type LiveChatTransferred = z.infer<typeof liveChatTransferredPayloadSchema>
export type LiveChatEventPayload = LiveChatWebhookPayload['payload']

// Event handler parameters
export interface EventHandlerParams {
  payload: LiveChatEventPayload
  logger: any
  client: any
  ctx: any
}