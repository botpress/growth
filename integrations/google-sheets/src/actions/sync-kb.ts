import * as bp from '.botpress'
import * as sdk from '@botpress/sdk'
import { GoogleSheetsClient } from '../client'
import { StoredSheetRow } from '../misc/types'

const syncKb: bp.IntegrationProps['actions']['syncKb'] = async ({
  ctx,
  client,
  logger,
}) => {
  const { sheetsUrl, sheetId, knowledgeBaseId } = ctx.configuration

  if (!sheetsUrl || !sheetId || !knowledgeBaseId) {
    throw new sdk.RuntimeError('Missing required configuration: sheetsUrl, sheetId, or knowledgeBaseId')
  }

  const sheetsClient = new GoogleSheetsClient()
  
  try {
    logger.forBot().info('Starting Google Sheets sync to Knowledge Base')

    const existingFiles = await client.listFiles({
      tags: {
        kbId: knowledgeBaseId,
        origin: 'google-sheets',
      },
    })

    logger.forBot().info(`Found ${existingFiles.files.length} existing files to delete`)

    for (const file of existingFiles.files) {
      await client.deleteFile({ id: file.id })
    }

    logger.forBot().info('Fetching data from Google Sheets')
    const sheetData = await sheetsClient.getSheetData(sheetsUrl, sheetId)

    if (sheetData.headers.length === 0) {
      return {
        success: true,
        message: 'No data found in the sheet',
        recordsProcessed: 0,
      }
    }

    const uploadPromises: Promise<void>[] = []
    let recordsProcessed = 0

    for (let i = 0; i < sheetData.rows.length; i++) {
      const row = sheetData.rows[i]
      if (!row || row.length === 0) continue

      const rowData: Record<string, string | undefined> = {}
      sheetData.headers.forEach((header, index) => {
        rowData[header] = row[index] || ''
      })

      const storedRow: StoredSheetRow = {
        id: `row_${i + 1}`,
        rowIndex: i + 1,
        data: rowData,
        sourceSheet: sheetId,
        updatedAt: new Date().toISOString(),
      }

      const fileKey = `${knowledgeBaseId}/sheet_row_${i + 1}.json`
      const content = JSON.stringify(storedRow, null, 2)

      const uploadPromise = client.uploadFile({
        key: fileKey,
        content,
        tags: {
          source: 'knowledge-base',
          kbId: knowledgeBaseId,
          rowId: storedRow.id,
          origin: 'google-sheets',
          sheetId: sheetId,
        },
      })

      uploadPromises.push(uploadPromise.then(() => {}))
      recordsProcessed++
    }

    await Promise.all(uploadPromises)

    logger.forBot().info(`Successfully synced ${recordsProcessed} rows to Knowledge Base`)

    return {
      success: true,
      message: `Successfully synced ${recordsProcessed} rows from Google Sheets to Knowledge Base`,
      recordsProcessed,
    }
  } catch (error) {
    logger.forBot().error('Error syncing Google Sheets to Knowledge Base', { error })
    
    if (error instanceof sdk.RuntimeError) {
      throw error
    }
    
    throw new sdk.RuntimeError(`Failed to sync Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export { syncKb }