import { z } from "@botpress/sdk";

export const CreateConversationResponseSchema = z.object({
  conversation_id: z.string(),
  channel_id: z.string(),
});

export const LiveChatConfigurationSchema = z.object({
  clientId: z.string().describe("LiveChat Client ID"),
  organizationId: z.string().describe("LiveChat Organization ID"),
  webhookSecret: z.string().describe("Webhook Secret"),
});

export type LiveChatConfiguration = z.infer<typeof LiveChatConfigurationSchema>;
