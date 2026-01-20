import { RuntimeError } from '@botpress/client'
import * as bp from '.botpress'
import { getAccessToken, WECHAT_API_BASE } from './wechat-api'

export type MessageHandlerProps<T extends keyof bp.MessageProps['channel']> = bp.MessageProps['channel'][T]

// Upload media to WeChat (returns media_id) 
// for image and video messages
async function uploadMedia(
  accessToken: string,
  mediaUrl: string,
  mediaType: 'image' | 'voice' | 'video' | 'thumb'
): Promise<string> {
  const mediaResponse = await fetch(mediaUrl)
  if (!mediaResponse.ok) {
    throw new RuntimeError(`Failed to download media from URL: ${mediaUrl}`)
  }

  const mediaBuffer = await mediaResponse.arrayBuffer()
  const mediaBlob = new Blob([mediaBuffer])

  const formData = new FormData()
  formData.append('media', mediaBlob, 'media')

  const uploadUrl = `${WECHAT_API_BASE}/media/upload?access_token=${accessToken}&type=${mediaType}`
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  })

  const uploadData = (await uploadResponse.json()) as { media_id?: string; errcode?: number; errmsg?: string }

  if (uploadData.errcode) {
    throw new RuntimeError(`Failed to upload media to WeChat: ${uploadData.errmsg}`)
  }

  if (!uploadData.media_id) {
    throw new RuntimeError('Failed to upload media to WeChat: missing media_id')
  }

  return uploadData.media_id
}

// Send message to WeChat user, with no 5 seconds limit
async function sendWeChatMessage(accessToken: string, toUser: string, message: object): Promise<void> {
  const url = `${WECHAT_API_BASE}/message/custom/send?access_token=${accessToken}`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      touser: toUser,
      ...message,
    }),
  })
  
  const data = await response.json() as { errcode?: number; errmsg?: string }
  
  if (data.errcode && data.errcode !== 0) {
    throw new RuntimeError(`Failed to send WeChat message: ${data.errmsg} (code: ${data.errcode})`)
  }
}

// Get chat ID (WeChat user OpenID) from conversation tags
function getChatId(conversation: { tags: Record<string, string> }): string {
  const chatId = conversation.tags?.id || conversation.tags?.chatId
  if (!chatId) {
    throw new RuntimeError('Conversation does not have a WeChat chat ID')
  }
  return chatId
}

// Acknowledge message - ack is a function that takes tags
async function ackMessage(ack: (props: { tags: { id: string } }) => Promise<void>, messageId: string): Promise<void> {
  await ack({ tags: { id: messageId } })
}






export const handleTextMessage = async (props: MessageHandlerProps<'text'>) => {
  const { payload, ctx, conversation, ack } = props
  const { text } = payload
  const chatId = getChatId(conversation)
  try {
    const accessToken = await getAccessToken(ctx.configuration.appId, ctx.configuration.appSecret)
    
    await sendWeChatMessage(accessToken, chatId, {
      msgtype: 'text',
      text: { content: text },
    })
    
    await ackMessage(ack, `wechat-${Date.now()}`)
  } catch (error) {
    throw error
  }
}

// ============== FOR FUTURE USE ==============
// export const handleImageMessage = async ({ payload, ctx, conversation, ack, logger }: MessageHandlerProps<'image'>) => {
//   const chatId = getChatId(conversation)
//   logger.forBot().debug(`Sending image message to WeChat user ${chatId}:`, payload.imageUrl)
  
//   try {
//     const accessToken = await getAccessToken(ctx.configuration.appId, ctx.configuration.appSecret)
    
//     // Upload the image to WeChat and get media_id
//     logger.forBot().debug(`Uploading image to WeChat...`)
//     const mediaId = await uploadMedia(accessToken, payload.imageUrl, 'image')
//     logger.forBot().debug(`Image uploaded, media_id: ${mediaId}`)
    
//     // Send image message with media_id
//     await sendWeChatMessage(accessToken, chatId, {
//       msgtype: 'image',
//       image: { media_id: mediaId },
//     })
    
//     await ackMessage(ack, `wechat-${Date.now()}`)
//     logger.forBot().info(`Successfully sent image message to WeChat user ${chatId}`)
//   } catch (error) {
//     logger.forBot().error(`Failed to send image message to WeChat user ${chatId}:`, error)
//     throw error
//   }
// }
  // ============== END FOR FUTURE USE ==============

export const handleImageMessage = async ({ payload, ctx, conversation, ack }: MessageHandlerProps<'image'>) => { // handle image messages with tencent cloud url
  const chatId = getChatId(conversation)
  try {
    const accessToken = await getAccessToken(ctx.configuration.appId, ctx.configuration.appSecret)
    
    const mediaId = await uploadMedia(accessToken, payload.imageUrl, 'image')
    await sendWeChatMessage(accessToken, chatId, {
      msgtype: 'image',
      image: { media_id: mediaId },
    })
    
    await ackMessage(ack, `wechat-${Date.now()}`)
  } catch (error) {
    throw error
  }
}

export const handleVideoMessage = async ({ payload, ctx, conversation, ack }: MessageHandlerProps<'video'>) => { // not implemented yet
  const chatId = getChatId(conversation)
  try {
    const accessToken = await getAccessToken(ctx.configuration.appId, ctx.configuration.appSecret)
    
    // Send video URL as text (simplified - no media upload)
    await sendWeChatMessage(accessToken, chatId, {
      msgtype: 'text',
      text: { content: `[Video] ${payload.videoUrl}` },
    })
    
    await ackMessage(ack, `wechat-${Date.now()}`)
  } catch (error) {
    throw error
  }
}
