import { z, IntegrationDefinition } from "@botpress/sdk";
import { integrationName } from "./package.json";
import { configuration } from ".botpress";

export default new IntegrationDefinition({
  name: integrationName,
  version: "0.0.1",
  readme: "hub.md",
  icon: "icon.svg",
  configuration: {
    schema: z.object({
      clientId: z.string().min(1).describe("The client ID"),
      tenantId: z.string().min(1).describe("The tenant ID"),
      thumbprint: z.string().min(1).describe("The thumbprint"),
      privateKey: z.string().min(1).describe("The private key"),
      primaryDomain: z.string().min(1).describe("The primary domain"),
      siteName: z.string().min(1).describe("The name of the Sharepoint site."),
      documentLibraryName: z
        .string()
        .min(1)
        .describe("The name of the Document Library that you wan to sync a Botpress knowledge base with."),
      kbId: z.string().min(1).describe("The knowledge base ID to sync with"),
    }),
  },
  states: {
    configuration: {
      type: "integration",
      schema: z.object({
        webhookSubscriptionId: z.string().min(1),
        changeToken: z.string().min(1),
      }),
    },
  },
  actions: {},
});
