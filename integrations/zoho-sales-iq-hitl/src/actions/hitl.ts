import { RuntimeError } from '@botpress/client'

import { getClient } from '../client'
import * as bp from '.botpress'

export const startHitl: bp.IntegrationProps['actions']['startHitl'] = async ({ ctx, client, logger, input }) => {
  const zohoClient = getClient(
    ctx.configuration.refreshToken,
    ctx.configuration.clientId,
    ctx.configuration.clientSecret,
    ctx.configuration.dataCenter,
    ctx,
    client
  )

  try {
    const { state } = await client.getState({
      id: ctx.integrationId,
      name: 'userInfo',
      type: 'integration',
    })

    const { title, description} = input

    const normalizedTitle = title?.trim() || 'Untitled Ticket'
    const normalizedDescription = description?.trim() || 'No description available'

    const result = await zohoClient.createConversation(
      state.payload.name,
      state.payload.email,
      normalizedTitle,
      normalizedDescription
    )

    if ( result.success === false || result.data === null ) {
      const safeResultInfo = {
        success: result.success,
        conversationId: result.data?.conversation_id,
      }
      throw new RuntimeError(
        'Failed to create a conversation with Zoho SalesIQ. Result: ' + JSON.stringify(safeResultInfo, null, 2)
      )
    }

    const { conversation } = await client.getOrCreateConversation({
      channel: 'hitl',
      tags: { id: `${result.data.conversation_id}` },
    })

    return {
      conversationId: conversation.id,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    logger.forBot().error(`'Create Conversation' exception: ${errorMessage}`)

    return {
      success: false,
      message: errorMessage,
      data: null,
      conversationId: 'error_conversation_id',
    }
  }
}

export const stopHitl: bp.IntegrationProps['actions']['stopHitl'] = async ({ ctx, input, client, logger }) => {
  const { conversation } = await client.getConversation({
    id: input.conversationId,
  })

  const salesIqConversationId: string | undefined = conversation.tags.id

  if (!salesIqConversationId) {
    return {}
  }

  const zohoClient = getClient(
    ctx.configuration.refreshToken,
    ctx.configuration.clientId,
    ctx.configuration.clientSecret,
    ctx.configuration.dataCenter,
    ctx,
    client
  )

  zohoClient.sendMessage(salesIqConversationId, 'Botpress HITL terminated.')

  logger.forBot().info('Botpress HITL terminated.')

  return {}
}

export const createUser: bp.IntegrationProps['actions']['createUser'] = async ({ client, input, ctx }) => {
  try {
    const { name, email, pictureUrl } = input

    if (!email) {
      throw new RuntimeError('Email necessary for HITL')
    }

    await client.setState({
      id: ctx.integrationId,
      type: 'integration',
      name: 'userInfo',
      payload: {
        name: name,
        email: email,
      },
    })

    const { user: botpressUser } = await client.getOrCreateUser({
      name,
      pictureUrl,
      tags: {
        id: email,
      },
    })

    return {
      userId: botpressUser.id,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new RuntimeError(errorMessage)
  }
}
