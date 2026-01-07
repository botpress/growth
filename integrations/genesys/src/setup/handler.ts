import * as bp from '.botpress'
import { genesysInboundMessageSchema } from '../definitions/genesys-schemas'
import { parseAndValidate } from '../misc/json'

export const handler: bp.IntegrationProps['handler'] = async ({ req, logger, client }) => {
  if (!req.body) {
    logger.forBot().warn('Handler received a request with no body.')
    return { status: 400 }
  }

  logger.forBot().debug('Handler received request from Genesys with raw payload:', req.body)

  // Ensure req.body is a string before parsing
  if (typeof req.body !== 'string') {
    logger.forBot().error('Handler received a non-string body. Type:', typeof req.body)
    return { status: 400 }
  }

  // Parse and validate the payload using Zod schema (type-safe)
  const validationResult = parseAndValidate(req.body, genesysInboundMessageSchema)
  if (!validationResult.success) {
    logger.forBot().error('Invalid Genesys message payload:', validationResult.error.format())
    return { status: 400 }
  }

  const message = validationResult.data

  // Only process inbound messages from users (not outbound bot messages)
  if (message.direction === 'Outbound') {
    logger.forBot().debug('Skipping outbound message')
    return { status: 200 }
  }

  const externalUserId = message.channel.from.id
  const text = message.text || ''
  const nickname = message.channel.from.nickname

  logger
    .forBot()
    .info(
      `Handler: Processing Genesys message from user: ${externalUserId}, nickname: ${nickname || 'N/A'}, text: "${text}"`
    )

  // Get or create the HITL conversation
  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: externalUserId,
    },
  })

  logger.forBot().info(`Got/Created HITL conversation with ID: ${conversation.id}`)

  // Get or create the user
  const { user } = await client.getOrCreateUser({
    tags: {
      id: externalUserId,
    },
  })

  // Update user state with latest info
  await client.setState({
    id: user.id,
    type: 'user',
    name: 'userInfo',
    payload: {
      externalUserId,
      nickname,
    },
  })

  logger.forBot().info(`Got/Created user with ID: ${user.id}`)

  // Create the message in Botpress
  await client.createMessage({
    tags: {},
    type: 'text',
    userId: user.id,
    conversationId: conversation.id,
    payload: { text },
  })

  logger.forBot().info('Successfully created message in Botpress')

  return { status: 200 }
}
