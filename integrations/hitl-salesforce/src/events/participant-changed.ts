import { ParticipantChangedDataPayload, ParticipantChangedMessagingTrigger } from '../triggers'
import { closeConversation } from './conversation-close'
import { getSalesforceClientWithBotpress } from '../client'
import { SFMessagingConfig } from '../definitions/schemas'
import { ROUTING_STATUS } from '../const'
import * as bp from '.botpress'

export const executeOnParticipantChanged = async ({
  messagingTrigger,
  conversation,
  ctx,
  client,
  logger,
}: {
  messagingTrigger: ParticipantChangedMessagingTrigger
  conversation: bp.AnyMessageProps['conversation']
  ctx: bp.Context
  client: bp.Client
  logger: bp.Logger
}) => {
  let entryPayload: ParticipantChangedDataPayload

  try {
    entryPayload = JSON.parse(messagingTrigger.data.conversationEntry.entryPayload) as ParticipantChangedDataPayload
  } catch (e) {
    logger.forBot().error('Could not parse entry payload', e)
    return
  }

  for (const entry of entryPayload.entries) {
    const {
      displayName,
      participant: { role, subject },
    } = entry

    if (role !== 'Agent') {
      return
    }

    switch (entry.operation) {
      case 'remove':
        // Check routing status to determine if this is a transfer or actual agent removal
        // This prevents conversations from being closed when agents are transferred
        // For TRANSFER status, send transfer message to user
        // Only close conversation if routing status is NEEDS_ROUTING (agent ended chat)
        try {
          // Get the conversation state to access the access token
          const conversationState = await client.getState({
            type: 'conversation',
            id: conversation.id,
            name: 'messaging',
          })

          if (!conversationState?.state?.payload?.accessToken) {
            logger.forBot().warn('No access token found in conversation state, proceeding with conversation close')
            await closeConversation({ conversation, ctx, client, logger })
            return
          }

          const salesforceClient = await getSalesforceClientWithBotpress({ client, ctx, conversation, logger })

          const routingStatus = await salesforceClient.getConversationRoutingStatus()

          // Handle different routing statuses
          if (routingStatus.routingStatus === ROUTING_STATUS.TRANSFER) {
            // Agent was transferred, check if transfer message is configured
            const transferMessage = (ctx.configuration as SFMessagingConfig).transferMessage

            if (transferMessage?.trim()) {
              // Send transfer message to user if configured
              logger.forBot().info('Agent removed due to transfer, sending transfer message', {
                conversationId: conversation.id,
                routingStatus: routingStatus.routingStatus,
              })

              // Create a system user to send the transfer message
              const { user: systemUser } = await client.getOrCreateUser({
                name: 'System',
                tags: {
                  id: conversation.id,
                },
              })

              // Send transfer message to user
              await client.createMessage({
                tags: {},
                type: 'text',
                userId: systemUser?.id as string,
                conversationId: conversation.id,
                payload: {
                  text: transferMessage,
                },
              })
            } else {
              // No transfer message configured, just log the transfer
              logger.forBot().info('Agent removed due to transfer, no transfer message configured', {
                conversationId: conversation.id,
                routingStatus: routingStatus.routingStatus,
              })
            }
            return
          }

          if (routingStatus.routingStatus === ROUTING_STATUS.NEEDS_ROUTING) {
            // Agent ended chat, close conversation
            logger.forBot().info('Agent removed with NEEDS_ROUTING status, closing conversation', {
              conversationId: conversation.id,
              routingStatus: routingStatus.routingStatus,
            })
          } else {
            // Any other status, don't close conversation
            return
          }
        } catch (error) {
          // If we can't determine the routing status, fall back to the original behavior
          // This ensures backward compatibility and prevents conversations from getting stuck
          logger.forBot().warn('Failed to check routing status, proceeding with conversation close', error)
        }

        await closeConversation({ conversation, ctx, client, logger })
        return
      case 'add':
        const { user } = await client.getOrCreateUser({
          name: displayName,
          tags: {
            id: subject,
          },
        })

        if (!user.name?.length) {
          await client.updateUser({
            ...user,
            name: displayName,
            tags: {
              id: subject,
            },
          })
        }

        await client.updateConversation({
          id: conversation.id,
          tags: {
            assignedAt: new Date().toISOString(),
            transportKey: conversation.tags.transportKey,
            id: conversation.tags.id,
            closedAt: conversation.tags.closedAt,
          },
        })

        await client.createEvent({
          type: 'hitlAssigned',
          conversationId: conversation.id,
          payload: {
            conversationId: conversation.id,
            userId: user.id,
          },
        })
        return
      default:
        break
    }
  }
}
