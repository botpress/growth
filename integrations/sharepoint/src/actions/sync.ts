import * as bp from '.botpress'
import { SharepointSync } from 'src/services/sync/SharepointSync'
import { getLibraryNames } from 'src/setup/utils'
import { SharepointClient } from 'src/SharepointClient'

export const addToSync: bp.Integration['actions']['addToSync'] = async ({ client, ctx, input, logger }) => {
  // setup
  const webhookUrl = `https://webhook.botpress.cloud/${ctx.webhookId}`

  // prev state
  const { state } = await client.getState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
  })

  const subscriptions = (state.payload?.subscriptions ?? {}) as Record<
    string,
    { webhookSubscriptionId: string; changeToken: string }
  >
  const libs = getLibraryNames(input.documentLibraryNames)

  const clearedKbIds = new Set<string>()

  // filter to not repeat existing webhooks
  const nonExistingLibs = libs.filter((lib) => !subscriptions[lib])

  const newSubscriptions: Record<string, { webhookSubscriptionId: string; changeToken: string }> = {}

  // create webhooks for each of the new document libraries
  for (const newLib of nonExistingLibs) {
    try {
      const spClient = new SharepointClient({ ...ctx.configuration }, newLib)
      const spSync = new SharepointSync(spClient, client, logger, ctx.configuration.enableVision)

      logger.forBot().info(`[Action] (${newLib}) Creating webhook → ${webhookUrl}`)
      const webhookSubscriptionId = await spClient.registerWebhook(webhookUrl)

      logger.forBot().info(`[Action] (${newLib}) Performing initial full sync…`)
      await spSync.loadAllDocumentsIntoBotpressKB(clearedKbIds)

      const changeToken = await spClient.getLatestChangeToken()
      const tokenToUse = changeToken || 'initial-sync-token'

      newSubscriptions[newLib] = { webhookSubscriptionId, changeToken: tokenToUse }

      logger.forBot().info(`[Action] (${newLib}) Successfully registered and synced.`)
    } catch (error) {
      logger
        .forBot()
        .error(
          `[Action] (${newLib}) Failed to register: ${error instanceof Error ? error.message : String(error)}. Skipping this library.`
        )
      continue
    }
  }

  // conbine and set all subscriptioins to state for cleanup
  const mergedSubscriptions = {
    ...subscriptions,
    ...newSubscriptions,
  }

  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: { subscriptions: mergedSubscriptions },
  })

  return {
    success: true,
  }
}
