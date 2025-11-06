import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import * as xlsx from 'xlsx'
import { SharepointClient } from '../SharepointClient'
import { getErrorMessage } from '../utils'

type Logger = Parameters<bp.IntegrationProps['actions']['syncExcelFile']>[0]['logger']
type RealClient = any

/**
 * Compares Excel headers with existing table schema to determine column changes
 */
function compareColumns(
  excelHeaders: string[],
  tableSchema: any
): { columnsToAdd: string[]; columnsToRemove: string[]; unchangedColumns: string[] } {
  const cleanExcelHeaders = excelHeaders.map((h) => String(h).trim()).filter((h) => h !== '')
  const existingColumns = tableSchema?.properties ? Object.keys(tableSchema.properties) : []

  const columnsToAdd = cleanExcelHeaders.filter((header) => !existingColumns.includes(header))
  const columnsToRemove = existingColumns.filter((col) => !cleanExcelHeaders.includes(col))
  const unchangedColumns = cleanExcelHeaders.filter((header) => existingColumns.includes(header))

  return { columnsToAdd, columnsToRemove, unchangedColumns }
}

/**
 * Detects the type of a column based on its data values
 */
function detectColumnType(columnIndex: number, rowsData: any[][]): 'number' | 'string' {
  let isNumeric = true
  let hasData = false

  for (const row of rowsData) {
    const value = row[columnIndex]
    if (value !== undefined && value !== null && value !== '') {
      hasData = true
      if (isNaN(Number(value))) {
        isNumeric = false
        break
      }
    }
  }

  return hasData && isNumeric ? 'number' : 'string'
}

/**
 * Validates that all headers are unique
 * @throws RuntimeError if duplicate headers are found
 */
function validateUniqueHeaders(headers: string[], sheetName: string): void {
  const cleanHeaders = headers.map((h) => String(h).trim()).filter((h) => h !== '')
  
  // Count occurrences of each header
  const headerCounts = new Map<string, number>()
  cleanHeaders.forEach((header) => {
    headerCounts.set(header, (headerCounts.get(header) || 0) + 1)
  })
  
  // Find duplicates
  const duplicates = Array.from(headerCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([header, count]) => `"${header}" (${count}x)`)

  if (duplicates.length > 0) {
    throw new sdk.RuntimeError(
      `Sheet "${sheetName}" has duplicate column headers: ${duplicates.join(', ')}. Each column must have a unique name.`
    )
  }
}

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
 * Clears all rows from a table (non-fatal operation)
 */
async function clearTableRows(
  realClient: RealClient,
  tableId: string,
  tableName: string,
  logger: Logger
): Promise<void> {
  logger.forBot().info(`Clearing all existing rows from table "${tableName}" (ID: ${tableId}).`)
  
  try {
    await realClient.deleteTableRows({
      table: tableId,
      deleteAllRows: true,
    })
    logger.forBot().info(`Successfully cleared all rows from table "${tableName}" (ID: ${tableId}).`)
  } catch (deleteError: unknown) {
    logger.forBot().error(
      `Error clearing rows from table "${tableName}" (ID: ${tableId}): ${getErrorMessage(deleteError)}`
    )
    logger.forBot().warn(`This may result in duplicate data if old rows weren't properly cleared.`)
  }
}

/**
 * Fetches table schema (required operation - throws on failure)
 */
async function fetchTableSchema(
  realClient: RealClient,
  tableId: string,
  tableName: string,
  logger: Logger
): Promise<any> {
  const tableDetailsResponse = await realClient.getTable({ table: tableId })
  const schema = tableDetailsResponse.table?.schema
  
  if (!schema) {
    const errorMsg = `Table "${tableName}" (ID: ${tableId}) exists but has no schema. Cannot proceed safely.`
    logger.forBot().error(errorMsg)
    throw new sdk.RuntimeError(errorMsg)
  }
  
  return schema
}

/**
 * Waits for new columns to propagate in schema (non-fatal operation)
 */
