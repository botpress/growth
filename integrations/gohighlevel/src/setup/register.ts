import { getClient } from 'src/client'
import * as bpclient from "@botpress/client";
import type { RegisterFunction } from '../misc/types'

export const register: RegisterFunction = async ({ ctx, client, logger }) => {
  try {
    const _goHighLevelClient = getClient(ctx.configuration.accessToken, ctx.configuration.refreshToken, ctx.configuration.clientId, ctx.configuration.clientSecret, ctx, client);

    await client.setState({
      id: ctx.integrationId,
      type: "integration",
      name: 'credentials',
      payload: {
        accessToken: ctx.configuration.accessToken,
        refreshToken: ctx.configuration.refreshToken
      }
    })

    /*
    TODO: Add a proper check for access to GoHighLevel

    i.e validate /locations endpoint or /me
    */
    const result = "Placeholder until proper check"

    // assuming check above is proper, this is called if successful login to ghl
    logger.forBot().info("Successfully accessed GoHighLevel: Integration can proceed");
    
    logger.forBot().info(`Successfully retrieved ${JSON.stringify(result)} contact`);
  } catch (error) {
    logger.forBot().error("Failed to access GoHighLevel: Check configuration", error);
    
    throw new bpclient.RuntimeError(
      "Configuration Error! Unknown error."
    );
  }
}
