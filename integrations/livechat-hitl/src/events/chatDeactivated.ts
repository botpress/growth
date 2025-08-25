import * as bp from ".botpress";
import { LiveChatWebhookPayload } from "src/definitions/livechatEvents";

export const handleChatDeactivated = async (
  webhookPayload: Extract<
    LiveChatWebhookPayload,
    { action: "chat_deactivated" }
  >,
  logger: bp.Logger,
  client: bp.Client,
  conversation: any,
): Promise<void> => {
  const { chat_id, thread_id, user_id } = webhookPayload.payload;

  logger.forBot().info(`Processing chat deactivated event`, {
    chat_id,
    thread_id,
    user_id,
  });

  await client.createEvent({
    type: "hitlStopped",
    payload: {
      conversationId: conversation.id,
    },
  });
};
