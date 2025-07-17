import { Integration } from '../../.botpress'
import { getShopifyClient } from '../client'

type Implementation = ConstructorParameters<typeof Integration>[0]
type UnregisterFunction = Implementation['unregister']

export const unregister: UnregisterFunction = async ({ ctx, logger, webhookUrl }) => {
    const shopifyClient = getShopifyClient(ctx.configuration)
    const response = await shopifyClient.getWebhooks(webhookUrl)

    if (response.data.webhooks.length > 0) {
        for (const webhook of response.data.webhooks) {
          const webhookId = webhook.id
            await shopifyClient.deleteWebhook(webhookId.toString(), logger)
        }
      }
    logger.forBot().info('Shopify integration registered and products synced successfully')
}