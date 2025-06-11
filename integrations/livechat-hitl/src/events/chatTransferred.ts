import * as bp from '.botpress'
import { LiveChatTransferred } from 'src/definitions/livechatEvents'

export const handleChatTransferred = async (
  payload: LiveChatTransferred,
  logger: bp.Logger,
  client: bp.Client,
): Promise<void> => {
  const { chat_id, thread_id, requester_id, reason, transferred_to } = payload

  logger.forBot().info(`Processing chat transferred event`, {
    chat_id,
    thread_id,
    requester_id,
    reason,
    transferred_to: {
      group_ids: transferred_to.group_ids || [],
      agent_ids: transferred_to.agent_ids,
    },
  })

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: chat_id,
    },
  })

  const { user: botpressUser } = await client.getOrCreateUser({
    tags: {
      livechatConversationId: chat_id,
    },
  })

  await client.createEvent({
    type: 'hitlAssigned',
    payload: {
      conversationId: conversation.id,
      userId: botpressUser.id as string,
    },
  })
} 