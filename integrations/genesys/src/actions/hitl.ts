import { getClient } from '../client'
import { RuntimeError } from '@botpress/client'
import * as bp from '.botpress'
import * as crypto from 'crypto'

/**
 * The 'startHitl' action initiates a conversation in Genesys and links it to the Botpress conversation.
 */
export const startHitl: bp.IntegrationProps['actions']['startHitl'] = async ({ ctx, client, logger, input }) => {
  logger.forBot().info('[StartHitl] Action called with input:', input)

  const { userId, title, description = 'No description available' } = input

  if (!userId) {
    throw new RuntimeError('[StartHitl] Action requires a userId from the input.')
  }

  const genesysClient = getClient(ctx)

  const userInfoState = await client.getState({
    id: userId,
    name: 'userInfo',
    type: 'user',
  })
  logger.forBot().info(`[StartHitl] userid ${userId}`)

  if (!userInfoState?.state.payload.externalUserId) {
    logger.forBot().error('No userInfo found in state')
    return {
      conversationId: 'No user external ID found in state',
    }
  }

  const { externalUserId, nickname } = userInfoState.state.payload

  // Generate a unique HITL conversation ID
  // This ID consists of the external user ID prefix and a random string
  const userIdPrefix = externalUserId.substring(0, 15)
  const randomBytes = crypto.randomBytes(8) // 8 bytes = 16 hex chars
  const randomHex = randomBytes.toString('hex')
  const uniqueHitlId = `${userIdPrefix}_${randomHex}`

  logger.forBot().info(`[StartHitl] Generated uniqueHitlId: ${uniqueHitlId} for externalUserId: ${externalUserId}`)

  try {
    const subjectText = title || 'N/A'
    const descriptionText = description || 'No additional description provided.'

    const initialMessage = `*New HITL Conversation Request*\n*User ID*: ${externalUserId}\n*Subject*: ${subjectText}\n\n*Description*:\n${descriptionText}\n`

    // Send the initial message to Genesys
    await genesysClient.sendMessage(uniqueHitlId, nickname, initialMessage)
    logger.forBot().info('Successfully created Genesys conversation via API.')

    // Create or get the Botpress HITL conversation
    const { conversation } = await client.getOrCreateConversation({
      channel: 'hitl',
      tags: {
        id: uniqueHitlId,
      },
    })

    logger.forBot().info(`Got/Created Botpress HITL channel conversation with ID: ${conversation.id}`)

    // Create the hitlAssigned event
    await client.createEvent({
      type: 'hitlAssigned',
      conversationId: conversation.id,
      payload: {
        conversationId: conversation.id,
        userId,
      },
    })

    return {
      conversationId: conversation.id,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    logger.forBot().error(`'startHitl' action failed: ${errorMessage}`, errorStack)
    if (error instanceof RuntimeError) {
      throw error
    }
    throw new RuntimeError(`Failed to start Genesys HITL session: ${errorMessage}`)
  }
}

/**
 * Genesys Open Message doesn't have a specific API to end a conversation,
 * so we just return success without doing anything.
 */
export const stopHitl: bp.IntegrationProps['actions']['stopHitl'] = async ({ logger }) => {
  logger.forBot().info('[StopHitl] Action called - no action needed for Genesys')
  return {}
}

/**
 * Creates a user in Botpress and tags them with their external ID for Genesys.
 */
export const createUser: bp.IntegrationProps['actions']['createUser'] = async ({ client, input, logger }) => {
  try {
    const { name, email, pictureUrl } = input

    // For Genesys, we'll use email as the external user ID if provided, otherwise generate one
    const externalUserId = email || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const nickname = name || externalUserId

    const { user: botpressUser } = await client.getOrCreateUser({
      name: nickname,
      pictureUrl,
      tags: { id: externalUserId },
    })

    await client.setState({
      id: botpressUser.id,
      type: 'user',
      name: 'userInfo',
      payload: {
        externalUserId,
        nickname,
      },
    })

    logger
      .forBot()
      .info(
        `[CreateUser] Called getOrCreateUser. Botpress User ID: ${botpressUser.id}. External User ID for Genesys: ${externalUserId}`
      )

    return {
      userId: botpressUser.id,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    logger.forBot().error(`[CreateUser] Action failed: ${errorMessage}`, errorStack)
    if (error instanceof RuntimeError) throw error
    throw new RuntimeError(`Failed to create/map user for Genesys HITL: ${errorMessage}`)
  }
}
