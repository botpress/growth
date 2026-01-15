import * as bp from '.botpress'
import { z } from '@botpress/sdk'
import { executeOdooMethod, getAuthenticatedCookie } from 'src/services/odoo'
import { helpdeskTeamSchema, stageSchema } from 'definitions/schemas'

// Botpress action handlers
export const getHelpdeskTeams = async ({
  ctx,
  logger,
}: {
  ctx: bp.Context
  logger: bp.Logger
}): Promise<{ helpdeskTeams: Array<z.infer<typeof helpdeskTeamSchema>> }> => {
  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })
  logger.forBot().info(`Odoo authentication cookie obtained successfully`)

  const filters: any[] = [['active', '=', true]]
  const fields: string[] = ['name', 'id']

  const rawOdooHelpdeskTeams = await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'helpdesk.team',
    method: 'search_read',
    args: [filters, fields],
    logger,
  })

  const helpdeskTeams = rawOdooHelpdeskTeams.map((team: any) => ({
    name: team.name as string,
    id: team.id as number,
  })) as Array<z.infer<typeof helpdeskTeamSchema>>

  return {
    helpdeskTeams,
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
}): Promise<{ stages: Array<z.infer<typeof stageSchema>> }> => {
  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })

  const teamIds = input.teamIds
  const filters: any[] = [['active', '=', true]]
  if (teamIds) {
    filters.push(['team_id', 'in', teamIds])
  }

  const fields: string[] = ['name', 'id', 'team_ids']

  const rawOdooStages = await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'helpdesk.stage',
    method: 'search_read',
    args: [filters, fields],
    logger,
  })
  const stages = rawOdooStages.map((stage: any) => ({
    name: stage.name as string,
    id: stage.id as number,
    teamIds: stage.team_ids as number[],
  })) as Array<z.infer<typeof stageSchema>>

  return {
    stages,
  }
}
