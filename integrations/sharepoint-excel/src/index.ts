import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import * as xlsx from 'xlsx'
import axios from 'axios'

import { SharepointClient } from './SharepointClient'

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

export default new bp.Integration({
  register: async ({ ctx, logger }) => {
    logger.forBot().info(`Registering SharePoint Excel integration for bot: ${ctx.botId}. Performing connection test.`)
    const spClient = new SharepointClient({
      primaryDomain: ctx.configuration.primaryDomain,
      siteName: ctx.configuration.siteName,
      clientId: ctx.configuration.clientId,
      tenantId: ctx.configuration.tenantId,
      thumbprint: ctx.configuration.thumbprint,
      privateKey: ctx.configuration.privateKey,
    })

    try {
      const siteId = await spClient.getSiteId()
      logger.forBot().info(`SharePoint connection test successful during registration. Site ID: ${siteId}`)
    } catch (error: any) {
      logger.forBot().error(`SharePoint connection test failed during registration: ${error.message}`, error.stack)
      throw new sdk.RuntimeError(`SharePoint connection validation failed during registration: ${error.message}`)
    }
  },

  unregister: async ({ ctx, logger }) => {
    logger.forBot().info(`Unregistering SharePoint Excel integration for bot: ${ctx.botId}`)
    // No cleanup needed for Excel integration
  },

  actions: {
    syncExcelFile: async ({ ctx, input, logger, client }) => {
      logger.forBot().info(`Starting Excel file sync for bot: ${ctx.botId}`)
      const getRealClient = (client: sdk.IntegrationSpecificClient<bp.TIntegration>) => (client as any)._client
      const realClient = getRealClient(client)

      const { sharepointFileUrl, sheetTableMapping, processAllSheets } = input
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

        // If in debug mode or if file not found, list available document libraries
        let fileContentBuffer: Buffer
        try {
          fileContentBuffer = await spClient.getFileContentByUrl(sharepointFileUrl)
          logger.forBot().info('Successfully fetched Excel file content.')
        } catch (error: any) {
          if (error.message.includes('404') || error.message.includes('not found')) {
            logger.forBot().warn('File not found. Listing available document libraries to help diagnose the issue...')
            try {
              const libraries = await spClient.listDocumentLibraries()
              logger.forBot().info(`Available document libraries in site "${ctx.configuration.siteName}":`)
              libraries.forEach((lib) => {
                logger.forBot().info(`- ${lib.name} (Web URL: ${lib.webUrl})`)
              })
              logger.forBot().info('Please ensure your file URL matches one of these document libraries.')
            } catch (listError) {
              logger.forBot().error('Could not list document libraries:', listError)
            }
          }
          throw error
        }

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

          // Check for duplicate headers
          const cleanHeaders = excelHeaders.map((h) => String(h).trim()).filter((h) => h !== '')
          const headerCounts = new Map<string, number>()
          cleanHeaders.forEach((header) => {
            headerCounts.set(header, (headerCounts.get(header) || 0) + 1)
          })
          const duplicates = Array.from(headerCounts.entries())
            .filter(([_, count]) => count > 1)
            .map(([header, count]) => `"${header}" (${count}x)`)

          if (duplicates.length > 0) {
            const errorMsg = `Sheet "${currentSheetName}" has duplicate column headers: ${duplicates.join(', ')}. Each column must have a unique name.`
            logger.forBot().error(errorMsg)
            throw new sdk.RuntimeError(errorMsg)
          }

          const rowsData = jsonData.slice(1) as any[][]
          logger.forBot().info(`Found ${rowsData.length} data rows in sheet "${currentSheetName}"`)

          // Determine table name for this sheet
          const tableNameForSheet = sheetToTable[currentSheetName]
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
              logger.forBot().info(`Clearing all existing rows from table "${tableNameForSheet}" (ID: ${tableId}).`)
              try {
                await realClient.deleteTableRows({
                  table: tableId,
                  deleteAllRows: true,
                })
                logger
                  .forBot()
                  .info(`Successfully cleared all rows from table "${tableNameForSheet}" (ID: ${tableId}).`)
              } catch (deleteError: any) {
                logger
                  .forBot()
                  .error(
                    `Error clearing rows from table "${tableNameForSheet}" (ID: ${tableId}): ${deleteError.message}`,
                    deleteError.stack
                  )
                logger.forBot().warn(`This may result in duplicate data if old rows weren't properly cleared.`)
              }

              logger
                .forBot()
                .info(`Populating table "${tableNameForSheet}" (ID: ${tableId}) with ${rowsData.length} new rows.`)

              // Get the schema to know the column types
              let tableSchema: any = null
              if (foundTable) {
                // If we found an existing table or just created one, get its schema
                try {
                  const tableDetailsResponse = await realClient.getTable({ table: tableId })
                  tableSchema = tableDetailsResponse.table?.schema
                } catch (error: any) {
                  logger
                    .forBot()
                    .warn(
                      `Could not fetch table schema for "${tableNameForSheet}": ${error.message}. Will use string types for all columns.`
                    )
                }

                // If we successfully fetched the schema, check for schema changes
                if (tableSchema) {
                  // Compare Excel headers with existing table schema
                  const { columnsToAdd, columnsToRemove, unchangedColumns } = compareColumns(excelHeaders, tableSchema)

                  // Log schema changes (only adding columns, not removing)
                  if (columnsToAdd.length > 0 || columnsToRemove.length > 0) {
                    logger
                      .forBot()
                      .info(
                        `Schema changes detected for table "${tableNameForSheet}": ${columnsToAdd.length} columns to add`
                      )

                    if (columnsToAdd.length > 0) {
                      logger.forBot().info(`Columns to add: [${columnsToAdd.join(', ')}]`)
                    }

                    if (columnsToRemove.length > 0) {
                      logger.forBot().warn(`Columns no longer in Excel: [${columnsToRemove.join(', ')}]`)
                      logger
                        .forBot()
                        .warn(
                          'These columns will be preserved in the table to maintain KB links. Remove them manually if needed.'
                        )
                    }

                    // Build updated schema
                    const updatedProperties: { [key: string]: { type: string } } = {}

                    // Preserve unchanged columns with their existing types
                    unchangedColumns.forEach((col) => {
                      if (tableSchema.properties[col]) {
                        updatedProperties[col] = tableSchema.properties[col]
                      }
                    })

                    // Preserve columns that are no longer in Excel (to maintain KB links)
                    columnsToRemove.forEach((col) => {
                      if (tableSchema.properties[col]) {
                        updatedProperties[col] = tableSchema.properties[col]
                      }
                    })

                    // Add new columns with type detection
                    columnsToAdd.forEach((col) => {
                      const columnIndex = excelHeaders.indexOf(col)
                      const detectedType = detectColumnType(columnIndex, rowsData)
                      updatedProperties[col] = { type: detectedType }
                    })

                    // Update table schema
                    if (columnsToAdd.length > 0 || columnsToRemove.length > 0) {
                      try {
                        // Build the schema update payload
                        const updateSchemaPayload: any = {
                          name: tableNameForSheet,
                          frozen: false,
                          schema: {
                            type: 'object',
                            properties: updatedProperties,
                          },
                          tags: {},
                          isComputeEnabled: false,
                        }

                        // Add null entries for columns to remove (at schema root level)
                        if (columnsToRemove.length > 0) {
                          // Create a new schema object with null entries for removed columns
                          const schemaWithRemovals: any = {}
                          columnsToRemove.forEach((col) => {
                            schemaWithRemovals[col] = null
                          })
                          updateSchemaPayload.schema = schemaWithRemovals
                        }

                        const updateResponse = await realClient.updateTable({
                          table: tableId,
                          ...updateSchemaPayload,
                        })

                        logger.forBot().info(`Successfully updated schema for table "${tableNameForSheet}"`)

                        // Use the schema from the response
                        if (updateResponse.table?.schema) {
                          tableSchema = updateResponse.table.schema
                        } else {
                          // Fall back to re-fetching if not in response
                          try {
                            const updatedTableResponse = await realClient.getTable({ table: tableId })
                            tableSchema = updatedTableResponse.table?.schema
                          } catch (refetchError: any) {
                            logger
                              .forBot()
                              .warn(`Could not re-fetch updated schema, using local schema: ${refetchError.message}`)
                            tableSchema = updateSchemaPayload.schema.properties
                              ? updateSchemaPayload.schema
                              : { properties: updateSchemaPayload.schema.properties }
                          }
                        }

                        // Ensure the updated schema includes the newly added columns before inserting rows
                        if (columnsToAdd.length > 0) {
                          try {
                            const maxAttempts = 6
                            let attempt = 0
                            // Helper to check if all new columns are present
                            const allNewColumnsPresent = () => columnsToAdd.every((c) => !!tableSchema?.properties?.[c])

                            while (!allNewColumnsPresent() && attempt < maxAttempts) {
                              await new Promise((resolve) => setTimeout(resolve, 1000))
                              const refreshed = await realClient.getTable({ table: tableId })
                              tableSchema = refreshed.table?.schema
                              attempt++
                            }

                            if (!allNewColumnsPresent()) {
                              logger
                                .forBot()
                                .warn(
                                  `New columns may not be propagated yet after schema update: missing [${columnsToAdd
                                    .filter((c) => !tableSchema?.properties?.[c])
                                    .join(', ')}]. Proceeding with best-effort.`
                                )
                            }
                          } catch (waitErr) {
                            logger
                              .forBot()
                              .warn(`Failed while waiting for schema propagation: ${(waitErr as any)?.message}`)
                          }
                        }
                      } catch (schemaUpdateError: any) {
                        logger
                          .forBot()
                          .error(
                            `Failed to update table schema for "${tableNameForSheet}": ${schemaUpdateError.response?.data?.message || schemaUpdateError.message}`
                          )
                        if (schemaUpdateError.response?.data) {
                          logger.forBot().error(`API Error Details: ${JSON.stringify(schemaUpdateError.response.data)}`)
                        }
                        throw new sdk.RuntimeError(
                          `Failed to update table schema: ${schemaUpdateError.response?.data?.message || schemaUpdateError.message}`
                        )
                      }
                    }
                  } else {
                    logger.forBot().info(`No schema changes detected for table "${tableNameForSheet}"`)
                  }
                }
              }

              const rowsToInsert = rowsData
                .map((rowArray) => {
                  const rowObject: { [key: string]: any } = {}
                  excelHeaders.forEach((header, index) => {
                    const cleanHeader = String(header).trim()
                    if (cleanHeader) {
                      const value = rowArray[index]
                      // Only add the property if it has a non-empty value
                      if (value !== undefined && value !== null && value !== '') {
                        // Convert to appropriate type based on schema
                        if (tableSchema?.properties?.[cleanHeader]?.type === 'number') {
                          const numValue = Number(value)
                          rowObject[cleanHeader] = isNaN(numValue) ? String(value) : numValue
                        } else {
                          rowObject[cleanHeader] = String(value)
                        }
                      }
                      // Omit empty values entirely - don't set null or empty string
                    }
                  })
                  return rowObject
                })
                .filter((obj) => Object.keys(obj).length > 0)

              if (rowsToInsert.length > 0) {
                // Create rows in the table with batching
                const BATCH_SIZE = 50
                const totalRows = rowsToInsert.length
                let processedRows = 0

                while (processedRows < totalRows) {
                  const batch = rowsToInsert.slice(processedRows, processedRows + BATCH_SIZE)
                  await realClient.createTableRows({ table: tableId, rows: batch })
                  processedRows += batch.length
                  logger.forBot().info(`Processed ${processedRows}/${totalRows} rows for table "${tableNameForSheet}"`)
                }

                logger
                  .forBot()
                  .info(`Successfully populated table "${tableNameForSheet}" with ${rowsToInsert.length} rows`)

                processedSheets.push({
                  sheetName: currentSheetName,
                  tableName: tableNameForSheet,
                  rowCount: rowsToInsert.length,
                })
              } else if (rowsData.length > 0) {
                logger
                  .forBot()
                  .warn(`Data rows were present in sheet "${currentSheetName}", but no valid rows could be constructed`)
              }
            } else if (!tableId) {
              logger.forBot().error('Table ID not available, cannot populate rows')
            } else {
              logger.forBot().info(`No data rows to populate in sheet "${currentSheetName}"`)
            }
          } catch (apiError: any) {
            logger
              .forBot()
              .error(
                `Tables API error for sheet "${currentSheetName}": ${apiError.response?.data?.message || apiError.message}`,
                apiError.stack
              )
            if (apiError.response?.data) {
              logger.forBot().error(`API Response: ${JSON.stringify(apiError.response.data)}`)
            }

            if (!processAllSheets) {
              // If not processing all sheets, throw error immediately
              throw apiError
            } else {
              // If processing all sheets, log error and continue with next sheet
              logger.forBot().warn(`Failed to process sheet "${currentSheetName}", continuing with other sheets...`)
            }
          }
        } // End of sheet processing loop

        logger.forBot().info(`\n--- Excel file sync completed ---`)
        logger.forBot().info(`Processed ${processedSheets.length} sheet(s) successfully`)

        return {
          processedSheets: processedSheets,
        }
      } catch (error: any) {
        logger.forBot().error(`Error during Excel file sync for "${sharepointFileUrl}": ${error.message}`, error.stack)
        throw error
      }
    },
  },

  handler: async ({}) => {},

  channels: {},
})
