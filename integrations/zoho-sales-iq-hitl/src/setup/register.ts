import {RuntimeError} from '@botpress/sdk'

import type { RegisterFunction } from '../misc/types'
import { getClient } from 'src/client'

export const register: RegisterFunction = async ({ ctx, client, logger }) => {
  const zohoClient = getClient(
    ctx.configuration.refreshToken,
    ctx.configuration.clientId,
    ctx.configuration.clientSecret,
    ctx.configuration.dataCenter,
    ctx,
    client
  )

  const refreshResult = await zohoClient.refreshAccessToken()
  if (!refreshResult.success) {
    throw new RuntimeError(refreshResult.error ?? 'Authentication error. Please reauthorize the integration.')
  }

  // Validate Zoho Configuration
  const appResponse = await zohoClient.getApp()
  if (!appResponse.success) {
    throw new RuntimeError('Configuration Error! Unable to retrieve app details.')
  }

  logger.info('Registering configuration...', appResponse.data)
  logger.info('Zoho configuration validated successfully.')
}
