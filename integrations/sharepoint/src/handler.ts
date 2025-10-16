import * as bp from '.botpress'
import { SharepointClient } from './SharepointClient'
import { SharepointSync } from './SharepointSync'

export const handler: bp.IntegrationProps['handler'] = async ({ ctx, req, client, logger }) => {
  if (req.query.includes('validationtoken')) {
    const token = req.query.split('=')[1]
    return { status: 200, body: token }
  }

  const {
    state: { payload },
  } = await client.getState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
  })

  const oldSubs = payload.subscriptions as Record<string, { webhookSubscriptionId: string; changeToken: string }>
  const newSubs = { ...oldSubs }

  for (const [lib, { changeToken }] of Object.entries(oldSubs)) {
    try {
      const spClient = new SharepointClient({ ...ctx.configuration }, lib)
      const spSync = new SharepointSync(spClient, client, logger, ctx.configuration.enableVision)

      logger.forBot().info(`[Webhook] (${lib}) Running incremental sync…`)
      const newToken = await spSync.syncSharepointDocumentLibraryAndBotpressKB(changeToken)
      newSubs[lib]!.changeToken = newToken
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

  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: { subscriptions: newSubs },
  })

  return { status: 200, body: 'OK' }
}
