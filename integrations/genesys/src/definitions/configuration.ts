import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const GenesysConfigurationSchema = z.object({
  clientId: z.string().describe('Your Genesys OAuth2 Client ID'),
  clientSecret: z.string().describe('Your Genesys OAuth2 Client Secret'),
  integrationId: z.string().describe('Your Genesys Integration ID'),
  regionDomain: z
    .string()
    .describe(
      'Your Genesys region domain (e.g., mypurecloud.com, mypurecloud.ie, mec1.pure.cloud). Use the full domain, not just the region code.'
    ),
})

export const configuration = {
  schema: GenesysConfigurationSchema,
} satisfies IntegrationDefinitionProps['configuration']
