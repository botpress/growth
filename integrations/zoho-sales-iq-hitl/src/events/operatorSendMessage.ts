import { ConversationWebhookPayload } from '../definitions/salesIqEvents'
import * as bp from '.botpress'

export const handleOperatorReplied = async ({
  salesIqEvent,
  client,
}: {
  salesIqEvent: ConversationWebhookPayload
  client: bp.Client
}) => {
  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: salesIqEvent.entity_id,
    },
  })

  const { user } = await client.getOrCreateUser({
    tags: {
      id: salesIqEvent.entity.visitor.email_id,
    },
  })

  await client.createMessage({
    tags: {},
    type: 'text',
    userId: user?.id as string,
    conversationId: conversation.id,
    payload: { text: salesIqEvent.entity.message.text },
  })
}
