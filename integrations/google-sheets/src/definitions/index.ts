import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const configuration = {
  schema: z.object({
    sheetsUrl: z
      .string({
        description: 'Public Google Sheets shareable link',
      })
      .url()
      .min(1),
    sheetId: z
      .string({
        description: 'Sheet/tab ID or name within the spreadsheet',
      })
      .min(1),
    knowledgeBaseId: z
      .string({
        description: 'Botpress Knowledge Base ID to sync data to',
      })
      .min(1),
  }),
} satisfies IntegrationDefinitionProps['configuration']

export const actions = {
  syncKb: {
    title: 'Sync KB',
    description: 'Sync data from Google Sheets to Botpress Knowledge Base',
    input: {
      schema: z.object({}),
    },
    output: {
      schema: z.object({
        success: z.boolean().describe('Whether the sync was successful'),
        message: z.string().describe('Status message'),
        recordsProcessed: z.number().optional().describe('Number of records processed'),
      }),
    },
  },
} satisfies IntegrationDefinitionProps['actions']

export const events = {} satisfies IntegrationDefinitionProps['events']

export const states = {} satisfies IntegrationDefinitionProps['states']