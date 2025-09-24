import * as bp from '.botpress'

export const handleOperatorReplied = async ({ hubspotEvent, client }: { hubspotEvent: any; client: bp.Client }) => {
  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: hubspotEvent.message?.conversationsThreadId,
    },
  })

  const { user } = await client.getOrCreateUser({
    tags: {
      agentId: hubspotEvent.message?.senders?.[0]?.actorId,
    },
  })

  await client.createMessage({
    tags: {},
    type: 'text',
    userId: user?.id as string,
    conversationId: conversation.id,
    payload: { text: hubspotEvent.message?.text },
  })
}
