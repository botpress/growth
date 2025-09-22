import { RuntimeError } from "@botpress/sdk";
import * as bp from ".botpress";
import { getProfilesApi } from './auth';

export const register: bp.IntegrationProps["register"] = async ({ ctx, logger }) => {
  try {
    const profilesApi = getProfilesApi(ctx);
    await profilesApi.getProfiles({ pageSize: 1 })
    logger.forBot().info("Klaviyo integration registered successfully")
  } catch (error) {
    logger.forBot().error("Failed to register Klaviyo integration", error)
    throw new RuntimeError("Failed to register Klaviyo integration")
  }
};

export const unregister: bp.IntegrationProps["unregister"] = async ({ logger }) => {
  logger.forBot().info("Klaviyo integration unregistered")
};
