import { google, sheets_v4 } from 'googleapis'
import * as sdk from '@botpress/sdk'

interface SheetData {
  headers: string[]
  rows: string[][]
}

export class GoogleSheetsClient {
  private sheets: sheets_v4.Sheets

  constructor() {
    this.sheets = google.sheets({ version: 'v4' })
  }

  private extractSpreadsheetId(url: string): string {
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
    const match = url.match(regex)
    if (!match || !match[1]) {
      throw new sdk.RuntimeError('Invalid Google Sheets URL format')
    }
    return match[1]
  }

  private sanitizeSheetId(sheetId: string): string {
    return sheetId.trim().replace(/'/g, "'")
  }

  async getSheetData(sheetsUrl: string, sheetId: string): Promise<SheetData> {
    try {
      const spreadsheetId = this.extractSpreadsheetId(sheetsUrl)
      const sanitizedSheetId = this.sanitizeSheetId(sheetId)
      
      const range = `${sanitizedSheetId}!A:ZZ`
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
        valueRenderOption: 'FORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING',
      })

      const values = response.data.values || []
      
      if (values.length === 0) {
        return { headers: [], rows: [] }
      }

      const headers = values[0] as string[]
      const rows = values.slice(1) as string[][]

      return { headers, rows }
    } catch (error) {
      if (error instanceof Error) {
        throw new sdk.RuntimeError(`Failed to fetch Google Sheets data: ${error.message}`)
      }
      throw new sdk.RuntimeError('Failed to fetch Google Sheets data: Unknown error')
    }
  }

  async validateAccess(sheetsUrl: string, sheetId: string): Promise<boolean> {
    try {
      await this.getSheetData(sheetsUrl, sheetId)
      return true
    } catch {
      return false
    }
  }
}