async function waitForSchemaPropagation(
  realClient: RealClient,
  tableId: string,
  columnsToAdd: string[],
  tableSchema: any,
  logger: Logger
): Promise<any> {
  try {
    const maxAttempts = 6
    let attempt = 0
    let currentSchema = tableSchema
    
    const allNewColumnsPresent = (schema: any) => 
      columnsToAdd.every((c) => !!schema?.properties?.[c])

    while (!allNewColumnsPresent(currentSchema) && attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const refreshed = await realClient.getTable({ table: tableId })
      currentSchema = refreshed.table?.schema
      attempt++
    }

    if (!allNewColumnsPresent(currentSchema)) {
      const missingColumns = columnsToAdd.filter((c) => !currentSchema?.properties?.[c])
      logger.forBot().warn(
        `New columns may not be propagated yet after schema update: missing [${missingColumns.join(', ')}]. Proceeding with best-effort.`
      )
    }
    
    return currentSchema
  } catch (waitErr: unknown) {
    logger.forBot().warn(`Failed while waiting for schema propagation: ${getErrorMessage(waitErr)}`)
    return tableSchema
  }
}

/**
 * Handles schema updates (add new columns, remove old ones)
 */
async function updateTableSchema(
  realClient: RealClient,
  tableId: string,
  tableName: string,
  excelHeaders: string[],
  rowsData: any[][],
  tableSchema: any,
  logger: Logger
): Promise<any> {
  const { columnsToAdd, columnsToRemove, unchangedColumns } = compareColumns(excelHeaders, tableSchema)

  // No changes needed
  if (columnsToAdd.length === 0 && columnsToRemove.length === 0) {
    logger.forBot().info(`No schema changes detected for table "${tableName}"`)
    return tableSchema
  }

  // Log what's changing
  logger
    .forBot()
    .info(`Schema changes detected for table "${tableName}": ${columnsToAdd.length} to add, ${columnsToRemove.length} to remove`)

  if (columnsToAdd.length > 0) {
    logger.forBot().info(`Columns to add: [${columnsToAdd.join(', ')}]`)
  }

  if (columnsToRemove.length > 0) {
    logger.forBot().warn(`Columns no longer in Excel will be removed: [${columnsToRemove.join(', ')}]`)
  }

  // Build updated schema with unchanged + new columns
  const updatedProperties: { [key: string]: { type: string } } = {}

  unchangedColumns.forEach((col) => {
    if (tableSchema.properties[col]) {
      updatedProperties[col] = tableSchema.properties[col]
    }
  })

  columnsToAdd.forEach((col) => {
    const columnIndex = excelHeaders.indexOf(col)
    const detectedType = detectColumnType(columnIndex, rowsData)
    updatedProperties[col] = { type: detectedType }
  })

  // Prepare update payload
  const updateSchemaPayload: any = {
    name: tableName,
    frozen: false,
    schema: {
      type: 'object',
      properties: updatedProperties,
    },
    tags: {},
    isComputeEnabled: false,
  }

  // Handle column removals by setting to null
  if (columnsToRemove.length > 0) {
    const schemaWithRemovals: any = {}
    columnsToRemove.forEach((col) => {
      schemaWithRemovals[col] = null
    })
    updateSchemaPayload.schema = schemaWithRemovals
  }

  // Execute update
  const updateResponse = await realClient.updateTable({
    table: tableId,
    ...updateSchemaPayload,
  })

  logger.forBot().info(`Successfully updated schema for table "${tableName}"`)

  // Get the updated schema
  let updatedSchema = updateResponse.table?.schema || await fetchTableSchema(realClient, tableId, tableName, logger)

  // Wait for new columns to propagate
  if (columnsToAdd.length > 0) {
    updatedSchema = await waitForSchemaPropagation(realClient, tableId, columnsToAdd, updatedSchema, logger)
  }

  return updatedSchema
}

/**
 * Builds row objects from Excel data and inserts them into the table
 */
async function insertTableRows(
  realClient: RealClient,
  tableId: string,
  tableName: string,
  excelHeaders: string[],
  rowsData: any[][],
  tableSchema: any,
  logger: Logger
): Promise<number> {
  const rowsToInsert = rowsData
    .map((rowArray) => {
      const rowObject: { [key: string]: any } = {}
      excelHeaders.forEach((header, index) => {
        const cleanHeader = String(header).trim()
        if (cleanHeader) {
          const value = rowArray[index]
          if (value !== undefined && value !== null && value !== '') {
            // Convert to appropriate type based on schema
            if (tableSchema?.properties?.[cleanHeader]?.type === 'number') {
              const numValue = Number(value)
              rowObject[cleanHeader] = isNaN(numValue) ? String(value) : numValue
            } else {
              rowObject[cleanHeader] = String(value)
            }
          }
        }
      })
      return rowObject
    })
    .filter((obj) => Object.keys(obj).length > 0)

  if (rowsToInsert.length === 0) {
    if (rowsData.length > 0) {
      logger.forBot().warn(`Data rows were present but no valid rows could be constructed`)
    }
    return 0
  }

  // Insert in batches
  const BATCH_SIZE = 50
  const totalRows = rowsToInsert.length
  let processedRows = 0

  while (processedRows < totalRows) {
    const batch = rowsToInsert.slice(processedRows, processedRows + BATCH_SIZE)
    await realClient.createTableRows({ table: tableId, rows: batch })
    processedRows += batch.length
    logger.forBot().info(`Processed ${processedRows}/${totalRows} rows for table "${tableName}"`)
  }

  logger.forBot().info(`Successfully populated table "${tableName}" with ${rowsToInsert.length} rows`)
  return rowsToInsert.length
}

