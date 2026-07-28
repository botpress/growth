/**
 * Represents a column definition with name and detected type
 */
export type ColumnDefinition = {
  name: string
  type: 'number' | 'string'
}

/**
 * Represents parsed Excel sheet data in a format ready for Botpress
 */
export type ParsedSheetData = {
  columns: ColumnDefinition[]
  rows: Array<Record<string, string | number>>
}

