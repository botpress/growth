import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import { Version3Parameters } from 'jira.js'
import { getClient } from '../utils'
import { getErrorMessage } from '../utils/error-handler'

export const newIssue: bp.IntegrationProps['actions']['newIssue'] = async ({ ctx, input, logger }) => {
  try {
    const jiraClient = getClient(ctx.configuration)

    const fields: Version3Parameters.CreateIssue['fields'] = {
      summary: input.summary,
      issuetype: {
        name: input.issueType,
      },
      project: {
        key: input.projectKey,
      },
    }

    // Only include optional fields if they're provided
    if (input.description !== undefined) {
      fields.description = input.description
    }
    if (input.parentKey !== undefined) {
      fields.parent = { key: input.parentKey }
    }
    if (input.assigneeId !== undefined) {
      fields.assignee = { id: input.assigneeId }
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
