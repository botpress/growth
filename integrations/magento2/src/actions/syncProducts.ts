import axios from 'axios'
import * as crypto from 'crypto'
import * as bp from '.botpress'
import { BotpressContext, SyncInput, SyncResult, SyncContext, SyncState } from '../types/magento'
import { parseAttributeMappings, parseColumnNameMappings } from '../utils/magento'
import { createMagentoClient } from '../services/magento-client'
import { setupInitialSync, processFirstPage, processRemainingPages } from '../services/sync-service'

const BOTPRESS_API_BASE_URL = 'https://api.botpress.cloud/v1/tables'

function createSyncContext(ctx: BotpressContext, logger: bp.Logger): SyncContext {
  const client = createMagentoClient(ctx.configuration, logger)

  return {
    config: {
      ...ctx.configuration,
      store_code: ctx.configuration.store_code || 'all',
    },
    oauth: client.getOAuthClient(),
    token: client.getToken(),
    headers: client.createHeaders(),
    httpHeaders: client.createHttpHeaders(ctx.botId),
    apiBaseUrl: BOTPRESS_API_BASE_URL,
  }
}

function createWebhookPayload(input: SyncInput, state: SyncState, runId: string, totalCount: number) {
  return {
    type: 'magentoSyncContinue',
    data: {
      ...input,
      _currentPage: 2,
      _totalCount: totalCount,
      _tableId: state.tableId,
      _runId: runId,
      _customAttributeCodes: state.customAttributeCodes,
      _attributeMappings:
        typeof input._attributeMappings === 'string'
          ? input._attributeMappings
          : JSON.stringify(state.attributeMappings),
      _columnNameMappings: JSON.stringify(state.columnNameMappings),
      _filterCriteria: state.filterCriteria,
      _currentPageProductIndex: 0,
    },
  }
}

function createSuccessResult(syncedCount: number, totalCount: number, tableName: string, status: string): SyncResult {
  return {
    success: true,
    synced_count: syncedCount,
    total_count: totalCount,
    table_name: tableName,
    status,
  }
}

function createErrorResult(tableName: string, error: string, status: string): SyncResult {
  return {
    success: false,
    synced_count: 0,
    total_count: 0,
    table_name: tableName,
    error,
    status,
  }
}

async function handleInitialRun(
  input: SyncInput,
  context: SyncContext,
  runId: string,
  log: bp.Logger
): Promise<SyncResult> {
  const state = await setupInitialSync(
    input,
    context.config,
    context.oauth,
    context.token,
    context.headers,
    context.httpHeaders,
    context.apiBaseUrl,
    log
  )
  const { totalCount, processedCount } = await processFirstPage(
    state,
    input,
    context.config,
    context.oauth,
    context.token,
    context.headers,
    context.httpHeaders,
    context.apiBaseUrl,
    log
  )

  if (totalCount === 0) {
    return createSuccessResult(0, 0, input.table_name, 'Completed - No Products')
  }

  const hasMorePages = totalCount > 50

  if (hasMorePages) {
    if (!context.webhookId) {
      log.error('No webhook ID available. Cannot continue sync automatically.')
      return createErrorResult(input.table_name, 'No webhook ID available for continuation', 'Failed - No Webhook')
    }

    const payload = createWebhookPayload(input, state, runId, totalCount)
    const client = createMagentoClient(context.config, log)
    await client.sendWebhook(context.webhookId, payload)

    return createSuccessResult(processedCount, totalCount, input.table_name, 'In Progress - Webhook Sent')
  } else {
    log.info(`Sync completed successfully. Total products synced: ${processedCount}`)
    return createSuccessResult(processedCount, totalCount, input.table_name, 'Completed')
  }
}

async function handleContinuation(input: SyncInput, context: SyncContext, log: bp.Logger): Promise<SyncResult> {
  if (!input._currentPage || !input._tableId || !input._runId) {
    log.error('Invalid continuation parameters. Missing required state variables.')
    return createErrorResult(input.table_name, 'Invalid continuation parameters', 'Failed - Invalid State')
  }

  const columnNameMappings = parseColumnNameMappings(input._columnNameMappings)

  const state: SyncState = {
    tableId: input._tableId,
    tableSchema: null,
    customAttributeCodes: input._customAttributeCodes || [],
    filterCriteria: input._filterCriteria || '',
    attributeMappings: parseAttributeMappings(input._attributeMappings),
    columnNameMappings: columnNameMappings,
  }

  const { totalProcessed } = await processRemainingPages(
    state,
    input,
    context.config,
    context.oauth,
    context.token,
    context.headers,
    context.httpHeaders,
    context.apiBaseUrl,
    log
  )

  const totalCount = input._totalCount || 0
  log.info(`Sync completed successfully. Total products synced: ${totalProcessed}`)
  return createSuccessResult(totalProcessed, totalCount, input.table_name, 'Completed')
}

export async function executeSyncProducts({
  ctx,
  input,
  logger,
}: {
  ctx: BotpressContext
  input: SyncInput
  logger: bp.Logger
}): Promise<SyncResult> {
  const context = createSyncContext(ctx, logger)
  const log = logger.forBot()
  const runId = input._runId || crypto.randomUUID()

  log.info(`-> Starting Magento2 product sync (run ID: ${runId})`)
  log.debug(`Sync start timestamp: ${new Date().toISOString()}`)

  try {
    const isInitialRun = !input._tableId

    if (isInitialRun) {
      return await handleInitialRun(input, { ...context, webhookId: ctx.webhookId }, runId, log)
    } else {
      return await handleContinuation(input, context, log)
    }
  } catch (error) {
    const errorMsg = `Product sync failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
    log.error(errorMsg, error)
    if (axios.isAxiosError(error)) {
      log.error(`HTTP Status: ${error.response?.status}, Response: ${JSON.stringify(error.response?.data)}`)
    }
    return createErrorResult(input.table_name, errorMsg, 'Failed')
  }
}

export const syncProducts: bp.IntegrationProps['actions']['syncProducts'] = async ({ ctx, input, logger }) => {
  return executeSyncProducts({ ctx, input, logger })
}
