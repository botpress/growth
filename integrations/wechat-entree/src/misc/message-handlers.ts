import { RuntimeError } from '@botpress/client'
import * as bp from '.botpress'

export type MessageHandlerProps<T extends keyof bp.MessageProps['channel']> = bp.MessageProps['channel'][T]

// WeChat API base URL
const WECHAT_API_BASE = 'https://api.weixin.qq.com/cgi-bin'

// Get access token from WeChat API
async function getAccessToken(appId: string, appSecret: string): Promise<string> {
  const url = `${WECHAT_API_BASE}/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`
  const response = await fetch(url)
  const data = await response.json() as { access_token?: string; errcode?: number; errmsg?: string }
  
  if (data.errcode) {
    throw new RuntimeError(`Failed to get WeChat access token: ${data.errmsg}`)
  }
  
  return data.access_token!
}

// ============== FOR FUTURE USE ==============
// Upload media to WeChat (returns media_id)
// async function uploadMedia(accessToken: string, mediaUrl: string, mediaType: 'image' | 'voice' | 'video' | 'thumb'): Promise<string> {
//   // First, download the media from the URL
//   const mediaResponse = await fetch(mediaUrl)
//   if (!mediaResponse.ok) {
//     throw new RuntimeError(`Failed to download media from URL: ${mediaUrl}`)
//   }
  
//   const mediaBuffer = await mediaResponse.arrayBuffer()
//   const mediaBlob = new Blob([mediaBuffer])
  
//   // Create form data for WeChat upload
//   const formData = new FormData()
//   formData.append('media', mediaBlob, 'media')
  
//   // Upload to WeChat
//   const uploadUrl = `${WECHAT_API_BASE}/media/upload?access_token=${accessToken}&type=${mediaType}`
//   const uploadResponse = await fetch(uploadUrl, {
//     method: 'POST',
//     body: formData,
//   })
  
//   const uploadData = await uploadResponse.json() as { media_id?: string; errcode?: number; errmsg?: string }
  
//   if (uploadData.errcode) {
//     throw new RuntimeError(`Failed to upload media to WeChat: ${uploadData.errmsg}`)
//   }
  
//   return uploadData.media_id!
// }
// ============== END FOR FUTURE USE ==============

