import type { AttenderUpdatedEvent } from '../definitions/webhook-events'
import { validateConversationTag, validateUserTag } from '../utils/validation'
import * as bp from '.botpress'

export const handleOperatorAssignedUpdate = async ({
  salesIqEvent,
  client,
}: {
  salesIqEvent: AttenderUpdatedEvent
  client: bp.Client
}) => {
  const conversationTagId = validateConversationTag(salesIqEvent.entity_id)
  const userTagId = validateUserTag(salesIqEvent.entity.visitor.email_id)

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: conversationTagId,
    },
  })

  const { user } = await client.getOrCreateUser({
    tags: {
      id: userTagId,
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
