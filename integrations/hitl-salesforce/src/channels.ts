import { AxiosError } from 'axios'
import * as bp from '../.botpress'
import { getSalesforceClient } from './client'
import { SFMessagingConfig } from './definitions/schemas'
import { closeConversation, isConversationClosed } from './events/conversation-close'

const getSalesforceClientFromMessage = async (props: bp.AnyMessageProps) => {
  const { client, ctx, conversation, logger } = props
  const {
    state: {
      payload: { accessToken },
    },
  } = await client.getState({
    type: 'conversation',
    id: conversation.id,
    name: 'messaging',
  })
  return getSalesforceClient(
    logger,
    { ...(ctx.configuration as SFMessagingConfig) },
    {
      accessToken,
      sseKey: conversation.tags.transportKey,
      conversationId: conversation.tags.id,
    }
  )
}

export const channels = {
  hitl: {
    messages: {
      text: async (props: bp.MessageProps['hitl']['text']) => {
        const { client, ctx, conversation, logger, payload } = props

        if (isConversationClosed(conversation)) {
          logger
            .forBot()
            .error(
              'Tried to send a message from a conversation that is already closed: ' +
                JSON.stringify({ conversation }, null, 2)
            )
          return
        }

        if (!conversation.tags.assignedAt && ctx.configuration.conversationNotAssignedMessage?.length) {
          const { user: systemUser } = await client.getOrCreateUser({
            name: 'System',
            tags: {
              id: conversation.id,
            },
          })

          await client.createMessage({
            tags: {},
            type: 'text',
            userId: systemUser?.id as string,
            conversationId: conversation.id,
            payload: {
              text: ctx.configuration.conversationNotAssignedMessage || 'Conversation not assigned',
            },
          })
          return
        }

        const salesforceClient = await getSalesforceClientFromMessage(props)

        try {
          await salesforceClient.sendMessage(payload.text)
        } catch (thrown: unknown) {
          const error = thrown instanceof Error ? thrown : new Error(String(thrown))
          logger.forBot().error('Failed to send message: ' + error.message)

          if ((error as AxiosError)?.response?.status === 403) {
            // Session is no longer valid
            try {
              await closeConversation({ conversation, ctx, client, logger, force: true })
            } catch (thrown2: unknown) {
              const error2 = thrown2 instanceof Error ? thrown2 : new Error(String(thrown2))
              logger.forBot().error('Failed to finish invalid session: ' + error2.message)
            }
          }
        }
      },
      audio: async (props: bp.MessageProps['hitl']['audio']) => {
        const { payload } = props
        const salesforceClient = await getSalesforceClientFromMessage(props)
        await salesforceClient.sendMessage(payload.audioUrl)
      },
      image: async (props: bp.MessageProps['hitl']['image']) => {
        const { payload } = props
        const salesforceClient = await getSalesforceClientFromMessage(props)
        await salesforceClient.sendMessage(payload.imageUrl)
      },
      video: async (props: bp.MessageProps['hitl']['video']) => {
        const { payload } = props
        const salesforceClient = await getSalesforceClientFromMessage(props)
        await salesforceClient.sendMessage(payload.videoUrl)
      },
      file: async (props: bp.MessageProps['hitl']['file']) => {
        console.log('Will send file', { payload: props.payload })
        const { payload } = props
        const salesforceClient = await getSalesforceClientFromMessage(props)
        await salesforceClient.sendMessage(payload.fileUrl)
      },
    },
  },
} satisfies bp.IntegrationProps['channels']

export default channels
