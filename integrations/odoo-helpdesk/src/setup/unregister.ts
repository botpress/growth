import * as bp from '.botpress'

export const unregister: bp.IntegrationProps['unregister'] = async ({ logger }) => {
  logger.forBot().info(`Unregistering Odoo Helpdesk Integration...`)
  logger.forBot().info(`Odoo Helpdesk Integration unregistered successfully`)
}
