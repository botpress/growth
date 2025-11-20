import * as bp from '.botpress'
import { Version3Models } from 'jira.js'
import { findAllUsersInputSchema, findAllUsersOutputSchema } from '../misc/custom-schemas'
import { getClient } from '../utils'

export const findAllUsers: bp.IntegrationProps['actions']['findAllUsers'] = async ({ ctx, input, logger }) => {
  const validatedInput = findAllUsersInputSchema.parse(input)
  const jiraClient = getClient(ctx.configuration)

  // Only include parameters if they're provided
  const addParams: { startAt?: number; maxResults?: number } = {}
  if (validatedInput.startAt !== undefined) {
    addParams.startAt = validatedInput.startAt
  }
  if (validatedInput.maxResults !== undefined) {
    addParams.maxResults = validatedInput.maxResults
  }
  let response
  try {
    response = await jiraClient.findAllUser(addParams)
    logger.forBot().info(`Successful - Find All User - Total Users ${response.length}`)
  } catch (error) {
    logger.forBot().debug(`'Find All User' exception ${JSON.stringify(error)}`)
    response = [] as Version3Models.User[]
  }
  return findAllUsersOutputSchema.parse({ users: response })
}
