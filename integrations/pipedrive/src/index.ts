import actions from './actions' 
import * as bp from '.botpress'
import { validateCredentials } from './auth'
import { RuntimeError } from '@botpress/sdk'

export const register: bp.IntegrationProps['register'] = async ({ ctx, logger }) => {
  try {
    await validateCredentials({ ctx })
    logger.forBot().info('Pipedrive integration registered')
  } catch (error) {
    logger.forBot().error('Failed to register Pipedrive integration', error)
    throw new RuntimeError(`Failed to register Pipedrive integration: ${error}`)
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async ({ logger }) => {
  logger.forBot().info('Pipedrive integration unregistered')
}

export default new bp.Integration({
  register,   
  unregister,
  actions, 
  channels: {},
  handler: async () => {},
})
