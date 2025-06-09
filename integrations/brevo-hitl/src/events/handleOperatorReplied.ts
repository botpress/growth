import * as bp from '.botpress'
import { BrevoApi } from 'src/client'
import { brevoConversationFragmentEventSchema } from 'src/definitions/brevo-schemas'
import { z } from 'zod'

type BrevoConversationFragmentEvent = z.infer<typeof brevoConversationFragmentEventSchema>

export const handleOperatorReplied = async ({
  brevoEvent,
  client,
  logger,
}: {
  brevoEvent: BrevoConversationFragmentEvent
  client: bp.Client
  logger: bp.Logger
}) => {
  // Validate agents
  if (!brevoEvent.agents || brevoEvent.agents.length === 0) {
    logger.forBot().warn(`Received a 'conversationFragment' event with no agents. Conversation ID: ${brevoEvent.conversationId}. Skipping message creation.`);
    return;
  }

  // Validate messages
  if (!brevoEvent.messages || brevoEvent.messages.length === 0) {
    logger.forBot().warn(`Received a 'conversationFragment' event with no messages. Conversation ID: ${brevoEvent.conversationId}. Skipping message creation.`);
    return;
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: brevoEvent.visitor.id,
    },
  })

  let agentId = brevoEvent.agents[0]?.id
  let message = brevoEvent.messages[0]?.text

  // Additional validation for agent and message content
  if (!agentId) {
    logger.forBot().warn(`Received a 'conversationFragment' event with invalid agent ID. Conversation ID: ${brevoEvent.conversationId}. Skipping message creation.`);
    return;
  }

  if (!message) {
    logger.forBot().warn(`Received a 'conversationFragment' event with invalid message. Conversation ID: ${brevoEvent.conversationId}. Skipping message creation.`);
    return;
  }

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