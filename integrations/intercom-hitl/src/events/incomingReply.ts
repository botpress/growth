import * as bp from '.botpress'
import { adminRepliedEventSchema } from 'src/definitions/intercomEvents'
import TurndownService from 'turndown'

// HTML to Markdown converter tool
const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
})

const htmlToMarkdown = (html: string): string => {
  if (!html?.trim()) return ''
  return turndownService.turndown(html).trim()
}

export const handleIncomingReply = async (
  payload: typeof adminRepliedEventSchema._type,
  logger: bp.Logger,
  client: bp.Client
): Promise<void> => {
  const conversationId = payload.data.item.id
  const conversationParts = (payload.data.item.conversation_parts as { conversation_parts: any[] }).conversation_parts
  const latestPart = conversationParts[conversationParts.length - 1]

  if (!latestPart) {
    logger.forBot().warn('No conversation part found in admin replied event', { conversationId })
    return
  }

  const adminId = latestPart.author.id
  const htmlBody = latestPart.body || ''
  const attachments = latestPart.attachments || []

  // Convert HTML to Markdown
  const markdownContent = htmlToMarkdown(htmlBody)

  logger.forBot().info('Processing conversation.admin.replied event', {
    conversationId,
    adminId,
    hasContent: !!markdownContent,
    attachmentsCount: attachments.length,
  })

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: conversationId,
    },
  })

  let adminUser
  if (adminId) {
    const result = await client.getOrCreateUser({
      tags: {
        intercomAdminId: String(adminId),
      },
    })
    adminUser = result.user
  }

  if (!adminUser) {
    logger.forBot().warn('No admin user found, skipping message creation')
    return
  }

  if (markdownContent) {
    await client.createMessage({
      conversationId: conversation.id,
      tags: {},
      type: 'text',
      payload: { text: markdownContent },
      userId: adminUser.id,
    })
  }

  // Send attachments
  for (const attachment of attachments) {
    const url = attachment.url
    const contentType = attachment.content_type || ''
    const name = attachment.name || ''

    if (!url) continue

    if (contentType.startsWith('video/') || contentType === 'application/force-download') {
      await client.createMessage({
        conversationId: conversation.id,
        tags: {},
        type: 'video',
        payload: { videoUrl: url },
        userId: adminUser.id,
      })
      logger.forBot().info('Sent video attachment', { url, name })
    } else if (contentType.startsWith('image/')) {
      await client.createMessage({
        conversationId: conversation.id,
        tags: {},
        type: 'image',
        payload: { imageUrl: url },
        userId: adminUser.id,
      })
      logger.forBot().info('Sent image attachment', { url, name })
    } else {
      await client.createMessage({
        conversationId: conversation.id,
        tags: {},
        type: 'file',
        payload: { fileUrl: url, title: name },
        userId: adminUser.id,
      })
      logger.forBot().info('Sent file attachment', { url, name })
    }
  }

  logger.forBot().info('Admin reply added to conversation', {
    conversationId: conversation.id,
    adminId,
    adminUserId: adminUser?.id,
    markdownContent,
  })
}
