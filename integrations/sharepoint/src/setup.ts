import * as bp from '.botpress'
import { SharepointClient } from './SharepointClient'
import { SharepointSync } from './SharepointSync'

const getLibraryNames = (documentLibraryNames: string): string[] => {
  try {
    const parsed = JSON.parse(documentLibraryNames)
    if (Array.isArray(parsed)) {
      return parsed
    }
    return [parsed]
  } catch {
    return documentLibraryNames
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
  }
}

export const register: bp.IntegrationProps['register'] = async ({ ctx, webhookUrl, client, logger }) => {
  const libs = getLibraryNames(ctx.configuration.documentLibraryNames)
  const subscriptions: Record<string, { webhookSubscriptionId: string; changeToken: string }> = {}

  const clearedKbIds = new Set<string>()

  for (const lib of libs) {
    try {
      const spClient = new SharepointClient({ ...ctx.configuration }, lib)
      const spSync = new SharepointSync(spClient, client, logger, ctx.configuration.enableVision)

      logger.forBot().info(`[Registration] (${lib}) Creating webhook → ${webhookUrl}`)
      const webhookSubscriptionId = await spClient.registerWebhook(webhookUrl)

      logger.forBot().info(`[Registration] (${lib}) Performing initial full sync…`)
      await spSync.loadAllDocumentsIntoBotpressKB(clearedKbIds)

      const changeToken = await spClient.getLatestChangeToken()
      const tokenToUse = changeToken || 'initial-sync-token'

      subscriptions[lib] = { webhookSubscriptionId, changeToken: tokenToUse }

      logger.forBot().info(`[Registration] (${lib}) Successfully registered and synced.`)
    } catch (error) {
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
    payload: { subscriptions },
  })
}

export const unregister: bp.IntegrationProps['unregister'] = async ({ client, ctx, logger }) => {
  const { state } = await client.getState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
  })

  for (const [lib, { webhookSubscriptionId }] of Object.entries(state.payload.subscriptions as Record<string, any>)) {
    try {
      logger.forBot().info(`[Unregister] (${lib}) Deleting webhook ${webhookSubscriptionId}`)
      const spClient = new SharepointClient({ ...ctx.configuration }, lib)
      await spClient.unregisterWebhook(webhookSubscriptionId)
      logger.forBot().info(`[Unregister] (${lib}) Successfully unregistered.`)
    } catch (error) {
      logger
        .forBot()
        .error(
          `[Unregister] (${lib}) Failed to unregister: ${error instanceof Error ? error.message : String(error)}. Continuing with other libraries.`
        )
      continue
    }
  }
}
