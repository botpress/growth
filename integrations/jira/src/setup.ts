import * as bp from '.botpress'
import { getClient } from './utils'
import { RuntimeError } from '@botpress/sdk'

export const register: bp.IntegrationProps['register'] = async ({ ctx, logger }) => {
  const jiraClient = getClient(ctx.configuration)
  try {
    await jiraClient.findAllUser()
    logger.forBot().info('Jira integration registered successfully')
  } catch (error) {
    logger.forBot().error('Failed to register Jira integration', error)
    throw new RuntimeError('Failed to register Jira integration')
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async ({ logger }) => {
  logger.forBot().info('Jira integration unregistered')
}
