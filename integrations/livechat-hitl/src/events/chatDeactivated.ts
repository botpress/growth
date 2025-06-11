import * as bp from '.botpress'
import { LiveChatDeactivated } from 'src/definitions/livechatEvents'

export const handleChatDeactivated = async (
  payload: LiveChatDeactivated,
  logger: bp.Logger,
  client: bp.Client,
): Promise<void> => {
  const { chat_id, thread_id, user_id } = payload

  logger.forBot().info(`Processing chat deactivated event`, {
    chat_id,
    thread_id,
    user_id,
  })

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: chat_id,
    },
  })

  await client.createEvent({
    type: 'hitlStopped',
    payload: {
      conversationId: conversation.id,
    },
  })
} 