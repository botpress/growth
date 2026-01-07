import { getClient } from '../client'
import * as bpclient from '@botpress/client'
import type { RegisterFunction } from '../misc/types'

export const register: RegisterFunction = async ({ ctx, logger }) => {
  try {
    const genesysClient = getClient(ctx)

    // Validate Genesys Configuration by testing authentication
    const isValid = await genesysClient.validateConfiguration()

    if (!isValid) {
      throw new bpclient.RuntimeError('Invalid Genesys configuration! Unable to authenticate.')
    }

    logger.info('Genesys configuration validated successfully.')
  } catch (error) {
    logger.error('Error during integration registration:', error)
    throw new bpclient.RuntimeError('Configuration Error! Unable to validate Genesys credentials.')
  }
}
