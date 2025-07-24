import * as sdk from '@botpress/sdk'

interface SheetData {
  headers: string[]
  rows: string[][]
}

export class GoogleSheetsClient {
  constructor() {}

  private parseCsv(csvText: string): string[][] {
    const lines = csvText.split('\n').filter(line => line.trim() !== '')
    const result: string[][] = []
    
    for (const line of lines) {
      const row: string[] = []
      let currentField = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            currentField += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === ',' && !inQuotes) {
          row.push(currentField.trim())
          currentField = ''
        } else {
          currentField += char
        }
      }
      
      row.push(currentField.trim())
      result.push(row)
    }
    
    return result
  }

  private extractSpreadsheetId(url: string): string {
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
    const match = url.match(regex)
    if (!match || !match[1]) {
      throw new sdk.RuntimeError('Invalid Google Sheets URL format')
    }
    return match[1]
  }

  private extractGidFromUrl(url: string): string {
    const gidMatch = url.match(/[?&]gid=([0-9]+)/)
    if (gidMatch && gidMatch[1]) {
      return gidMatch[1]
    }
    const hashMatch = url.match(/#gid=([0-9]+)/)
    if (hashMatch && hashMatch[1]) {
      return hashMatch[1]
    }
    return '0'
  }

  async getSheetData(sheetsUrl: string): Promise<SheetData> {
    try {
      const spreadsheetId = this.extractSpreadsheetId(sheetsUrl)
      const gid = this.extractGidFromUrl(sheetsUrl)
      
      const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`
      
      const response = await fetch(csvUrl)
      
      if (!response.ok) {
        throw new sdk.RuntimeError(`Failed to fetch sheet data: ${response.status} ${response.statusText}`)
      }
      
      const csvText = await response.text()
      
      if (!csvText.trim()) {
        return { headers: [], rows: [] }
      }
      
      const allRows = this.parseCsv(csvText)
      
      if (allRows.length === 0) {
        return { headers: [], rows: [] }
      }
      
      const headers = allRows[0] || []
      const rows = allRows.slice(1)
      
      return { headers, rows }
    } catch (error) {
      if (error instanceof sdk.RuntimeError) {
        throw error
      }
      if (error instanceof Error) {
        throw new sdk.RuntimeError(`Failed to fetch Google Sheets data: ${error.message}`)
      }
      throw new sdk.RuntimeError('Failed to fetch Google Sheets data: Unknown error')
    }
  }

  async validateAccess(sheetsUrl: string): Promise<boolean> {
    try {
      await this.getSheetData(sheetsUrl)
      return true
    } catch {
      return false
    }
  }
}