import * as bp from '.botpress'
import { adminClosedEventSchema } from 'src/definitions/intercomEvents'

export const handleConversationClosed = async (
  payload: typeof adminClosedEventSchema._type,
  logger: bp.Logger,
  client: bp.Client
): Promise<void> => {
  const conversationId = payload.data.item.id
  const adminId = payload.data.item.admin_assignee_id

  logger.forBot().info('Processing conversation.admin.closed event', {
    conversationId,
    adminId,
  })

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: conversationId,
    },
  })

  let adminUser
  if (adminId) {
    const result = await client.getOrCreateUser({
      tags: {
        intercomAdminId: String(adminId),
      },
    })
    adminUser = result.user
  }

  await client.createEvent({
    type: 'hitlStopped',
    conversationId: conversation.id,
    payload: {
      conversationId: conversation.id,
    },
    userId: adminUser?.id,
  })

  logger.forBot().info('Conversation closed', {
    conversationId: conversation.id,
    adminId,
    adminUserId: adminUser?.id,
  })
}
