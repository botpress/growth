import * as bp from '.botpress'
import { BrevoApi } from 'src/client'
import { BrevoConversationFragmentEvent } from 'src/definitions/brevo-events'

export const handleOperatorReplied = async ({
  brevoEvent,
  client,
}: {
  brevoEvent: BrevoConversationFragmentEvent
  client: bp.Client,
}) => {
  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: brevoEvent.visitor.id,
    },
  })

  let agentId = brevoEvent.agents[0]?.id || 'No agent found'
  let message = brevoEvent.messages[0]?.text || 'No message found'

  if (message.startsWith('*New HITL Conversation Request') || message.startsWith('*Botpress User')) {
    return;
  }
//This is because Brevo agent IDs are more than 36 characters long, and botpress accepts max 36 characters
  agentId = agentId.substring(0, 36);

  const { user } = await client.getOrCreateUser({
    tags: {
      id: agentId,
    },
  })
  
  await client.createMessage({
    tags: {},
    type: 'text',
    userId: user.id,
    conversationId: conversation.id,
    payload: { text: message },
  })
}