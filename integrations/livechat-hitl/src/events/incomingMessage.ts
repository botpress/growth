import * as bp from '.botpress'
import { getClient } from 'src/client'
import { LiveChatIncomingEvent } from 'src/definitions/livechatEvents'

export const handleIncomingMessage = async (
  payload: LiveChatIncomingEvent,
  logger: bp.Logger,
  client: bp.Client,
): Promise<void> => {
  const { chat_id, thread_id, event } = payload
  const { author_id, text, type, custom_id, created_at, visibility } = event

  logger.forBot().info(`Processing LiveChat message`, {
    chat_id,
    thread_id,
    author_id,
    text,
    type,
    custom_id,
    created_at,
    visibility,
  })
  
  const { user: agentUser } = await client.getOrCreateUser({
    tags: {
      agentId: author_id,
    },
  })

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: chat_id,
    },
  })

  await client.createMessage({
    conversationId: conversation.id,
    tags: {},
    type: 'text',
    payload: {
      text,
    },
    userId: agentUser.id,
  })
} 