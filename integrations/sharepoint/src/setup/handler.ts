import * as bp from '.botpress'
import { SharepointClient } from '../SharepointClient'
import { SharepointSync } from '../services/sync/SharepointSync'

export const handler: bp.IntegrationProps['handler'] = async ({ ctx, req, client, logger }) => {
  /* 0 - Validation ping from SharePoint */
  if (req.query.includes('validationtoken')) {
    const token = req.query.split('=')[1]
    return { status: 200, body: token }
  }

  /* 1 - Load per‑library state */
  const {
    state: { payload },
  } = await client.getState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
  })

  const oldSubs = payload.subscriptions as Record<string, { webhookSubscriptionId: string; changeToken: string }>
  const newSubs = { ...oldSubs }

  /* 2 - Iterate through each library, perform incremental sync */
  for (const [lib, { changeToken }] of Object.entries(oldSubs)) {
    try {
      const spClient = new SharepointClient({ ...ctx.configuration }, lib)
      const spSync = new SharepointSync(spClient, client, logger, ctx.configuration.enableVision)

      logger.forBot().info(`[Webhook] (${lib}) Running incremental sync…`)
      const newToken = await spSync.syncSharepointDocumentLibraryAndBotpressKB(changeToken)
      newSubs[lib]!.changeToken = newToken // non‑null assertion OK – lib is guaranteed
      logger.forBot().info(`[Webhook] (${lib}) Successfully synced.`)
    } catch (error) {
      logger
        .forBot()
        .error(
          `[Webhook] (${lib}) Failed to sync: ${error instanceof Error ? error.message : String(error)}. Skipping this library.`
        )
      continue
    }
  }

  /* 3 - Persist updated change tokens */
  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: { subscriptions: newSubs },
  })

  return { status: 200, body: 'OK' }
}
