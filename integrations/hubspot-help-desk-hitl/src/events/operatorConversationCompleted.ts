import { ConversationCompletedParams } from '../misc/types'

export const handleConversationCompleted = async ({ hubspotEvent, client }: ConversationCompletedParams) => {
  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: hubspotEvent.objectId.toString(),
    },
  })

  await client.createEvent({
    type: 'hitlStopped',
    payload: {
      conversationId: conversation.id,
    },
  })
}
