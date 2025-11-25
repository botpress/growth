import * as bp from '.botpress'
import { adminRepliedEventSchema } from 'src/definitions/intercomEvents'
import { htmlToText } from 'html-to-text'

// Helper function to strip HTML tags and convert to plain text
const htmlToFormattedText = (html: string): string => {
  return htmlToText(html, {
    wordwrap: false,
    preserveNewlines: true,
  })
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

  // Split HTML into ordered content blocks
  const contentBlocks: Array<{ type: 'text'; content: string } | { type: 'image'; url: string }> = []
  const imgTagRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi

  let lastIndex = 0
  let match

  while ((match = imgTagRegex.exec(htmlBody)) !== null) {
    const textBefore = htmlBody.slice(lastIndex, match.index)
    if (textBefore.trim()) {
      contentBlocks.push({ type: 'text', content: htmlToFormattedText(textBefore) })
    }

    const imageUrl = match[1]
    if (imageUrl) {
      contentBlocks.push({ type: 'image', url: imageUrl })
    }
    lastIndex = match.index + match[0].length
  }

  const remainingText = htmlBody.slice(lastIndex)
  if (remainingText.trim()) {
    contentBlocks.push({ type: 'text', content: htmlToFormattedText(remainingText) })
  }

  logger.forBot().info('Processing conversation.admin.replied event', {
    conversationId,
    adminId,
    contentBlocksCount: contentBlocks.length,
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

  // Send in order
  for (const block of contentBlocks) {
    if (block.type === 'text' && block.content.trim()) {
      await client.createMessage({
        conversationId: conversation.id,
        tags: {},
        type: 'text',
        payload: { text: block.content },
        userId: adminUser.id,
      })
    } else if (block.type === 'image') {
      await client.createMessage({
        conversationId: conversation.id,
        tags: {},
        type: 'image',
        payload: { imageUrl: block.url },
        userId: adminUser.id,
      })
    }
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
    contentBlocksCount: contentBlocks.length,
  })
}
