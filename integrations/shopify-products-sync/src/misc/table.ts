import { Client } from '@botpress/client'
import * as bp from '.botpress'
import { PRODUCTS_TABLE_NAME } from '../constants'
import { PRODUCT_TABLE_SCHEMA, ShopifyProduct } from '../schemas/products'
import { stripHtmlTags } from './utils'
import { IntegrationLogger } from '@botpress/sdk'

// Get the vanilla Botpress client for table operations
const getVanillaClient = (client: bp.Client): Client => client._inner

export const createTableRow = async (client: bp.Client, product: ShopifyProduct, shopDomain: string, rowStorageFactor: number = 1, logger: IntegrationLogger) => {
  const botpressVanillaClient = getVanillaClient(client)  

  logger.forBot().info(`Table row creation requested for product ${product.id}`)
  
  try {
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
      url: `https://${shopDomain}/products/${product.handle}`
    }

    // Store only the required columns: product_id, url, and aggregate
    const tableRow = {
      product_id: product.id,
      aggregate: stripHtmlTags(JSON.stringify(productData)),
    }

    await botpressVanillaClient.createTableRows({
      table: PRODUCTS_TABLE_NAME,
      rows: [tableRow],
    })

    logger.forBot().info(`Successfully created table row for product ${product.id}`)
  } catch (error) {
    logger.forBot().error(`Error creating table row for product ${product.id}: ${error}`)
    throw error
  }
}

export const deleteTableRow = async (client: bp.Client, productId: number, logger: IntegrationLogger) => {
  const botpressVanillaClient = getVanillaClient(client)
  
  try {
    const { rows } = await botpressVanillaClient.findTableRows({
      table: PRODUCTS_TABLE_NAME,
      filter: { product_id: productId },
    })

    logger.forBot().info(`Table row deletion requested for product ${productId}`)

    if (rows.length > 0 && rows[0]?.id) {
      await botpressVanillaClient.deleteTableRows({
        table: PRODUCTS_TABLE_NAME,
        ids: [rows[0].id],
      })

      logger.forBot().info(`Successfully deleted table row for product ${productId}`)
      return {
        success: true,
        message: `Product ${productId} deleted successfully`,
      }
    } else {
      logger.forBot().warn(`Product ID ${productId} not found for deletion`)
      return {
        success: true,
        message: `Product ${productId} not found for deletion`,
      }
    }
  } catch (error) {
    logger.forBot().error(`Error deleting table row for product ${productId}: ${error}`)
    return {
      success: false,
      message: `Error deleting product ${productId}: ${error}`,
    }
  }
}

export const updateTableRow = async (client: bp.Client, product: ShopifyProduct, shopDomain: string, rowStorageFactor: number = 1, logger: IntegrationLogger) => {
  // For updates, we delete the old row and create a new one
  logger.forBot().info(`Table row update requested for product ${product.id}`)
  
  try {
    await deleteTableRow(client, product.id, logger)
    await createTableRow(client, product, shopDomain, rowStorageFactor, logger)
    logger.forBot().info(`Successfully updated table row for product ${product.id}`)
  } catch (error) {
    logger.forBot().error(`Error updating table row for product ${product.id}: ${error}`)
    throw error
  }
}

export const ensureTableExists = async (client: bp.Client, rowStorageFactor: number = 1) => {
  const botpressVanillaClient = getVanillaClient(client)
  
  try {
    await botpressVanillaClient.getOrCreateTable({
      factor: rowStorageFactor,
      table: PRODUCTS_TABLE_NAME,
      schema: PRODUCT_TABLE_SCHEMA,
    })
  } catch (error) {
    console.error(`Error ensuring table exists: ${error}`)
    throw error
  }
} 