import { z } from "@botpress/sdk";

export const CreateConversationResponseSchema = z.object({
  conversation_id: z.string(),
  channel_id: z.string(),
});

export const LiveChatConfigurationSchema = z.object({
  clientId: z.string().describe("LiveChat Client ID"),
  organizationId: z.string().describe("LiveChat Organization ID"),
  webhookSecret: z.string().describe("Webhook Secret"),
  agentToken: z.string().describe("LiveChat Agent Token (Base64 encoded)"),
  groupId: z
    .number()
    .describe("LiveChat Group ID for HITL conversations and chat transfers"),
  ignoreNonHitlConversations: z
    .boolean()
    .optional()
    .title("Ignore non-HITL conversations")
    .describe("Ignore conversations that were not created by the startHitl action"),
});

export type LiveChatConfiguration = z.infer<typeof LiveChatConfigurationSchema>;
