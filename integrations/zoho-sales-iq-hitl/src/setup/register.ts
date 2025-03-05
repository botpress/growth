import { getClient } from 'src/client';
import * as bpclient from "@botpress/client";
import type { RegisterFunction } from '../misc/types';

export const register: RegisterFunction = async ({ ctx, client, logger }) => {
  try {
    const zohoClient = getClient(
      ctx.configuration.refreshToken,
      ctx.configuration.clientId,
      ctx.configuration.clientSecret,
      ctx.configuration.dataCenter,
      ctx,
      client
    );

    await zohoClient.refreshAccessToken()

    // Validate Zoho Configuration
    const appResponse = await zohoClient.getApp();

    console.log("Registering configuration...")
    console.log(appResponse)   

    if (!appResponse) {
      throw new bpclient.RuntimeError("Invalid Zoho configuration! Unable to get App ID.");
    }

    logger.info("Zoho configuration validated successfully.");

  } catch (error) {
    logger.error("Error during integration registration:", error);
    throw new bpclient.RuntimeError(
      "Configuration Error! Unable to retrieve app details."
    );
  }
};
