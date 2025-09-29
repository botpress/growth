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

    // Use DeveloperName from hitlSession if provided and not empty, otherwise fall back to configuration
    const developerName = (input.hitlSession?.DeveloperName && input.hitlSession.DeveloperName.trim() !== '') 
      ? input.hitlSession.DeveloperName 
      : (ctx.configuration as SFMessagingConfig).DeveloperName

    const salesforceClient = getSalesforceClient(logger, { 
      ...(ctx.configuration as SFMessagingConfig),
      DeveloperName: developerName
    })

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
        developerName: developerName,
      },
    })

    const splitName = user.name?.split(' ')

    let routingAttributesObj: Record<string, any> = {}

    try {
      routingAttributesObj = JSON.parse(input.hitlSession?.routingAttributes || '{}')
      logger.forBot().debug(`Will use custom routing attributes: ${JSON.stringify({ routingAttributesObj })}`)
    } catch (thrown) {
      const err = thrown instanceof Error ? thrown : new Error(String(thrown))
      logger.forBot().warn('Failed to parse routing attributes, using empty object: ' + err.message)
    }

    const name = (splitName?.length && splitName[0]) || 'Anon'

    await salesforceClient.createConversation(newSalesforceConversationId, {
      _firstName: name,
      firstName: name, //backwards compatibility
      _lastName: (splitName && splitName?.length > 1 && splitName[splitName.length]) || '',
      _email: user.tags?.email || 'anon@email.com',
      ...routingAttributesObj,
    })

    await client.createEvent({
      type: 'hitlStarted',
      conversationId: conversation.id,
      payload: {
        conversationId: conversation.id,
        userId,
        title: title ?? 'Untitled ticket',
        description,
      },
    })

    return { conversationId: conversation.id }
  } catch (error: any) {
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
