import { deleteKbArticles } from 'src/misc/kb'
import { Integration } from '../../.botpress'
import { getShopifyClient } from '../client'

type Implementation = ConstructorParameters<typeof Integration>[0]
type UnregisterFunction = Implementation['unregister']

export const unregister: UnregisterFunction = async ({ ctx, logger, webhookUrl, client }) => {
  logger.forBot().info('Unregistering Shopify integration')

  await deleteKbArticles(ctx.configuration.knowledgeBaseId, client)

  const shopifyClient = getShopifyClient(ctx.configuration)
  const response = await shopifyClient.getWebhooks(webhookUrl)

  if (response.webhooks.length > 0) {
    for (const webhook of response.webhooks) {
      const webhookId = webhook.id
      await shopifyClient.deleteWebhook(webhookId.toString(), logger)
    }
  }
  logger.forBot().info('Shopify integration unregistered and products deleted successfully')
}
