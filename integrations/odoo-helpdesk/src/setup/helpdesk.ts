import * as bp from '.botpress'
import { executeOdooMethod, getAuthenticatedCookie } from 'src/services/odoo'
import {
  fetchHelpdeskTeamResultsSchema,
  fetchStagesResultsSchema,
  HelpdeskTeam,
  FetchHelpdeskTeamResults,
  FetchStagesResults,
  Stage,
  OdooRequestFilters,
} from 'definitions/schemas'

// Botpress action handlers
export const getHelpdeskTeams = async ({
  ctx,
  logger,
}: {
  ctx: bp.Context
  logger: bp.Logger
}): Promise<{ helpdeskTeams: HelpdeskTeam[] }> => {
  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })
  logger.forBot().info(`Odoo authentication cookie obtained successfully`)

  const filters: OdooRequestFilters = [['active', '=', true]]
  const fields: string[] = ['name', 'id']

  const rawOdooHelpdeskTeams: FetchHelpdeskTeamResults = await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'helpdesk.team',
    method: 'search_read',
    args: [filters, fields],
    logger,
    schema: fetchHelpdeskTeamResultsSchema,
  })

  return {
    helpdeskTeams: rawOdooHelpdeskTeams,
  }
}

export const getStages = async ({
  ctx,
  input,
  logger,
}: {
  ctx: bp.Context
  input: { teamIds: number[] }
  logger: bp.Logger
}): Promise<{ stages: Stage[] }> => {
  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })

  const teamIds = input.teamIds
  const filters: OdooRequestFilters = [['active', '=', true]]
  if (teamIds) {
    filters.push(['team_ids', 'in', teamIds])
  }

  const fields: string[] = ['name', 'id', 'team_ids']

  const rawOdooStages: FetchStagesResults = await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'helpdesk.stage',
    method: 'search_read',
    args: [filters, fields],
    logger,
    schema: fetchStagesResultsSchema,
  })

  return {
    stages: rawOdooStages.map((stage) => ({
      name: stage.name,
      id: stage.id,
      teamIds: stage.team_ids,
    })),
  }
}
