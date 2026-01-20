import {
  handleImageMessage,
  handleTextMessage,
  handleVideoMessage,
} from './misc/message-handlers'
import { downloadWeChatMedia, getAccessToken } from './misc/wechat-api'
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
        image: handleImageMessage, //messages to be handled
        video: handleVideoMessage,
      },
    },
  },
  handler: async ({ req, client, ctx }) => {
    // Extract query parameters - try from req.query first, then from path
    let signature: string | undefined
    let timestamp: string | undefined
    let nonce: string | undefined
    let echostr: string | undefined

    // Parse the query parameters from the request
    if (req.query) {
      const query = typeof req.query === 'string' ? new URLSearchParams(req.query) : null
      if (query) {
        signature = query.get('signature') || undefined
        timestamp = query.get('timestamp') || undefined
        nonce = query.get('nonce') || undefined
        echostr = query.get('echostr') || undefined
      }
    }

    // ======================= this is for the signature verification step=================================
    if (!signature && req.path && req.path.includes('?')) {
      const url = new URL(req.path, 'http://localhost')
      signature = url.searchParams.get('signature') || undefined
      timestamp = url.searchParams.get('timestamp') || undefined
      nonce = url.searchParams.get('nonce') || undefined
      echostr = url.searchParams.get('echostr') || undefined
    }

    if (!signature && req.headers) {
      signature = req.headers['x-wechat-signature'] || undefined
      timestamp = req.headers['x-wechat-timestamp'] || undefined
      nonce = req.headers['x-wechat-nonce'] || undefined
    }
    

    // ===================================================================================================
    
    
    
    
    // Handle WeChat request with signature verification
    const result = handleWeChatRequest({
      wechatToken: ctx.configuration.wechatToken,
      method: req.method || 'POST',
      signature,
      timestamp,
      nonce,
      echostr,
      body: req.body,
    })

    if (req.method === 'GET' && echostr) {
      //  this is where the issue exist and we add a "|" to resolve the pproblem and in the proxy, it will be removed
      return {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
        },
        body: echostr + '|',
      }
    }

    //  Parse the message and create the conversation and user on botpress
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
      } else if (wechatMessage.MsgType === 'image') {
        const mediaKey = `wechat/media/image/${wechatMessage.MediaId || messageId || Date.now()}`
        let imageUrl: string | undefined

        if (wechatMessage.PicUrl) {
          const { file } = await client.uploadFile({ // upload the image to the botpress file cloud
            key: mediaKey,
            url: wechatMessage.PicUrl,
            accessPolicies: ['public_content'],
            publicContentImmediatelyAccessible: true,
          })
          imageUrl = file.url
        } else if (wechatMessage.MediaId) {
          const accessToken = await getAccessToken(ctx.configuration.appId, ctx.configuration.appSecret)
          const { content, contentType } = await downloadWeChatMedia(accessToken, wechatMessage.MediaId)
          const { file } = await client.uploadFile({
            key: mediaKey,
            content,
            contentType,
            accessPolicies: ['public_content'],
            publicContentImmediatelyAccessible: true,
          })
          imageUrl = file.url
        }

        if (imageUrl) {
          await client.createMessage({
            tags: {
              id: messageId || '',
              chatId: wechatConversationId,
            },
            type: 'image',
            payload: { imageUrl },
            userId: user.id,
            conversationId: conversation.id,
          })
        }
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
      } else if (wechatMessage.MsgType === 'video' && wechatMessage.MediaId) {
        const accessToken = await getAccessToken(ctx.configuration.appId, ctx.configuration.appSecret)
        const { content, contentType } = await downloadWeChatMedia(accessToken, wechatMessage.MediaId)
        const { file } = await client.uploadFile({
          key: `wechat/media/video/${wechatMessage.MediaId}`,
          content,
          contentType,
          accessPolicies: ['public_content'],
          publicContentImmediatelyAccessible: true,
        })
        await client.createMessage({
          tags: {
            id: messageId || '',
            chatId: wechatConversationId,
          },
          type: 'video',
          payload: { videoUrl: file.url },
          userId: user.id,
          conversationId: conversation.id,
        })
      } else if (wechatMessage.MsgType === 'location') {
        await client.createMessage({
          tags: {
            id: messageId || '',
            chatId: wechatConversationId,
          },
          type: 'text',
          payload: {
            text: `[Location] ${wechatMessage.Label || ''} (${wechatMessage.Location_X || '0'}, ${wechatMessage.Location_Y || '0'})`,
          },
          userId: user.id,
          conversationId: conversation.id,
        })
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
      } else {
      }
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
