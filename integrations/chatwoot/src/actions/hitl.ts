import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import {
  searchContactByEmail,
  createContact,
  updateContact,
  createConversation,
  resolveConversation,
  getPreviousAgentId,
  assignConversation,
  sendMessage,
  getActiveConversation,
} from '../client'

export const getAccountId = async (client: bp.Client, ctx: bp.Context) => {
  const { state } = await client.getState({
    type: 'integration',
    name: 'integration',
    id: ctx.integrationId,
  })
  return state.payload.accountId
}

export const createUser: bp.IntegrationProps['actions']['createUser'] = async ({ ctx, client, input, logger }) => {
  const { name: inputName, email: rawEmail } = input

  if (!rawEmail) {
    throw new RuntimeError('Email is required for HITL')
  }

  const email = rawEmail.trim().toLowerCase()
  const name = inputName && inputName !== 'Unknown User' ? inputName : email.split('@')[0] || 'Unknown'

  const accountId = await getAccountId(client, ctx)

  const { user: botpressUser } = await client.getOrCreateUser({
    name,
    tags: { email },
  })

  let chatwootContactId: string
  const searchResult = await searchContactByEmail(ctx, accountId, email)

  const existingContact = searchResult.payload?.[0]
  if (existingContact) {
    chatwootContactId = existingContact.id.toString()
    logger.forBot().info(`Found Chatwoot contact: ${chatwootContactId}`)
  } else {
    const newContact = await createContact(ctx, accountId, email, name)
    chatwootContactId = newContact.payload.contact.id.toString()
    logger.forBot().info(`Created Chatwoot contact: ${chatwootContactId}`)
  }

  try {
    await updateContact(ctx, accountId, chatwootContactId, name)
    logger.forBot().info(`Updated Chatwoot contact name to: ${name}`)
  } catch (error) {
    logger.forBot().warn(`Failed to update contact name: ${error}`)
  }

  await client.setState({
    id: botpressUser.id,
    type: 'user',
    name: 'userInfo',
    payload: { email, chatwootContactId },
  })

  return { userId: botpressUser.id }
}

export const startHitl: bp.IntegrationProps['actions']['startHitl'] = async ({ ctx, client, input, logger }) => {
  const { userId, title, description = 'HITL started' } = input

  const userState = await client.getState({ id: userId, name: 'userInfo', type: 'user' })

  if (!userState?.state?.payload?.chatwootContactId) {
    throw new RuntimeError('Call createUser first')
  }

  const { chatwootContactId, email } = userState.state.payload
  const accountId = await getAccountId(client, ctx)

  if (title && email) {
    let extractedName = title.replace(email, '').trim()
    const nameObj = JSON.parse(extractedName)
    extractedName = `${nameObj.first || ''} ${nameObj.last || ''}`.trim()

    if (extractedName && extractedName !== 'Unknown User') {
      try {
        await updateContact(ctx, accountId, chatwootContactId, extractedName)
        logger.forBot().info(`Updated contact name from title: ${extractedName}`)
      } catch (error) {
        logger.forBot().warn(`Failed to update contact name from title: ${error}`)
      }
    }
  }

  const activeConversation = await getActiveConversation(ctx, accountId, chatwootContactId)

  let chatwootConvId: string

  if (activeConversation) {
    chatwootConvId = activeConversation.id.toString()
    logger.forBot().info(`Reusing existing conversation: ${chatwootConvId}`)
  } else {
    const chatwootConv = await createConversation(ctx, accountId, chatwootContactId)
    chatwootConvId = chatwootConv.id.toString()
    logger.forBot().info(`Created new conversation: ${chatwootConvId}`)
  }

  if (description) {
    await sendMessage(ctx, accountId, chatwootConvId, description)
  }

  try {
    const previousAgentId = await getPreviousAgentId(ctx, accountId, chatwootContactId)
    if (previousAgentId) {
      await assignConversation(ctx, accountId, chatwootConvId, previousAgentId.toString())
      logger.forBot().info(`Assigned to previous agent: ${previousAgentId}`)
    }
  } catch (error) {
    logger.forBot().warn(`Failed to assign to previous agent: ${error}`)
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: { id: chatwootConvId, odId: userId },
  })

  await client.setState({
    id: conversation.id,
    type: 'conversation',
    name: 'chatwootContact',
    payload: { chatwootContactId },
  })

  await client.createEvent({
    type: 'hitlStarted',
    conversationId: conversation.id,
    payload: { conversationId: conversation.id, userId, title: title ?? 'HITL', description },
  })

  logger.forBot().info(`HITL started: ${conversation.id} → Chatwoot ${chatwootConvId}`)
  return { conversationId: conversation.id }
}

export const stopHitl: bp.IntegrationProps['actions']['stopHitl'] = async ({ ctx, client, input }) => {
  const { conversationId } = input

  try {
    const { conversation } = await client.getConversation({ id: conversationId })
    const chatwootConvId = conversation.tags.id

    if (!chatwootConvId) {
      return { success: false, message: 'No Chatwoot conversation ID' }
    }

    const accountId = await getAccountId(client, ctx)
    await resolveConversation(ctx, accountId, chatwootConvId)

    await client.createEvent({
      type: 'hitlStopped',
      payload: { conversationId },
    })

    return { success: true, message: 'HITL stopped' }
  } catch (error) {
    return { success: false, message: String(error) }
  }
}
