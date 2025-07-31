import { z } from "@botpress/sdk";

export type HubSpotConfiguration = z.infer<typeof HubSpotConfigurationSchema>;

export const HubSpotConfigurationSchema = z.object({
  developerApiKey: z.string().describe("developerApiKey"),
  refreshToken: z.string().describe("refreshToken"),
  appId: z.string().describe("appId"),
  clientId: z.string().describe("clientId"),
  clientSecret: z.string().describe("clientSecret"),
  helpDeskId: z.string().describe("helpDeskId"),
});
