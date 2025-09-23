import { getClient } from '../client'
import { RuntimeError } from '@botpress/client'
import * as bp from '.botpress'

export const startHitl: bp.IntegrationProps['actions']['startHitl'] = async ({ ctx, client, logger, input }) => {
  const intercomClient = getClient(ctx.configuration.accessToken, logger)

  logger.forBot().info('Starting Intercom HITL...')

  try {
    const { userId, title, description = 'No description available' } = input

    const { user } = await client.getUser({ id: userId })

    const userInfoState = await client.getState({
      id: input.userId,
      name: 'userInfo',
      type: 'user',
    })

    if (!userInfoState?.state.payload.email) {
      throw new RuntimeError('No userInfo found in state')
    }
    const { email, intercomContactId } = userInfoState.state.payload

    logger
      .forBot()
      .info(
        `Retrieved user info - Email: ${email}, Intercom Contact ID: ${intercomContactId}, Botpress User ID: ${userId}`
      )

    if (!intercomContactId) {
      throw new RuntimeError('No Intercom contact ID found in user state')
    }

    const createdConversation = await intercomClient.createConversation(intercomContactId, email, description)

    if (!createdConversation.success || !createdConversation.data?.conversation_id) {
      logger.forBot().error(`Failed to create Intercom conversation. Response: ${JSON.stringify(createdConversation)}`)
      throw new RuntimeError(createdConversation.message || 'Failed to create Intercom conversation')
    }

    const intercomConversationId = createdConversation.data.conversation_id
    logger.forBot().info(`Successfully created Intercom conversation. Conversation ID: ${intercomConversationId}`)

    const { conversation } = await client.getOrCreateConversation({
      channel: 'hitl',
      tags: {
        id: intercomConversationId,
        userId: user.id,
      },
    })

    await client.updateUser({
      ...user,
      tags: {
        email: email,
        intercomConversationId: intercomConversationId,
      },
    })

    await client.setState({
      id: conversation.id,
      type: 'conversation',
      name: 'intercomContact',
      payload: {
        intercomContactId: intercomContactId,
      },
    })

    logger.forBot().debug(`Intercom Conversation ID: ${intercomConversationId}`)
    logger.forBot().debug(`Botpress Conversation ID: ${conversation.id}`)
    logger
      .forBot()
      .info(
        `HITL session started successfully - Intercom Contact ID: ${intercomContactId}, Intercom Conversation ID: ${intercomConversationId}, Botpress Conversation ID: ${conversation.id}`
      )

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

    return {
      conversationId: conversation.id,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    logger.forBot().error(`'Create Conversation' exception: ${errorMessage}`)
    throw new RuntimeError(errorMessage)
  }
}

export const stopHitl: bp.IntegrationProps['actions']['stopHitl'] = async ({ ctx, client, logger, input }) => {
  const intercomClient = getClient(ctx.configuration.accessToken, logger)

  logger.forBot().info('Stopping Intercom HITL...')

  try {
    const { conversationId } = input as { conversationId: string }

    const { conversation } = await client.getConversation({
      id: conversationId,
    })

    const intercomConversationId = conversation.tags.id as string
    const userId = conversation.tags.userId as string

    if (!intercomConversationId || !userId) {
      logger.forBot().error('No Intercom conversation ID or user ID found in conversation tags')
      return {
        success: false,
        message: 'No Intercom conversation ID or user ID found in conversation tags',
      }
    }

    await intercomClient.closeConversation(intercomConversationId, 'Conversation closed.')

    await client.createEvent({
      type: 'hitlStopped',
      payload: {
        conversationId,
      },
    })

    return {
      success: true,
      message: 'Chat deactivated successfully',
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    logger.forBot().error(`'Stop HITL' exception: ${errorMessage}`)

    return {
      success: false,
      message: errorMessage,
    }
  }
}

export const createUser: bp.IntegrationProps['actions']['createUser'] = async ({ ctx, client, input, logger }) => {
  try {
    const { name = 'None', email = 'None', pictureUrl = 'None' } = input

    if (!email) {
      logger.forBot().error('Email necessary for HITL')
      throw new RuntimeError('Email necessary for HITL')
    }

    logger.forBot().info(`Creating user with email: ${email}`)

    const { user: botpressUser } = await client.getOrCreateUser({
      name,
      pictureUrl,
      tags: {
        email: email,
      },
    })

    const intercomClient = getClient(ctx.configuration.accessToken, logger)

    // First, search for existing contact by email
    logger.forBot().info(`Searching for existing Intercom contact with email: ${email}`)
    const searchResult = await intercomClient.searchContactByEmail(email)

    let intercomContactId: string

    if (searchResult.success && searchResult.data?.data && searchResult.data.data.length > 0) {
      // Contact already exists, use the existing contact ID
      intercomContactId = searchResult.data.data[0].id
      logger.forBot().info(`Found existing Intercom contact. Contact ID: ${intercomContactId}`)
    } else {
      // Contact doesn't exist, create a new one
      logger.forBot().info(`No existing contact found. Creating new Intercom contact for email: ${email}`)
      const result = await intercomClient.createContact(email)

      if (!result.success) {
        logger.forBot().error(`Failed to create Intercom contact. Response: ${JSON.stringify(result)}`)
        throw new RuntimeError('Failed to create contact')
      }

      if (!result.data) {
        logger.forBot().error(`Failed to create Intercom contact. Response: ${JSON.stringify(result)}`)
        throw new RuntimeError('Failed to create contact')
      }

      intercomContactId = result.data.id
      logger.forBot().info(`Successfully created new Intercom contact. Contact ID: ${intercomContactId}`)
    }

    await client.setState({
      id: botpressUser.id,
      type: 'user',
      name: 'userInfo',
      payload: {
        email: email,
        intercomContactId: intercomContactId,
      },
    })

    logger.forBot().debug(`Created/Found user: ${botpressUser.id}`)
    logger
      .forBot()
      .info(
        `User setup complete - Botpress User ID: ${botpressUser.id}, Intercom Contact ID: ${intercomContactId}, Email: ${email}`
      )

    return {
      userId: botpressUser.id,
    }
  } catch (error: any) {
    logger.forBot().error(`Error in createUser: ${error.message}`)
    throw new RuntimeError(error.message)
  }
}
