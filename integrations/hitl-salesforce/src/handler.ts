import { getSalesforceClient } from './client'
import { SFMessagingConfig } from './definitions/schemas'
import {
  closeConversation,
  executeOnConversationClose,
  isConversationClosed,
} from './events/conversation-close'
import { executeOnConversationMessage } from './events/conversation-message'
import { executeOnParticipantChanged } from './events/participant-changed'
import type { TriggerPayload } from './triggers'
import { IntegrationProps } from '.botpress'

export const handler: IntegrationProps['handler'] = async ({
  req,
  ctx,
  client,
  logger,
}) => {
  if (!req.body) {
    logger.forBot().warn('Handler received an empty body')
    return
  }

  const trigger = JSON.parse(req.body) as TriggerPayload

  if (typeof trigger.payload !== 'string' || trigger.payload.length) {
    console.log('Got Data on handler:', JSON.stringify(req.body))
  }

  if (
    trigger.type == 'TRANSPORT_START' ||
    (trigger.type == 'DATA' &&
      (!trigger.payload ||
        (typeof trigger.payload == 'string' && !trigger.payload.length)))
  ) {
    if (typeof trigger.payload == 'string' && !trigger.payload.length) {
      return
    }
    console.log(
      `Ignoring sf event of type: ${
        trigger.type
      } with definition ${JSON.stringify(trigger, null, 2)}`
    )
    return
  }

  if (
    ['DATA', 'TRANSPORT_END', 'TRANSPORT_RESTORED', 'ERROR'].includes(
      trigger.type
    )
  ) {
    const { conversation } = await client.getOrCreateConversation({
      channel: 'hitl',
      tags: {
        transportKey: trigger.transport.key,
      },
    })

    switch (trigger.type) {
      case 'DATA':
        const { payload: messagingTrigger } = trigger

        try {
          messagingTrigger.data = JSON.parse(messagingTrigger?.data)
        } catch (e) {
          return /* Ignore non json data */
        }

        console.log('Got conversation for data: ', { conversation })
        switch (messagingTrigger.event) {
          case 'CONVERSATION_MESSAGE':
            await executeOnConversationMessage({
              messagingTrigger,
              conversation,
              client,
              logger,
            })
            break
          case 'CONVERSATION_PARTICIPANT_CHANGED':
            await executeOnParticipantChanged({
              messagingTrigger,
              ctx,
              conversation,
              client,
              logger,
            })
            break
          case 'CONVERSATION_CLOSE_CONVERSATION':
            await executeOnConversationClose({
              messagingTrigger,
              ctx,
              conversation,
              client,
              logger,
            })
            break
          default:
            console.log('Got unhandled event: ' + trigger.payload.event)
        }
        return
      case 'ERROR':
        // If you start the polling session with debug enabled
        logger
          .forBot()
          .debug(
            'Got a debug error from the transport session: ' +
              JSON.stringify(
                { trigger, response: trigger.payload?.response },
                null,
                2
              )
          )
        return
      case 'TRANSPORT_END':
        console.log('On Transport End')
        await closeConversation({ conversation, ctx, client, logger })
        return
      case 'TRANSPORT_RESTORED':
        console.log('On Transport Restored')
        if (isConversationClosed(conversation)) {
          console.log(
            'Restored transport from a conversation that is already closed, ending transport'
          )

          const {
            state: {
              payload: { accessToken },
            },
          } = await client.getState({
            type: 'conversation',
            id: conversation.id,
            name: 'messaging',
          })

          const salesforceClient = getSalesforceClient(
            logger,
            { ...(ctx.configuration as SFMessagingConfig) },
            {
              accessToken,
              sseKey: conversation.tags.transportKey,
              conversationId: conversation.tags.id,
            }
          )

          await salesforceClient.stopSSE(conversation.tags.transportKey)
        }
        return

      default:
        break
    }
  } else {
    logger.forBot().warn('Unsupported trigger type: ' + trigger.type)
  }
}
