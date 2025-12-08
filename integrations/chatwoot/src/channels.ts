import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import { sendMessage, sendAttachment } from './client'
import { getAccountId } from './actions/hitl'

type MessageHandlerProps<T extends keyof bp.MessageProps['hitl']> = bp.MessageProps['hitl'][T]

const getConversationContext = async (
  client: bp.Client,
  ctx: bp.Context,
  conversation: { tags: { id?: string } }
) => {
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

      audio: async (props: MessageHandlerProps<'audio'>) => {
        const { ctx, client, conversation, payload, ack } = props
        await sendTextToChatwoot(ctx, client, conversation, `[Audio: ${payload.audioUrl}]`, ack)
      },

      bloc: async (props: MessageHandlerProps<'bloc'>) => {
        const { ctx, client, conversation, payload, ack } = props
        const items = payload.items
          .map((item) => {
            if (item.type === 'text') return item.payload.text
            if (item.type === 'markdown') return item.payload.markdown
            return null
          })
          .filter(Boolean)
          .join('\n')
        await sendTextToChatwoot(ctx, client, conversation, items || '[Bloc message]', ack)
      },

      card: async (props: MessageHandlerProps<'card'>) => {
        const { ctx, client, conversation, payload, ack } = props
        const text = [payload.title, payload.subtitle].filter(Boolean).join('\n')
        await sendTextToChatwoot(ctx, client, conversation, text || '[Card]', ack)
      },

      carousel: async (props: MessageHandlerProps<'carousel'>) => {
        const { ctx, client, conversation, payload, ack } = props
        const items = payload.items.map((item) => item.title).filter(Boolean).join('\n')
        await sendTextToChatwoot(ctx, client, conversation, items || '[Carousel]', ack)
      },

      choice: async (props: MessageHandlerProps<'choice'>) => {
        const { ctx, client, conversation, payload, ack } = props
        const options = payload.options.map((opt) => opt.label).join(', ')
        await sendTextToChatwoot(ctx, client, conversation, `${payload.text}\nOptions: ${options}`, ack)
      },

      dropdown: async (props: MessageHandlerProps<'dropdown'>) => {
        const { ctx, client, conversation, payload, ack } = props
        const options = payload.options.map((opt) => opt.label).join(', ')
        await sendTextToChatwoot(ctx, client, conversation, `${payload.text}\nOptions: ${options}`, ack)
      },

      location: async (props: MessageHandlerProps<'location'>) => {
        const { ctx, client, conversation, payload, ack } = props
        await sendTextToChatwoot(ctx, client, conversation, `[Location: ${payload.latitude}, ${payload.longitude}]`, ack)
      },

      markdown: async (props: MessageHandlerProps<'markdown'>) => {
        const { ctx, client, conversation, payload, ack } = props
        await sendTextToChatwoot(ctx, client, conversation, payload.markdown, ack)
      },
    },
  },
} satisfies bp.IntegrationProps['channels']
