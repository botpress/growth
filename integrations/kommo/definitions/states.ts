import { StateDefinition } from '@botpress/sdk'
import { z } from '@bpinternal/zui'

/**
 * OAuth Credentials State
 * Stores OAuth tokens and configuration for accessing Kommo API
 */
const oauthCredentials: StateDefinition = {
  type: 'integration',
  schema: z.object({
    accessToken: z.string().describe('Access token for API calls'),
    refreshToken: z.string().describe('Refresh token to get new access tokens'),
    expiresAt: z.number().describe('When the access token expires (Unix timestamp)'),
    baseDomain: z.string().describe('Kommo subdomain (e.g., yourcompany.kommo.com)'),
  }),
}

// Export all states
export const states = {
  oauthCredentials,
} as const
