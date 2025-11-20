import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import { addCommentToIssueInputSchema } from '../misc/custom-schemas'
import { getClient } from '../utils'
import { getErrorMessage } from '../utils/error-handler'

export const addCommentToIssue: bp.IntegrationProps['actions']['addCommentToIssue'] = async ({
  ctx,
  input,
  logger,
}) => {
  try {
    const validatedInput = addCommentToIssueInputSchema.parse(input)
    const jiraClient = getClient(ctx.configuration)
    const comment = {
      issueIdOrKey: validatedInput.issueKey,
      body: validatedInput.body,
    }
    const response = await jiraClient.addCommentToIssue(comment)
    logger
      .forBot()
      .info(`Successful - Add Comment to Issue - with issueKey: ${validatedInput.issueKey} - id: ${response}`)
    return { id: response }
  } catch (error) {
    const errorMessage = getErrorMessage(error)
    logger.forBot().error(`'Add Comment to Issue' exception: ${errorMessage}`, error)
    if (error instanceof RuntimeError) {
      throw error
    }
    throw new RuntimeError(`Failed to add comment to Jira issue: ${errorMessage}`)
  }
}
