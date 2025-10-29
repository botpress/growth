import * as bp from '.botpress'
import { SharepointClient } from '../SharepointClient'
import { SharepointSync } from '../services/sync/SharepointSync'
import { cleanupWebhook, getLibraryNames } from './utils'

export const register: bp.IntegrationProps['register'] = async ({ ctx, webhookUrl, client, logger }) => {
  const libs = getLibraryNames(ctx.configuration.documentLibraryNames)
  const subscriptions: Record<string, { webhookSubscriptionId: string; changeToken: string }> = {}

  const clearedKbIds = new Set<string>()

  for (const lib of libs) {
    let webhookSubscriptionId: string | undefined
    try {
      const spClient = new SharepointClient({ ...ctx.configuration }, lib)
      const spSync = new SharepointSync(spClient, client, logger, ctx.configuration.enableVision, ctx)

      logger.forBot().info(`[Registration] (${lib}) Creating webhook → ${webhookUrl}`)
      webhookSubscriptionId = await spClient.registerWebhook(webhookUrl)

      logger.forBot().info(`[Registration] (${lib}) Performing initial full sync…`)
      await spSync.loadAllDocumentsIntoBotpressKB({ clearedKbIds })

      const changeToken = await spClient.getLatestChangeToken()
      const tokenToUse = changeToken || 'initial-sync-token'

      subscriptions[lib] = { webhookSubscriptionId, changeToken: tokenToUse }

      logger.forBot().info(`[Registration] (${lib}) Successfully registered and synced.`)
    } catch (error) {
      await cleanupWebhook(webhookSubscriptionId, ctx, lib, logger)
      logger
        .forBot()
        .error(
          `[Registration] (${lib}) Failed to register: ${error instanceof Error ? error.message : String(error)}. Skipping this library.`
        )
      continue
    }
  }

  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: { subscriptions, folderKbMap: ctx.configuration.folderKbMap },
  })
}
