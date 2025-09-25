import * as bp from '.botpress'
import { adminAssignedEventSchema } from 'src/definitions/intercomEvents'

export const handleConversationAssigned = async (
  payload: typeof adminAssignedEventSchema._type,
  logger: bp.Logger,
  client: bp.Client
): Promise<void> => {
  const conversationId = payload.data.item.id
  const adminId = payload.data.item.admin_assignee_id

  logger.forBot().info('Processing conversation.admin.assigned event', {
    conversationId,
    adminId,
  })

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: conversationId,
    },
  })

  const { user: botpressUser } = await client.getOrCreateUser({
    tags: {
      intercomConversationId: conversationId,
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
