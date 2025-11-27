import * as sdk from '@botpress/sdk'
import { Client, Table } from '@botpress/client'
import { ColumnDefinition } from './types'

type Logger = {
  forBot: () => {
    info: (message: string) => void
    warn: (message: string) => void
    error: (message: string) => void
    debug: (message: string) => void
  }
}

/**
 * Compares column definitions with existing table schema to determine changes
 */
function compareColumns(
  columns: ColumnDefinition[],
  botpressTableSchema: Table['schema']
): { columnsToAdd: ColumnDefinition[]; columnsToRemove: string[]; columnsToKeep: ColumnDefinition[] } {
  const columnNames = columns.map((c) => c.name)
  const existingColumns = botpressTableSchema?.properties ? Object.keys(botpressTableSchema.properties) : []

  const columnsToAdd = columns.filter((col) => !existingColumns.includes(col.name))
  const columnsToRemove = existingColumns.filter((col) => !columnNames.includes(col))
  const columnsToKeep = columns.filter((col) => existingColumns.includes(col.name))

  return { columnsToAdd, columnsToRemove, columnsToKeep }
}

/**
 * Clears all rows from a table (non-fatal operation)
 */
export async function clearTableRows(
  bpClient: Client,
  tableId: string,
  tableName: string,
  logger: Logger
): Promise<void> {
  logger.forBot().info(`Clearing all existing rows from table "${tableName}" (ID: ${tableId}).`)
  
  try {
    await bpClient.deleteTableRows({
      table: tableId,
      deleteAllRows: true,
    })
    logger.forBot().info(`Successfully cleared all rows from table "${tableName}" (ID: ${tableId}).`)
  } catch (deleteError: unknown) {
    const errorMsg = deleteError instanceof Error ? deleteError.message : String(deleteError)
    logger.forBot().error(
      `Error clearing rows from table "${tableName}" (ID: ${tableId}): ${errorMsg}`
    )
    logger.forBot().warn(`This may result in duplicate data if old rows weren't properly cleared.`)
  }
}

/**
 * Fetches table schema (required operation - throws on failure)
 */
export async function fetchTableSchema(
  bpClient: Client,
  tableId: string,
  tableName: string,
  logger: Logger
): Promise<Table['schema']> {
  const tableDetailsResponse = await bpClient.getTable({ table: tableId })
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
  bpClient: Client,
  tableId: string,
  columnsToAdd: ColumnDefinition[],
  botpressTableSchema: Table['schema'],
  logger: Logger
): Promise<Table['schema']> {
  try {
    const maxAttempts = 6
    let attempt = 0
    let currentSchema = botpressTableSchema
    
    const allNewColumnsPresent = (schema: Table['schema']) => 
      columnsToAdd.every((c) => !!schema?.properties?.[c.name])

    while (!allNewColumnsPresent(currentSchema) && attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const refreshed = await bpClient.getTable({ table: tableId })
      currentSchema = refreshed.table?.schema
      attempt++
    }

    if (!allNewColumnsPresent(currentSchema)) {
      const missingColumns = columnsToAdd.filter((c) => !currentSchema?.properties?.[c.name])
      logger.forBot().warn(
        `New columns may not be propagated yet after schema update: missing [${missingColumns.map(c => c.name).join(', ')}]. Proceeding with best-effort.`
      )
    }
    
    return currentSchema
  } catch (waitErr: unknown) {
    const errorMsg = waitErr instanceof Error ? waitErr.message : String(waitErr)
    logger.forBot().warn(`Failed while waiting for schema propagation: ${errorMsg}`)
    return botpressTableSchema
  }
}

/**
 * Handles schema updates (add new columns, remove old ones)
 */
