import { ConversationWebhookPayload } from '../definitions/salesIqEvents'
import * as bp from '.botpress'

export const handleOperatorAssignedUpdate = async ({
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
  
  await client.createEvent({
    type: 'hitlAssigned',
    payload: {
      conversationId: conversation.id,
      userId: user.id as string,
    },
  })
}
