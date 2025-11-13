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

// Extract image URLs from HTML and remove img tags
const extractImages = (html: string): { html: string; imageUrls: string[] } => {
  const imageUrls: string[] = []
  const htmlWithoutImages = html.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, (_match, url) => {
    imageUrls.push(url)
    return ''
  })
  return { html: htmlWithoutImages, imageUrls }
}

// Extract video URLs from HTML and remove video tags
const extractVideos = (html: string): { html: string; videoUrls: string[] } => {
  const videoUrls: string[] = []
  const htmlWithoutVideos = html.replace(
    /<video[^>]*>.*?<source[^>]+src=["']([^"']+)["'][^>]*>.*?<\/video>/gi,
    (_match, url) => {
      videoUrls.push(url)
      return ''
    }
  )
  return { html: htmlWithoutVideos, videoUrls }
}

// Helper function to determine if a URL or content type is an image
const isImageType = (contentType?: string, url?: string): boolean => {
  if (contentType) {
    return contentType.startsWith('image/')
  }
  if (url) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico']
    return imageExtensions.some((ext) => url.toLowerCase().includes(ext))
  }
  return false
}

// Helper function to determine if a URL or content type is a video
const isVideoType = (contentType?: string, url?: string): boolean => {
  if (contentType) {
    return contentType.startsWith('video/')
  }
  if (url) {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv', '.wmv']
    return videoExtensions.some((ext) => url.toLowerCase().includes(ext))
  }
  return false
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

  // Extract images and videos from HTML
  const { html: htmlWithoutImages, imageUrls } = extractImages(htmlBody)
  const { html: htmlWithoutMedia, videoUrls } = extractVideos(htmlWithoutImages)

  // Convert cleaned HTML to text
  const replyText = htmlToFormattedText(htmlWithoutMedia)

  logger.forBot().info('Processing conversation.admin.replied event', {
    conversationId,
    adminId,
    imagesFound: imageUrls.length,
    videosFound: videoUrls.length,
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

  // Send text message first (if there's text)
  if (replyText && replyText.trim()) {
    try {
      await client.createMessage({
        conversationId: conversation.id,
        tags: {},
        type: 'text',
        payload: {
          text: replyText,
        },
        userId: adminUser.id,
      })
      logger.forBot().info('Sent text message')
    } catch (error) {
      logger.forBot().error('Failed to send text', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  // Send images
  for (const imageUrl of imageUrls) {
    try {
      await client.createMessage({
        conversationId: conversation.id,
        tags: {},
        type: 'image',
        payload: {
          imageUrl,
        },
        userId: adminUser.id,
      })
      logger.forBot().info('Sent image', { url: imageUrl })
    } catch (error) {
      logger.forBot().error('Failed to send image', {
        error: error instanceof Error ? error.message : String(error),
        imageUrl,
      })
    }
  }

  // Send videos
  for (const videoUrl of videoUrls) {
    try {
      await client.createMessage({
        conversationId: conversation.id,
        tags: {},
        type: 'video',
        payload: {
          videoUrl,
        },
        userId: adminUser.id,
      })
      logger.forBot().info('Sent video', { url: videoUrl })
    } catch (error) {
      logger.forBot().error('Failed to send video', {
        error: error instanceof Error ? error.message : String(error),
        videoUrl,
      })
    }
  }

  // Send each attachment as a separate message with appropriate type
  for (const attachment of attachments) {
    const attachmentUrl = attachment.url
    const contentType = attachment.content_type
    const name = attachment.name || ''

    if (!attachmentUrl) {
      logger.forBot().warn('Attachment without URL found', { attachment })
      continue
    }

    try {
      if (isImageType(contentType, attachmentUrl)) {
        await client.createMessage({
          conversationId: conversation.id,
          tags: {},
          type: 'image',
          payload: {
            imageUrl: attachmentUrl,
          },
          userId: adminUser.id,
        })
        logger.forBot().info('Sent image attachment', { url: attachmentUrl })
      } else if (isVideoType(contentType, attachmentUrl)) {
        await client.createMessage({
          conversationId: conversation.id,
          tags: {},
          type: 'video',
          payload: {
            videoUrl: attachmentUrl,
          },
          userId: adminUser.id,
        })
        logger.forBot().info('Sent video attachment', { url: attachmentUrl })
      } else {
        // Send as file for other types
        await client.createMessage({
          conversationId: conversation.id,
          tags: {},
          type: 'file',
          payload: {
            fileUrl: attachmentUrl,
            title: name,
          },
          userId: adminUser.id,
        })
        logger.forBot().info('Sent file attachment', { url: attachmentUrl, name })
      }
    } catch (error) {
      logger.forBot().error('Failed to send attachment', {
        error: error instanceof Error ? error.message : String(error),
        attachmentUrl,
        contentType,
      })
    }
  }

  logger.forBot().info('Admin reply added to conversation', {
    conversationId: conversation.id,
    adminId,
    adminUserId: adminUser?.id,
    textSent: replyText ? 1 : 0,
    imagesSent: imageUrls.length,
    videosSent: videoUrls.length,
    attachmentsSent: attachments.length,
  })
}
