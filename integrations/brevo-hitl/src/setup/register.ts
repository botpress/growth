import { getClient } from 'src/client'
import * as bpclient from '@botpress/client'
import type { RegisterFunction } from '../misc/types'

export const register: RegisterFunction = async ({ ctx, logger }) => {
  try {
    const brevoClient = getClient(ctx)

    // Validate Brevo Configuration
    const accountDetailsResponse = await brevoClient.getAccountDetails()

    console.log('Registering configuration...')
    console.log(accountDetailsResponse)

    if (!accountDetailsResponse) {
      throw new bpclient.RuntimeError('Invalid Brevo configuration! Unable to get Account Details.')
    }

    logger.info('Brevo configuration validated successfully.')
  } catch (error) {
    logger.error('Error during integration registration:', error)
    throw new bpclient.RuntimeError('Configuration Error! Unable to retrieve app details.')
  }
}
