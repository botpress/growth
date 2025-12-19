import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import { sendMessage, sendAttachment, getApiAccessToken } from './client'
import { getAccountId } from './actions/hitl'

type ConversationWithTags = { tags: { id?: string } }
type MessageDirection = 'toChatwoot' | 'fromChatwoot'

const directionMap: Record<MessageDirection, 'incoming' | 'outgoing'> = {
  toChatwoot: 'incoming',
  fromChatwoot: 'outgoing',
}

const getConversationContext = async (client: bp.Client, ctx: bp.Context, conversation: ConversationWithTags) => {
  const chatwootConvId = conversation.tags.id
  if (!chatwootConvId) throw new RuntimeError('No Chatwoot conversation ID')
  const accountId = await getAccountId(client, ctx)
  return { chatwootConvId, accountId }
}

const unsupportedHandler =
  (type: string) =>
  async ({ logger }: { logger: bp.Logger }) => {
    logger.forBot().warn(`Unsupported message type: ${type}`)
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

const createMessageHandlers = (direction: MessageDirection) => ({
  text: async ({
    ctx,
    client,
    conversation,
    payload,
  }: {
    ctx: bp.Context
    client: bp.Client
    conversation: ConversationWithTags
    payload: { text: string }
  }) => {
    const { chatwootConvId, accountId } = await getConversationContext(client, ctx, conversation)
    await sendMessage(getApiAccessToken(ctx), accountId, chatwootConvId, payload.text, directionMap[direction])
  },
  image: async ({
    ctx,
    client,
    conversation,
    payload,
  }: {
    ctx: bp.Context
    client: bp.Client
    conversation: ConversationWithTags
    payload: { imageUrl: string }
  }) => {
    const { chatwootConvId, accountId } = await getConversationContext(client, ctx, conversation)
    const res = await fetch(payload.imageUrl)
    const buffer = Buffer.from(await res.arrayBuffer())
    await sendAttachment(getApiAccessToken(ctx), accountId, chatwootConvId, buffer, 'image.png')
  },
  file: async ({
    ctx,
    client,
    conversation,
    payload,
  }: {
    ctx: bp.Context
    client: bp.Client
    conversation: ConversationWithTags
    payload: { fileUrl: string; title?: string }
  }) => {
    const { chatwootConvId, accountId } = await getConversationContext(client, ctx, conversation)
    const res = await fetch(payload.fileUrl)
    const buffer = Buffer.from(await res.arrayBuffer())
    await sendAttachment(getApiAccessToken(ctx), accountId, chatwootConvId, buffer, payload.title || 'file')
  },
  video: async ({
    ctx,
    client,
    conversation,
    payload,
  }: {
    ctx: bp.Context
    client: bp.Client
    conversation: ConversationWithTags
    payload: { videoUrl: string; title?: string }
  }) => {
    const { chatwootConvId, accountId } = await getConversationContext(client, ctx, conversation)
    const res = await fetch(payload.videoUrl)
    const buffer = Buffer.from(await res.arrayBuffer())
    await sendAttachment(getApiAccessToken(ctx), accountId, chatwootConvId, buffer, payload.title || 'video.mp4')
  },
  choice: async ({
    ctx,
    client,
    conversation,
    payload,
  }: {
    ctx: bp.Context
    client: bp.Client
    conversation: ConversationWithTags
    payload: { text: string; options: Array<{ label: string }> }
  }) => {
    const { chatwootConvId, accountId } = await getConversationContext(client, ctx, conversation)
    const options = payload.options.map((opt, i) => `${i + 1}. ${opt.label}`).join('\n')
    const text = `${payload.text}\n\n${options}`
    await sendMessage(getApiAccessToken(ctx), accountId, chatwootConvId, text, directionMap[direction])
  },
  ...unsupportedMessages,
})

export const channels = {
  hitl: { messages: createMessageHandlers('toChatwoot') },
  channel: { messages: createMessageHandlers('fromChatwoot') },
} satisfies bp.IntegrationProps['channels']