export const syncExcelFile: bp.IntegrationProps['actions']['syncExcelFile'] = async ({
  ctx,
  input,
  logger,
  client,
}) => {
  logger.forBot().info(`Starting Excel file sync for bot: ${ctx.botId}`)
  const getRealClient = (client: sdk.IntegrationSpecificClient<bp.TIntegration>) => (client as any)._client
  const realClient = getRealClient(client)

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

    const fileContentBuffer = await fetchExcelFile(spClient, sharepointFileUrl, ctx.configuration.siteName, logger)

    const workbook = xlsx.read(fileContentBuffer, { type: 'buffer' })
    logger
      .forBot()
      .info(`Excel workbook loaded with ${workbook.SheetNames.length} sheet(s): ${workbook.SheetNames.join(', ')}`)

    // Determine which sheets to process
    let sheetsToProcess: string[] = []
    let sheetToTable: Record<string, string> = {}

    // Parse sheetTableMapping
    try {
      if (sheetTableMapping.trim().startsWith('{')) {
        sheetToTable = JSON.parse(sheetTableMapping)
      } else {
        // Parse as comma-separated pairs: Sheet1:table1,Sheet2:table2
        sheetTableMapping.split(',').forEach((pair: string) => {
          const [sheet, table] = pair.split(':').map((s: string) => s.trim())
          if (sheet && table) sheetToTable[sheet] = table
        })
      }
      sheetsToProcess = Object.keys(sheetToTable)
      logger.forBot().info(`Parsed sheetTableMapping: ${JSON.stringify(sheetToTable)}`)
    } catch (err) {
      logger.forBot().error(`Failed to parse sheetTableMapping: ${err}`)
      throw new sdk.RuntimeError('Invalid sheetTableMapping format. Use JSON or comma-separated pairs.')
    }

    // Validate that all sheets in the mapping exist in the workbook
    const missingSheets = sheetsToProcess.filter((sheet) => !workbook.SheetNames.includes(sheet))
    if (missingSheets.length > 0) {
      throw new sdk.RuntimeError(
        `Sheets not found in workbook: ${missingSheets.join(', ')}. Available sheets: ${workbook.SheetNames.join(', ')}`
      )
    }

    const processedSheets: any[] = []
    const failedSheets: any[] = []

    // Process each sheet
    for (const currentSheetName of sheetsToProcess) {
      logger.forBot().info(`\n--- Processing sheet: "${currentSheetName}" ---`)

      const worksheet = workbook.Sheets[currentSheetName]
      if (!worksheet) {
        logger.forBot().warn(`Sheet "${currentSheetName}" is undefined, skipping`)
        continue
      }

      const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 })
      logger.forBot().info(`Sheet "${currentSheetName}" has ${jsonData.length} rows (including header)`)

      if (jsonData.length === 0) {
        logger.forBot().warn(`Sheet "${currentSheetName}" is empty, skipping`)
        continue
      }

      const excelHeaders = jsonData[0] as string[]
      if (!excelHeaders || excelHeaders.length === 0) {
        logger.forBot().warn(`Sheet "${currentSheetName}" has no header row, skipping`)
        continue
      }

      // Validate no duplicate headers
      validateUniqueHeaders(excelHeaders, currentSheetName)

      const rowsData = jsonData.slice(1) as any[][]
      logger.forBot().info(`Found ${rowsData.length} data rows in sheet "${currentSheetName}"`)

      // Determine table name for this sheet
      const tableNameForSheet = sheetToTable[currentSheetName]
      if (!tableNameForSheet) {
        logger.forBot().error(`No table mapping found for sheet "${currentSheetName}", skipping`)
        continue
      }
      logger.forBot().info(`Using mapped table name: "${tableNameForSheet}" for sheet "${currentSheetName}"`)

      let tableId = ''

      try {
        logger.forBot().debug(`Looking for existing table named: "${tableNameForSheet}"`)
        const listTablesResponse = await realClient.listTables({})
        const existingTables = listTablesResponse.tables || []
        let foundTable = existingTables.find((t: { id: string; name: string }) => t.name === tableNameForSheet)

        if (foundTable) {
          tableId = foundTable.id
          logger.forBot().info(`Table "${tableNameForSheet}" (ID: ${tableId}) found.`)
        }

        if (!foundTable) {
          logger.forBot().info(`Table "${tableNameForSheet}" not found. Creating it now.`)
          const properties: { [key: string]: { type: string } } = {}

          // Analyze data to determine column types
          excelHeaders.forEach((header, index) => {
            const cleanHeader = String(header).trim()
            if (cleanHeader) {
              const columnType = detectColumnType(index, rowsData)
              properties[cleanHeader] = { type: columnType }
              logger.forBot().debug(`Column "${cleanHeader}" detected as type: ${columnType}`)
            }
          })

          if (Object.keys(properties).length === 0) {
            const errorMsg =
              excelHeaders.length > 0
                ? 'Excel headers are present but all were empty or invalid after cleaning. Cannot create table schema.'
                : 'No headers found in the Excel sheet to create table schema.'
            logger.forBot().error(errorMsg)
            throw new sdk.RuntimeError(errorMsg)
          }

          const tableSchema = {
            type: 'object' as const,
            properties: properties,
          }

          logger
            .forBot()
            .debug(`Attempting to create table "${tableNameForSheet}" with schema: ${JSON.stringify(tableSchema)}`)
          const createTableResponse = await realClient.createTable({
            name: tableNameForSheet,
            schema: tableSchema,
          })

          if (!createTableResponse.table || !createTableResponse.table.id) {
            logger
              .forBot()
              .error(
                `Failed to create table "${tableNameForSheet}" or extract its ID. Response: ${JSON.stringify(createTableResponse)}`
              )
            throw new sdk.RuntimeError(
              `Failed to create table "${tableNameForSheet}" or extract its ID from Botpress.`
            )
          }
          tableId = createTableResponse.table.id
          logger.forBot().info(`Table "${tableNameForSheet}" created successfully with ID: ${tableId}.`)

          // Mark as found so schema is fetched below
          foundTable = createTableResponse.table
        }

        if (rowsData.length > 0 && tableId) {
          // Clear existing data
          await clearTableRows(realClient, tableId, tableNameForSheet, logger)

          logger.forBot().info(`Populating table "${tableNameForSheet}" (ID: ${tableId}) with ${rowsData.length} new rows.`)

          // Fetch and update schema if needed
          let tableSchema = await fetchTableSchema(realClient, tableId, tableNameForSheet, logger)
          tableSchema = await updateTableSchema(
            realClient,
            tableId,
            tableNameForSheet,
            excelHeaders,
            rowsData,
            tableSchema,
            logger
          )

          // Insert rows
          const rowCount = await insertTableRows(
            realClient,
            tableId,
            tableNameForSheet,
            excelHeaders,
            rowsData,
            tableSchema,
            logger
          )

          if (rowCount > 0) {
            processedSheets.push({
              sheetName: currentSheetName,
              tableName: tableNameForSheet,
              rowCount,
            })
          }
        } else if (!tableId) {
          logger.forBot().error('Table ID not available, cannot populate rows')
        } else {
          logger.forBot().info(`No data rows to populate in sheet "${currentSheetName}"`)
        }
      } catch (apiError: unknown) {
        const errorMsg = getErrorMessage(apiError)
        logger.forBot().error(`Failed to process sheet "${currentSheetName}": ${errorMsg}`)
        logger.forBot().warn(`Continuing with remaining sheets...`)
        
        failedSheets.push({
          sheetName: currentSheetName,
          error: errorMsg,
        })
      }
    } // End of sheet processing loop

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
      ...(failedSheets.length > 0 && { failedSheets }),
    }
  } catch (error: unknown) {
    logger.forBot().error(`Error during Excel file sync for "${sharepointFileUrl}": ${getErrorMessage(error)}`)
    throw error
  }
}

