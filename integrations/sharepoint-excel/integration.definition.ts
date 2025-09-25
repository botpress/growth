import { z, IntegrationDefinition } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'plus/sharepoint-excel',
  version: '2.2.0',
  title: 'SharePoint Excel',
  description: 'Sync one or many SharePoint document libraries with one or more Botpress knowledge bases.',
  readme: 'hub.md',
  icon: 'icon.svg',

  /******************************************************************
   * CONFIGURATION (user‑visible)
   ******************************************************************/
  configuration: {
    schema: z.object({
      clientId: z.string().min(1).describe('Azure AD application client ID'),
      tenantId: z.string().min(1).describe('Azure AD tenant ID'),
      thumbprint: z.string().min(1).describe('Certificate thumbprint'),
      privateKey: z.string().min(1).describe('PEM‑formatted certificate private key'),
      primaryDomain: z.string().min(1).describe('SharePoint primary domain (e.g. contoso)'),
      siteName: z.string().min(1).describe('SharePoint site name'),
      personalAccessToken: z.string().min(1).describe('Botpress Personal Access Token (PAT) for Tables API access'),
    }),
  },

  /******************************************************************
   * STATE (stored per installation)
   ******************************************************************/
  states: {},

  /******************************************************************
   * ACTIONS
   ******************************************************************/
  actions: {
    syncExcelFile: {
      title: 'Sync Excel File',
      description: 'Download an Excel file from SharePoint and sync it to a Botpress table',
      input: {
        schema: z.object({
          sharepointFileUrl: z.string().min(1).describe('Full URL to the Excel file in SharePoint'),
          sheetTableMapping: z
            .string()
            .describe(
              'Map sheets to tables. Format: \'Sheet1:table1,Sheet2:table2\' or JSON: \'{"Sheet1":"table1","Sheet2":"table2"}\''
            ),
        }),
      },
      output: {
        schema: z.object({
          processedSheets: z
            .array(
              z.object({
                sheetName: z.string(),
                tableName: z.string(),
                rowCount: z.number(),
              })
            )
            .optional(),
        }),
      },
    },
  },
})
