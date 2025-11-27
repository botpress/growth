import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import { Client } from '@botpress/client'
import * as xlsx from 'xlsx'
import { SharepointClient } from '../SharepointClient'
import { getErrorMessage } from '../utils'
import { parseExcelSheet, parseSheetTableMapping } from '../helpers/sharepoint-excel'
import {
  ensureTableExists,
  clearTableRows,
  fetchTableSchema,
  updateTableSchema,
  insertTableRows,
} from '../helpers/botpress-tables'

type Logger = Parameters<bp.IntegrationProps['actions']['syncExcelFile']>[0]['logger']
type BotpressClient = Client

/**
 * Fetches Excel file from SharePoint, with diagnostic logging on failure
 */
async function fetchExcelFile(
  spClient: SharepointClient,
  sharepointFileUrl: string,
  siteName: string,
  logger: Logger
): Promise<Buffer> {
  try {
    const fileContentBuffer = await spClient.getFileContentByUrl(sharepointFileUrl)
    logger.forBot().info('Successfully fetched Excel file content.')
    return fileContentBuffer
  } catch (error: unknown) {
    const errorMsg = getErrorMessage(error)
    
    if (errorMsg.includes('404') || errorMsg.toLowerCase().includes('not found')) {
      await logAvailableLibraries(spClient, siteName, logger)
    }
    
    throw error
  }
}

/**
 * Logs available document libraries for diagnostic purposes
 */
async function logAvailableLibraries(
  spClient: SharepointClient,
  siteName: string,
  logger: Logger
): Promise<void> {
  logger.forBot().warn('File not found. Listing available document libraries to help diagnose the issue...')
  
  try {
    const libraries = await spClient.listDocumentLibraries()
    logger.forBot().info(`Available document libraries in site "${siteName}":`)
    libraries.forEach((lib) => {
      logger.forBot().info(`- ${lib.name} (Web URL: ${lib.webUrl})`)
    })
    logger.forBot().info('Please ensure your file URL matches one of these document libraries.')
  } catch (listError: unknown) {
    logger.forBot().error('Could not list document libraries:', getErrorMessage(listError))
  }
}

/**
 * Processes a single Excel sheet and syncs it to a Botpress table
 */
async function processSheet(
  worksheet: xlsx.WorkSheet,
  sheetName: string,
  tableName: string,
  bpClient: BotpressClient,
  logger: Logger
): Promise<{ sheetName: string; tableName: string; rowCount: number }> {
  logger.forBot().info(`\n--- Processing sheet: "${sheetName}" ---`)

  // Parse Excel sheet into structured data (columns + rows)
  const parsedData = parseExcelSheet(worksheet, sheetName)
  logger.forBot().info(`Sheet "${sheetName}" has ${parsedData.columns.length} columns and ${parsedData.rows.length} data rows`)

  // Ensure table exists
  const tableId = await ensureTableExists(bpClient, tableName, parsedData.columns, logger)

  if (parsedData.rows.length === 0) {
    logger.forBot().info(`No data rows to populate in sheet "${sheetName}"`)
    return { sheetName, tableName, rowCount: 0 }
  }

  // Clear existing data
  await clearTableRows(bpClient, tableId, tableName, logger)

  logger.forBot().info(`Populating table "${tableName}" (ID: ${tableId}) with ${parsedData.rows.length} new rows.`)

  // Fetch and update schema if needed
  let botpressTableSchema = await fetchTableSchema(bpClient, tableId, tableName, logger)
  botpressTableSchema = await updateTableSchema(bpClient, tableId, tableName, parsedData.columns, botpressTableSchema, logger)

  // Insert rows
  const rowCount = await insertTableRows(bpClient, tableId, tableName, parsedData.rows, logger)

  return { sheetName, tableName, rowCount }
}

