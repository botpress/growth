import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import { SharepointClient } from './SharepointClient'
import { syncExcelFile } from './actions'

export default new bp.Integration({
  register: async ({ ctx, logger }) => {
    logger.forBot().info(`Registering SharePoint Excel integration for bot: ${ctx.botId}. Performing connection test.`)
    const spClient = new SharepointClient({
      primaryDomain: ctx.configuration.primaryDomain,
      siteName: ctx.configuration.siteName,
      clientId: ctx.configuration.clientId,
      tenantId: ctx.configuration.tenantId,
      thumbprint: ctx.configuration.thumbprint,
      privateKey: ctx.configuration.privateKey,
    })

    try {
      const siteId = await spClient.getSiteId()
      logger.forBot().info(`SharePoint connection test successful during registration. Site ID: ${siteId}`)
    } catch (error: any) {
      logger.forBot().error(`SharePoint connection test failed during registration: ${error.message}`, error.stack)
      throw new sdk.RuntimeError(`SharePoint connection validation failed during registration: ${error.message}`)
    }
  },

  unregister: async ({ ctx, logger }) => {
    logger.forBot().info(`Unregistering SharePoint Excel integration for bot: ${ctx.botId}`)
    // No cleanup needed for Excel integration
  },

  actions: {
    syncExcelFile,
  },

  handler: async ({}) => {},

  channels: {},
})
