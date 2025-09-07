import { getClient } from '../client';
import type { UnregisterFunction } from '../misc/types';

export const unregister: UnregisterFunction = async ({ ctx, client, logger }) => {
  logger.forBot().info("Starting HubSpot Inbox HITL integration unregistration...");

  try {
    const { state } = await client.getState({
      id: ctx.integrationId,
      name: "channelInfo",
      type: "integration",
    });

    if (!state?.payload?.channelId) {
      logger.forBot().info("No channel found to delete during unregistration.");
      return;
    }

    const { channelId } = state.payload;
    logger.forBot().info(`Found channel to delete: ${channelId}`);

    const hubspotClient = getClient(
      ctx,
      client,
      ctx.configuration.refreshToken,
      ctx.configuration.clientId,
      ctx.configuration.clientSecret,
      logger
    );

    const deleteSuccess = await hubspotClient.deleteCustomChannel(channelId);
    
    if (deleteSuccess) {
      logger.forBot().info(`Successfully deleted HubSpot Inbox channel: ${channelId}`);
    } else {
      logger.forBot().warn(`Failed to delete HubSpot Inbox channel: ${channelId}. Manual cleanup may be required.`);
    }

  } catch (error) {
    logger.forBot().error("Error during HubSpot Inbox HITL integration unregistration:", error);
  }

  logger.forBot().info("HubSpot Inbox HITL integration unregistration completed.");
}