export const syncExcelFile: bp.IntegrationProps['actions']['syncExcelFile'] = async ({
  ctx,
  input,
  logger,
  client,
}) => {
  logger.forBot().info(`Starting Excel file sync for bot: ${ctx.botId}`)
  const getBotpressClient = (client: sdk.IntegrationSpecificClient<bp.TIntegration>): BotpressClient => {
    return (client as unknown as { _client: BotpressClient })._client
  }
  const bpClient = getBotpressClient(client)

  const { sharepointFileUrl, sheetTableMapping } = input
  logger.forBot().info(`Syncing Excel file: "${sharepointFileUrl}"`)
  logger.forBot().info(`Using sheetTableMapping: ${sheetTableMapping}`)

  const spClient = new SharepointClient({
    primaryDomain: ctx.configuration.primaryDomain,
    siteName: ctx.configuration.siteName,
    clientId: ctx.configuration.clientId,
    tenantId: ctx.configuration.tenantId,
    thumbprint: ctx.configuration.thumbprint,
    privateKey: ctx.configuration.privateKey,
  })

  try {
    logger.forBot().debug(`Fetching Excel file from URL: ${sharepointFileUrl}`)

    // Fetch and parse Excel file
    const fileContentBuffer = await fetchExcelFile(spClient, sharepointFileUrl, ctx.configuration.siteName, logger)
    const workbook = xlsx.read(fileContentBuffer, { type: 'buffer' })
    logger
      .forBot()
      .info(`Excel workbook loaded with ${workbook.SheetNames.length} sheet(s): ${workbook.SheetNames.join(', ')}`)

    // Parse mapping and validate
    const sheetToTable = parseSheetTableMapping(sheetTableMapping)
    const sheetsToProcess = Object.keys(sheetToTable)
    logger.forBot().info(`Parsed sheetTableMapping: ${JSON.stringify(sheetToTable)}`)

    const missingSheets = sheetsToProcess.filter((sheet) => !workbook.SheetNames.includes(sheet))
    if (missingSheets.length > 0) {
      throw new sdk.RuntimeError(
        `Sheets not found in workbook: ${missingSheets.join(', ')}. Available sheets: ${workbook.SheetNames.join(', ')}`
      )
    }

    // Process each sheet
    const processedSheets: Array<{ sheetName: string; tableName: string; rowCount: number }> = []
    const failedSheets: Array<{ sheetName: string; error: string }> = []

    for (const sheetName of sheetsToProcess) {
      const worksheet = workbook.Sheets[sheetName]
      if (!worksheet) {
        logger.forBot().warn(`Sheet "${sheetName}" is undefined, skipping`)
        continue
      }

      const tableName = sheetToTable[sheetName]
      if (!tableName) {
        logger.forBot().error(`No table mapping found for sheet "${sheetName}", skipping`)
        continue
      }

      try {
        const result = await processSheet(worksheet, sheetName, tableName, bpClient, logger)
        if (result.rowCount > 0) {
          processedSheets.push(result)
        }
      } catch (error: unknown) {
        const errorMsg = getErrorMessage(error)
        logger.forBot().error(`Failed to process sheet "${sheetName}": ${errorMsg}`)
        logger.forBot().warn(`Continuing with remaining sheets...`)
        failedSheets.push({ sheetName, error: errorMsg })
      }
    }

    // Log summary
    logger.forBot().info(`\n--- Excel file sync completed ---`)
    logger.forBot().info(`Successfully processed: ${processedSheets.length} sheet(s)`)
    if (failedSheets.length > 0) {
      logger.forBot().warn(`Failed to process: ${failedSheets.length} sheet(s)`)
      failedSheets.forEach(({ sheetName, error }) => {
        logger.forBot().warn(`  - ${sheetName}: ${error}`)
      })
    }

    return {
      processedSheets,
      failedSheets,
    }
  } catch (error: unknown) {
    logger.forBot().error(`Error during Excel file sync for "${sharepointFileUrl}": ${getErrorMessage(error)}`)
    throw error
  }
}