export async function updateTableSchema(
  bpClient: Client,
  tableId: string,
  tableName: string,
  columns: ColumnDefinition[],
  botpressTableSchema: Table['schema'],
  logger: Logger
): Promise<Table['schema']> {
  const { columnsToAdd, columnsToRemove, columnsToKeep } = compareColumns(columns, botpressTableSchema)

  // No changes needed
  if (columnsToAdd.length === 0 && columnsToRemove.length === 0) {
    logger.forBot().info(`No schema changes detected for table "${tableName}"`)
    return botpressTableSchema
  }

  // Log what's changing
  logger
    .forBot()
    .info(`Schema changes detected for table "${tableName}": ${columnsToAdd.length} to add, ${columnsToRemove.length} to remove`)

  if (columnsToAdd.length > 0) {
    logger.forBot().info(`Columns to add: [${columnsToAdd.map(c => c.name).join(', ')}]`)
  }

  if (columnsToRemove.length > 0) {
    logger.forBot().warn(`Columns no longer in Excel will be removed: [${columnsToRemove.join(', ')}]`)
  }

  // Build updated schema with unchanged + new columns
  const updatedProperties: Record<string, unknown> = {}

  columnsToKeep.forEach((col) => {
    const existingProperty = botpressTableSchema?.properties?.[col.name]
    if (existingProperty) {
      updatedProperties[col.name] = existingProperty
    }
  })

  columnsToAdd.forEach((col) => {
    updatedProperties[col.name] = { type: col.type }
  })

  // Prepare update payload
  const updateSchemaPayload: {
    name: string
    frozen: boolean
    schema: { type: string; properties: Record<string, unknown> } | Record<string, null>
    tags: Record<string, never>
    isComputeEnabled: boolean
  } = {
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
    const schemaWithRemovals: Record<string, null> = {}
    columnsToRemove.forEach((col) => {
      schemaWithRemovals[col] = null
    })
    updateSchemaPayload.schema = schemaWithRemovals
  }

  // Execute update
  const updateResponse = await bpClient.updateTable({
    table: tableId,
    ...updateSchemaPayload,
  })

  logger.forBot().info(`Successfully updated schema for table "${tableName}"`)

  // Get the updated schema
  let updatedSchema = updateResponse.table?.schema || await fetchTableSchema(bpClient, tableId, tableName, logger)

  // Wait for new columns to propagate
  if (columnsToAdd.length > 0) {
    updatedSchema = await waitForSchemaPropagation(bpClient, tableId, columnsToAdd, updatedSchema, logger)
  }

  return updatedSchema
}

/**
 * Inserts rows into a Botpress table in batches
 */
export async function insertTableRows(
  bpClient: Client,
  tableId: string,
  tableName: string,
  rows: Array<Record<string, string | number>>,
  logger: Logger
): Promise<number> {
  if (rows.length === 0) {
    logger.forBot().warn(`No valid rows to insert into table "${tableName}"`)
    return 0
  }

  // Insert in batches
  const BATCH_SIZE = 50
  const totalRows = rows.length
  let processedRows = 0

  while (processedRows < totalRows) {
    const batch = rows.slice(processedRows, processedRows + BATCH_SIZE)
    await bpClient.createTableRows({ table: tableId, rows: batch })
    processedRows += batch.length
    logger.forBot().info(`Processed ${processedRows}/${totalRows} rows for table "${tableName}"`)
  }

  logger.forBot().info(`Successfully populated table "${tableName}" with ${rows.length} rows`)
  return rows.length
}

/**
 * Ensures a table exists (creates if necessary) and returns its ID
 */
export async function ensureTableExists(
  bpClient: Client,
  tableName: string,
  columns: ColumnDefinition[],
  logger: Logger
): Promise<string> {
  logger.forBot().debug(`Looking for existing table named: "${tableName}"`)
  const listTablesResponse = await bpClient.listTables({})
  const existingTables = listTablesResponse.tables || []
  const foundTable = existingTables.find((t: { id: string; name: string }) => t.name === tableName)

  if (foundTable) {
    logger.forBot().info(`Table "${tableName}" (ID: ${foundTable.id}) found.`)
    return foundTable.id
  }

  // Create new table
  logger.forBot().info(`Table "${tableName}" not found. Creating it now.`)
  const properties: { [key: string]: { type: string } } = {}

  columns.forEach((column) => {
    properties[column.name] = { type: column.type }
    logger.forBot().debug(`Column "${column.name}" detected as type: ${column.type}`)
  })

  if (Object.keys(properties).length === 0) {
    const errorMsg = 'No valid columns found to create table schema.'
    logger.forBot().error(errorMsg)
    throw new sdk.RuntimeError(errorMsg)
  }

  const tableSchema = {
    type: 'object' as const,
    properties: properties,
  }

  logger.forBot().debug(`Attempting to create table "${tableName}" with schema: ${JSON.stringify(tableSchema)}`)
  const createTableResponse = await bpClient.createTable({
    name: tableName,
    schema: tableSchema,
  })

  if (!createTableResponse.table || !createTableResponse.table.id) {
    logger
      .forBot()
      .error(
        `Failed to create table "${tableName}" or extract its ID. Response: ${JSON.stringify(createTableResponse)}`
      )
    throw new sdk.RuntimeError(`Failed to create table "${tableName}" or extract its ID from Botpress.`)
  }

  logger.forBot().info(`Table "${tableName}" created successfully with ID: ${createTableResponse.table.id}.`)
  return createTableResponse.table.id
}

