import * as bp from ".botpress";
import { LiveChatWebhookPayload } from "src/definitions/livechatEvents";

export const handleChatTransferred = async (
  webhookPayload: Extract<
    LiveChatWebhookPayload,
    { action: "chat_transferred" }
  >,
  logger: bp.Logger,
  client: bp.Client,
  conversation: any,
): Promise<void> => {
  const { chat_id, thread_id, requester_id, reason, transferred_to } =
    webhookPayload.payload;

  logger.forBot().info(`Processing chat transferred event`, {
    chat_id,
    thread_id,
    requester_id,
    reason,
    transferred_to: {
      group_ids: transferred_to.group_ids || [],
      agent_ids: transferred_to.agent_ids,
    },
  });

  const { user: botpressUser } = await client.getOrCreateUser({
    tags: {
      livechatConversationId: chat_id,
    },
  });

  await client.createEvent({
    type: "hitlAssigned",
    payload: {
      conversationId: conversation.id,
      userId: botpressUser.id as string,
    },
  });
};
