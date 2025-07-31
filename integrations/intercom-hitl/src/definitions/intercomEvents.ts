import { z } from "@botpress/sdk";

export const adminAssignedEventSchema = z
  .object({
    topic: z.literal("conversation.admin.assigned"),
    data: z
      .object({
        item: z
          .object({
            id: z.string(),
            admin_assignee_id: z.number().nullable(),
          })
          .passthrough(),
      })
      .passthrough(),
  })
  .passthrough();

export const adminRepliedEventSchema = z
  .object({
    topic: z.literal("conversation.admin.replied"),
    data: z
      .object({
        item: z
          .object({
            id: z.string(),
          })
          .passthrough(),
      })
      .passthrough(),
  })
  .passthrough();

export const adminClosedEventSchema = z
  .object({
    topic: z.literal("conversation.admin.closed"),
    data: z
      .object({
        item: z
          .object({
            id: z.string(),
          })
          .passthrough(),
      })
      .passthrough(),
  })
  .passthrough();
