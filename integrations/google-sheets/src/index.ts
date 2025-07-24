import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import { GoogleSheetsClient } from './client'
import { syncKb } from './actions'
import { deleteKbFiles } from './misc/kb'

export default new bp.Integration({
  register: async ({ ctx, client, logger }) => {
    const { sheetsUrl, knowledgeBaseId } = ctx.configuration

    if (!sheetsUrl || !knowledgeBaseId) {
      throw new sdk.RuntimeError('Missing required configuration: sheetsUrl or knowledgeBaseId')
    }

    const sheetsClient = new GoogleSheetsClient()
    
    const isValidAccess = await sheetsClient.validateAccess(sheetsUrl)
    if (!isValidAccess) {
      throw new sdk.RuntimeError('Cannot access the specified Google Sheet. Please ensure the sheet is publicly accessible.')
    }

    logger.forBot().info('Google Sheets integration registered successfully, triggering initial sync')
    
    await syncKb({
      ctx,
      client,
      logger,
      input: {},
      type: 'syncKb',
      metadata: { setCost: (_cost: number) => {} },
    })
  },
  unregister: async ({ ctx, client, logger }) => {
    logger.forBot().info('Unregistering Google Sheets integration')
    
    try {
      await deleteKbFiles(ctx.configuration.knowledgeBaseId, client)
      logger.forBot().info('Google Sheets integration unregistered and files deleted successfully')
    } catch (error) {
      logger.forBot().error('Error during unregistration', { error })
      throw new sdk.RuntimeError(`Failed to clean up Google Sheets files: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },
  actions: {
    syncKb,
  },
  channels: {},
  handler: async () => {},
})
