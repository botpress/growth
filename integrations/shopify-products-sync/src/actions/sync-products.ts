// Action to sync Shopify products to Botpress table
import { Client } from '@botpress/client'
import { getShopifyClient } from '../client'
import { PRODUCT_TABLE_SCHEMA, ShopifyProduct } from '../schemas/products'
import * as bp from '.botpress'
import { stripHtmlTags } from '../misc/utils'
import { PRODUCTS_TABLE_NAME } from 'src/constants'
import { fetchAllProducts } from 'src/misc/shopify-products'

const syncProducts: bp.IntegrationProps['actions']['syncProducts'] = async (props) => {
  const { client, logger, input } = props
  const ctx = props.ctx.configuration
  const rowStorageFactor = input.rowStorageFactor || 1

  // this client is necessary for table operations
  const getVanillaClient = (client: bp.Client): Client => client._inner
  const botpressVanillaClient = getVanillaClient(client)

  const shopifyClient = getShopifyClient(ctx)

  try {
    const tableName = PRODUCTS_TABLE_NAME
    const tableSchema = PRODUCT_TABLE_SCHEMA

    logger.forBot().info(`Creating table with factor: ${input.rowStorageFactor}`)
    await botpressVanillaClient.getOrCreateTable({
      factor: rowStorageFactor,
      table: tableName,
      schema: tableSchema,
    })

    const allProducts = await fetchAllProducts(shopifyClient, logger)

    if (allProducts.length === 0) {
      logger.forBot().warn('No products found in Shopify store')
      return {
        success: true,
        message: 'No products found in Shopify store',
        productsCount: 0,
      }
    }

    logger.forBot().info(`Total products fetched: ${allProducts.length}`)

    const tableRows = allProducts.map((product: ShopifyProduct) => {
      // Create comprehensive product data for the aggregate column
      const productData = {
        product_id: product.id,
        name: product.title,
        sku: product.variants && product.variants[0]?.sku,
        price: product.variants && product.variants[0]?.price ? Number(product.variants[0].price) : undefined,
        weight: product.variants && product.variants[0]?.weight,
        type: product.product_type,
        brand_name: product.vendor,
        categories: product.tags,
        availability: product.status,
        is_visible: product.status === 'active',
        description: stripHtmlTags(product.body_html)?.substring(0, rowStorageFactor * 3000) || '',
        image_url: product.image?.src || (product.images && product.images[0]?.src) || '',
        url: `https://${ctx.shopDomain}/products/${product.handle}`
      }

      // Store only the required columns: product_id, url, and aggregate
      return {
        product_id: product.id,
        url: `https://${ctx.shopDomain}/products/${product.handle}`,
        aggregate: stripHtmlTags(JSON.stringify(productData)),
      }
    })

    try {
      logger.forBot().info('Dropping existing products table...')
      await botpressVanillaClient.deleteTable({
        table: tableName,
      })

      await botpressVanillaClient.getOrCreateTable({
        factor: rowStorageFactor,
        table: tableName,
        schema: tableSchema,
      })
    } catch (error) {
      logger.forBot().warn('Error dropping products table', error)
    }

    const BATCH_SIZE = 50
    const totalRows = tableRows.length
    let processedRows = 0

    while (processedRows < totalRows) {
      const batch = tableRows.slice(processedRows, processedRows + BATCH_SIZE)

      await botpressVanillaClient.createTableRows({
        table: tableName,
        rows: batch,
      })

      processedRows += batch.length
    }

    return {
      success: true,
      message: `Successfully synced ${allProducts.length} products from Shopify`,
      productsCount: allProducts.length,
    }
  } catch (error) {
    logger.forBot().error('Error syncing Shopify products', error instanceof Error ? error.message : String(error))
    return {
      success: false,
      message: `Error syncing Shopify products: ${error instanceof Error ? error.message : String(error)}`,
      productsCount: 0,
    }
  }
}

export default syncProducts
