import * as sdk from '@botpress/sdk'
import * as xlsx from 'xlsx'
import { ColumnDefinition, ParsedSheetData } from './types'

/**
 * Detects the type of a column based on its data values
 */
function detectColumnType(columnIndex: number, rowsData: unknown[][]): 'number' | 'string' {
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
 * Parses an Excel worksheet into a structured format with columns and typed rows
 * @throws RuntimeError if sheet is empty, has no headers, or has duplicate headers
 */
export function parseExcelSheet(worksheet: xlsx.WorkSheet, sheetName: string): ParsedSheetData {
  const jsonArray = xlsx.utils.sheet_to_json(worksheet, { header: 1 })

  if (jsonArray.length === 0) {
    throw new sdk.RuntimeError(`Sheet "${sheetName}" is empty`)
  }

  const excelHeaders = jsonArray[0] as string[]
  if (!excelHeaders || excelHeaders.length === 0) {
    throw new sdk.RuntimeError(`Sheet "${sheetName}" has no header row`)
  }

  // Validate no duplicate headers
  validateUniqueHeaders(excelHeaders, sheetName)

  const rowsData = jsonArray.slice(1) as unknown[][]

  // Clean headers and detect column types
  const columns: ColumnDefinition[] = excelHeaders
    .map((header, index) => {
      const cleanName = String(header).trim()
      if (!cleanName) return null
      
      const type = detectColumnType(index, rowsData)
      return { name: cleanName, type }
    })
    .filter((col): col is ColumnDefinition => col !== null)

  if (columns.length === 0) {
    throw new sdk.RuntimeError(
      `Sheet "${sheetName}": Excel headers are present but all were empty or invalid after cleaning. Cannot create table schema.`
    )
  }

  // Map rows to objects with proper types
  const rows = rowsData
    .map((rowArray) => {
      const rowObject: Record<string, string | number> = {}
      
      columns.forEach((column, index) => {
        const value = rowArray[index]
        if (value !== undefined && value !== null && value !== '') {
          // Convert to appropriate type
          if (column.type === 'number') {
            const numValue = Number(value)
            rowObject[column.name] = isNaN(numValue) ? String(value) : numValue
          } else {
            rowObject[column.name] = String(value)
          }
        }
      })
      
      return rowObject
    })
    .filter((obj) => Object.keys(obj).length > 0)

  return { columns, rows }
}

/**
 * Parses the sheet-to-table mapping string into an object
 * @throws RuntimeError if mapping format is invalid
 */
export function parseSheetTableMapping(sheetTableMapping: string): Record<string, string> {
  try {
    if (sheetTableMapping.trim().startsWith('{')) {
      return JSON.parse(sheetTableMapping)
    } else {
      // Parse as comma-separated pairs: Sheet1:table1,Sheet2:table2
      const sheetToTable: Record<string, string> = {}
      sheetTableMapping.split(',').forEach((pair: string) => {
        const [sheet, table] = pair.split(':').map((s: string) => s.trim())
        if (sheet && table) sheetToTable[sheet] = table
      })
      return sheetToTable
    }
  } catch (err) {
    throw new sdk.RuntimeError(`Invalid sheetTableMapping format. Use JSON or comma-separated pairs. Error: ${err}`)
  }
}

