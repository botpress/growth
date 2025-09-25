import { getClient } from '../client'
import { RuntimeError } from '@botpress/client'
import * as bp from '.botpress'
import * as crypto from 'crypto'

/**
 * The 'startHitl' action initiates a conversation in Brevo and links it to the Botpress conversation.
 */
export const startHitl: bp.IntegrationProps['actions']['startHitl'] = async ({ ctx, client, logger, input }) => {
  logger.forBot().info('[StartHitl] Action called with input:', input)

  const { userId, title, description = 'No description available' } = input

  if (!userId) {
    throw new RuntimeError('[StartHitl] Action requires a userId from the input.')
  }

  const brevoClient = getClient(ctx)

  const userInfoState = await client.getState({
    id: userId,
    name: 'userInfo',
    type: 'user',
  })
  logger.forBot().info(`[StartHitl] userid ${userId}`)

  if (!userInfoState?.state.payload.email) {
    console.log('No userInfo found in state')
    return {
      success: false,
      message: 'errorMessage',
      data: null,
      conversationId: 'No user email found in state',
    }
  }
  const { email } = userInfoState.state.payload

  // Generate a unique HITL ID for the Brevo conversation (visitorId).
  // This ID consists of the first 15 characters of the user's email local part (before the '@')
  // combined with an 8-byte (16-character hex) random string.
  // This approach helps in identifying conversations while ensuring uniqueness to prevent collisions.
  const emailParts = email.split('@')
  if (!emailParts[0]) {
    logger.forBot().error('[CreateUser] Invalid email format: no local part found.')
    throw new RuntimeError('Invalid email format for HITL ID generation.')
  }

  const localPart = emailParts[0]
  const emailPrefix = localPart.substring(0, 15) // Max 15 chars for prefix
  const randomBytes = crypto.randomBytes(8) // 8 bytes = 16 hex chars
  const randomHex = randomBytes.toString('hex')
  const uniqueHitlId = `${emailPrefix}_${randomHex}` // Max 15 + 1 + 16 = 32 chars

  logger.forBot().info(`[CreateUser] Generated uniqueHitlId: ${uniqueHitlId} for email: ${email}`)

  try {
    logger.forBot().info(`[StartHitl] Using Botpress userId '${email}' directly as visitorId for Brevo.`)

    const subjectText = title || 'N/A'
    const descriptionText = description || 'No additional description provided.'

    const initialMessage = `*New HITL Conversation Request*\n*User Email*: ${email}\n*Subject*: ${subjectText}\n\n*Description*:\n${descriptionText}\n`

    const brevoExternalConversationResponse = await brevoClient.createConversation(uniqueHitlId, initialMessage)
    logger.forBot().info('Full response from brevoClient.createConversation:', brevoExternalConversationResponse)

    logger.forBot().info(`Successfully created Brevo conversation via API.`)

    const { conversation } = await client.getOrCreateConversation({
      channel: 'hitl',
      tags: {
        id: uniqueHitlId,
      },
    })

    logger.forBot().info(`Got/Created Botpress HITL channel conversation with ID: ${conversation.id}`)

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
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error'
    logger.forBot().error(`'startHitl' action failed: ${errorMessage}`, error.stack)
    if (error instanceof RuntimeError) {
      throw error
    }
    throw new RuntimeError(`Failed to start Brevo HITL session: ${errorMessage}`)
  }
}
// Brevo has no way to end a conversation via API, so we don't need to do anything here.
export const stopHitl: bp.IntegrationProps['actions']['stopHitl'] = async () => {
  return {}
}

/**
 * Creates a user in Botpress and tags them with an email, which Brevo will use as the \`visitorId\`.
 */
export const createUser: bp.IntegrationProps['actions']['createUser'] = async ({ client, ctx, input, logger }) => {
  try {
    const { name, email, pictureUrl } = input

    if (!email) {
      logger.forBot().error('Email necessary for HITL')
      throw new RuntimeError('Email necessary for HITL')
    }

    const { user: botpressUser } = await client.getOrCreateUser({
      name,
      pictureUrl,
      tags: { id: email },
    })

    await client.setState({
      id: botpressUser.id,
      type: 'user',
      name: 'userInfo',
      payload: {
        email: email,
      },
    })

    logger
      .forBot()
      .info(
        `[CreateUser] Called getOrCreateUser. Botpress User ID: ${botpressUser.id}. Unique HITL ID for Brevo visitorId: ${email}`
      )

    return {
      userId: botpressUser.id,
    }
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error'
    logger.forBot().error(`[CreateUser] Action failed: ${errorMessage}`, error.stack)
    if (error instanceof RuntimeError) throw error
    throw new RuntimeError(`Failed to create/map user for Brevo HITL: ${errorMessage}`)
  }
}
