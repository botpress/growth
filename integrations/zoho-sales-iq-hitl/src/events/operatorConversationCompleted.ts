import type { ConversationCompletedEvent } from '../definitions/webhook-events'
import * as bp from '.botpress'

export const handleConversationCompleted = async ({
  salesIqEvent,
  client,
}: {
  salesIqEvent: ConversationCompletedEvent
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
