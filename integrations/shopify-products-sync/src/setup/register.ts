import { RuntimeError } from '@botpress/sdk'
import { getShopifyClient } from '../client'
import * as bp from '.botpress'
import actions from '../actions'
import { Integration, IntegrationProps } from '../../.botpress'
import { SHOPIFY_WEBHOOK_TOPICS } from '../constants'

type IntegrationLogger = Parameters<IntegrationProps['handler']>[0]['logger']
type Implementation = ConstructorParameters<typeof Integration>[0]
type RegisterFunction = Implementation['register']
type IntegrationContext = Parameters<RegisterFunction>[0]['ctx']

async function syncKb(ctx: IntegrationContext, client: bp.Client, logger: IntegrationLogger) {
  logger.forBot().info('Syncing Shopify products to BP KB for shop:', ctx.configuration.shopDomain)
  await actions.syncKb({
    ctx,
    client,
    logger,
    input: {
      knowledgeBaseId: ctx.configuration.knowledgeBaseId,
    },
    type: 'syncKb',
    metadata: { setCost: (_cost: number) => {} },
  })
  logger.forBot().info('KB sync complete for shop:', ctx.configuration.shopDomain)
}

async function setupWebhooks(ctx: IntegrationContext, logger: IntegrationLogger, webhookUrl: string) {
  const shopifyClient = getShopifyClient(ctx.configuration)
  logger.forBot().info(`Setting up webhooks for shop: ${ctx.configuration.shopDomain}, bot: ${ctx.botId}`)
  await Promise.all(
    SHOPIFY_WEBHOOK_TOPICS.map(async (topic) => {
      try {
        await shopifyClient.createWebhook({
          topic,
          webhookUrl,
          topicReadable: topic.replace('/', ' '),
          botId: ctx.botId,
          logger,
        })
        logger
          .forBot()
          .info(`Webhook for topic "${topic}" created for shop: ${ctx.configuration.shopDomain}, bot: ${ctx.botId}`)
      } catch (e) {
        logger
          .forBot()
          .error(
            `Error creating webhook for topic "${topic}" on shop: ${ctx.configuration.shopDomain}, bot: ${ctx.botId}: ${JSON.stringify(e)}`
          )
      }
    })
  )
  logger.forBot().info('All webhooks setup complete.')
}

export const register: RegisterFunction = async ({ ctx, logger, webhookUrl, client }) => {
  try {
    await syncKb(ctx, client, logger)
    await setupWebhooks(ctx, logger, webhookUrl)
    logger
      .forBot()
      .info(
        `Shopify integration registered and products synced successfully for shop: ${ctx.configuration.shopDomain}, bot: ${ctx.botId}`
      )
  } catch (error) {
    throw new RuntimeError(
      `Error during registration for shop: ${ctx.configuration.shopDomain}, bot: ${ctx.botId}: ${JSON.stringify(error)}`
    )
  }
}
