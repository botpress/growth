import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import { GoogleSheetsClient } from './client'
import { syncKb } from './actions'

export default new bp.Integration({
  register: async ({ ctx, client, logger }) => {
    const { sheetsUrl, sheetId, knowledgeBaseId } = ctx.configuration

    if (!sheetsUrl || !sheetId || !knowledgeBaseId) {
      throw new sdk.RuntimeError('Missing required configuration: sheetsUrl, sheetId, or knowledgeBaseId')
    }

    const sheetsClient = new GoogleSheetsClient()
    
    const isValidAccess = await sheetsClient.validateAccess(sheetsUrl, sheetId)
    if (!isValidAccess) {
      throw new sdk.RuntimeError('Cannot access the specified Google Sheet. Please ensure the sheet is publicly accessible and the sheet ID is correct.')
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
  unregister: async ({ logger }) => {
    logger.forBot().info('Google Sheets integration unregistered')
  },
  actions: {
    syncKb,
  },
  channels: {},
  handler: async () => {},
})
