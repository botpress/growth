import * as bp from '.botpress'
import { updateIssueInputSchema } from '../misc/custom-schemas'
import { getClient } from '../utils'

export const updateIssue: bp.IntegrationProps['actions']['updateIssue'] = async ({ ctx, input, logger }) => {
  const validatedInput = updateIssueInputSchema.parse(input)
  const jiraClient = getClient(ctx.configuration)
  const issueUpdate = {
    issueIdOrKey: validatedInput.issueKey,
    fields: {
      summary: validatedInput.summary,
      description: validatedInput.description,
      issuetype: {
        name: validatedInput.issueType,
      },
      project: {
        key: validatedInput.projectKey,
      },
      parent: {
        key: validatedInput.parentKey,
      },
      assignee: {
        id: validatedInput.assigneeId,
      },
    },
  }
  let issueKey = validatedInput.issueKey
  try {
    await jiraClient.updateIssue(issueUpdate)
    logger.forBot().info(`Successful - Update Issue - ${issueKey}`)
  } catch (error) {
    issueKey = ''
    logger.forBot().debug(`'Update Issue' exception ${JSON.stringify(error)}`)
  }
  return { issueKey }
}
