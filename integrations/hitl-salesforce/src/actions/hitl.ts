import { RuntimeError } from '@botpress/client'
import { v4 } from 'uuid'
import { getSalesforceClient } from '../client'
import { SFMessagingConfig } from '../definitions/schemas'
import { closeConversation } from '../events/conversation-close'
import * as bp from '.botpress'

export const startHitl: bp.IntegrationProps['actions']['startHitl'] = async ({ ctx, client, input, logger }) => {
  try {
    const { userId, title, description } = input

    const { user } = await client.getUser({ id: userId })

    const salesforceClient = getSalesforceClient(logger, { ...(ctx.configuration as SFMessagingConfig) })

    const unauthenticatedData = await salesforceClient.createTokenForUnauthenticatedUser()

    // Use transport-translator to get realtime data
    await salesforceClient.startSSE({
      webhook: { url: `${process.env.BP_WEBHOOK_URL}/${ctx.webhookId}` },
    })

    const session = salesforceClient.getCurrentSession()

    if (!session) {
      throw new RuntimeError('Failed to create Session')
    }

    const newSalesforceConversationId = v4()

    const { conversation } = await client.createConversation({
      channel: 'hitl',
      tags: {
        transportKey: session.sseKey,
        id: newSalesforceConversationId,
      },
    })

    await client.updateUser({
      ...user,
      tags: {
        conversationId: newSalesforceConversationId,
      },
    })

    await client.setState({
      type: 'conversation',
      id: conversation.id,
      name: 'messaging',
      payload: {
        accessToken: unauthenticatedData.accessToken,
      },
    })

    const splitName = user.name?.split(' ')

    await salesforceClient.createConversation(newSalesforceConversationId, {
      firstName: (splitName?.length && splitName[0]) || 'Anon',
      _lastName: splitName && splitName?.length > 1 && splitName[splitName.length] || '',
      _email: user.tags?.email || 'anon@email.com',
    })

    await client.createEvent({
      type: 'hitlStarted',
      conversationId: conversation.id,
      payload: {
        conversationId: conversation.id,
        userId,
        title,
        description
      },
    })

    return { conversationId: conversation.id }
  } catch (error: any) {
    logger.forBot().error('Failed to start HITL Session: ' + error.message)
    throw new RuntimeError('Failed to start HITL Session: ' + error.message)
  }
}

export const stopHitl: bp.IntegrationProps['actions']['stopHitl'] = async ({ ctx, input, client, logger }) => {
  const { conversation } = await client.getConversation({
    id: input.conversationId,
  })

  if (!conversation) {
    throw new RuntimeError("Conversation doesn't exist")
  }

  await closeConversation({ conversation, ctx, client, logger, force: true })

  return {}
}

export const createUser: bp.IntegrationProps['actions']['createUser'] = async ({ client, input }) => {
  try {
    const { name, email, pictureUrl } = input

    const { user: botpressUser } = await client.getOrCreateUser({
      name,
      pictureUrl,
      tags: {
        email,
      },
    })

    return {
      userId: botpressUser.id, // always return the newly created botpress user id
    }
  } catch (error: any) {
    throw new RuntimeError(error.message)
  }
}
