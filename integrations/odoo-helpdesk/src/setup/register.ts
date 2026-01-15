import * as bp from '.botpress'
import { getHelpdeskTeams, getStages } from 'src/setup/helpdesk'
import { RuntimeError } from '@botpress/sdk'

export const register: bp.IntegrationProps['register'] = async ({ ctx, client, logger }) => {
  try {
    logger.forBot().info(`Registering Odoo Helpdesk Integration...`)

    // Get the Odoo helpdesk teams and ticket stages
    const { helpdeskTeams } = await getHelpdeskTeams({ ctx, logger })
    logger.forBot().info(`Odoo helpdesk teams: ${JSON.stringify(helpdeskTeams)}`)
    const { stages } = await getStages({ ctx, input: { teamIds: helpdeskTeams.map((team) => team.id) }, logger })
    logger.forBot().info(`Odoo ticket stages: ${JSON.stringify(stages)}`)

    // Store ticket stages in integration state
    await client.getOrSetState({
      type: 'integration',
      name: 'helpdeskIntegrationInfo',
      id: ctx.integrationId,
      payload: { helpdeskIntegrationInfo: { helpdeskTeams, stages } },
    })

    logger.forBot().info(`Odoo Helpdesk Integration registered successfully`)
  } catch (error) {
    logger.forBot().error(`Failed to register Odoo Helpdesk Integration`, error)
    throw new RuntimeError(
      `Failed to register Odoo Helpdesk Integration: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
