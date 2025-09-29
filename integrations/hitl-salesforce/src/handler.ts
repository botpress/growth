import { getSalesforceClientWithBotpress } from './client'
import { closeConversation, executeOnConversationClose, isConversationClosed } from './events/conversation-close'
import { executeOnConversationMessage } from './events/conversation-message'
import { executeOnParticipantChanged } from './events/participant-changed'
import type {
  CloseConversationMessagingTrigger,
  MessageMessagingTrigger,
  ParticipantChangedMessagingTrigger,
  TriggerPayload,
} from './triggers'
import { IntegrationProps } from '.botpress'

export const handler: IntegrationProps['handler'] = async (props) => {
  const { req, ctx, client, logger } = props
  if (!req.body) {
    logger.forBot().warn('Handler received an empty body')
    return
  }

  const trigger = JSON.parse(req.body) as TriggerPayload

  logger.forBot().debug('Got Data on handler:', JSON.stringify(req.body))

  if (trigger.type === 'TRANSPORT_START' || (trigger.type === 'DATA' && !trigger.payload)) {
    logger
      .forBot()
      .debug(`Ignoring sf event of type: ${trigger.type} with definition ${JSON.stringify(trigger, null, 2)}`)
    return
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      transportKey: trigger.transport.key,
    },
  })

  if (!conversation) {
    logger.forBot().warn(`No conversation for transport key ${trigger.transport.key}, ignoring event`)
    return
  }

  switch (trigger.type) {
    case 'DATA':
      const { payload: messagingTrigger } = trigger

      if (messagingTrigger.raw === 'Jwt is expired') {
        await closeConversation({ conversation, ctx, client, logger })
        return
      }

      try {
        messagingTrigger.data = JSON.parse(messagingTrigger?.data)
      } catch {
        return /* Ignore non json data */
      }

      switch (messagingTrigger.event) {
        case 'CONVERSATION_MESSAGE':
          await executeOnConversationMessage({
            messagingTrigger: messagingTrigger as MessageMessagingTrigger,
            conversation,
            ...props,
          })
          break
        case 'CONVERSATION_PARTICIPANT_CHANGED':
          await executeOnParticipantChanged({
            messagingTrigger: messagingTrigger as ParticipantChangedMessagingTrigger,
            ctx,
            conversation,
            client,
            logger,
          })
          break
        case 'CONVERSATION_CLOSE_CONVERSATION':
          logger.forBot().warn('Got CONVERSATION_CLOSE_CONVERSATION')
          await executeOnConversationClose({
            messagingTrigger: messagingTrigger as CloseConversationMessagingTrigger,
            ctx,
            conversation,
            client,
            logger,
          })
          break
        default:
          logger.forBot().warn('Got unhandled event: ' + trigger.payload.event)
      }
      return
    case 'ERROR':
      // If you start the sse session with debug enabled
      logger.forBot().debug('Got a debug error from the transport session: ' + JSON.stringify({ trigger }, null, 2))
      return
    case 'TRANSPORT_END':
      logger.forBot().warn('Got TRANSPORT_END')
      await closeConversation({ conversation, ctx, client, logger })
      return
    case 'TRANSPORT_RESTORED':
      if (isConversationClosed(conversation)) {
        // Restored transport from a conversation that is already closed, ending transport
        const salesforceClient = await getSalesforceClientWithBotpress({ client, ctx, conversation, logger })

        await salesforceClient.stopSSE(conversation.tags.transportKey as string)
      }
      return

    default:
      logger.forBot().warn('Unsupported trigger type: ' + trigger.type)
      break
  }
}
