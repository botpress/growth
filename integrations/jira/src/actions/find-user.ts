import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import { findUserInputSchema, findUserOutputSchema } from '../misc/custom-schemas'
import { getClient } from '../utils'
import { getErrorMessage } from '../utils/error-handler'

export const findUser: bp.IntegrationProps['actions']['findUser'] = async ({ ctx, input, logger }) => {
  try {
    const validatedInput = findUserInputSchema.parse(input)
    const jiraClient = getClient(ctx.configuration)
    const response = await jiraClient.findUser(validatedInput.accountId)
    logger
      .forBot()
      .info(`Successful - Find User - ${response?.displayName || 'Unknown'} - with ID: ${validatedInput.accountId}`)
    return findUserOutputSchema.parse(response)
  } catch (error) {
    const errorMessage = getErrorMessage(error)
    logger.forBot().error(`'Find User' exception: ${errorMessage}`, error)
    if (error instanceof RuntimeError) {
      throw error
    }
    throw new RuntimeError(`Failed to find Jira user: ${errorMessage}`)
  }
}
