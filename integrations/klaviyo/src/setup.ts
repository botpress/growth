import { RuntimeError } from "@botpress/sdk";
import * as bp from ".botpress";
import { validateCredentials } from "./auth";

export const register: bp.IntegrationProps["register"] = async ({
  ctx,
  logger,
}) => {
  try {
    await validateCredentials({ ctx });
    logger.forBot().info("Klaviyo integration registered successfully");
  } catch (error) {
    logger.forBot().error("Failed to register Klaviyo integration", error);
    throw new RuntimeError(`Failed to register Klaviyo integration: ${error}`);
  }
};

export const unregister: bp.IntegrationProps["unregister"] = async ({
  logger,
}) => {
  logger.forBot().info("Klaviyo integration unregistered");
};
