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

  // Handle both Inbound (user messages) and Outbound (agent messages)
  const isInbound = message.direction === 'Inbound'
  const isOutbound = message.direction === 'Outbound'

  if (isInbound) {
    await handleUserMessage(message, client, logger)
  } else if (isOutbound) {
    await handleAgentMessage(message, client, logger)
  }

  return { status: 200 }
}

async function handleUserMessage(
  message: { channel: { from: { id: string; nickname?: string } }; text?: string },
  client: bp.Client,
  logger: bp.Logger
) {
  const externalUserId = message.channel.from.id
  const text = message.text || ''
  const nickname = message.channel.from.nickname

  logger
    .forBot()
    .info(
      `Handler: Processing Genesys user message from: ${externalUserId}, nickname: ${nickname || 'N/A'}, text: "${text}"`
    )

  // Get or create the user
  const { user } = await client.getOrCreateUser({
    tags: {
      id: externalUserId,
    },
  })

  logger.forBot().info(`Got/Created user with ID: ${user.id}`)

  // Get or create the HITL conversation with both id and userId tags
  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: externalUserId,
      userId: user.id,
    },
  })

  logger.forBot().info(`Got/Created HITL conversation with ID: ${conversation.id}`)

  // Update user state and tags with latest info
  await client.setState({
    id: user.id,
    type: 'user',
    name: 'userInfo',
    payload: {
      externalUserId,
      nickname,
    },
  })

  // Update user tags for better querying
  await client.updateUser({
    ...user,
    tags: {
      ...user.tags,
      genesysConversationId: externalUserId,
    },
  })

  // Create the message in Botpress
  await client.createMessage({
    tags: {},
    type: 'text',
    userId: user.id,
    conversationId: conversation.id,
    payload: { text },
  })

  logger.forBot().info('Successfully created user message in Botpress')
}

async function handleAgentMessage(
  message: { channel: { from: { id: string; nickname?: string } }; text?: string },
  client: bp.Client,
  logger: bp.Logger
) {
  const externalUserId = message.channel.from.id
  const text = message.text || ''
  const nickname = message.channel.from.nickname

  logger
    .forBot()
    .info(
      `Handler: Processing Genesys agent message from: ${externalUserId}, nickname: ${nickname || 'N/A'}, text: "${text}"`
    )

  // Find the existing HITL conversation for this user
  const hitlConv = await findHitlConversation(client, externalUserId, logger)
  if (!hitlConv) return

  // Create or get agent user
  const { user: agentUser } = await client.getOrCreateUser({
    tags: { genesysAgentId: externalUserId },
    name: nickname || 'Genesys Agent',
  })

  logger.forBot().info(`Got/Created agent user with ID: ${agentUser.id}`)

  // Create the message in Botpress HITL conversation
  await client.createMessage({
    tags: {},
    type: 'text',
    userId: agentUser.id,
    conversationId: hitlConv.id,
    payload: { text },
  })

  logger.forBot().info('Successfully created agent message in Botpress')
}

async function findHitlConversation(client: bp.Client, externalUserId: string, logger: bp.Logger) {
  const { conversations } = await client.listConversations({
    tags: { id: externalUserId },
  })
  const hitlConv = conversations.find((c) => c.channel === 'hitl' && c.tags?.userId)
  if (!hitlConv) {
    logger.forBot().error(`No HITL conversation found for user ${externalUserId}`)
  }
  return hitlConv
}