// Send customer service message via WeChat API
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
  const { payload, ctx, conversation, ack, logger } = props
  const { text } = payload
  
  const chatId = getChatId(conversation)
  logger.forBot().debug(`Sending text message to WeChat user ${chatId}:`, text)
  
  try {
    const accessToken = await getAccessToken(ctx.configuration.appId, ctx.configuration.appSecret)
    
    await sendWeChatMessage(accessToken, chatId, {
      msgtype: 'text',
      text: { content: text },
    })
    
    await ackMessage(ack, `wechat-${Date.now()}`)
    logger.forBot().info(`Successfully sent text message to WeChat user ${chatId}`)
  } catch (error) {
    logger.forBot().error(`Failed to send text message to WeChat user ${chatId}:`, error)
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

export const handleImageMessage = async ({ payload, ctx, conversation, ack, logger }: MessageHandlerProps<'image'>) => {
  const chatId = getChatId(conversation)
  logger.forBot().debug(`Sending image message to WeChat user ${chatId}:`, payload.imageUrl)
  
  try {
    const accessToken = await getAccessToken(ctx.configuration.appId, ctx.configuration.appSecret)
    
    // Send image URL as text (simplified - no media upload)
    await sendWeChatMessage(accessToken, chatId, {
      msgtype: 'text',
      text: { content: `[Image] ${payload.imageUrl}` },
    })
    
    await ackMessage(ack, `wechat-${Date.now()}`)
    logger.forBot().info(`Successfully sent image URL to WeChat user ${chatId}`)
  } catch (error) {
    logger.forBot().error(`Failed to send image message to WeChat user ${chatId}:`, error)
    throw error
  }
}

// ============== FOR FUTURE USE ==============
// export const handleAudioMessage = async ({ payload, ctx, conversation, ack, logger }: MessageHandlerProps<'audio'>) => {
//   const chatId = getChatId(conversation)
//   logger.forBot().debug(`Sending audio message to WeChat user ${chatId}:`, payload.audioUrl)
  
//   try {
//     const accessToken = await getAccessToken(ctx.configuration.appId, ctx.configuration.appSecret)
    
//     // Upload the audio to WeChat and get media_id
//     logger.forBot().debug(`Uploading audio to WeChat...`)
//     const mediaId = await uploadMedia(accessToken, payload.audioUrl, 'voice')
//     logger.forBot().debug(`Audio uploaded, media_id: ${mediaId}`)
    
//     // Send voice message with media_id
//     await sendWeChatMessage(accessToken, chatId, {
//       msgtype: 'voice',
//       voice: { media_id: mediaId },
//     })
    
//     await ackMessage(ack, `wechat-${Date.now()}`)
//     logger.forBot().info(`Successfully sent audio message to WeChat user ${chatId}`)
//   } catch (error) {
//     logger.forBot().error(`Failed to send audio message to WeChat user ${chatId}:`, error)
//     throw error
//   }
// }
// =============================================

export const handleAudioMessage = async ({ payload, ctx, conversation, ack, logger }: MessageHandlerProps<'audio'>) => {
  const chatId = getChatId(conversation)
  logger.forBot().debug(`Sending audio message to WeChat user ${chatId}:`, payload.audioUrl)
  
  try {
    const accessToken = await getAccessToken(ctx.configuration.appId, ctx.configuration.appSecret)
    
    // Send audio URL as text (simplified - no media upload)
    await sendWeChatMessage(accessToken, chatId, {
      msgtype: 'text',
      text: { content: `[Audio] ${payload.audioUrl}` },
    })
    
    await ackMessage(ack, `wechat-${Date.now()}`)
    logger.forBot().info(`Successfully sent audio URL to WeChat user ${chatId}`)
  } catch (error) {
    logger.forBot().error(`Failed to send audio message to WeChat user ${chatId}:`, error)
    throw error
  }
}

// ============== FOR FUTURE USE ==============
// export const handleVideoMessage = async ({ payload, ctx, conversation, ack, logger }: MessageHandlerProps<'video'>) => {
//   const chatId = getChatId(conversation)
//   logger.forBot().debug(`Sending video message to WeChat user ${chatId}:`, payload.videoUrl)
  
//   try {
//     const accessToken = await getAccessToken(ctx.configuration.appId, ctx.configuration.appSecret)
    
//     // Upload the video to WeChat and get media_id
//     logger.forBot().debug(`Uploading video to WeChat...`)
//     const mediaId = await uploadMedia(accessToken, payload.videoUrl, 'video')
//     logger.forBot().debug(`Video uploaded, media_id: ${mediaId}`)
    
//     // Send video message with media_id
//     await sendWeChatMessage(accessToken, chatId, {
//       msgtype: 'video',
//       video: { 
//         media_id: mediaId,
//         title: payload.title || 'Video',
//         description: payload.title || '',
//       },
//     })
    
//     await ackMessage(ack, `wechat-${Date.now()}`)
//     logger.forBot().info(`Successfully sent video message to WeChat user ${chatId}`)
//   } catch (error) {
//     logger.forBot().error(`Failed to send video message to WeChat user ${chatId}:`, error)
//     throw error
//   }
// }
// =============================================

export const handleVideoMessage = async ({ payload, ctx, conversation, ack, logger }: MessageHandlerProps<'video'>) => {
  const chatId = getChatId(conversation)
  logger.forBot().debug(`Sending video message to WeChat user ${chatId}:`, payload.videoUrl)
  
  try {
    const accessToken = await getAccessToken(ctx.configuration.appId, ctx.configuration.appSecret)
    
    // Send video URL as text (simplified - no media upload)
    await sendWeChatMessage(accessToken, chatId, {
      msgtype: 'text',
      text: { content: `[Video] ${payload.videoUrl}` },
    })
    
    await ackMessage(ack, `wechat-${Date.now()}`)
    logger.forBot().info(`Successfully sent video URL to WeChat user ${chatId}`)
  } catch (error) {
    logger.forBot().error(`Failed to send video message to WeChat user ${chatId}:`, error)
    throw error
  }
}

export const handleFileMessage = async ({ payload, ctx, conversation, ack, logger }: MessageHandlerProps<'file'>) => {
  const chatId = getChatId(conversation)
  logger.forBot().debug(`Sending file message to WeChat user ${chatId}:`, payload.fileUrl)
  
  try {
    const accessToken = await getAccessToken(ctx.configuration.appId, ctx.configuration.appSecret)
    
    // WeChat doesn't support generic file sending via customer service, send as text
    await sendWeChatMessage(accessToken, chatId, {
      msgtype: 'text',
      text: { content: `[File] ${payload.fileUrl}` },
    })
    
    await ackMessage(ack, `wechat-${Date.now()}`)
  } catch (error) {
    logger.forBot().error(`Failed to send file message to WeChat user ${chatId}:`, error)
    throw error
  }
}

export const handleLocationMessage = async ({
  payload,
  ctx,
  conversation,
  ack,
  logger,
}: MessageHandlerProps<'location'>) => {
  const chatId = getChatId(conversation)
  logger.forBot().debug(`Sending location message to WeChat user ${chatId}:`, {
    latitude: payload.latitude,
    longitude: payload.longitude,
  })
  
  try {
    const accessToken = await getAccessToken(ctx.configuration.appId, ctx.configuration.appSecret)
    
    // Send location as text with coordinates
    await sendWeChatMessage(accessToken, chatId, {
      msgtype: 'text',
      text: { content: `[Location] ${payload.latitude}, ${payload.longitude}` },
    })
    
    await ackMessage(ack, `wechat-${Date.now()}`)
  } catch (error) {
    logger.forBot().error(`Failed to send location message to WeChat user ${chatId}:`, error)
    throw error
  }
}

export const handleCardMessage = async ({ payload, ctx, conversation, ack, logger }: MessageHandlerProps<'card'>) => {
  const chatId = getChatId(conversation)
  logger.forBot().debug(`Sending card message to WeChat user ${chatId}:`, payload)
  
  try {
    const accessToken = await getAccessToken(ctx.configuration.appId, ctx.configuration.appSecret)
    
    // Send card as a news article
    await sendWeChatMessage(accessToken, chatId, {
      msgtype: 'news',
      news: {
        articles: [{
          title: payload.title,
          description: payload.subtitle || '',
          url: payload.actions?.[0]?.value || '',
          picurl: payload.imageUrl || '',
        }],
      },
    })
    
    await ackMessage(ack, `wechat-${Date.now()}`)
  } catch (error) {
    logger.forBot().error(`Failed to send card message to WeChat user ${chatId}:`, error)
    throw error
  }
}

export const handleCarouselMessage = async ({
  payload,
  ctx,
  conversation,
  ack,
  logger,
}: MessageHandlerProps<'carousel'>) => {
  const chatId = getChatId(conversation)
  logger.forBot().debug(`Sending carousel message to WeChat user ${chatId}:`, payload)
  
  try {
    const accessToken = await getAccessToken(ctx.configuration.appId, ctx.configuration.appSecret)
    
    // Send carousel as multiple news articles (max 8 for WeChat)
    const articles = payload.items.slice(0, 8).map(item => ({
      title: item.title,
      description: item.subtitle || '',
      url: item.actions?.[0]?.value || '',
      picurl: item.imageUrl || '',
    }))
    
    await sendWeChatMessage(accessToken, chatId, {
      msgtype: 'news',
      news: { articles },
    })
    
    await ackMessage(ack, `wechat-${Date.now()}`)
  } catch (error) {
    logger.forBot().error(`Failed to send carousel message to WeChat user ${chatId}:`, error)
    throw error
  }
}

export const handleDropdownMessage = async ({
  payload,
  ctx,
  conversation,
  ack,
  logger,
}: MessageHandlerProps<'dropdown'>) => {
  const chatId = getChatId(conversation)
  logger.forBot().debug(`Sending dropdown message to WeChat user ${chatId}:`, payload)
  
  try {
    const accessToken = await getAccessToken(ctx.configuration.appId, ctx.configuration.appSecret)
    
    // WeChat doesn't support interactive dropdowns, send as text with options
    const optionsText = payload.options.map((opt, i) => `${i + 1}. ${opt.label}`).join('\n')
    await sendWeChatMessage(accessToken, chatId, {
      msgtype: 'text',
      text: { content: `${payload.text}\n\n${optionsText}` },
    })
    
    await ackMessage(ack, `wechat-${Date.now()}`)
  } catch (error) {
    logger.forBot().error(`Failed to send dropdown message to WeChat user ${chatId}:`, error)
    throw error
  }
}

export const handleChoiceMessage = async ({
  payload,
  ctx,
  conversation,
  ack,
  logger,
}: MessageHandlerProps<'choice'>) => {
  const chatId = getChatId(conversation)
  logger.forBot().debug(`Sending choice message to WeChat user ${chatId}:`, payload)
  
  try {
    const accessToken = await getAccessToken(ctx.configuration.appId, ctx.configuration.appSecret)
    
    // WeChat doesn't support interactive buttons, send as text with options
    const optionsText = payload.options.map((opt, i) => `${i + 1}. ${opt.label}`).join('\n')
    await sendWeChatMessage(accessToken, chatId, {
      msgtype: 'text',
      text: { content: `${payload.text}\n\n${optionsText}` },
    })
    
    await ackMessage(ack, `wechat-${Date.now()}`)
  } catch (error) {
    logger.forBot().error(`Failed to send choice message to WeChat user ${chatId}:`, error)
    throw error
  }
}

export const handleBlocMessage = async ({
  client,
  payload,
  ctx,
  conversation,
  ...rest
}: MessageHandlerProps<'bloc'>) => {
  for (const item of payload.items) {
    switch (item.type) {
      case 'text':
        await handleTextMessage({ ...rest, type: item.type, client, payload: item.payload, ctx, conversation })
        break
      case 'image':
        await handleImageMessage({ ...rest, type: item.type, client, payload: item.payload, ctx, conversation })
        break
      case 'audio':
        await handleAudioMessage({ ...rest, type: item.type, client, payload: item.payload, ctx, conversation })
        break
      case 'video':
        await handleVideoMessage({ ...rest, type: item.type, client, payload: item.payload, ctx, conversation })
        break
      case 'file':
        await handleFileMessage({ ...rest, type: item.type, client, payload: item.payload, ctx, conversation })
        break
      case 'location':
        await handleLocationMessage({
          ...rest,
          type: item.type,
          client,
          payload: item.payload,
          ctx,
          conversation,
        })
        break
      default:
        // @ts-ignore
        throw new RuntimeError(`Unsupported message type: ${item?.type ?? 'Unknown'}`)
    }
  }
}
