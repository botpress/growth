import {
  handleAudioMessage,
  handleBlocMessage,
  handleCardMessage,
  handleCarouselMessage,
  handleChoiceMessage,
  handleDropdownMessage,
  handleFileMessage,
  handleImageMessage,
  handleLocationMessage,
  handleTextMessage,
  handleVideoMessage,
} from './misc/message-handlers'
import { handleWeChatRequest } from './wechat-handler'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register: async () => {
    // WeChat doesn't require webhook registration - it's configured in the WeChat admin console
  },
  unregister: async () => {
    // WeChat doesn't require webhook unregistration
  },
  actions: {},
  channels: {
    channel: {
      messages: {
        text: handleTextMessage,
        image: handleImageMessage,
        audio: handleAudioMessage,
        video: handleVideoMessage,
        file: handleFileMessage,
        location: handleLocationMessage,
        card: handleCardMessage,
        carousel: handleCarouselMessage,
        dropdown: handleDropdownMessage,
        choice: handleChoiceMessage,
        bloc: handleBlocMessage,
      },
    },
  },
  handler: async ({ req, client, ctx, logger }) => {
    // Log the full request for debugging
    logger.forBot().info('=== WeChat Handler Request ===')
    logger.forBot().info('Method:', req.method)
    logger.forBot().info('Path:', req.path)
    logger.forBot().info('Query:', req.query)
    logger.forBot().info('Body:', req.body)
    logger.forBot().info('Headers:', JSON.stringify(req.headers))

    // Extract query parameters - try from req.query first, then from path
    let signature: string | undefined
    let timestamp: string | undefined
    let nonce: string | undefined
    let echostr: string | undefined

    // Try req.query if available (Botpress might pass query params here)
    if (req.query) {
      const query = typeof req.query === 'string' ? new URLSearchParams(req.query) : null
      if (query) {
        signature = query.get('signature') || undefined
        timestamp = query.get('timestamp') || undefined
        nonce = query.get('nonce') || undefined
        echostr = query.get('echostr') || undefined
      }
    }

    // Fallback: try to extract from path if it contains query string
    if (!signature && req.path && req.path.includes('?')) {
      const url = new URL(req.path, 'http://localhost')
      signature = url.searchParams.get('signature') || undefined
      timestamp = url.searchParams.get('timestamp') || undefined
      nonce = url.searchParams.get('nonce') || undefined
      echostr = url.searchParams.get('echostr') || undefined
    }

    // Also check headers for forwarded requests from proxy
    if (!signature && req.headers) {
      signature = req.headers['x-wechat-signature'] || undefined
      timestamp = req.headers['x-wechat-timestamp'] || undefined
      nonce = req.headers['x-wechat-nonce'] || undefined
    }

    logger.forBot().info('=== Extracted Parameters ===')
    logger.forBot().info('signature:', signature)
    logger.forBot().info('timestamp:', timestamp)
    logger.forBot().info('nonce:', nonce)
    logger.forBot().info('echostr:', echostr)
    logger.forBot().info('wechatToken:', ctx.configuration.wechatToken ? '[CONFIGURED]' : '[NOT CONFIGURED]')

    // Create a logger adapter for the WeChat handler
    const wechatLogger = {
      info: (...args: unknown[]) => logger.forBot().info(...args),
      debug: (...args: unknown[]) => logger.forBot().debug(...args),
      error: (...args: unknown[]) => logger.forBot().error(...args),
    }

    // Handle WeChat request with signature verification
    const result = handleWeChatRequest({
      wechatToken: ctx.configuration.wechatToken,
      method: req.method || 'POST',
      signature,
      timestamp,
      nonce,
      echostr,
      body: req.body,
      logger: wechatLogger,
    })

    logger.forBot().info('=== WeChat Handler Result ===')
    logger.forBot().info('Status:', result.status)
    logger.forBot().info('ContentType:', result.contentType)
    logger.forBot().info('Body:', result.body)
    logger.forBot().info('Message:', result.message ? JSON.stringify(result.message) : 'none')

    // If this was a verification request (GET with echostr), return the echostr directly
    if (req.method === 'GET' && echostr) {
      logger.forBot().info('=== RETURNING ECHOSTR DIRECTLY ===')
      logger.forBot().info('echostr from query:', echostr)
      logger.forBot().info('typeof echostr:', typeof echostr)
      
      // Return echostr directly as plain text - simplest possible approach
      return {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
        },
        body: echostr + '|',
      }
    }

    // If we have a parsed message, create it in Botpress
    if (result.message) {
      const wechatMessage = result.message
      const wechatConversationId = wechatMessage.FromUserName
      const wechatUserId = wechatMessage.FromUserName
      const messageId = wechatMessage.MsgId || wechatMessage.CreateTime

      const { conversation } = await client.getOrCreateConversation({
        channel: 'channel',
        tags: {
          id: wechatConversationId,
          fromUserId: wechatUserId,
          fromUserUsername: wechatUserId,
          fromUserName: wechatUserId,
          chatId: wechatConversationId,
        },
        discriminateByTags: ['id'],
      })

      const { user } = await client.getOrCreateUser({
        tags: {
          id: wechatUserId,
        },
        discriminateByTags: ['id'],
      })

      logger.forBot().debug(`Received ${wechatMessage.MsgType} message from user ${wechatUserId}`)

      // Create message based on type
      if (wechatMessage.MsgType === 'text' && wechatMessage.Content) {
        await client.createMessage({
          tags: {
            id: messageId || '',
            chatId: wechatConversationId,
          },
          type: 'text',
          payload: { text: wechatMessage.Content },
          userId: user.id,
          conversationId: conversation.id,
        })
        logger.forBot().info(`Text message created in Botpress: "${wechatMessage.Content}"`)
      } else if (wechatMessage.MsgType === 'image' && wechatMessage.PicUrl) {
        await client.createMessage({
          tags: {
            id: messageId || '',
            chatId: wechatConversationId,
          },
          type: 'image',
          payload: { imageUrl: wechatMessage.PicUrl },
          userId: user.id,
          conversationId: conversation.id,
        })
        logger.forBot().info(`Image message created in Botpress. PicUrl: ${wechatMessage.PicUrl}, MediaId: ${wechatMessage.MediaId}`)
      } else if (wechatMessage.MsgType === 'voice' && wechatMessage.MediaId) {
        // For voice messages, WeChat provides MediaId but not a direct URL
        // We'll create an audio message with a placeholder or fetch it from WeChat API
        await client.createMessage({
          tags: {
            id: messageId || '',
            chatId: wechatConversationId,
          },
          type: 'text',
          payload: { text: `[Voice Message] MediaId: ${wechatMessage.MediaId}${wechatMessage.Recognition ? `\nRecognized: ${wechatMessage.Recognition}` : ''}` },
          userId: user.id,
          conversationId: conversation.id,
        })
        logger.forBot().info(`Voice message created in Botpress. MediaId: ${wechatMessage.MediaId}`)
      } else if (wechatMessage.MsgType === 'video' && wechatMessage.MediaId) {
        // For video messages, similar to voice - MediaId provided
        await client.createMessage({
          tags: {
            id: messageId || '',
            chatId: wechatConversationId,
          },
          type: 'text',
          payload: { text: `[Video Message] MediaId: ${wechatMessage.MediaId}` },
          userId: user.id,
          conversationId: conversation.id,
        })
        logger.forBot().info(`Video message created in Botpress. MediaId: ${wechatMessage.MediaId}`)
      } else if (wechatMessage.MsgType === 'location') {
        await client.createMessage({
          tags: {
            id: messageId || '',
            chatId: wechatConversationId,
          },
          type: 'location',
          payload: { 
            latitude: parseFloat(wechatMessage.Location_X || '0'),
            longitude: parseFloat(wechatMessage.Location_Y || '0'),
            address: wechatMessage.Label,
          },
          userId: user.id,
          conversationId: conversation.id,
        })
        logger.forBot().info(`Location message created in Botpress: ${wechatMessage.Label} (${wechatMessage.Location_X}, ${wechatMessage.Location_Y})`)
      } else if (wechatMessage.MsgType === 'link') {
        await client.createMessage({
          tags: {
            id: messageId || '',
            chatId: wechatConversationId,
          },
          type: 'text',
          payload: { text: `${wechatMessage.Title || ''}\n${wechatMessage.Description || ''}\n${wechatMessage.Url || ''}` },
          userId: user.id,
          conversationId: conversation.id,
        })
        logger.forBot().info(`Link message created in Botpress: ${wechatMessage.Title}`)
      } else {
        logger.forBot().warn(`Unsupported message type: ${wechatMessage.MsgType}`)
      }
      
      logger.forBot().info('=== Message created in Botpress ===')
    }
    
    // Return success response for POST requests
    return {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'success',
    }
  },
})

export default integration
