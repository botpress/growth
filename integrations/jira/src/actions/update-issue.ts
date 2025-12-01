import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import { Version3Parameters } from 'jira.js'
import { getClient } from '../utils'
import { getErrorMessage } from '../utils/error-handler'

export const updateIssue: bp.IntegrationProps['actions']['updateIssue'] = async ({ ctx, input, logger }) => {
  try {
    const jiraClient = getClient(ctx.configuration)

    // Only include fields that are actually provided (not undefined)
    const fields: Partial<Version3Parameters.EditIssue['fields']> = {}

    if (input.summary !== undefined) {
      fields.summary = input.summary
    }
    if (input.description !== undefined) {
      fields.description = input.description
    }
    if (input.issueType !== undefined) {
      fields.issuetype = { name: input.issueType }
    }
    if (input.projectKey !== undefined) {
      fields.project = { key: input.projectKey }
    }
    if (input.parentKey !== undefined) {
      fields.parent = { key: input.parentKey }
    }
    if (input.assigneeId !== undefined) {
      fields.assignee = { id: input.assigneeId }
    }

    const issueUpdate = {
      issueIdOrKey: input.issueKey,
      fields,
    }

    await jiraClient.updateIssue(issueUpdate)
    logger.forBot().info(`Successful - Update Issue - ${input.issueKey}`)
    return { issueKey: input.issueKey }
  } catch (error) {
    const errorMessage = getErrorMessage(error)
    logger.forBot().error(`'Update Issue' exception: ${errorMessage}`, error)
    if (error instanceof RuntimeError) {
      throw error
    }
    throw new RuntimeError(`Failed to update Jira issue: ${errorMessage}`)
  }
}
