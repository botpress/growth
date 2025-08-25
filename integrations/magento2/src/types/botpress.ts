export interface TableSchema {
  type: string
  properties: Record<string, { type: string }>
}

export interface TableResponse {
  table: {
    id: string
    schema: TableSchema
  }
}

export interface TablesListResponse {
  tables: Array<{ id: string; name: string }>
}
