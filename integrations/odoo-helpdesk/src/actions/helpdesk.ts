import * as bp from '.botpress'
import { helpdeskTeamSchema, stageSchema } from 'definitions/schemas'
import { z } from '@botpress/sdk'

export const getHelpdeskTeams: bp.Integration['actions']['getHelpdeskTeams'] = async ({ ctx, client, logger }) => {
  logger.forBot().info(`Getting cached helpdesk teams...`)
  const { state } = (await client.getState({
    type: 'integration',
    name: 'helpdeskIntegrationInfo',
    id: ctx.integrationId,
  })) as {
    state: { payload: { helpdeskIntegrationInfo: { helpdeskTeams: Array<z.infer<typeof helpdeskTeamSchema>> } } }
  }

  const helpdeskTeams = state.payload.helpdeskIntegrationInfo.helpdeskTeams

  logger.forBot().info(`Cached helpdesk teams: ${JSON.stringify(helpdeskTeams)}`)

  return {
    helpdeskTeams,
  }
}

export const getStages: bp.Integration['actions']['getStages'] = async ({ ctx, client, input, logger }) => {
  const { state } = (await client.getState({
    type: 'integration',
    name: 'helpdeskIntegrationInfo',
    id: ctx.integrationId,
  })) as { state: { payload: { helpdeskIntegrationInfo: { stages: Array<z.infer<typeof stageSchema>> } } } }

  let stages = state.payload.helpdeskIntegrationInfo.stages
  logger.forBot().info(`Cached stages: ${JSON.stringify(stages)}`)

  if (input && input.teamId) {
    stages = state.payload.helpdeskIntegrationInfo.stages.filter((stage) =>
      stage.teamIds.includes(input.teamId as number)
    ) as Array<z.infer<typeof stageSchema>>
    logger.forBot().info(`Filtered stages: ${JSON.stringify(stages)}`)
  }

  return { stages }
}
