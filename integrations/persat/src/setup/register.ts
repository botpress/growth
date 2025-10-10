import { getAxiosClient } from 'src/utils/axiosClient'
import * as bp from '.botpress'
import { RuntimeError } from '@botpress/client'
import { AxiosError } from 'axios'

export const register: bp.IntegrationProps['register'] = async ({ ctx, client, logger }) => {
  try {
    const http = await getAxiosClient({ ctx, client })
    await http.get('clients')
    logger.forBot().info('API key validated successfully')
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response?.status === 401) {
      throw new RuntimeError('Invalid API key: unauthorized (401)')
    }
    const errorMessage = (error as any)?.response?.data?.message || (error as Error)?.message || 'Unknown error'
    throw new RuntimeError(`Failed to validate API key: ${errorMessage}`)
  }
}
