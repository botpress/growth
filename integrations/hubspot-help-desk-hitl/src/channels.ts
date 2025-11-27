import * as bp from '../.botpress'
import { getClient } from './client'
import { RuntimeError } from '@botpress/sdk'

export const channels: bp.Integration['channels'] = {
  hitl: {
    messages: {
      text: async ({ client, ctx, conversation, logger, ...props }: bp.MessageProps['hitl']['text']) => {
        const hubSpotClient = getClient(
          ctx,
          client,
          ctx.configuration.refreshToken,
          ctx.configuration.clientId,
          ctx.configuration.clientSecret,
          logger
        )

        const { text: userMessage } = props.payload

        const hubspotConversationId = conversation.tags.id

        if (!hubspotConversationId?.length) {
          logger.forBot().error('No HubSpot Conversation Id')
          return
        }

        const { user: botpressUser } = await client.getOrCreateUser({
          tags: {
            hubspotConversationId: hubspotConversationId,
          },
        })

        const userInfoState = await client.getState({
          id: botpressUser.id,
          name: 'userInfo',
          type: 'user',
        })

        // Check if either phoneNumber or email is present in the userInfo state
        const userPhoneNumber = userInfoState?.state.payload.phoneNumber
        const userEmail = userInfoState?.state.payload.email

        if (!userPhoneNumber && !userEmail) {
          const errorMessage =
            'User identifier (phone number or email) not found. Please ensure the user is created with an identifier.'
          logger.forBot().error(errorMessage)
          throw new RuntimeError(errorMessage)
        }

        const { name } = userInfoState.state.payload

        // Prefer phone number if available, otherwise use email
        const contactIdentifier = userPhoneNumber || userEmail!
        if (userPhoneNumber) {
          logger.forBot().info(`Using phone number for message: ${userPhoneNumber}`)
        } else {
          logger.forBot().info(`Using email for message: ${userEmail}`)
        }

        return await hubSpotClient.sendMessage(
          userMessage,
          name,
          contactIdentifier,
          botpressUser.tags.integrationThreadId as string
        )
      },
      image: async ({ logger }) => {
        logger.forBot().warn('Image messages are not supported yet')
      },
      video: async ({ logger }) => {
        logger.forBot().warn('Video messages are not supported yet')
      },
      audio: async ({ logger }) => {
        logger.forBot().warn('Audio messages are not supported yet')
      },
      file: async ({ logger }) => {
        logger.forBot().warn('File messages are not supported yet')
      },
      bloc: async ({ logger }) => {
        logger.forBot().warn('Bloc messages are not supported yet')
      },
    },
  },
} satisfies bp.IntegrationProps['channels']
