import * as bp from '.botpress'
import { ChatwootWebhookPayload } from '../misc/types'

export const handler: bp.IntegrationProps['handler'] = async ({ req, client, logger }) => {
  const payload: ChatwootWebhookPayload = JSON.parse(req.body || '{}')

  if (payload.event !== 'message_created') return
  if (payload.sender?.type !== 'user') return

  const chatwootConvId = payload.conversation?.id?.toString()
  if (!chatwootConvId) return

  const { conversations } = await client.listConversations({
    tags: { id: chatwootConvId },
  })

  if (!conversations.length) {
    logger.forBot().debug(`No HITL conv for Chatwoot ${chatwootConvId}`)
    return
  }

  const hitlConv = conversations[0]
  if (!hitlConv) return

  const agentId = payload.sender?.id?.toString()
  const { user: agentUser } = await client.getOrCreateUser({
    tags: { chatwootAgentId: agentId || 'unknown' },
    name: payload.sender?.name || 'Agent',
  })

  if (payload.content?.trim()) {
    await client.createMessage({
      conversationId: hitlConv.id,
      userId: agentUser.id,
      type: 'text',
      payload: { text: payload.content },
      tags: { id: payload.id?.toString() || '', conversationId: chatwootConvId },
    })
  }

  if (payload.attachments?.length) {
    for (const attachment of payload.attachments) {
      switch (attachment.file_type) {
        case 'image':
          await client.createMessage({
            conversationId: hitlConv.id,
            userId: agentUser.id,
            type: 'image',
            payload: { imageUrl: attachment.data_url },
            tags: { id: payload.id?.toString() || '', conversationId: chatwootConvId },
          })
          break
        case 'video':
          await client.createMessage({
            conversationId: hitlConv.id,
            userId: agentUser.id,
            type: 'video',
            payload: { videoUrl: attachment.data_url },
            tags: { id: payload.id?.toString() || '', conversationId: chatwootConvId },
          })
          break
        case 'file':
          await client.createMessage({
            conversationId: hitlConv.id,
            userId: agentUser.id,
            type: 'file',
            payload: { fileUrl: attachment.data_url, title: 'File' },
            tags: { id: payload.id?.toString() || '', conversationId: chatwootConvId },
          })
          break
      }
    }
  }
}
