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

  const filters: (string | boolean)[][] = [['active', '=', true]]
  const fields: string[] = ['name', 'id']

  const rawOdooHelpdeskTeams = (await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'helpdesk.team',
    method: 'search_read',
    args: [filters, fields] as (string | number)[][],
    logger,
  })) as Array<Record<string, string>>

  const helpdeskTeams = rawOdooHelpdeskTeams.map((team: Record<string, string>) => ({
    name: team.name as string,
    id: team.id as unknown as number,
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
  const filters: (string | number | boolean)[][] = [['active', '=', true]]
  if (teamIds) {
    filters.push(['team_ids', 'in', teamIds] as (string | number)[])
  }

  const fields: string[] = ['name', 'id', 'team_ids']

  const rawOdooStages = (await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'helpdesk.stage',
    method: 'search_read',
    args: [filters, fields] as (string | number)[][],
    logger,
  })) as Array<Record<string, string | number>>
  const stages = rawOdooStages.map((stage: Record<string, string | number>) => ({
    name: stage.name as string,
    id: stage.id as unknown as number,
    teamIds: stage.team_ids as unknown as number[],
  })) as Array<z.infer<typeof stageSchema>>

  return {
    stages,
  }
}
