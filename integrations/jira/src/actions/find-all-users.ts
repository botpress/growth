import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import { findAllUsersOutputSchema } from '../misc/custom-schemas'
import { getClient } from '../utils'
import { getErrorMessage } from '../utils/error-handler'

export const findAllUsers: bp.IntegrationProps['actions']['findAllUsers'] = async ({ ctx, input, logger }) => {
  try {
    const jiraClient = getClient(ctx.configuration)

    // Only include parameters if they're provided
    const addParams: { startAt?: number; maxResults?: number } = {}
    if (input.startAt !== undefined) {
      addParams.startAt = input.startAt
    }
    if (input.maxResults !== undefined) {
      addParams.maxResults = input.maxResults
    }
    const response = await jiraClient.findAllUser(addParams)
    logger.forBot().info(`Successful - Find All User - Total Users ${response.length}`)
    return findAllUsersOutputSchema.parse({ users: response })
  } catch (error) {
    const errorMessage = getErrorMessage(error)
    logger.forBot().error(`'Find All Users' exception: ${errorMessage}`, error)
    if (error instanceof RuntimeError) {
      throw error
    }
    throw new RuntimeError(`Failed to find all Jira users: ${errorMessage}`)
  }
}
