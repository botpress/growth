import * as bp from '.botpress'
import { LiveChatWebhookPayload } from 'src/definitions/livechatEvents'

export const handleIncomingMessage = async (
  webhookPayload: Extract<LiveChatWebhookPayload, { action: 'incoming_event' }>,
  logger: bp.Logger,
  client: bp.Client,
  conversation: bp.AnyMessageProps['conversation'],
  ctx: bp.Context
): Promise<void> => {
  const { chat_id, thread_id, event } = webhookPayload.payload
  const { author_id, text, type, custom_id, created_at, visibility } = event

  if (!text?.trim()) {
    logger.forBot().info('Skipping empty message from LiveChat', {
      chat_id,
      thread_id,
      author_id,
      type,
      custom_id,
    })
    return
  }

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

  if (ctx.configuration.startChatAsCustomer) {
    const { state } = await client.getState({ id: conversation.id, name: 'livechatToken', type: 'conversation' })
    if (!state.payload.agentAssigned) {
      await client.createEvent({
        type: 'hitlAssigned',
        payload: { conversationId: conversation.id, userId: agentUser.id },
      })
      await client.setState({
        id: conversation.id,
        name: 'livechatToken',
        type: 'conversation',
        payload: { ...state.payload, agentAssigned: true },
      })
      logger.forBot().info(`Agent assigned to chat ${chat_id}`)
    }
  }

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
