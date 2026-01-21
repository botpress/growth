import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import { clearCookieCache } from 'src/services/odoo'
import { safeSetState } from 'src/utils'

export const unregister: bp.IntegrationProps['unregister'] = async ({ logger, client, ctx }) => {
  logger.forBot().info(`Unregistering Odoo Helpdesk Integration`)

  await safeSetState(client, {
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

  logger.forBot().info(`Cleared integration state`)

  await clearCookieCache({
    odooApiUrl: ctx.configuration.odooApiUrl,
    odooDb: ctx.configuration.odooDb,
    odooEmail: ctx.configuration.odooEmail,
    logger,
  })

  logger.forBot().info(`Odoo Helpdesk Integration unregistered successfully`)
}
