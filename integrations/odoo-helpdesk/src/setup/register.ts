import * as bp from '.botpress'
import { getHelpdeskTeams, getStages } from 'src/setup/helpdesk'

export const register: bp.IntegrationProps['register'] = async ({ ctx, client, logger }) => {
  logger.forBot().info(`Registering Odoo Helpdesk Integration...`)

  // Get the Odoo helpdesk teams and ticket stages
  const { helpdeskTeams } = await getHelpdeskTeams({ ctx, logger })
  const { stages } = await getStages({ ctx, input: { teamIds: helpdeskTeams.map((team) => team.id) }, logger })

  // Store ticket stages in integration state
  await client.getOrSetState({
    type: 'integration',
    name: 'helpdeskIntegrationInfo',
    id: ctx.integrationId,
    payload: { helpdeskIntegrationInfo: { helpdeskTeams, stages } },
  })

  logger.forBot().info(`Odoo Helpdesk Integration registered successfully`)
}
