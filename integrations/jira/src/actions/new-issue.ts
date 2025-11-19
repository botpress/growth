import * as bp from '.botpress'
import { newIssueInputSchema } from '../misc/custom-schemas'
import { getClient } from '../utils'

export const newIssue: bp.IntegrationProps['actions']['newIssue'] = async ({ ctx, input, logger }) => {
  const validatedInput = newIssueInputSchema.parse(input)
  const jiraClient = getClient(ctx.configuration)
  const issue = {
    fields: {
      summary: validatedInput.summary,
      issuetype: {
        name: validatedInput.issueType,
      },
      project: {
        key: validatedInput.projectKey,
      },
      description: validatedInput.description,
      parent: {
        key: validatedInput.parentKey,
      },
      assignee: {
        id: validatedInput.assigneeId,
      },
    },
  }
  let response
  try {
    response = await jiraClient.newIssue(issue)
    logger.forBot().info(`Successful - New Issue - ${response}`)
  } catch (error) {
    logger.forBot().debug(`'New Issue' exception ${JSON.stringify(error)}`)
    response = ''
  }
  return { issueKey: response }
}
