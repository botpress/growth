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
  ReviewData,
} from '../misc/zod-schemas'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function apiCallWithRetry<T>(
  request: () => Promise<T>,
  logger: bp.Logger,
  maxRetries = 5,
  initialDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await request()
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        if (status && (status === 429 || status >= 500) && i < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, i) * (1 + Math.random()) // add jitter
          logger.forBot().warn(`API call failed with status ${status}. Retrying in ${delay.toFixed(0)}ms... (Attempt ${
            i + 1
          }/${maxRetries})`)
          await sleep(delay)
          continue
        }
      }
      logger.forBot().error('API call failed after all retries or with a non-retriable error.', error)
      throw error
    }
  }
  throw new Error('API call failed after all retries.')
}

function toMagentoAttributeCode(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_') // spaces to underscores
    .replace(/[^a-z0-9_]/g, '') // remove non-alphanumeric/underscore
}

export const syncProducts: bp.IntegrationProps['actions']['syncProducts'] = async ({ ctx, input, logger }) => {
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
    custom_attributes,
    filters_json,
    // Recursive inputs
    _currentPage,
    _totalCount,
    _tableId,
    _runId,
    _customAttributeCodes,
    _attributeMappings,
    _filterCriteria,
  } = input as any

  const log = logger.forBot()
  const runId = _runId || crypto.randomUUID()
  log.info(`-> Starting Magento2 product sync (run ID: ${runId})`)

  const MAX_EXECUTION_TIME_MS = 28000 // 28s to leave a buffer
  const startTime = Date.now()
  log.debug(`Sync start timestamp: ${new Date(startTime).toISOString()}`)

  const oauth = new OAuth({
    consumer: {
      key: consumer_key,
      secret: consumer_secret,
    },
    signature_method: 'HMAC-SHA256',
    hash_function(baseString: string, key: string) {
      return crypto.createHmac('sha256', key).update(baseString).digest('base64')
    },
  })

  const token = {
    key: access_token,
    secret: access_token_secret,
  }

  const defaultUserAgent = 'Botpress-Magento2-Integration/1.0'
  const headers = {
    'User-Agent': user_agent || defaultUserAgent,
    accept: 'application/json',
  }

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
    let attributeMappings: Record<string, Record<string, string>> = _attributeMappings || {}
    let filterCriteria = _filterCriteria

    const isInitialRun = !_tableId

    if (isInitialRun) {
      log.info('Initial run detected. Setting up table and attributes.')
      customAttributeCodes = (custom_attributes || '')
        .split(',')
        .map((attr: string) => toMagentoAttributeCode(attr))
        .filter((attr: string) => attr.length > 0)
      log.info(`Custom attributes to sync: ${customAttributeCodes.join(', ')}`)

      if (filters_json) {
        try {
          let filters = JSON.parse(filters_json)
          if (!Array.isArray(filters)) {
            return { success: false, synced_count: 0, total_count: 0, table_name, error: 'filters_json must be a JSON array' }
          }
          const standardFields = ['sku', 'name', 'description', 'price', 'original_price', 'currency', 'image_url', 'thumbnail_url', 'stock_qty', 'is_in_stock', 'average_rating', 'review_count']
          const attributeFields = Array.from(new Set(filters.map((f: any) => f.field).filter((f: string) => f && !standardFields.includes(f))))

          for (const attrCode of attributeFields) {
            try {
              const attrUrl = `https://${magento_domain}/rest/default/V1/products/attributes/${attrCode}`
              const attrResponse = await apiCallWithRetry(() => axios({ method: 'GET', url: attrUrl, headers: { ...oauth.toHeader(oauth.authorize({ url: attrUrl, method: 'GET' }, token)), ...headers } }), log)
              const attribute = ProductAttributeSchema.parse(attrResponse.data)
              if (attribute.options && attribute.options.length > 0) {
                attributeMappings[attrCode] = {}
                for (const option of attribute.options) {
                  attributeMappings[attrCode][option.label] = option.value
                }
                log.info(`Fetched ${attribute.options.length} options for attribute ${attrCode}`)
              }
            } catch (error) {
              log.warn(`Failed to get attribute mapping for ${attrCode}:`, error)
            }
          }

          filters = filters.map((filter: any) => {
            if (filter.field !== undefined && filter.value !== undefined && attributeMappings[filter.field]?.[filter.value] !== undefined) {
              return { ...filter, value: attributeMappings[filter.field]?.[filter.value] }
            }
            return filter
          })

          const filterGroups: string[] = []
          filters.forEach((filter: any, idx: number) => {
            if (!filter.field || !filter.condition) return
            const filterGroup = `searchCriteria[filterGroups][${idx}][filters][0][field]=${encodeURIComponent(filter.field)}&searchCriteria[filterGroups][${idx}][filters][0][conditionType]=${filter.condition}`
            if (filter.value && filter.condition !== 'notnull' && filter.condition !== 'null') {
              filterGroups.push(`${filterGroup}&searchCriteria[filterGroups][${idx}][filters][0][value]=${encodeURIComponent(filter.value)}`)
            } else {
              filterGroups.push(filterGroup)
            }
          })
          if (filterGroups.length > 0) {
            filterCriteria = filterGroups.join('&')
          }
        } catch (err) {
          return { success: false, synced_count: 0, total_count: 0, table_name, error: `filters_json is not valid JSON: ${err instanceof Error ? err.message : 'Unknown parsing error'}` }
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
          return { success: false, synced_count: 0, total_count: 0, table_name, error }
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
            const attrUrl = `https://${magento_domain}/rest/default/V1/products/attributes/${attrCode}`
            const attrResponse = await apiCallWithRetry(() => axios({ method: 'GET', url: attrUrl, headers: { ...oauth.toHeader(oauth.authorize({ url: attrUrl, method: 'GET' }, token)), ...headers } }), log)
            const attribute = ProductAttributeSchema.parse(attrResponse.data)
            if (attribute.options && attribute.options.length > 0) {
              attributeMappings[attrCode] = {}
              for (const option of attribute.options) {
                attributeMappings[attrCode][option.value] = option.label
              }
              log.info(`Mapped ${attribute.options.length} options for attribute ${attrCode}`)
            }
          } catch (error) {
            const errorMessage = `Failed to get attribute mapping for ${attrCode}: ${error instanceof Error ? error.message : 'Unknown error'}`
            log.error(errorMessage, error)
            return { success: false, synced_count: 0, total_count: 0, table_name, error: errorMessage }
          }
        }
      }
    }

    let currentPage = _currentPage || 1
    let totalCount = _totalCount || 0
    let hasMorePages = true

    while (hasMorePages) {
      if (Date.now() - startTime >= MAX_EXECUTION_TIME_MS) {
        const elapsedNow = Date.now() - startTime
        log.info(`Execution time limit approaching after ${elapsedNow}ms. Triggering webhook to continue sync on next run.`)
        break;
      }

      const pageSize = 100
      const searchCriteria = `searchCriteria[pageSize]=${pageSize}&searchCriteria[currentPage]=${currentPage}${filterCriteria ? `&${filterCriteria}` : ''}`
      const productsUrl = `https://${magento_domain}/rest/default/V1/products?${searchCriteria}`
      
      log.info(`Fetching page ${currentPage} from: ${productsUrl}`)

      const productsResponse = await apiCallWithRetry(() => axios({
        method: 'GET',
        url: productsUrl,
        headers: { ...oauth.toHeader(oauth.authorize({ url: productsUrl, method: 'GET' }, token)), ...headers },
      }), log)

      const parsed = ProductListSchema.parse(productsResponse.data)
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
      
      log.info(`Processing ${products.length} products from page ${currentPage}`)
      
      if (!tableSchema) {
        const tableDetailsResponse = await apiCallWithRetry(() => axios.get(`${apiBaseUrl}/${tableId}`, { headers: httpHeaders }), log)
        tableSchema = tableDetailsResponse.data.table?.schema
      }
      const availableColumns = Object.keys(tableSchema.properties)

      const rowsToInsert = await processProducts(products, {
        logger: log,
        magento_domain,
        oauth,
        token,
        headers,
        availableColumns,
        customAttributeCodes,
        attributeMappings,
        tableSchema
      })

      if (rowsToInsert.length > 0) {
        log.info(`Inserting ${rowsToInsert.length} rows into table ${table_name}`)
        await apiCallWithRetry(() => axios.post(`${apiBaseUrl}/${tableId}/rows`, { rows: rowsToInsert }, { headers: httpHeaders }), log)
        log.info(`Successfully inserted rows for page ${currentPage}`)
        const elapsed = Date.now() - startTime
        log.debug(`Elapsed time so far: ${elapsed}ms (remaining: ${MAX_EXECUTION_TIME_MS - elapsed}ms)`)
      }

      const currentSyncedCount = ((currentPage -1) * pageSize) + products.length
      hasMorePages = currentSyncedCount < totalCount
      currentPage++
    }

    if (hasMorePages) {
      log.info(`Time limit reached or page processed. Triggering webhook to continue sync.`)
      const webhookUrl = `https://webhook.botpress.cloud/${ctx.webhookId}`
      const payload = {
        action: 'syncProducts',
        ctx,
        input: {
          ...input,
          _currentPage: currentPage,
          _totalCount: totalCount,
          _tableId: tableId,
          _runId: runId,
          _customAttributeCodes: customAttributeCodes,
          _attributeMappings: attributeMappings,
          _filterCriteria: filterCriteria,
        },
      }
      
      try {
        log.info('Attempting to trigger webhook for next page...')
        await axios.post(webhookUrl, payload, { headers: { Authorization: `Bearer ${ctx.configuration.botpress_pat}` } })
        log.info('Successfully triggered webhook for continued sync.')
      } catch (err: any) {
          log.error('Failed to trigger webhook for continued sync.', err)
          if (axios.isAxiosError(err)) {
              log.error(`Webhook error details: status=${err.response?.status}, data=${JSON.stringify(err.response?.data)}`)
          }
      }

      return {
        success: true,
        synced_count: (currentPage - 1) * 100, // Approximate count
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
    }
  }
}

