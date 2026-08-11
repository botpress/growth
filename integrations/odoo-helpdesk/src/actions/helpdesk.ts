import * as bp from '.botpress'
import { RuntimeError } from '@botpress/client'
import { safeGetState } from 'src/utils'
import { HelpdeskTeam, Stage } from 'definitions/schemas'

type HelpdeskIntegrationInfo = {
  helpdeskIntegrationInfo: {
    helpdeskTeams: HelpdeskTeam[]
    stages: Stage[]
  }
}

export const getHelpdeskTeams: bp.Integration['actions']['getHelpdeskTeams'] = async ({ ctx, client, logger }) => {
  logger.forBot().debug(`Getting cached helpdesk teams`)

  const { state } = await safeGetState(client, {
    type: 'integration',
    name: 'helpdeskIntegrationInfo',
    id: ctx.integrationId,
  })

  if (
    state.payload === undefined ||
    state.payload === null ||
    typeof state.payload !== 'object' ||
    Array.isArray(state.payload)
  ) {
    throw new RuntimeError('Invalid state payload: helpdeskIntegrationInfo not found')
  }
  if (!('helpdeskIntegrationInfo' in state.payload)) {
    throw new RuntimeError('Invalid state payload: helpdeskIntegrationInfo property missing')
  }

  const payload: HelpdeskIntegrationInfo = state.payload
  const helpdeskTeams = payload.helpdeskIntegrationInfo.helpdeskTeams

  logger.forBot().info(`Retrieved ${helpdeskTeams.length} helpdesk teams`)

  return { helpdeskTeams }
}

export const getStages: bp.Integration['actions']['getStages'] = async ({ ctx, client, input, logger }) => {
  logger.forBot().debug(`Getting cached stages${input.teamId ? ` for teamId=${input.teamId}` : ''}`)

  const { state } = await safeGetState(client, {
    type: 'integration',
    name: 'helpdeskIntegrationInfo',
    id: ctx.integrationId,
  })

  if (
    state.payload === undefined ||
    state.payload === null ||
    typeof state.payload !== 'object' ||
    Array.isArray(state.payload)
  ) {
    throw new RuntimeError('Invalid state payload: helpdeskIntegrationInfo not found')
  }
  if (!('helpdeskIntegrationInfo' in state.payload)) {
    throw new RuntimeError('Invalid state payload: helpdeskIntegrationInfo not found')
  }

  const payload: HelpdeskIntegrationInfo = state.payload
  let stages = payload.helpdeskIntegrationInfo.stages

  if (input.teamId !== undefined) {
    const teamId = input.teamId
    stages = payload.helpdeskIntegrationInfo.stages.filter((stage) => stage.teamIds.includes(teamId))
    logger.forBot().debug(`Filtered to ${stages.length} stages for teamId=${teamId}`)
  }

  logger.forBot().info(`Retrieved ${stages.length} stages`)
  return { stages }
}
