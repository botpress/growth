import { IntegrationDefinition, z } from "@botpress/sdk";
import { integrationName } from "./package.json";
import { actionDefinitions } from "./src/definitions";

export default new IntegrationDefinition({
  name: integrationName,
  version: "0.0.1",
  readme: "hub.md",
  icon: "icon.svg",
  identifier: {
    fallbackHandlerScript: "fallbackHandler.vrl",
  },
  states: {
    credentials: {
      type: "integration",
      schema: z.object({
        accessToken: z.string(),
        instanceUrl: z.string(),
        refreshToken: z.string(),
      }),
    },
  },
  secrets: {
    CONSUMER_KEY: {
      description: "Consumer key of the Salesforce app",
    },
    CONSUMER_SECRET: {
      description: "Consumer secret of the Salesforce app",
    },
  },
  actions: actionDefinitions,
});
