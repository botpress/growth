import * as bp from '../.botpress'
import { getClient } from './client'
import { RuntimeError } from '@botpress/sdk'

const getIntercomContextFromMessage = async (props: bp.AnyMessageProps) => {
  const { client, ctx, conversation, logger } = props
  const intercomClient = getClient(ctx.configuration.accessToken, logger)

  const intercomConversationId = conversation.tags.id
  if (!intercomConversationId?.length) {
    logger.forBot().error('No Intercom Conversation Id')
    throw new RuntimeError('No Intercom Conversation Id')
  }

  const intercomContact = await client.getState({
    id: conversation.id,
    name: 'intercomContact',
    type: 'conversation',
  })

  const intercomContactId = intercomContact.state?.payload?.intercomContactId
  if (!intercomContactId) {
    logger.forBot().error('No Intercom Contact ID found in conversation state')
    throw new RuntimeError('No Intercom Contact ID found in conversation state')
  }

  return { intercomClient, intercomConversationId, intercomContactId }
}

export const channels = {
  hitl: {
    messages: {
      bloc: async (props: bp.AnyMessageProps) => {
        const { intercomClient, intercomConversationId, intercomContactId } = await getIntercomContextFromMessage(props)

        for (const item of (props as any).payload.items || []) {
          try {
            switch (item.type) {
              case 'text':
                await intercomClient.replyToConversation(intercomConversationId, intercomContactId, item.payload.text)
                break
              case 'markdown':
                await intercomClient.replyToConversation(
                  intercomConversationId,
                  intercomContactId,
                  item.payload.markdown
                )
                break
              case 'image':
                await intercomClient.replyToConversation(
                  intercomConversationId,
                  intercomContactId,
                  item.payload.text || ' ',
                  [item.payload.imageUrl]
                )
                break
              case 'video':
                await intercomClient.replyToConversation(
                  intercomConversationId,
                  intercomContactId,
                  item.payload.text || ' ',
                  [item.payload.videoUrl]
                )
                break
              case 'audio':
                await intercomClient.replyToConversation(
                  intercomConversationId,
                  intercomContactId,
                  item.payload.text || ' ',
                  [item.payload.audioUrl]
                )
                break
              case 'file': {
                const { fileUrl, title } = item.payload
                try {
                  await intercomClient.replyToConversation(intercomConversationId, intercomContactId, title || ' ', [
                    fileUrl,
                  ])
                } catch (err: unknown) {
                  const e = err as any
                  const msg: string | undefined = e?.response?.data?.errors?.[0]?.message
                  const fb: string = err instanceof Error ? err.message : String(err)
                  ;(props.logger || { forBot: () => ({ error: () => {} }) })
                    .forBot()
                    .error('Failed to attach bloc file: ' + (msg || fb))
                  await intercomClient.replyToConversation(
                    intercomConversationId,
                    intercomContactId,
                    `${title ? title + ': ' : ''}${fileUrl}`
                  )
                }
                break
              }
            }
          } catch (err) {
            ;(props.logger || { forBot: () => ({ error: () => {} }) })
              .forBot()
              .error('Failed to send bloc item to Intercom: ' + (err as Error).message)
          }
        }
      },
      file: async (props: bp.AnyMessageProps) => {
        const { intercomClient, intercomConversationId, intercomContactId } = await getIntercomContextFromMessage(props)
        const { title, fileUrl } = (props.payload as any) || {}

        if (!fileUrl) {
          props.logger.forBot().error('No fileUrl provided for file message')
          throw new RuntimeError('No fileUrl provided for file message')
        }

        try {
          return await intercomClient.replyToConversation(intercomConversationId, intercomContactId, title || ' ', [
            fileUrl,
          ])
        } catch (err: any) {
          const message = (err?.response?.data?.errors?.[0]?.message as string) || (err as Error).message
          props.logger.forBot().error('Failed to attach file: ' + message)
          return await intercomClient.replyToConversation(
            intercomConversationId,
            intercomContactId,
            `${title ? title + ': ' : ''}${fileUrl}`
          )
        }
      },
      video: async (props: bp.AnyMessageProps) => {
        const { intercomClient, intercomConversationId, intercomContactId } = await getIntercomContextFromMessage(props)
        const userMessage = (props.payload as any)?.text || ' '
        const videoUrl = (props.payload as any)?.videoUrl

        try {
          return await intercomClient.replyToConversation(
            intercomConversationId,
            intercomContactId,
            userMessage,
            videoUrl ? [videoUrl] : undefined
          )
        } catch {
          props.logger.forBot().warn('Video attachment failed, falling back to plain URL text')
          return await intercomClient.replyToConversation(
            intercomConversationId,
            intercomContactId,
            `${(props.payload as any)?.text ? (props.payload as any).text + ' ' : ''}${videoUrl}`
          )
        }
      },
      audio: async (props: bp.AnyMessageProps) => {
        const { intercomClient, intercomConversationId, intercomContactId } = await getIntercomContextFromMessage(props)
        const userMessage = (props.payload as any)?.text || ' '
        const audioUrl = (props.payload as any)?.audioUrl

        try {
          return await intercomClient.replyToConversation(
            intercomConversationId,
            intercomContactId,
            userMessage,
            audioUrl ? [audioUrl] : undefined
          )
        } catch {
          props.logger.forBot().warn('Audio attachment failed, falling back to plain URL text')
          return await intercomClient.replyToConversation(
            intercomConversationId,
            intercomContactId,
            `${(props.payload as any)?.text ? (props.payload as any).text + ' ' : ''}${audioUrl}`
          )
        }
      },
      image: async (props: bp.AnyMessageProps) => {
        const { intercomClient, intercomConversationId, intercomContactId } = await getIntercomContextFromMessage(props)
        const userMessage = (props.payload as any)?.text || ' '
        const imageUrl = (props.payload as any)?.imageUrl

        props.logger
          .forBot()
          .info(
            `Sending image to Intercom - Conversation ID: ${intercomConversationId}, Contact ID: ${intercomContactId}, Image URL: ${imageUrl}`
          )

        return await intercomClient.replyToConversation(
          intercomConversationId,
          intercomContactId,
          userMessage,
          imageUrl ? [imageUrl] : undefined
        )
      },
      text: async (props: bp.AnyMessageProps) => {
        const { intercomClient, intercomConversationId, intercomContactId } = await getIntercomContextFromMessage(props)
        const userMessage = (props.payload as any)?.text

        props.logger
          .forBot()
          .info(
            `Sending message to Intercom - Conversation ID: ${intercomConversationId}, Contact ID: ${intercomContactId}, Message: ${userMessage}`
          )

        return await intercomClient.replyToConversation(intercomConversationId, intercomContactId, userMessage)
      },
    },
  },
} satisfies bp.IntegrationProps['channels']
