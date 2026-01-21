import * as bp from '.botpress'
import { executeOdooMethod, getAuthenticatedCookie } from './odoo'
import {
  fetchHelpdeskTeamResultsSchema,
  fetchStagesResultsSchema,
  HelpdeskTeam,
  FetchHelpdeskTeamResults,
  FetchStagesResults,
  Stage,
  OdooRequestFilters,
} from 'definitions/schemas'

/**
 * Repository responsible for helpdesk data operations with Odoo.
 * Follows Single Responsibility Principle - only handles Odoo API interactions for helpdesk teams and stages.
 * Follows Dependency Inversion Principle - depends on abstractions (Odoo service functions).
 */
export class HelpdeskRepository {
  private readonly odooApiUrl: string
  private readonly logger: bp.Logger
  private readonly getCookie: () => Promise<string>

  constructor(odooApiUrl: string, logger: bp.Logger, getCookie: () => Promise<string>) {
    this.odooApiUrl = odooApiUrl
    this.logger = logger
    this.getCookie = getCookie
  }

  /**
   * Fetches all active helpdesk teams from Odoo.
   *
   * @returns Array of helpdesk teams with valid IDs (teams with null IDs are filtered out)
   */
  async getTeams(): Promise<HelpdeskTeam[]> {
    const cookie = await this.getCookie()
    const filters: OdooRequestFilters = [['active', '=', true]]
    const fields: string[] = ['name', 'id']

    const teams: FetchHelpdeskTeamResults = await executeOdooMethod({
      odooApiUrl: this.odooApiUrl,
      cookie,
      model: 'helpdesk.team',
      method: 'search_read',
      args: [filters, fields],
      logger: this.logger,
      schema: fetchHelpdeskTeamResultsSchema,
    })

    // Filter out teams with null IDs (Odoo data issue)
    const validTeams = teams.filter((team): team is HelpdeskTeam & { id: number } => {
      if (team.id === null) {
        this.logger.forBot().warn(`Skipping helpdesk team "${team.name}" with null ID`)
        return false
      }
      return true
    })

    this.logger
      .forBot()
      .info(`Fetched ${validTeams.length} helpdesk teams (${teams.length - validTeams.length} skipped due to null IDs)`)
    return validTeams
  }

  /**
   * Fetches ticket stages from Odoo, optionally filtered by team IDs.
   *
   * @param teamIds - Optional array of team IDs to filter stages
   * @returns Array of stages
   */
  async getStages(teamIds?: number[]): Promise<Stage[]> {
    const cookie = await this.getCookie()
    const filters: OdooRequestFilters = [['active', '=', true]]

    if (teamIds && teamIds.length > 0) {
      filters.push(['team_ids', 'in', teamIds])
    }

    const fields: string[] = ['name', 'id', 'team_ids']

    const rawStages: FetchStagesResults = await executeOdooMethod({
      odooApiUrl: this.odooApiUrl,
      cookie,
      model: 'helpdesk.stage',
      method: 'search_read',
      args: [filters, fields],
      logger: this.logger,
      schema: fetchStagesResultsSchema,
    })

    this.logger.forBot().info(`Fetched ${rawStages.length} stages`)

    return rawStages.map((stage) => ({
      name: stage.name,
      id: stage.id,
      teamIds: stage.team_ids,
    }))
  }
}

/**
 * Factory function to create a HelpdeskRepository instance.
 * This follows Dependency Inversion Principle by injecting dependencies.
 *
 * @param ctx - The Botpress context
 * @param logger - The logger instance
 * @returns A new HelpdeskRepository instance
 */
export function createHelpdeskRepository(ctx: bp.Context, logger: bp.Logger): HelpdeskRepository {
  return new HelpdeskRepository(ctx.configuration.odooApiUrl, logger, async () => {
    return getAuthenticatedCookie({ ...ctx.configuration, logger })
  })
}
