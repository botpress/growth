import type { OperatorRepliedEvent } from '../definitions/webhook-events'
import { validateConversationTag, validateUserTag } from '../utils/validation'
import * as bp from '.botpress'

export const handleOperatorReplied = async ({
  salesIqEvent,
  client,
}: {
  salesIqEvent: OperatorRepliedEvent
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

  await client.createMessage({
    tags: {},
    type: 'text',
    userId: user?.id as string,
    conversationId: conversation.id,
    payload: { text: salesIqEvent.entity.message.text },
  })
}
