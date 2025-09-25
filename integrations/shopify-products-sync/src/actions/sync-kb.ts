import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import { getShopifyClient } from '../client'
import { fetchAllProducts } from 'src/misc/shopify-products'
import { deleteKbArticles, getUploadArticlePayload } from 'src/misc/kb'

const syncKb: bp.IntegrationProps['actions']['syncKb'] = async ({ ctx, client, logger, input }) => {
  try {
    const kbId = input.knowledgeBaseId

    await deleteKbArticles(kbId, client)

    const productsCount = await uploadProductsToKb({ ctx, client, logger, kbId })

    return {
      success: true,
      message: 'Successfully synced Shopify products to BP KB',
      productsCount: productsCount || 0,
    }
  } catch (error) {
    throw new sdk.RuntimeError(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`)
  }
}

export const uploadProductsToKb = async (props: {
  ctx: bp.Context
  client: bp.Client
  logger: bp.Logger
  kbId: string
}) => {
  const { ctx, client, logger, kbId } = props

  logger.forBot().info('Attempting to sync Shopify products to BP KB')

  const shopifyClient = getShopifyClient(ctx.configuration)
  const allProducts = await fetchAllProducts(shopifyClient, logger)

  const productsCount = allProducts.length

  try {
    for (const product of allProducts) {
      const payload = getUploadArticlePayload({ kbId, product, shopDomain: ctx.configuration.shopDomain })
      await client.uploadFile(payload)

      logger.forBot().info(`Successfully uploaded article ${product.title} to BP KB`)
    }
  } catch (error) {
    logger
      .forBot()
      .error(
        `Error uploading article to BP KB: ${error instanceof Error ? error.message : 'An unknown error occurred'}`
      )
    logger.forBot().error(JSON.stringify(error))
    return
  }

  logger.forBot().info('Successfully synced Shopify products to BP KB')

  return productsCount
}

export default syncKb
