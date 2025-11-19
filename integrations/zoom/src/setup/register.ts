import * as bp from '.botpress'
import { getZoomClient } from '../client'
import { RuntimeError } from '@botpress/sdk'
import { ZoomConfig } from '../types'

export const register: bp.IntegrationProps['register'] = async ({ ctx, logger }) => {
  try {
    const config = ctx.configuration as ZoomConfig
    const zoomClient = getZoomClient(config, logger)
    await zoomClient.getAccessToken()

    logger.forBot().info('Zoom integration registered successfully')
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    logger.forBot().error(`Failed to connect to Zoom API: ${errorMsg}`)

    throw new RuntimeError('Configuration Error! Please check your Zoom Account ID, Client ID, and Client Secret.')
  }
}
