import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import { sendMessage, sendAttachment } from './client'
import { getAccountId } from './actions/hitl'

type MessageHandlerProps<T extends keyof bp.MessageProps['hitl']> = bp.MessageProps['hitl'][T]

const getConversationContext = async (client: bp.Client, ctx: bp.Context, conversation: { tags: { id?: string } }) => {
  const chatwootConvId = conversation.tags.id
  if (!chatwootConvId) throw new RuntimeError('No Chatwoot conversation ID')
  const accountId = await getAccountId(client, ctx)
  return { chatwootConvId, accountId }
}

const sendTextToChatwoot = async (
  ctx: bp.Context,
  client: bp.Client,
  conversation: { tags: { id?: string } },
  text: string,
  ack: (props: { tags: { id: string; conversationId: string } }) => Promise<void>
) => {
  const { chatwootConvId, accountId } = await getConversationContext(client, ctx, conversation)
  await sendMessage(ctx, accountId, chatwootConvId, text)
  await ack({ tags: { id: '', conversationId: chatwootConvId } })
}

export const channels = {
  hitl: {
    messages: {
      text: async (props: MessageHandlerProps<'text'>) => {
        const { ctx, client, conversation, payload, ack } = props
        await sendTextToChatwoot(ctx, client, conversation, payload.text, ack)
      },

      image: async (props: MessageHandlerProps<'image'>) => {
        const { ctx, client, conversation, payload, ack } = props
        const { chatwootConvId, accountId } = await getConversationContext(client, ctx, conversation)
        const res = await fetch(payload.imageUrl)
        const buffer = Buffer.from(await res.arrayBuffer())
        await sendAttachment(ctx, accountId, chatwootConvId, buffer, 'image.png')
        await ack({ tags: { id: '', conversationId: chatwootConvId } })
      },

      file: async (props: MessageHandlerProps<'file'>) => {
        const { ctx, client, conversation, payload, ack } = props
        const { chatwootConvId, accountId } = await getConversationContext(client, ctx, conversation)
        const res = await fetch(payload.fileUrl)
        const buffer = Buffer.from(await res.arrayBuffer())
        await sendAttachment(ctx, accountId, chatwootConvId, buffer, payload.title || 'file')
        await ack({ tags: { id: '', conversationId: chatwootConvId } })
      },

      video: async (props: MessageHandlerProps<'video'>) => {
        const { ctx, client, conversation, payload, ack } = props
        const { chatwootConvId, accountId } = await getConversationContext(client, ctx, conversation)
        const res = await fetch(payload.videoUrl)
        const buffer = Buffer.from(await res.arrayBuffer())
        await sendAttachment(ctx, accountId, chatwootConvId, buffer, 'video.mp4')
        await ack({ tags: { id: '', conversationId: chatwootConvId } })
      },

      audio: async ({ logger }) => {
        logger.forBot().warn('Audio attachment not supported for Chatwoot')
      },

      bloc: async ({ logger }) => {
        logger.forBot().warn('Bloc messages not supported for Chatwoot')
      },

      card: async ({ logger }) => {
        logger.forBot().warn('Card messages not supported for Chatwoot')
      },

      carousel: async ({ logger }) => {
        logger.forBot().warn('Carousel messages not supported for Chatwoot')
      },

      choice: async ({ logger }) => {
        logger.forBot().warn('Choice messages not supported for Chatwoot')
      },

      dropdown: async ({ logger }) => {
        logger.forBot().warn('Dropdown messages not supported for Chatwoot')
      },

      location: async ({ logger }) => {
        logger.forBot().warn('Location messages not supported for Chatwoot')
      },

      markdown: async ({ logger }) => {
        logger.forBot().warn('Markdown messages not supported for Chatwoot')
      },
    },
  },
} satisfies bp.IntegrationProps['channels']
