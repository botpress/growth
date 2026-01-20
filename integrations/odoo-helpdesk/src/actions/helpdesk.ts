import * as bp from '.botpress'

export const getHelpdeskTeams: bp.Integration['actions']['getHelpdeskTeams'] = async ({ ctx, client, logger }) => {
  logger.forBot().info(`Getting cached helpdesk teams...`)
  const { state } = await client.getState({
    type: 'integration',
    name: 'helpdeskIntegrationInfo',
    id: ctx.integrationId,
  })

  const helpdeskTeams = state.payload.helpdeskIntegrationInfo.helpdeskTeams

  logger.forBot().info(`Cached helpdesk teams: ${JSON.stringify(helpdeskTeams)}`)

  return { helpdeskTeams }
}

export const getStages: bp.Integration['actions']['getStages'] = async ({ ctx, client, input, logger }) => {
  const { state } = await client.getState({
    type: 'integration',
    name: 'helpdeskIntegrationInfo',
    id: ctx.integrationId,
  })

  let stages = state.payload.helpdeskIntegrationInfo.stages
  logger.forBot().info(`Cached stages: ${JSON.stringify(stages)}`)

  if (input.teamId) {
    stages = state.payload.helpdeskIntegrationInfo.stages.filter(
      (stage) => input.teamId !== undefined && stage.teamIds.includes(input.teamId)
    )
    logger.forBot().info(`Filtered stages: ${JSON.stringify(stages)}`)
  }

  return { stages }
}
