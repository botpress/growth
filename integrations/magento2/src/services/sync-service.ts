import axios from 'axios'
import * as bp from '.botpress'
import { SyncInput, SyncState, MagentoConfiguration, AttributeMapping, ColumnNameMapping, OAuthClient, OAuthToken, MagentoProduct } from '../types/magento'
import { toMagentoAttributeCode, shortenColumnName, parseAttributeMappings, parseColumnNameMappings } from '../utils/magento'
import { processFilters, createOAuthClient, createHeaders, createHttpHeaders, fetchProducts, sendWebhook, apiCallWithRetry } from './magento-api'
import { createOrGetTable, fetchAttributeMappings, insertProductsToTable } from './botpress-api'
import { processProducts } from './product-processor'

const PAGE_SIZE = 50
const BOTPRESS_API_BASE_URL = 'https://api.botpress.cloud/v1/tables'

async function ensureTableSchema(
  state: SyncState,
  httpHeaders: Record<string, string>,
  log: bp.Logger
): Promise<void> {
  if (!state.tableSchema) {
    const tableDetailsResponse = await apiCallWithRetry(
      () => axios.get(`${BOTPRESS_API_BASE_URL}/${state.tableId}`, { headers: httpHeaders }), 
      log
    )
    state.tableSchema = tableDetailsResponse.data.table?.schema
  }
  
  if (!state.tableSchema) {
    throw new Error('Table schema is not available')
  }
}

async function processProductBatch(
  products: MagentoProduct[],
  state: SyncState,
  input: SyncInput,
  config: MagentoConfiguration,
  oauth: OAuthClient,
  token: OAuthToken,
  headers: Record<string, string>,
  httpHeaders: Record<string, string>,
  apiBaseUrl: string,
  log: bp.Logger
): Promise<Record<string, string | number | boolean | null>[]> {
  await ensureTableSchema(state, httpHeaders, log)
  const availableColumns = Object.keys(state.tableSchema!.properties)

  const rowsToInsert = await processProducts(input.retrieve_reviews || false, products, {
    logger: log,
    magento_domain: config.magento_domain,
    oauth,
    token,
    headers,
    availableColumns,
    customAttributeCodes: state.customAttributeCodes,
    attributeMappings: state.attributeMappings,
    columnNameMappings: state.columnNameMappings,
    tableSchema: state.tableSchema!,
    store_code: config.store_code || 'all',
  })

  await insertProductsToTable(state.tableId, rowsToInsert, apiBaseUrl, httpHeaders, input.table_name, log)
  return rowsToInsert
}

function createColumnNameMappings(originalAttributes: string[], customAttributeCodes: string[]): ColumnNameMapping {
  const columnNameMappings: ColumnNameMapping = {}
  originalAttributes.forEach((attr: string, index: number) => {
    const shortName = customAttributeCodes[index]
    if (shortName) {
      columnNameMappings[shortName] = attr.trim()
    }
  })
  return columnNameMappings
}

function recreateColumnNameMappings(customAttributeCodes: string[]): ColumnNameMapping {
  const columnNameMappings: ColumnNameMapping = {}
  customAttributeCodes.forEach((shortName: string) => {
    if (shortName === 'meta_description') {
      columnNameMappings[shortName] = 'meta_description'
    } else if (shortName === 'attr_pim_beschreibungstext_70a') {
      columnNameMappings[shortName] = 'attr_pim_beschreibungstext_original'
    }
  })
  return columnNameMappings
}

