import { ConversationWebhookPayload } from '../definitions/salesIqEvents'
import * as bp from '.botpress'

export const handleConversationMissed = async ({
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

  await client.createEvent({
    type: 'hitlStopped',
    payload: {
      conversationId: conversation.id,
    },
  })
}
