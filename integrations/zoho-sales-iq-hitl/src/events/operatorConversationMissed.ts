import type { ConversationMissedEvent } from '../definitions/webhook-events'
import { validateConversationTag } from '../utils/validation'
import * as bp from '.botpress'

export const handleConversationMissed = async ({
  salesIqEvent,
  client,
}: {
  salesIqEvent: ConversationMissedEvent
  client: bp.Client
}) => {
  const conversationTagId = validateConversationTag(salesIqEvent.entity_id)

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: conversationTagId,
    },
  })

  await client.createEvent({
    type: 'hitlStopped',
    payload: {
      conversationId: conversation.id,
    },
  })
}
