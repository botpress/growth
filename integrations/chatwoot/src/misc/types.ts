import { z } from '@botpress/sdk'

export const chatwootEventTypeSchema = z.enum([
  'message_created',
  'message_updated',
  'conversation_created',
  'conversation_updated',
  'conversation_status_changed',
  'webwidget_triggered',
])

export const chatwootSenderSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  email: z.string().optional(),
  phone_number: z.string().optional(),
  type: z.string(),
  avatar_url: z.string().optional(),
})

export const chatwootAgentSchema = z.object({
  id: z.number(),
  account_id: z.number(),
  email: z.string(),
  name: z.string(),
  role: z.string(),
  availability_status: z.string().optional(),
  avatar_url: z.string().optional(),
  confirmed: z.boolean().optional(),
})

export const chatwootConversationSchema = z.object({
  id: z.number(),
  account_id: z.number().optional(),
  inbox_id: z.number(),
  status: z.string(),
  channel: z.string().optional(),
  unread_count: z.number().optional(),
  can_reply: z.boolean().optional(),
  muted: z.boolean().optional(),
  created_at: z.number().optional(),
  last_activity_at: z.number().optional(),
  meta: z
    .object({
      assignee: z
        .object({
          id: z.number(),
          name: z.string(),
          email: z.string().optional(),
          avatar_url: z.string().optional(),
        })
        .optional(),
      sender: z
        .object({
          id: z.number(),
          name: z.string(),
          email: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
})

export const chatwootAttachmentSchema = z.object({
  id: z.number(),
  message_id: z.number(),
  file_type: z.string(),
  data_url: z.string(),
  thumb_url: z.string().optional(),
})

export const chatwootWebhookPayloadSchema = z.object({
  event: chatwootEventTypeSchema,
  id: z.number().optional(),
  status: z.string().optional(),
  content: z.string().optional(),
  created_at: z.string().optional(),
  private: z.boolean().optional(),
  message_type: z.string().optional(),
  sender: chatwootSenderSchema.optional(),
  conversation: chatwootConversationSchema.optional(),
  attachments: z.array(chatwootAttachmentSchema).optional(),
})

export const chatwootProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  accounts: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      role: z.string(),
    })
  ),
})

export const chatwootMessageResponseSchema = z.object({
  id: z.number(),
  content: z.string().nullable().optional(),
  message_type: z.number(),
  conversation_id: z.number(),
  created_at: z.number(),
})

export const chatwootContactSchema = z.object({
  id: z.number(),
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone_number: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
})

export const chatwootContactSearchResponseSchema = z.object({
  payload: z.array(chatwootContactSchema),
})

export const chatwootContactCreateResponseSchema = z.object({
  payload: z.object({
    contact: chatwootContactSchema,
  }),
})

export const chatwootConversationResponseSchema = z.object({
  id: z.number(),
  inbox_id: z.number(),
  status: z.string(),
  contact_last_seen_at: z.string().nullable().optional(),
  created_at: z.number(),
})

export const chatwootStatusToggleResponseSchema = z.object({
  success: z.boolean(),
  current_status: z.string(),
  conversation_id: z.number(),
})

export const chatwootContactConversationsResponseSchema = z.object({
  payload: z.array(chatwootConversationSchema),
})

export type ChatwootEventType = z.infer<typeof chatwootEventTypeSchema>
export type ChatwootSender = z.infer<typeof chatwootSenderSchema>
export type ChatwootAgent = z.infer<typeof chatwootAgentSchema>
export type ChatwootConversation = z.infer<typeof chatwootConversationSchema>
export type ChatwootAttachment = z.infer<typeof chatwootAttachmentSchema>
export type ChatwootWebhookPayload = z.infer<typeof chatwootWebhookPayloadSchema>
export type ChatwootProfile = z.infer<typeof chatwootProfileSchema>
export type ChatwootMessageResponse = z.infer<typeof chatwootMessageResponseSchema>
export type ChatwootContact = z.infer<typeof chatwootContactSchema>
export type ChatwootContactSearchResponse = z.infer<typeof chatwootContactSearchResponseSchema>
export type ChatwootContactCreateResponse = z.infer<typeof chatwootContactCreateResponseSchema>
export type ChatwootConversationResponse = z.infer<typeof chatwootConversationResponseSchema>
export type ChatwootStatusToggleResponse = z.infer<typeof chatwootStatusToggleResponseSchema>
