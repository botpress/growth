import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import { Version3Parameters } from 'jira.js'
import { updateIssueInputSchema } from '../misc/custom-schemas'
import { getClient } from '../utils'
import { getErrorMessage } from '../utils/error-handler'

export const updateIssue: bp.IntegrationProps['actions']['updateIssue'] = async ({ ctx, input, logger }) => {
  try {
    const validatedInput = updateIssueInputSchema.parse(input)
    const jiraClient = getClient(ctx.configuration)

    // Only include fields that are actually provided (not undefined)
    const fields: Partial<Version3Parameters.EditIssue['fields']> = {}

    if (validatedInput.summary !== undefined) {
      fields.summary = validatedInput.summary
    }
    if (validatedInput.description !== undefined) {
      fields.description = validatedInput.description
    }
    if (validatedInput.issueType !== undefined) {
      fields.issuetype = { name: validatedInput.issueType }
    }
    if (validatedInput.projectKey !== undefined) {
      fields.project = { key: validatedInput.projectKey }
    }
    if (validatedInput.parentKey !== undefined) {
      fields.parent = { key: validatedInput.parentKey }
    }
    if (validatedInput.assigneeId !== undefined) {
      fields.assignee = { id: validatedInput.assigneeId }
    }

    const issueUpdate = {
      issueIdOrKey: validatedInput.issueKey,
      fields,
    }

    await jiraClient.updateIssue(issueUpdate)
    logger.forBot().info(`Successful - Update Issue - ${validatedInput.issueKey}`)
    return { issueKey: validatedInput.issueKey }
  } catch (error) {
    const errorMessage = getErrorMessage(error)
    logger.forBot().error(`'Update Issue' exception: ${errorMessage}`, error)
    if (error instanceof RuntimeError) {
      throw error
    }
    throw new RuntimeError(`Failed to update Jira issue: ${errorMessage}`)
  }
}
