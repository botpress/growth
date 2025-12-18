import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import { sendMessage, sendAttachment, getApiAccessToken } from './client'
import { getAccountId } from './actions/hitl'

type ConversationWithTags = { tags: { id?: string } }

const getConversationContext = async (client: bp.Client, ctx: bp.Context, conversation: ConversationWithTags) => {
  const chatwootConvId = conversation.tags.id
  if (!chatwootConvId) throw new RuntimeError('No Chatwoot conversation ID')
  const accountId = await getAccountId(client, ctx)
  return { chatwootConvId, accountId }
}

const unsupportedHandler =
  (type: string) =>
  async ({ logger }: { logger: bp.Logger }) => {
    logger.forBot().warn(`${type} messages not supported for Chatwoot`)
  }

const unsupportedMessages = {
  audio: unsupportedHandler('Audio'),
  bloc: unsupportedHandler('Bloc'),
  card: unsupportedHandler('Card'),
  carousel: unsupportedHandler('Carousel'),
  dropdown: unsupportedHandler('Dropdown'),
  location: unsupportedHandler('Location'),
  markdown: unsupportedHandler('Markdown'),
}

const sendMessageToOrFromChatwoot = async (
  ctx: bp.Context,
  client: bp.Client,
  conversation: ConversationWithTags,
  content: string,
  messageType: 'incoming' | 'outgoing'
) => {
  const { chatwootConvId, accountId } = await getConversationContext(client, ctx, conversation)
  await sendMessage(getApiAccessToken(ctx), accountId, chatwootConvId, content, messageType)
}

const sendImageToChatwoot = async (
  ctx: bp.Context,
  client: bp.Client,
  conversation: ConversationWithTags,
  imageUrl: string
) => {
  const { chatwootConvId, accountId } = await getConversationContext(client, ctx, conversation)
  const res = await fetch(imageUrl)
  const buffer = Buffer.from(await res.arrayBuffer())
  await sendAttachment(getApiAccessToken(ctx), accountId, chatwootConvId, buffer, 'image.png')
}

const sendFileToChatwoot = async (
  ctx: bp.Context,
  client: bp.Client,
  conversation: ConversationWithTags,
  fileUrl: string,
  title: string
) => {
  const { chatwootConvId, accountId } = await getConversationContext(client, ctx, conversation)
  const res = await fetch(fileUrl)
  const buffer = Buffer.from(await res.arrayBuffer())
  await sendAttachment(getApiAccessToken(ctx), accountId, chatwootConvId, buffer, title || 'file')
}

const sendVideoToChatwoot = async (
  ctx: bp.Context,
  client: bp.Client,
  conversation: ConversationWithTags,
  videoUrl: string
) => {
  const { chatwootConvId, accountId } = await getConversationContext(client, ctx, conversation)
  const res = await fetch(videoUrl)
  const buffer = Buffer.from(await res.arrayBuffer())
  await sendAttachment(getApiAccessToken(ctx), accountId, chatwootConvId, buffer, 'video.mp4')
}

export const channels = {
  hitl: {
    messages: {
      text: async ({ ctx, client, conversation, payload }) => {
        await sendMessageToOrFromChatwoot(ctx, client, conversation, payload.text, 'incoming')
      },
      image: async ({ ctx, client, conversation, payload }) => {
        await sendImageToChatwoot(ctx, client, conversation, payload.imageUrl)
      },
      file: async ({ ctx, client, conversation, payload }) => {
        await sendFileToChatwoot(ctx, client, conversation, payload.fileUrl, payload.title || 'file')
      },
      video: async ({ ctx, client, conversation, payload }) => {
        await sendVideoToChatwoot(ctx, client, conversation, payload.videoUrl)
      },
      choice: async ({ ctx, client, conversation, payload }) => {
        const options = payload.options.map((opt, i) => `${i + 1}. ${opt.label}`).join('\n')
        const text = `${payload.text}\n\n${options}`
        await sendMessageToOrFromChatwoot(ctx, client, conversation, text, 'incoming')
      },
      ...unsupportedMessages,
    },
  },

  channel: {
    messages: {
      text: async ({ ctx, client, conversation, payload }) => {
        await sendMessageToOrFromChatwoot(ctx, client, conversation, payload.text, 'outgoing')
      },
      image: async ({ ctx, client, conversation, payload }) => {
        await sendImageToChatwoot(ctx, client, conversation, payload.imageUrl)
      },
      file: async ({ ctx, client, conversation, payload }) => {
        await sendFileToChatwoot(ctx, client, conversation, payload.fileUrl, 'file')
      },
      video: async ({ ctx, client, conversation, payload }) => {
        await sendVideoToChatwoot(ctx, client, conversation, payload.videoUrl)
      },
      choice: async ({ ctx, client, conversation, payload }) => {
        const options = payload.options.map((opt, i) => `${i + 1}. ${opt.label}`).join('\n')
        const text = `${payload.text}\n\n${options}`
        await sendMessageToOrFromChatwoot(ctx, client, conversation, text, 'outgoing')
      },
      ...unsupportedMessages,
    },
  },
} satisfies bp.IntegrationProps['channels']
