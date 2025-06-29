import { OperatorSendMessageParams } from '../misc/types'

export const handleOperatorReplied = async ({
  hubspotEvent,
  client
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

  const { user } = await client.getOrCreateUser({
    tags: {
      agentId: hubspotEvent.message?.senders?.[0]?.actorId,    
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
