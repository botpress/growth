import { z } from '@botpress/sdk'

// JSON value type for flexible metadata
const JsonLiteralSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])
type JsonLiteral = z.infer<typeof JsonLiteralSchema>
type JsonValue = JsonLiteral | { [key: string]: JsonValue } | JsonValue[]
const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([JsonLiteralSchema, z.array(JsonValueSchema), z.record(JsonValueSchema)])
)

// Base webhook structure
const WebhookBaseSchema = z.object({
  entity_type: z.literal('conversation'),
  webhook: z.object({ id: z.string() }),
  org_id: z.string(),
  entity_id: z.string(),
  attempt: z.number(),
  version: z.number(),
  app_id: z.string(),
  event_time: z.string(),
})

// Shared visitor schema for webhooks
const WebhookVisitorSchema = z
  .object({
    email_id: z.string(),
    name: z.string(),
    channel: z.string(),
    last_name: z.string(),
    salutation: z.string(),
    id: z.string(),
    type: z.string(),
    first_name: z.string(),
  })
  .passthrough()

// conversation.operator.replied
export const OperatorRepliedEventSchema = WebhookBaseSchema.extend({
  event: z.literal('conversation.operator.replied'),
  entity: z
    .object({
      id: z.string(),
      visitor_conversation_id: z.string(),
      message: z.object({
        sender: z.object({
          name: z.string(),
          id: z.string(),
          type: z.literal('operator'),
        }),
        meta: z.record(JsonValueSchema),
        msgid: z.string(),
        text: z.string(),
      }),
      visitor: WebhookVisitorSchema,
    })
    .passthrough(),
}).passthrough()
export type OperatorRepliedEvent = z.infer<typeof OperatorRepliedEventSchema>

// conversation.attender.updated
export const AttenderUpdatedEventSchema = WebhookBaseSchema.extend({
  event: z.literal('conversation.attender.updated'),
  entity: z
    .object({
      owner: z.object({
        email_id: z.string(),
        name: z.string(),
        id: z.string(),
        type: z.literal('operator'),
        email: z.string(),
      }),
      id: z.string(),
      visitor: WebhookVisitorSchema,
    })
    .passthrough(),
}).passthrough()
export type AttenderUpdatedEvent = z.infer<typeof AttenderUpdatedEventSchema>

// conversation.completed
export const ConversationCompletedEventSchema = WebhookBaseSchema.extend({
  event: z.literal('conversation.completed'),
  entity: z
    .object({
      id: z.string(),
      visitor: WebhookVisitorSchema,
      ended_by: z.string(),
      end_time: z.string(),
    })
    .passthrough(),
}).passthrough()
export type ConversationCompletedEvent = z.infer<typeof ConversationCompletedEventSchema>

// conversation.missed
export const ConversationMissedEventSchema = WebhookBaseSchema.extend({
  event: z.literal('conversation.missed'),
  entity: z
    .object({
      id: z.string(),
      visitor: WebhookVisitorSchema,
    })
    .passthrough(),
}).passthrough()
export type ConversationMissedEvent = z.infer<typeof ConversationMissedEventSchema>
