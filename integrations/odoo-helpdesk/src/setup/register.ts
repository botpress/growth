import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import { safeSetState } from 'src/utils'
import { clearCookieCache } from 'src/services/odoo'
import { createHelpdeskRepository } from 'src/services/helpdeskRepository'

export const register: bp.IntegrationProps['register'] = async ({ ctx, client, logger }) => {
  try {
    logger.forBot().info(`Registering Odoo Helpdesk Integration`)

    // Invalidate cookie cache on config changes.
    await clearCookieCache({
      odooApiUrl: ctx.configuration.odooApiUrl,
      odooDb: ctx.configuration.odooDb,
      odooEmail: ctx.configuration.odooEmail,
      logger,
    })

    // Get the Odoo helpdesk teams and ticket stages.
    const repository = createHelpdeskRepository(ctx, logger)
    const helpdeskTeams = await repository.getTeams()
    logger.forBot().info(`Retrieved ${helpdeskTeams.length} helpdesk teams`)

    const stages = await repository.getStages(helpdeskTeams.map((team) => team.id))
    logger.forBot().info(`Retrieved ${stages.length} ticket stages`)

    // Store ticket stages in integration state.
    await safeSetState(
      client,
      {
        type: 'integration',
        name: 'helpdeskIntegrationInfo',
        id: ctx.integrationId,
        payload: { helpdeskIntegrationInfo: { helpdeskTeams, stages } },
      },
      logger
    )

    logger.forBot().info(`Odoo Helpdesk Integration registered successfully`)
  } catch (error) {
    logger.forBot().error(`Failed to register Odoo Helpdesk Integration`, error)
    throw new RuntimeError(
      `Failed to register Odoo Helpdesk Integration: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
