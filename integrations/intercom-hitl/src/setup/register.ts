import { RuntimeError } from "@botpress/sdk";
import type { RegisterFunction } from "../misc/types";
import { getClient } from "../client";

export const register: RegisterFunction = async ({ ctx, logger }) => {
  logger.forBot().info("Registering Intercom integration configuration...");

  if (!ctx.configuration.accessToken) {
    throw new RuntimeError(
      "Configuration is incomplete. Please provide an Access Token.",
    );
  }

  const intercomClient = getClient(ctx.configuration.accessToken, logger);

  try {
    const result = await intercomClient.getAdmins();
    if (!result.data) {
      throw new RuntimeError("No admins returned");
    }
    logger
      .forBot()
      .info("Successfully listed admins. Integration credentials are valid.");
  } catch (error: any) {
    logger.forBot().error("Failed to list admins:", error.message || error);
    throw new RuntimeError(
      "Failed to list admins: " + (error.message || error),
    );
  }
};
