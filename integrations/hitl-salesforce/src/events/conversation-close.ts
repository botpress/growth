import { Conversation } from '@botpress/client'
import * as bp from '../../.botpress'
import { getSalesforceClientWithBotpress } from '../client'
import { CloseConversationMessagingTrigger } from '../triggers'

export const executeOnConversationClose = async ({
  messagingTrigger,
  conversation,
  ctx,
  client,
  logger,
}: {
  messagingTrigger: CloseConversationMessagingTrigger
  conversation: bp.AnyMessageProps['conversation']
  ctx: bp.Context
  client: bp.Client
  logger: bp.Logger
}) => {
  if (conversation.tags.id !== messagingTrigger.data.conversationId) {
    logger.forBot().warn('Received conversation close for an conversation not created by the integration')
    return
  }

  await closeConversation({ conversation, ctx, client, logger })
}

export const closeConversation = async ({
  conversation,
  ctx,
  client,
  logger,
  force,
  forceDelay,
}: {
  conversation: bp.AnyMessageProps['conversation']
  ctx: bp.Context
  client: bp.Client
  logger: bp.Logger
  force?: boolean
  forceDelay?: boolean
}) => {
  if (!force && isConversationClosed(conversation)) {
    // Skipping because the conversation was already closed at the Integration
    return
  }

  await client.updateConversation({
    id: conversation.id,
    tags: {
      assignedAt: conversation.tags.assignedAt,
      transportKey: conversation.tags.transportKey,
      id: conversation.tags.id,
      closedAt: new Date().toISOString(),
    },
  })

  let delay = 0

  if (!isConversationAssigned(conversation) || forceDelay) {
    // TODO: Weird race condition stuff, remove when the HITL Agent is migrated to plugins and uses it's own state
    delay = 3000
  }

  void client.createEvent({
    type: 'hitlStopped',
    conversationId: conversation.id,
    //...( delay && { schedule: { delay }}),
    payload: {
      conversationId: conversation.id,
    },
  })

  const salesforceClient = await getSalesforceClientWithBotpress({ client, ctx, conversation, logger })

  // Conversation could already be closed on Salesforce, ignore errors
  try {
    await salesforceClient.closeConversation()
  } catch (e) {}

  await salesforceClient.stopSSE(conversation.tags.transportKey as string)
}

export const isConversationClosed = (conversation: Conversation) => {
  return conversation.tags.closedAt?.length && true
}

export const isConversationAssigned = (conversation: bp.AnyMessageProps['conversation']) => {
  return conversation.tags.assignedAt?.length && true
}
