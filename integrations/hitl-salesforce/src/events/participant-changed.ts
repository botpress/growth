import { ParticipantChangedDataPayload, ParticipantChangedMessagingTrigger } from '../triggers'
import { closeConversation } from './conversation-close'
import * as bp from '.botpress'

export const executeOnParticipantChanged = async ({
  messagingTrigger,
  conversation,
  ctx,
  client,
  logger,
}: {
  messagingTrigger: ParticipantChangedMessagingTrigger
  conversation: bp.AnyMessageProps['conversation']
  ctx: bp.Context
  client: bp.Client
  logger: bp.Logger
}) => {
  let entryPayload: ParticipantChangedDataPayload

  try {
    entryPayload = JSON.parse(messagingTrigger.data.conversationEntry.entryPayload) as ParticipantChangedDataPayload
  } catch (e) {
    logger.forBot().error('Could not parse entry payload', e)
    return
  }

  for (const entry of entryPayload.entries) {
    const {
      displayName,
      participant: { role, subject },
    } = entry

    if (role !== 'Agent') {
      return
    }

    switch (entry.operation) {
      case 'remove':
        await closeConversation({ conversation, ctx, client, logger })
        return
      case 'add':
        const { user } = await client.getOrCreateUser({
          name: displayName,
          tags: {
            id: subject,
          },
        })

        if (!user.name?.length) {
          await client.updateUser({
            ...user,
            name: displayName,
            tags: {
              id: subject,
            },
          })
        }

        await client.updateConversation({
          id: conversation.id,
          tags: {
            assignedAt: new Date().toISOString(),
            transportKey: conversation.tags.transportKey,
            id: conversation.tags.id,
            closedAt: conversation.tags.closedAt
          },
        })

        await client.createEvent({
          type: 'hitlAssigned',
          conversationId: conversation.id,
          payload: {
            conversationId: conversation.id,
            userId: user.id,
          },
        })
        return
      default:
        break
    }
  }
}
