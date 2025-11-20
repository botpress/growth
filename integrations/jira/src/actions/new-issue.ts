import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import { Version3Parameters } from 'jira.js'
import { newIssueInputSchema } from '../misc/custom-schemas'
import { getClient } from '../utils'
import { getErrorMessage } from '../utils/error-handler'

export const newIssue: bp.IntegrationProps['actions']['newIssue'] = async ({ ctx, input, logger }) => {
  try {
    const validatedInput = newIssueInputSchema.parse(input)
    const jiraClient = getClient(ctx.configuration)

    const fields: Version3Parameters.CreateIssue['fields'] = {
      summary: validatedInput.summary,
      issuetype: {
        name: validatedInput.issueType,
      },
      project: {
        key: validatedInput.projectKey,
      },
    }

    // Only include optional fields if they're provided
    if (validatedInput.description !== undefined) {
      fields.description = validatedInput.description
    }
    if (validatedInput.parentKey !== undefined) {
      fields.parent = { key: validatedInput.parentKey }
    }
    if (validatedInput.assigneeId !== undefined) {
      fields.assignee = { id: validatedInput.assigneeId }
    }

    const issue: Version3Parameters.CreateIssue = {
      fields,
    }

    const response = await jiraClient.newIssue(issue)
    logger.forBot().info(`Successful - New Issue - ${response}`)
    return { issueKey: response }
  } catch (error) {
    const errorMessage = getErrorMessage(error)
    logger.forBot().error(`'New Issue' exception: ${errorMessage}`, error)
    if (error instanceof RuntimeError) {
      throw error
    }
    throw new RuntimeError(`Failed to create Jira issue: ${errorMessage}`)
  }
}
