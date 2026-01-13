import * as bp from '../.botpress'
import { RuntimeError } from '@botpress/sdk'
import { getClient } from './client'

type ConversationWithTags = { tags: { id?: string } }

const getConversationContext = async (conversation: ConversationWithTags) => {
  const genesysConvId = conversation.tags.id
  if (!genesysConvId) throw new RuntimeError('No Genesys conversation ID')
  return { genesysConvId }
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

const createMessageHandlers = () => ({
  text: async ({
    ctx,
    conversation,
    payload,
    user,
  }: {
    ctx: bp.Context
    conversation: ConversationWithTags
    payload: { text: string }
    user: { name?: string }
  }) => {
    const { genesysConvId } = await getConversationContext(conversation)
    const genesysClient = getClient(ctx)
    const nickname = user.name || genesysConvId
    await genesysClient.sendMessage(genesysConvId, nickname, payload.text)
  },
  image: async ({ logger }: { logger: bp.Logger }) => {
    logger.forBot().warn('Image messages not yet supported for Genesys')
  },
  file: async ({ logger }: { logger: bp.Logger }) => {
    logger.forBot().warn('File messages not yet supported for Genesys')
  },
  video: async ({ logger }: { logger: bp.Logger }) => {
    logger.forBot().warn('Video messages not yet supported for Genesys')
  },
  choice: async ({
    ctx,
    conversation,
    payload,
    user,
  }: {
    ctx: bp.Context
    conversation: ConversationWithTags
    payload: { text: string; options: Array<{ label: string }> }
    user: { name?: string }
  }) => {
    const { genesysConvId } = await getConversationContext(conversation)
    const genesysClient = getClient(ctx)
    const options = payload.options.map((opt, i) => `${i + 1}. ${opt.label}`).join('\n')
    const text = `${payload.text}\n\n${options}`
    const nickname = user.name || genesysConvId
    await genesysClient.sendMessage(genesysConvId, nickname, text)
  },
  ...unsupportedMessages,
})

export const channels = {
  hitl: { messages: createMessageHandlers() },
  channel: { messages: createMessageHandlers() },
} satisfies bp.IntegrationProps['channels']
