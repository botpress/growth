import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'

import { SharepointClient } from './SharepointClient'
import { SharepointSync } from './SharepointSync'

const getLibraryNames = (cfg: any): string[] => {
  try {
    return JSON.parse(cfg.documentLibraryNames)
  } catch {
    return cfg.documentLibraryNames
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
  }
}

export default new bp.Integration({
  register: async ({ ctx, webhookUrl, client, logger }) => {
    const libs = getLibraryNames(ctx.configuration)
    const subscriptions: Record<string, { webhookSubscriptionId: string; changeToken: string }> = {}

    for (const lib of libs) {
      const spClient = new SharepointClient({ ...ctx.configuration }, lib)
      const spSync = new SharepointSync(spClient, client, logger, ctx.configuration.enableVision)

      logger.forBot().info(`[Registration] (${lib}) Creating webhook → ${webhookUrl}`)
      const webhookSubscriptionId = await spClient.registerWebhook(webhookUrl)

      logger.forBot().info(`[Registration] (${lib}) Performing initial full sync…`)
      await spSync.loadAllDocumentsIntoBotpressKB()

      const changeToken = await spClient.getLatestChangeToken()
      if (!changeToken) {
        throw new sdk.RuntimeError(`(${lib}) Ensure document library has at least one file.`)
      }

      subscriptions[lib] = { webhookSubscriptionId, changeToken }
    }

    await client.setState({
      type: 'integration',
      name: 'configuration',
      id: ctx.integrationId,
      payload: { subscriptions },
    })
  },

  unregister: async ({ client, ctx, logger }) => {
    const { state } = await client.getState({
      type: 'integration',
      name: 'configuration',
      id: ctx.integrationId,
    })

    for (const [lib, { webhookSubscriptionId }] of Object.entries(state.payload.subscriptions as Record<string, any>)) {
      logger.forBot().info(`[Unregister] (${lib}) Deleting webhook ${webhookSubscriptionId}`)
      const spClient = new SharepointClient({ ...ctx.configuration }, lib)
      await spClient.unregisterWebhook(webhookSubscriptionId)
    }
  },

  actions: {},

  handler: async ({ ctx, req, client, logger }) => {
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
      const spClient = new SharepointClient({ ...ctx.configuration }, lib)
      const spSync = new SharepointSync(spClient, client, logger, ctx.configuration.enableVision)

      logger.forBot().info(`[Webhook] (${lib}) Running incremental sync…`)
      const newToken = await spSync.syncSharepointDocumentLibraryAndBotpressKB(changeToken)
      newSubs[lib]!.changeToken = newToken // non‑null assertion OK – lib is guaranteed
    }

    /* 3 - Persist updated change tokens */
    await client.setState({
      type: 'integration',
      name: 'configuration',
      id: ctx.integrationId,
      payload: { subscriptions: newSubs },
    })

    return { status: 200, body: 'OK' }
  },

  channels: {},
})
