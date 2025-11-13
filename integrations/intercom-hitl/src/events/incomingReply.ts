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

  // Extracting the image URLs from the HTML body
  const imageUrls: string[] = []
  const htmlWithoutImages = htmlBody.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, (_match: string, url: string) => {
    imageUrls.push(url)
    return ''
  })

  const replyText = htmlToFormattedText(htmlWithoutImages)

  logger.forBot().info('Processing conversation.admin.replied event', {
    conversationId,
    adminId,
    imagesFound: imageUrls.length,
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

  if (replyText && replyText.trim()) {
    await client.createMessage({
      conversationId: conversation.id,
      tags: {},
      type: 'text',
      payload: {
        text: replyText,
      },
      userId: adminUser.id,
    })
  }

  // Send images separately
  for (const imageUrl of imageUrls) {
    await client.createMessage({
      conversationId: conversation.id,
      tags: {},
      type: 'image',
      payload: { imageUrl },
      userId: adminUser.id,
    })
    logger.forBot().info('Sent image', { url: imageUrl })
  }

  // Send rest
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
    replyText,
  })
}
