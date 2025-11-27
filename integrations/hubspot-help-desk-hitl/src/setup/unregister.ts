import { getClient } from 'src/client'
import type { UnregisterFunction } from '../misc/types'

export const unregister: UnregisterFunction = async ({ ctx, client, logger }) => {
  logger.forBot().info('Unregistering HubSpot Help Desk HITL integration...')

  try {
    const { state } = await client.getState({
      id: ctx.integrationId,
      name: 'channelInfo',
      type: 'integration',
    })

    if (!state.payload?.channelId) {
      logger.forBot().info('No channel found to clean up during unregistration.')
      return
    }

    const { channelId } = state.payload

    logger.forBot().info(`Found channel ${channelId} to clean up.`)

    const hubspotClient = getClient(
      ctx,
      client,
      ctx.configuration.refreshToken,
      ctx.configuration.clientId,
      ctx.configuration.clientSecret,
      logger
    )

    const deleted = await hubspotClient.deleteCustomChannel(channelId)

    if (deleted) {
      logger.forBot().info(`Successfully cleaned up channel ${channelId} from HubSpot.`)
    } else {
      logger.forBot().warn(`Could not delete channel ${channelId} from HubSpot. It may need to be deleted manually.`)
    }
  } catch (error: any) {
    // Log but don't throw - unregister should not fail
    logger.forBot().warn(`Error during unregister cleanup: ${error.message}`)
  }
}
