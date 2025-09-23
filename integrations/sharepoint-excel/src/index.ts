import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import * as xlsx from 'xlsx'
import axios from 'axios'

import { SharepointClient } from './SharepointClient'

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
    syncExcelFile: async ({ ctx, input, logger }) => {
      logger.forBot().info(`Starting Excel file sync for bot: ${ctx.botId}`)

      const { sharepointFileUrl, sheetName, processAllSheets, sheetTableMapping } = input as any
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

        // Tables API requires a Personal Access Token (PAT) from Botpress
        const token = ctx.configuration.personalAccessToken

        if (!token) {
          logger
            .forBot()
            .error(
              'BOTPRESS_PAT_TOKEN environment variable is not set. Please create a Personal Access Token in Botpress and set it as an environment variable.'
            )
          throw new sdk.RuntimeError(
            'BOTPRESS_PAT_TOKEN is required for Tables API access. Create a PAT in your Botpress workspace settings.'
          )
        }

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

          const rowsData = jsonData.slice(1) as any[][]
          logger.forBot().info(`Found ${rowsData.length} data rows in sheet "${currentSheetName}"`)

          // Determine table name for this sheet
          const tableNameForSheet = sheetToTable[currentSheetName]
          logger.forBot().info(`Using mapped table name: "${tableNameForSheet}" for sheet "${currentSheetName}"`)

          logger.forBot().debug('Using direct API calls to Tables API')

          const apiBaseUrl = 'https://api.botpress.cloud/v1/tables'
          const httpHeaders = {
            Authorization: `bearer ${token}`,
            'x-bot-id': ctx.botId,
            'Content-Type': 'application/json',
          }

          let tableId = ''

          try {
            logger.forBot().debug(`Looking for existing table named: "${tableNameForSheet}"`)
            const listTablesResponse = await axios.get(apiBaseUrl, { headers: httpHeaders })
            const existingTables = listTablesResponse.data.tables || []
            const foundTable = existingTables.find((t: { id: string; name: string }) => t.name === tableNameForSheet)

            if (foundTable) {
              tableId = foundTable.id
              logger.forBot().info(`Table "${tableNameForSheet}" (ID: ${tableId}) found. Clearing all existing rows.`)
              try {
                // Use the correct POST endpoint to delete all rows
                await axios.post(
                  `${apiBaseUrl}/${tableId}/rows/delete`,
                  {
                    deleteAllRows: true,
                  },
                  { headers: httpHeaders }
                )
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
                // Always preserve the table for KB links
                logger
                  .forBot()
                  .warn(
                    `Preserving table to maintain KB links. Will attempt to insert new rows despite clearing error.`
                  )
                logger.forBot().warn(`This may result in duplicate data if old rows weren't properly cleared.`)
              }
            }

            if (!foundTable) {
              logger.forBot().info(`Table "${tableNameForSheet}" not found. Creating it now.`)
              const properties: { [key: string]: { type: string } } = {}

              // Analyze data to determine column types
              excelHeaders.forEach((header, index) => {
                const cleanHeader = String(header).trim()
                if (cleanHeader) {
                  // Check the values in this column to determine type
                  let isNumeric = true
                  let hasData = false

                  for (const row of rowsData) {
                    const value = row[index]
                    if (value !== undefined && value !== null && value !== '') {
                      hasData = true
                      // Check if the value is numeric
                      if (isNaN(Number(value))) {
                        isNumeric = false
                        break
                      }
                    }
                  }

                  // Default to string if no data or mixed types
                  const columnType = hasData && isNumeric ? 'number' : 'string'
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

              const createTablePayload = {
                name: tableNameForSheet,
                schema: {
                  type: 'object',
                  properties: properties,
                },
              }

              logger
                .forBot()
                .debug(
                  `Attempting to create table "${tableNameForSheet}" with schema: ${JSON.stringify(createTablePayload.schema)}`
                )
              const createTableResponse = await axios.post(apiBaseUrl, createTablePayload, { headers: httpHeaders })

              if (!createTableResponse.data || !createTableResponse.data.table || !createTableResponse.data.table.id) {
                logger
                  .forBot()
                  .error(
                    `Failed to create table "${tableNameForSheet}" or extract its ID. Response: ${JSON.stringify(createTableResponse.data)}`
                  )
                throw new sdk.RuntimeError(
                  `Failed to create table "${tableNameForSheet}" or extract its ID from Botpress.`
                )
              }
              tableId = createTableResponse.data.table.id
              logger.forBot().info(`Table "${tableNameForSheet}" created successfully with ID: ${tableId}.`)
            }

            if (rowsData.length > 0 && tableId) {
              logger
                .forBot()
                .info(`Populating table "${tableNameForSheet}" (ID: ${tableId}) with ${rowsData.length} new rows.`)

              // Get the schema to know the column types
              let tableSchema: any = null
              if (foundTable) {
                // If we found an existing table, get its schema
                try {
                  const tableDetailsResponse = await axios.get(`${apiBaseUrl}/${tableId}`, { headers: httpHeaders })
                  tableSchema = tableDetailsResponse.data.table?.schema
                } catch {
                  logger.forBot().warn('Could not fetch table schema, will use string types for all columns')
                }
              }

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
                          rowObject[cleanHeader] = isNaN(numValue) ? value : numValue
                        } else {
                          rowObject[cleanHeader] = String(value)
                        }
                      } else {
                        rowObject[cleanHeader] = tableSchema?.properties?.[cleanHeader]?.type === 'number' ? null : ''
                      }
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
                  await axios.post(`${apiBaseUrl}/${tableId}/rows`, { rows: batch }, { headers: httpHeaders })
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
