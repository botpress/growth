import { z, IntegrationDefinition } from "@botpress/sdk";
import { integrationName } from "./package.json";

export default new IntegrationDefinition({
  name: integrationName,
  version: "3.0.4",
  title: "SharePoint",
  description:
    "Sync one or many SharePoint document libraries with one or more Botpress knowledge bases.",
  readme: "hub.md",
  icon: "icon.svg",

  configuration: {
    schema: z.object({
      clientId: z.string().min(1).describe("Azure AD application client ID"),
      tenantId: z.string().min(1).describe("Azure AD tenant ID"),
      thumbprint: z.string().min(1).describe("Certificate thumbprint"),
      privateKey: z.string().min(1).describe("PEM-formatted certificate private key"),
      primaryDomain: z.string().min(1).describe("SharePoint primary domain (e.g. contoso)"),
      siteName: z.string().min(1).describe("SharePoint site name"),

      documentLibraryNames: z
        .string()
        .min(1)
        .describe(
          "Comma-separated list **or** JSON array of Document Libraries to sync " +
            '(e.g. "Policies,Procedures" or \'["Policies","Procedures"]\').'
        ),
      folderKbMap: z
        .string()
        .min(1)
        .describe(
          "Optional JSON map of kbId → array of folder prefixes used for routing.\n" +
            'Example: {"kb-marketing":["Campaigns"],"kb-policies":["HR","Legal"]}'
        ),
      enableVision: z
        .boolean()
        .default(false)
        .describe("Enable vision processing for uploaded files (transcribes and indexes visual content from files)"),
    }),
  },
  states: {
    configuration: {
      type: "integration",
      schema: z.object({
        /* key = documentLibraryName, value = {webhookSubscriptionId,changeToken} */
        subscriptions: z.record(
          z.object({
            webhookSubscriptionId: z.string().min(1),
            changeToken: z.string().min(1),
          })
        ),
      }),
    },
  },
  actions: {},
});