async function processProducts(
    products: ProductData[],
    config: {
        logger: bp.Logger
        magento_domain: string
        oauth: OAuth
        token: any
        headers: any
        availableColumns: string[]
        customAttributeCodes: string[]
        attributeMappings: Record<string, Record<string, string>>
        tableSchema: any
    }
) : Promise<any[]> {
    const { logger, magento_domain, oauth, token, headers, availableColumns, customAttributeCodes, attributeMappings, tableSchema } = config
    const rowsToInsert: any[] = []

    for (const product of products) {
        try {
            let stockQty = 0
            let isInStock = false
            if (product.extension_attributes?.stock_item) {
                stockQty = product.extension_attributes.stock_item.qty || 0
                isInStock = product.extension_attributes.stock_item.is_in_stock || false
            } else {
                const stockUrl = `https://${magento_domain}/rest/default/V1/stockItems/${encodeURIComponent(product.sku)}`
                const stockResponse = await apiCallWithRetry(() => axios({ method: 'GET', url: stockUrl, headers: { ...oauth.toHeader(oauth.authorize({ url: stockUrl, method: 'GET' }, token)), ...headers } }), logger)
                const stockData = StockItemSchema.parse(stockResponse.data)
                stockQty = stockData.qty
                isInStock = stockData.is_in_stock
            }

            const reviewsUrl = `https://${magento_domain}/rest/default/V1/products/${encodeURIComponent(product.sku)}/reviews`
            let averageRating = 0
            let reviewCount = 0
            try {
                const reviewsResponse = await apiCallWithRetry(() => axios({ method: 'GET', url: reviewsUrl, headers: { ...oauth.toHeader(oauth.authorize({ url: reviewsUrl, method: 'GET' }, token)), ...headers } }), logger)
                const reviews = ReviewsArraySchema.parse(reviewsResponse.data)
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