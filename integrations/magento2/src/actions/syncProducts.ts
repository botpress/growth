import axios from 'axios'
import crypto from 'crypto'
import OAuth from 'oauth-1.0a'
import * as bp from '.botpress'
import {
  ProductAttributeSchema,
  ProductListSchema,
  StockItemSchema,
  ReviewsArraySchema,
  ProductData,
} from '../misc/zod-schemas'
import { getMagentoClient, apiCallWithRetry, MagentoClient } from '../magentoClient'
import { processFilters, AttributeMapping } from '../misc/filter-processor'

function toMagentoAttributeCode(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_') // spaces to underscores
    .replace(/[^a-z0-9_]/g, '') // remove non-alphanumeric/underscore
}

// Core sync logic that can be called directly
export async function syncProductsCore({ ctx, input, logger }: { ctx: any, input: any, logger: any }) {
  const {
    magento_domain,
    consumer_key,
    consumer_secret,
    access_token,
    access_token_secret,
    user_agent,
    botpress_pat,
  } = ctx.configuration

  const {
    table_name,
    custom_columns_to_add_to_table,
    filters_json,
    retreive_reviews,
    // Recursive inputs
    _currentPage,
    _totalCount,
    _tableId,
    _runId,
    _customAttributeCodes,
    _attributeMappings,
    _filterCriteria,
    _currentPageProductIndex,
  } = input as any

  const log = logger.forBot()
  const runId = _runId || crypto.randomUUID()
  log.info(`-> Starting Magento2 product sync (run ID: ${runId})`)

  // Parse _attributeMappings from JSON string if needed
  let attributeMappings: AttributeMapping = {};
  if (typeof _attributeMappings === 'string') {
    try {
      attributeMappings = JSON.parse(_attributeMappings);
    } catch (e) {
      log.warn('Failed to parse _attributeMappings JSON string', e);
    }
  } else if (typeof _attributeMappings === 'object' && _attributeMappings !== null) {
    attributeMappings = _attributeMappings;
  }

  const MAX_EXECUTION_TIME_MS = 28000 // 28s to leave a buffer
  const startTime = Date.now()
  log.debug(`Sync start timestamp: ${new Date(startTime).toISOString()}`)

  const apiBaseUrl = 'https://api.botpress.cloud/v1/tables'
  const httpHeaders = {
    Authorization: `bearer ${botpress_pat}`,
    'x-bot-id': ctx.botId,
    'Content-Type': 'application/json',
  }

  try {
    let tableId = _tableId
    let tableSchema: any = null
    let customAttributeCodes: string[] = _customAttributeCodes
    let filterCriteria = _filterCriteria

    const isInitialRun = !_tableId

    const magentoClient = getMagentoClient(ctx.configuration)

    if (isInitialRun) {
      log.info('Initial run detected. Setting up table and attributes.')
      customAttributeCodes = (custom_columns_to_add_to_table || '')
        .split(',')
        .map((attr: string) => toMagentoAttributeCode(attr))
        .filter((attr: string) => attr.length > 0)
      log.info(`Custom attributes to sync: ${customAttributeCodes.join(', ')}`)

      if (filters_json) {
        try {
          const { filterCriteria: processedFilterCriteria, attributeMappings: filterAttributeMappings } = await processFilters(filters_json, {
            magentoClient,
            logger: log
          })
          
          filterCriteria = processedFilterCriteria
          // Merge filter attribute mappings with existing ones
          Object.assign(attributeMappings, filterAttributeMappings)
        } catch (err) {
          return { success: false, synced_count: 0, total_count: 0, table_name, error: err instanceof Error ? err.message : 'Unknown error', status: 'Failed' }
        }
      }

      log.info(`Setting up Botpress table: ${table_name}`)
      const listTablesResponse = await apiCallWithRetry(() => axios.get(apiBaseUrl, { headers: httpHeaders }), log)
      const existingTables = listTablesResponse.data.tables || []
      let foundTable = existingTables.find((t: { id: string; name: string }) => t.name === table_name)

      if (!foundTable) {
        log.info(`Table ${table_name} not found. Creating it.`)
        const defaultProperties: Record<string, { type: string }> = {
          sku: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          original_price: { type: 'number' },
          currency: { type: 'string' },
          image_url: { type: 'string' },
          thumbnail_url: { type: 'string' },
          stock_qty: { type: 'number' },
          is_in_stock: { type: 'boolean' },
          average_rating: { type: 'number' },
          review_count: { type: 'number' },
        }
        for (const attrCode of customAttributeCodes) {
          defaultProperties[attrCode] = { type: 'string' }
        }
        if (Object.keys(defaultProperties).length > 20) {
          const error = `Too many columns: ${Object.keys(defaultProperties).length}. Max is 20.`
          log.error(error)
          return { success: false, synced_count: 0, total_count: 0, table_name, error, status: 'Failed' }
        }
        const createTablePayload = { name: table_name, schema: { type: 'object', properties: defaultProperties } }
        const createTableResponse = await apiCallWithRetry(() => axios.post(apiBaseUrl, createTablePayload, { headers: httpHeaders }), log)
        tableId = createTableResponse.data.table.id
        tableSchema = createTableResponse.data.table.schema
        log.info(`Table ${table_name} created with ID: ${tableId}`)
      } else {
        tableId = foundTable.id
        log.info(`Found existing table ${table_name} (ID: ${tableId})`)
      }

      log.info(`Clearing existing rows from table ${table_name}`)
      await apiCallWithRetry(() => axios.post(`${apiBaseUrl}/${tableId}/rows/delete`, { deleteAllRows: true }, { headers: httpHeaders }), log)
      log.info('Successfully cleared existing rows')

      if (customAttributeCodes.length > 0) {
        log.info('Fetching attribute mappings for custom attributes')
        for (const attrCode of customAttributeCodes) {
          try {
            const attribute = await magentoClient.getAttribute(attrCode, log)
            const parsedAttribute = ProductAttributeSchema.parse(attribute)

            if (parsedAttribute.options && parsedAttribute.options.length > 0) {
              attributeMappings[attrCode] = {}
              for (const option of parsedAttribute.options) {
                attributeMappings[attrCode][option.value] = option.label
              }
              log.info(`Mapped ${parsedAttribute.options.length} options for attribute ${attrCode}`)
            }
          } catch (error) {
            const errorMessage = `Failed to get attribute mapping for ${attrCode}: ${error instanceof Error ? error.message : 'Unknown error'}`
            log.error(errorMessage, error)
            return { success: false, synced_count: 0, total_count: 0, table_name, error: errorMessage, status: 'Failed' }
          }
        }
      }
    }

    let currentPage = _currentPage || 1
    let totalCount = _totalCount || 0
    let hasMorePages = true
    let currentPageProductIndex = _currentPageProductIndex || 0

    while (hasMorePages) {
      if (Date.now() - startTime >= MAX_EXECUTION_TIME_MS) {
        const elapsedNow = Date.now() - startTime
        log.info(`Execution time limit approaching after ${elapsedNow}ms. Triggering webhook to continue sync on next run.`)
        break;
      }

      const pageSize = 50
      const searchCriteria = `searchCriteria[pageSize]=${pageSize}&searchCriteria[currentPage]=${currentPage}${filterCriteria ? `&${filterCriteria}` : ''}`

      const productsResponse = await magentoClient.getProducts(searchCriteria, log)
      const parsed = ProductListSchema.parse(productsResponse)

      const products = parsed.items
      if (currentPage === 1 && isInitialRun) {
        totalCount = parsed.total_count
        log.info(`Total products to sync: ${totalCount}`)
      }
      
      if (products.length === 0) {
        log.warn('No more products found to sync.')
        hasMorePages = false
        continue
      }
      
      const remainingProductsInPage = products.length - currentPageProductIndex
      log.info(`Processing ${remainingProductsInPage} remaining products from page ${currentPage} (starting from index ${currentPageProductIndex})`)
      
      if (!tableSchema) {
        const tableDetailsResponse = await apiCallWithRetry(() => axios.get(`${apiBaseUrl}/${tableId}`, { headers: httpHeaders }), log)
        tableSchema = tableDetailsResponse.data.table?.schema
      }
      const availableColumns = Object.keys(tableSchema.properties)

      const rowsToInsert = await processProducts(retreive_reviews, products.slice(currentPageProductIndex), {
        logger: log,
        magento_domain,
        magentoClient,
        availableColumns,
        customAttributeCodes,
        attributeMappings,
        tableSchema,
        startTime,
        MAX_EXECUTION_TIME_MS,
        onTimeLimit: () => {
          log.info(`Time limit reached while processing products. Will resume from current position.`)
          return true
        },
      })

      if (rowsToInsert.length > 0) {
        log.info(`Inserting ${rowsToInsert.length} rows into table ${table_name}`)
        await apiCallWithRetry(() => axios.post(`${apiBaseUrl}/${tableId}/rows`, { rows: rowsToInsert }, { headers: httpHeaders }), log)
        log.info(`Successfully inserted rows for page ${currentPage}`)
        const elapsed = Date.now() - startTime
        log.debug(`Elapsed time so far: ${elapsed}ms (remaining: ${MAX_EXECUTION_TIME_MS - elapsed}ms)`)
      }

      currentPageProductIndex += rowsToInsert.length
      
      if (currentPageProductIndex >= products.length) {
        currentPage++
        currentPageProductIndex = 0
      }
      
      const currentSyncedCount = ((currentPage - 1) * pageSize) + currentPageProductIndex
      hasMorePages = currentSyncedCount < totalCount
      
      if (Date.now() - startTime >= MAX_EXECUTION_TIME_MS) {
        log.info(`Time limit reached after processing page ${currentPage} (product index: ${currentPageProductIndex}). Breaking to trigger webhook.`)
        break;
      }
    }

    if (hasMorePages) {
      log.info('Time limit reached. Creating magentoSyncContinue webhook for next batch.')
      
      // Check if webhookId is available
      if (!ctx.webhookId) {
        log.error('No webhook ID available. Cannot continue sync automatically.')
        return {
          success: false,
          synced_count: ((currentPage - 1) * 50) + currentPageProductIndex,
          total_count: totalCount,
          table_name,
          error: 'No webhook ID available for continuation',
          status: 'Failed - No Webhook'
        }
      }
      
      try {
        const webhookUrl = `https://webhook.botpress.cloud/${ctx.webhookId}`
        log.info(`Attempting to call webhook: ${webhookUrl}`)
        
        const payload = {
          type: 'magentoSyncContinue',
          data: {
            ...input,
            _currentPage: currentPage,
            _totalCount: totalCount,
            _tableId: tableId,
            _runId: runId,
            _customAttributeCodes: customAttributeCodes,
            _attributeMappings: typeof _attributeMappings === 'string' ? _attributeMappings : JSON.stringify(attributeMappings),
            _filterCriteria: filterCriteria,
            _currentPageProductIndex: currentPageProductIndex,
          }
        };

        log.info(`Webhook payload: ${JSON.stringify(payload)}`)
        const response = await axios.post(webhookUrl, payload)
        log.info(`Webhook response status: ${response.status}`)

        log.info('Successfully called webhook to continue sync.')
      } catch (err: any) {
        log.error('Failed to call webhook to continue sync.', err)
        if (axios.isAxiosError(err)) {
          log.error(`Webhook HTTP Status: ${err.response?.status}`)
          log.error(`Webhook Response: ${JSON.stringify(err.response?.data)}`)
          log.error(`Webhook URL: ${err.config?.url}`)
        }
      }
      return {
        success: true,
        synced_count: ((currentPage - 1) * 50) + currentPageProductIndex,
        total_count: totalCount,
        table_name,
        status: 'In Progress'
      }
    }

    const totalElapsed = Date.now() - startTime
    log.info(`Sync completed successfully in ${totalElapsed}ms. Total products synced: ${totalCount}`)
    return {
      success: true,
      synced_count: totalCount,
      total_count: totalCount,
      table_name,
      status: 'Completed'
    }

  } catch (error) {
    const errorMsg = `Product sync failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
    log.error(errorMsg, error)
    if (axios.isAxiosError(error)) {
      log.error(`HTTP Status: ${error.response?.status}, Response: ${JSON.stringify(error.response?.data)}`)
    }
    return {
      success: false,
      synced_count: 0,
      total_count: 0,
      table_name: table_name,
      error: errorMsg,
      status: 'Failed',
    }
  }
}

export const syncProducts: bp.IntegrationProps['actions']['syncProducts'] = async ({ ctx, input, logger, client: _client }) => {
  return syncProductsCore({ ctx, input, logger })
}

async function processProducts(
    retreive_reviews: boolean,
    products: ProductData[],
    config: {
        logger: bp.Logger
        magento_domain: string
        magentoClient: MagentoClient
        availableColumns: string[]
        customAttributeCodes: string[]
        attributeMappings: AttributeMapping
        tableSchema: any
        startTime: number
        MAX_EXECUTION_TIME_MS: number
        onTimeLimit: () => boolean
    }
) : Promise<any[]> {
    const { logger, magento_domain, magentoClient, availableColumns, customAttributeCodes, attributeMappings, tableSchema, startTime, MAX_EXECUTION_TIME_MS, onTimeLimit } = config
    const rowsToInsert: any[] = []

    for (const product of products) {
        if (Date.now() - startTime >= MAX_EXECUTION_TIME_MS) {
            logger.warn(`Time limit reached while processing products. Stopping at product ${product.sku}.`)
            if (onTimeLimit()) {
                break;
            }
        }
        
        try {
            let stockQty = 0
            let isInStock = false
            if (product.extension_attributes?.stock_item) {
                stockQty = product.extension_attributes.stock_item.qty || 0
                isInStock = product.extension_attributes.stock_item.is_in_stock || false
            } else {
                const stockResponse = await magentoClient.getStockItem(product.sku, logger)
                const stockData = StockItemSchema.parse(stockResponse)
                stockQty = stockData.qty
                isInStock = stockData.is_in_stock
            }

            let averageRating = 0
            let reviewCount = 0
            if (retreive_reviews) {
              try {
                  const reviewsResponse = await magentoClient.getReviews(product.sku, logger)
                  const reviews = ReviewsArraySchema.parse(reviewsResponse)
                  reviewCount = reviews.length
                  if (reviewCount > 0) {
                      const totalRating = reviews.reduce((sum, review) => {
                          const ratingObj = Array.isArray(review.ratings) && review.ratings.length > 0 ? review.ratings[0] : null
                          return sum + (ratingObj ? Number(ratingObj.value) : 0)
                      }, 0)
                      averageRating = Math.round((totalRating / reviewCount) * 10) / 10
                  }
              } catch (e) {
                  logger.warn(`Could not fetch reviews for product ${product.sku}`)
              }
            }

            let imageUrl = ''
            let thumbnailUrl = ''
            const mainImage = product.media_gallery_entries?.[0]
            if (mainImage?.file) {
                imageUrl = `https://${magento_domain}/media/catalog/product${mainImage.file}`
                thumbnailUrl = imageUrl
            }
            
            const row: any = {}
            for (const columnName of availableColumns) {
                let value: any = null
                const productDataMap: Record<string, any> = {
                    sku: product.sku || '',
                    name: product.name || '',
                    description: product.custom_attributes?.find(a => a.attribute_code === 'description')?.value || '',
                    price: product.price || 0,
                    original_price: product.price || 0,
                    currency: 'USD',
                    image_url: imageUrl || '',
                    thumbnail_url: thumbnailUrl || '',
                    stock_qty: stockQty,
                    is_in_stock: isInStock,
                    average_rating: Math.round(averageRating * 100) / 100,
                    review_count: reviewCount,
                }
                value = productDataMap[columnName]

                if (value === undefined && customAttributeCodes.includes(columnName) && product.custom_attributes) {
                    const attr = product.custom_attributes.find(a => a.attribute_code === columnName)
                    if (attr) {
                        value = attr.value
                        if ((typeof attr.value === 'string' || typeof attr.value === 'number') && attributeMappings[attr.attribute_code]?.[attr.value] !== undefined) {
                            value = attributeMappings[attr.attribute_code]?.[attr.value]
                        } else if (Array.isArray(attr.value) && attributeMappings[attr.attribute_code]) {
                            value = attr.value.map((v: any) => attributeMappings[attr.attribute_code]?.[v] ?? v).join(', ')
                        }
                    }
                }
                
                if (value !== undefined && value !== null) {
                    const columnType = tableSchema.properties[columnName]?.type
                    if (columnType === 'number') {
                        const numValue = Number(value)
                        row[columnName] = isNaN(numValue) ? null : numValue
                    } else if (columnType === 'boolean') {
                        row[columnName] = Boolean(value)
                    } else {
                        row[columnName] = String(value ?? '')
                    }
                } else {
                    const columnType = tableSchema.properties[columnName]?.type
                    row[columnName] = columnType === 'number' ? null : (columnType === 'boolean' ? false : '')
                }
            }
            rowsToInsert.push(row)
        } catch (error) {
            logger.error(`Failed to process product ${product.sku ?? ''}: ${error instanceof Error ? error.message : 'Unknown error'}`, error)
        }
    }
    return rowsToInsert
}