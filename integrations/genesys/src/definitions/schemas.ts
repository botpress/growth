import { z } from '@botpress/sdk'

export const GenesysConfigurationSchema = z.object({
  clientId: z.string().describe('Your Genesys OAuth2 Client ID'),
  clientSecret: z.string().describe('Your Genesys OAuth2 Client Secret'),
  regionDomain: z.string().describe('Your Genesys region domain (e.g., mypurecloud.com, mypurecloud.ie)'),
})
