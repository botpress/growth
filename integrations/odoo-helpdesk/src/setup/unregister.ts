import * as bp from '.botpress'
import { clearCookieCache } from 'src/services/odoo'

export const unregister: bp.IntegrationProps['unregister'] = async ({ logger, client, ctx }) => {
  logger.forBot().info(`Unregistering Odoo Helpdesk Integration...`)
  await client.setState({
    type: 'integration',
    name: 'helpdeskIntegrationInfo',
    id: ctx.integrationId,
    payload: {
      helpdeskIntegrationInfo: {
        helpdeskTeams: [],
        stages: [],
      },
    },
  })
  logger.forBot().info(`Cleared Integration State`)
  await clearCookieCache({
    odooApiUrl: ctx.configuration.odooApiUrl,
    odooDb: ctx.configuration.odooDb,
    odooEmail: ctx.configuration.odooEmail,
    logger,
  })
  logger.forBot().info(`Odoo Helpdesk Integration unregistered successfully`)
}
