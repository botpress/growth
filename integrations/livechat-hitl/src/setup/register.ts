import * as bpclient from '@botpress/client'
import type { RegisterFunction } from '../misc/types'
import { getClient } from '../client'

export const register: RegisterFunction = async ({ ctx, logger }) => {
  logger.forBot().info('Registering LiveChat integration configuration...')

  if (!ctx.configuration.clientId || !ctx.configuration.organizationId) {
    throw new bpclient.RuntimeError(
      'Configuration is incomplete. Please provide both a Client ID and an Organization ID.'
    )
  }

  const liveChatClient = getClient(ctx.configuration.clientId, ctx.configuration.organizationId, logger)

  try {
    const result = await liveChatClient.createCustomerToken(`https://webhook.botpress.cloud/${ctx.webhookId}`)
    if (!result.access_token) {
      throw new Error('No access token returned')
    }
    logger.forBot().info('Successfully created a customer token. Integration credentials are valid.')
  } catch (error: any) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null
          ? JSON.stringify(error)
          : String(error)
    logger.forBot().error('Failed to create customer token:', errorMessage)
    throw new bpclient.RuntimeError('Failed to create customer token: ' + errorMessage)
  }
}
