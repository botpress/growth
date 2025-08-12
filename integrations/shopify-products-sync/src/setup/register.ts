import { Client } from '@botpress/client'
import { RuntimeError } from '@botpress/sdk'
import { getShopifyClient } from '../client'
import * as bp from '.botpress'
import actions from '../actions'
import { Integration, IntegrationProps } from '../../.botpress'
import { PRODUCTS_TABLE_NAME, SHOPIFY_WEBHOOK_TOPICS } from '../constants'
import { PRODUCT_TABLE_SCHEMA } from 'src/schemas/products'

type IntegrationLogger = Parameters<IntegrationProps['handler']>[0]['logger']
type Implementation = ConstructorParameters<typeof Integration>[0]
type RegisterFunction = Implementation['register']
type IntegrationContext = Parameters<RegisterFunction>[0]['ctx']

const getVanillaClient = (client: bp.Client): Client => client._inner

async function setupTable(client: bp.Client, logger: IntegrationLogger) {
  const botpressVanillaClient = getVanillaClient(client)
  logger.forBot().info('Creating or updating products table...')
  await botpressVanillaClient.getOrCreateTable({
    table: PRODUCTS_TABLE_NAME,
    schema: PRODUCT_TABLE_SCHEMA,
  })
  logger.forBot().info('Products table ready.')
}

async function syncProducts(ctx: IntegrationContext, client: bp.Client, logger: IntegrationLogger) {
  logger.forBot().info('Syncing Shopify products for shop:', ctx.configuration.shopDomain)
  await actions.syncProducts({
    ctx,
    client,
    logger,
    input: {},
    type: 'syncProducts',
    metadata: { setCost: (_cost: number) => {} },
  })
  logger.forBot().info('Product sync complete for shop:', ctx.configuration.shopDomain)
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
          logger
        })
        logger.forBot().info(`Webhook for topic "${topic}" created for shop: ${ctx.configuration.shopDomain}, bot: ${ctx.botId}`)
      } catch (e) {
        logger.forBot().error(`Error creating webhook for topic "${topic}" on shop: ${ctx.configuration.shopDomain}, bot: ${ctx.botId}: ${JSON.stringify(e)}`)
      }
    })
  )
  logger.forBot().info('All webhooks setup complete.')
}

export const register: RegisterFunction = async ({ ctx, logger, webhookUrl, client }) => {
  try {
    await setupTable(client, logger)
    await syncProducts(ctx, client, logger)
    await setupWebhooks(ctx, logger, webhookUrl)
    logger.forBot().info(`Shopify integration registered and products synced successfully for shop: ${ctx.configuration.shopDomain}, bot: ${ctx.botId}`)
  } catch (error) {
    throw new RuntimeError(`Error during registration for shop: ${ctx.configuration.shopDomain}, bot: ${ctx.botId}: ${JSON.stringify(error)}`)
  }
}