export async function setupInitialSync(
  input: SyncInput,
  config: MagentoConfiguration,
  oauth: OAuthClient,
  token: OAuthToken,
  headers: Record<string, string>,
  httpHeaders: Record<string, string>,
  apiBaseUrl: string,
  log: bp.Logger
): Promise<SyncState> {
  log.info('Initial run detected. Setting up table and attributes.')
  
  const originalAttributes = (input.custom_columns_to_add_to_table || '')
    .replace(/^["']|["']$/g, '')
    .split(',')
    .filter((attr: string) => attr.trim().length > 0)
    
  const customAttributeCodes = originalAttributes.map((attr: string) => {
    const baseCode = toMagentoAttributeCode(attr.trim())
    return shortenColumnName(baseCode)
  })

  const columnNameMappings = createColumnNameMappings(originalAttributes, customAttributeCodes)
  let filterCriteria = input._filterCriteria || ''
  const attributeMappings: AttributeMapping = {}

  if (input.filters_json) {
    filterCriteria = await processFilters(
      input.filters_json,
      attributeMappings,
      config.magento_domain,
      config.store_code || 'all',
      oauth,
      token,
      headers,
      log
    )
  }

  const { tableId, tableSchema } = await createOrGetTable(
    input.table_name,
    customAttributeCodes,
    apiBaseUrl,
    httpHeaders,
    log
  )

  log.info(`Clearing existing rows from table ${input.table_name}`)
  await insertProductsToTable(tableId, [], apiBaseUrl, httpHeaders, input.table_name, log)
  log.info('Successfully cleared existing rows')

  await fetchAttributeMappings(
    customAttributeCodes,
    columnNameMappings,
    attributeMappings,
    config.magento_domain,
    config.store_code || 'all',
    oauth,
    token,
    headers,
    log
  )

  return {
    tableId,
    tableSchema,
    customAttributeCodes,
    filterCriteria,
    attributeMappings,
    columnNameMappings,
  }
}

export async function processFirstPage(
  state: SyncState,
  input: SyncInput,
  config: MagentoConfiguration,
  oauth: OAuthClient,
  token: OAuthToken,
  headers: Record<string, string>,
  httpHeaders: Record<string, string>,
  apiBaseUrl: string,
  log: bp.Logger
): Promise<{ rowsToInsert: Record<string, string | number | boolean | null>[]; totalCount: number; processedCount: number }> {
  const { products, totalCount } = await fetchProducts(
    1, 
    PAGE_SIZE, 
    state.filterCriteria, 
    config.magento_domain, 
    config.store_code || 'all', 
    oauth, 
    token, 
    headers, 
    log
  )
  
  log.info(`Total products to sync: ${totalCount}`)
  
  if (products.length === 0) {
    log.warn('No products found to sync.')
    return { rowsToInsert: [], totalCount: 0, processedCount: 0 }
  }
  
  log.info(`Processing ${products.length} products from first page`)
  
  const rowsToInsert = await processProductBatch(
    products,
    state,
    input,
    config,
    oauth,
    token,
    headers,
    httpHeaders,
    apiBaseUrl,
    log
  )

  return { rowsToInsert, totalCount, processedCount: rowsToInsert.length }
}

export async function processRemainingPages(
  state: SyncState,
  input: SyncInput,
  config: MagentoConfiguration,
  oauth: OAuthClient,
  token: OAuthToken,
  headers: Record<string, string>,
  httpHeaders: Record<string, string>,
  apiBaseUrl: string,
  log: bp.Logger
): Promise<{ totalProcessed: number }> {
  let currentPage = input._currentPage || 2
  let currentPageProductIndex = input._currentPageProductIndex || 0
  let totalCount = input._totalCount || 0
  let totalProcessed = 0
  
  log.info(`Continuing sync from page ${currentPage} with run ID: ${input._runId}`)
  
  while (true) {
    const { products } = await fetchProducts(
      currentPage, 
      PAGE_SIZE, 
      state.filterCriteria, 
      config.magento_domain, 
      config.store_code || 'all', 
      oauth, 
      token, 
      headers, 
      log
    )
    
    if (products.length === 0) {
      log.warn('No more products found to sync.')
      break
    }
    
    const remainingProductsInPage = products.length - currentPageProductIndex
    log.info(`Processing ${remainingProductsInPage} remaining products from page ${currentPage} (starting from index ${currentPageProductIndex})`)
    
    const rowsToInsert = await processProductBatch(
      products.slice(currentPageProductIndex),
      state,
      input,
      config,
      oauth,
      token,
      headers,
      httpHeaders,
      apiBaseUrl,
      log
    )

    totalProcessed += rowsToInsert.length
    currentPageProductIndex += rowsToInsert.length
    
    if (currentPageProductIndex >= products.length) {
      currentPage++
      currentPageProductIndex = 0
    }
    
    const currentSyncedCount = ((currentPage - 1) * PAGE_SIZE) + currentPageProductIndex
    if (currentSyncedCount >= totalCount) {
      break
    }
  }
  
  return { totalProcessed }
}
