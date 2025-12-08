import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import { searchContactByEmail, createContact, createConversation, resolveConversation } from '../client'

export const getAccountId = async (client: bp.Client, ctx: bp.Context) => {
  const { state } = await client.getState({
    type: 'integration',
    name: 'integration',
    id: ctx.integrationId,
  })
  return state.payload.accountId
}

export const createUser: bp.IntegrationProps['actions']['createUser'] = async ({ ctx, client, input, logger }) => {
  const { name: inputName, email: rawEmail, pictureUrl } = input

  if (!rawEmail) {
    throw new RuntimeError('Email is required for HITL')
  }

  const email = rawEmail.trim().toLowerCase()
  const name = inputName || email.split('@')[0] || 'Unknown'
  const accountId = await getAccountId(client, ctx)

  const { user: botpressUser } = await client.getOrCreateUser({
    name,
    pictureUrl,
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

  const { chatwootContactId } = userState.state.payload
  const accountId = await getAccountId(client, ctx)

  const chatwootConv = await createConversation(ctx, accountId, chatwootContactId)
  const chatwootConvId = chatwootConv.id.toString()

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
    const chatwootConvId = conversation.tags.id as string

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
