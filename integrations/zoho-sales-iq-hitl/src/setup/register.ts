import * as bpclient from '@botpress/client'

import type { RegisterFunction } from '../misc/types'
import { getClient } from 'src/client'

export const register: RegisterFunction = async ({ ctx, client, logger }) => {
  try {
    const zohoClient = getClient(
      ctx.configuration.refreshToken,
      ctx.configuration.clientId,
      ctx.configuration.clientSecret,
      ctx.configuration.dataCenter,
      ctx,
      client
    )

    await zohoClient.refreshAccessToken()

    // Validate Zoho Configuration
    const appResponse = await zohoClient.getApp()

    logger.info('Registering configuration...', appResponse)
    logger.info('Zoho configuration validated successfully.')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('Error during integration registration:', errorMessage)
    throw new bpclient.RuntimeError('Configuration Error! Unable to retrieve app details.')
  }
}
