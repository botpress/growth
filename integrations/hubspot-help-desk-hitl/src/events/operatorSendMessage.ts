import { OperatorSendMessageParams } from '../misc/types'

export const handleOperatorReplied = async ({
  hubspotEvent,
  client,
  hubSpotClient,
}: OperatorSendMessageParams) => {
  if (!hubspotEvent.message?.conversationsThreadId) {
    throw new Error('Missing conversation thread ID in message')
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: hubspotEvent.message.conversationsThreadId,
    },
  })

  const recipientActorId = hubspotEvent.message?.recipients?.[0]?.actorId
  if (!recipientActorId) {
    throw new Error('Missing recipient actor ID in message')
  }
  
  // Stripping the "V-" prefix from the recipientActorId
  const recipientActorPhoneNumber = await hubSpotClient.getActorPhoneNumber(recipientActorId.substring(2))
  if (!recipientActorPhoneNumber) {
    throw new Error('Failed to get recipient phone number')
  }

  const { user } = await client.getOrCreateUser({
    tags: {
      id: recipientActorPhoneNumber,
    },
  })

  if (!user?.id) {
    throw new Error('Failed to get or create user')
  }

  await client.createMessage({
    tags: {},
    type: 'text',
    userId: user.id,
    conversationId: conversation.id,
    payload: { text: hubspotEvent.message.text },
  })
}
