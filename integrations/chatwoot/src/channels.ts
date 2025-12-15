import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import { sendMessage, sendAttachment, sendBotMessage } from './client'
import { getAccountId } from './actions/hitl'

type ConfirmDelivery = (props: { tags: { id: string; conversationId: string } }) => Promise<void>
type ConversationWithTags = { tags: { id?: string } }

const getConversationContext = async (client: bp.Client, ctx: bp.Context, conversation: ConversationWithTags) => {
  const chatwootConvId = conversation.tags.id
  if (!chatwootConvId) throw new RuntimeError('No Chatwoot conversation ID')
  const accountId = await getAccountId(client, ctx)
  return { chatwootConvId, accountId }
}

const createTextHandler =
  (sendFn: typeof sendMessage) =>
  async (
    ctx: bp.Context,
    client: bp.Client,
    conversation: ConversationWithTags,
    text: string,
    confirmDelivery: ConfirmDelivery
  ) => {
    const { chatwootConvId, accountId } = await getConversationContext(client, ctx, conversation)
    await sendFn(ctx, accountId, chatwootConvId, text)
    await confirmDelivery({ tags: { id: '', conversationId: chatwootConvId } })
  }

const sendTextHitl = createTextHandler(sendMessage)
const sendTextChannel = createTextHandler(sendBotMessage)

const sendImageToChatwoot = async (
  ctx: bp.Context,
  client: bp.Client,
  conversation: ConversationWithTags,
  imageUrl: string,
  confirmDelivery: ConfirmDelivery
) => {
  const { chatwootConvId, accountId } = await getConversationContext(client, ctx, conversation)
  const res = await fetch(imageUrl)
  const buffer = Buffer.from(await res.arrayBuffer())
  await sendAttachment(ctx, accountId, chatwootConvId, buffer, 'image.png')
  await confirmDelivery({ tags: { id: '', conversationId: chatwootConvId } })
}

const sendFileToChatwoot = async (
  ctx: bp.Context,
  client: bp.Client,
  conversation: ConversationWithTags,
  fileUrl: string,
  title: string,
  confirmDelivery: ConfirmDelivery
) => {
  const { chatwootConvId, accountId } = await getConversationContext(client, ctx, conversation)
  const res = await fetch(fileUrl)
  const buffer = Buffer.from(await res.arrayBuffer())
  await sendAttachment(ctx, accountId, chatwootConvId, buffer, title || 'file')
  await confirmDelivery({ tags: { id: '', conversationId: chatwootConvId } })
}

const sendVideoToChatwoot = async (
  ctx: bp.Context,
  client: bp.Client,
  conversation: ConversationWithTags,
  videoUrl: string,
  confirmDelivery: ConfirmDelivery
) => {
  const { chatwootConvId, accountId } = await getConversationContext(client, ctx, conversation)
  const res = await fetch(videoUrl)
  const buffer = Buffer.from(await res.arrayBuffer())
  await sendAttachment(ctx, accountId, chatwootConvId, buffer, 'video.mp4')
  await confirmDelivery({ tags: { id: '', conversationId: chatwootConvId } })
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

export const channels = {
  hitl: {
    messages: {
      text: async ({ ctx, client, conversation, payload, ack }) => {
        await sendTextHitl(ctx, client, conversation, payload.text, ack)
      },
      image: async ({ ctx, client, conversation, payload, ack }) => {
        await sendImageToChatwoot(ctx, client, conversation, payload.imageUrl, ack)
      },
      file: async ({ ctx, client, conversation, payload, ack }) => {
        await sendFileToChatwoot(ctx, client, conversation, payload.fileUrl, payload.title || 'file', ack)
      },
      video: async ({ ctx, client, conversation, payload, ack }) => {
        await sendVideoToChatwoot(ctx, client, conversation, payload.videoUrl, ack)
      },
      choice: async ({ ctx, client, conversation, payload, ack }) => {
        const options = payload.options.map((opt, i) => `${i + 1}. ${opt.label}`).join('\n')
        const text = `${payload.text}\n\n${options}`
        await sendTextHitl(ctx, client, conversation, text, ack)
      },
      ...unsupportedMessages,
    },
  },

  channel: {
    messages: {
      text: async ({ ctx, client, conversation, payload, ack }) => {
        await sendTextChannel(ctx, client, conversation, payload.text, ack)
      },
      image: async ({ ctx, client, conversation, payload, ack }) => {
        await sendImageToChatwoot(ctx, client, conversation, payload.imageUrl, ack)
      },
      file: async ({ ctx, client, conversation, payload, ack }) => {
        await sendFileToChatwoot(ctx, client, conversation, payload.fileUrl, 'file', ack)
      },
      video: async ({ ctx, client, conversation, payload, ack }) => {
        await sendVideoToChatwoot(ctx, client, conversation, payload.videoUrl, ack)
      },
      choice: async ({ ctx, client, conversation, payload, ack }) => {
        const options = payload.options.map((opt, i) => `${i + 1}. ${opt.label}`).join('\n')
        const text = `${payload.text}\n\n${options}`
        await sendTextChannel(ctx, client, conversation, text, ack)
      },
      ...unsupportedMessages,
    },
  },
} satisfies bp.IntegrationProps['channels']
