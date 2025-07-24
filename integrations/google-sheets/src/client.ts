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
      
      const spreadsheetResponse = await this.sheets.spreadsheets.get({
        spreadsheetId,
      })

      const targetSheet = spreadsheetResponse.data.sheets?.find(
        sheet => sheet.properties?.sheetId?.toString() === gid
      )

      if (!targetSheet) {
        throw new sdk.RuntimeError(`Sheet with gid ${gid} not found`)
      }

      const sheetName = targetSheet.properties?.title || 'Sheet1'
      const range = `${sheetName}!A:ZZ`
      
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

  async validateAccess(sheetsUrl: string): Promise<boolean> {
    try {
      await this.getSheetData(sheetsUrl)
      return true
    } catch {
      return false
    }
  }
}