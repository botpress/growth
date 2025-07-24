import * as bp from '.botpress'
import * as sdk from '@botpress/sdk'
import { GoogleSheetsClient } from '../client'
import { StoredSheetRow } from '../misc/types'
import { deleteKbFiles } from '../misc/kb'

const syncKb: bp.IntegrationProps['actions']['syncKb'] = async ({
  ctx,
  client,
  logger,
}) => {
  const { sheetsUrl } = ctx.configuration
  const knowledgeBaseId = 'kb-default'

  if (!sheetsUrl) {
    throw new sdk.RuntimeError('Missing required configuration: sheetsUrl')
  }

  const sheetsClient = new GoogleSheetsClient()
  
  try {
    logger.forBot().info('Starting Google Sheets sync to Knowledge Base')
    
    const extractSpreadsheetId = (url: string): string => {
      const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
      const match = url.match(regex)
      return match?.[1] || 'unknown'
    }
    
    const extractGid = (url: string): string => {
      const gidMatch = url.match(/[?&]gid=([0-9]+)/)
      if (gidMatch?.[1]) return gidMatch[1]
      const hashMatch = url.match(/#gid=([0-9]+)/)
      return hashMatch?.[1] || '0'
    }

    const spreadsheetId = extractSpreadsheetId(sheetsUrl)
    const gid = extractGid(sheetsUrl)
    const sourceSheet = `${spreadsheetId}_${gid}`

    logger.forBot().info('Deleting existing Google Sheets files from Knowledge Base')
    await deleteKbFiles(knowledgeBaseId, client, logger)

    logger.forBot().info('Fetching data from Google Sheets')
    const sheetData = await sheetsClient.getSheetData(sheetsUrl)

    if (sheetData.headers.length === 0) {
      return {
        success: true,
        message: 'No data found in the sheet',
        recordsProcessed: 0,
      }
    }

    const uploadTasks: Array<{
      storedRow: StoredSheetRow
      fileKey: string
      content: string
    }> = []

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
        sourceSheet: sourceSheet,
        updatedAt: new Date().toISOString(),
      }

      const fileKey = `${knowledgeBaseId}/sheet_row_${i + 1}.txt`
      const content = JSON.stringify(storedRow, null, 2)

      uploadTasks.push({ storedRow, fileKey, content })
    }

    const BATCH_SIZE = 245
    const shouldUseBatching = uploadTasks.length > BATCH_SIZE
    let allResults: PromiseSettledResult<unknown>[] = []
    let recordsProcessed = 0

    if (shouldUseBatching) {
      for (let i = 0; i < uploadTasks.length; i += BATCH_SIZE) {
        const batch = uploadTasks.slice(i, i + BATCH_SIZE)
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1
        const batchResults = await Promise.allSettled(
          batch.map(task => 
            client.uploadFile({
              key: task.fileKey,
              content: task.content,
              index: true,
              tags: {
                source: 'knowledge-base',
                kbId: knowledgeBaseId,
                rowId: task.storedRow.id,
                origin: 'google-sheets',
                sourceSheet: sourceSheet,
                spreadsheetId: spreadsheetId,
                gid: gid,
              },
            })
          )
        )
        
        const batchSuccesses = batchResults.filter(r => r.status === 'fulfilled').length
        const batchFailures = batchResults.filter(r => r.status === 'rejected').length
        
        if (batchFailures > 0) {
          logger.forBot().error(`Batch ${batchNumber}: ${batchFailures} upload failures`, 
            batchResults.filter(r => r.status === 'rejected')
              .map(r => (r as PromiseRejectedResult).reason)
              .slice(0, 3)
          )
        }
        recordsProcessed += batchSuccesses
        allResults.push(...batchResults)
      }
    } else {
      allResults = await Promise.allSettled(
        uploadTasks.map(task => 
          client.uploadFile({
            key: task.fileKey,
            content: task.content,
            index: true,
            tags: {
              source: 'knowledge-base',
              kbId: knowledgeBaseId,
              rowId: task.storedRow.id,
              origin: 'google-sheets',
              sourceSheet: sourceSheet,
              spreadsheetId: spreadsheetId,
              gid: gid,
            },
          })
        )
      )
      recordsProcessed = allResults.filter(r => r.status === 'fulfilled').length
    }

    const totalFailures = allResults.filter(r => r.status === 'rejected').length
    
    if (totalFailures > 0) {
      logger.forBot().error(`Upload completed with ${totalFailures} failures out of ${uploadTasks.length} total rows`)
    }

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