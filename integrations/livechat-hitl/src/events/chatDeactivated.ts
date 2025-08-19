import * as bp from ".botpress";
import { LiveChatWebhookPayload } from "src/definitions/livechatEvents";

export const handleChatDeactivated = async (
  webhookPayload: Extract<
    LiveChatWebhookPayload,
    { action: "chat_deactivated" }
  >,
  logger: bp.Logger,
  client: bp.Client,
): Promise<void> => {
  const { chat_id, thread_id, user_id } = webhookPayload.payload;

  logger.forBot().info(`Processing chat deactivated event`, {
    chat_id,
    thread_id,
    user_id,
  });

  const { conversation } = await client.getOrCreateConversation({
    channel: "hitl",
    tags: {
      id: chat_id,
    },
  });

  await client.createEvent({
    type: "hitlStopped",
    payload: {
      conversationId: conversation.id,
    },
  });
};
