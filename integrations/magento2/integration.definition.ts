import { z, IntegrationDefinition } from '@botpress/sdk'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '1.0.5',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      magento_domain: z.string().describe('The domain of the Magento instance (example www.test-domain.com)'),
      consumer_key: z.string().describe('The OAuth Consumer Key'),
      consumer_secret: z.string().describe('The OAuth Consumer Secret'),
      access_token: z.string().describe('The OAuth Access Token'),
      access_token_secret: z.string().describe('The OAuth Access Token Secret'),
      user_agent: z.string().optional().describe('The User Agent to use for the request'),
      botpress_pat: z.string().describe('Botpress Personal Access Token (PAT) for Tables API access'),
    }),
  },
  actions: {
    getProducts: {
      title: 'Get Products',
      description: 'Get products from the Magento instance',
      input: {
        schema: z.object({
          searchCriteria: z.string().optional().describe('The search criteria to use for the request'),
        }),
      },
      output: {
        schema: z.object({
          result: z.object({
            items: z.array(z.any()),
            search_criteria: z.object({}),
            total_count: z.number(),
          }),
        }),
      },
    },
    getStockItem: {
      title: 'Get Stock Item',
      description: 'Get stock information for a product by SKU',
      input: {
        schema: z.object({
          sku: z.string().describe('The SKU of the product to get stock information for'),
        }),
      },
      output: {
        schema: z.object({
          qty: z.number().optional().describe('The quantity in stock'),
          is_in_stock: z.boolean().optional().describe('Whether the item is in stock'),
          error: z.string().optional().describe('Error message if request failed'),
        }),
      },
    },
    syncProducts: {
      title: 'Sync Products to Botpress Table',
      description: 'Sync products from Magento to a Botpress table. Creates the table automatically if it doesn\'t exist with standard product columns.',
      input: {
        schema: z.object({
          table_name: z.string().describe('Name of the Botpress table to sync products to (will be created automatically if it doesn\'t exist)'),
          custom_columns_to_add_to_table: z.string().optional().describe('Comma-separated list of custom product attributes to sync (e.g., "color,tent_outer_material,tent_type")'),
          filters_json: z.string().optional().describe('JSON array of filter objects, e.g. [{"field": "price", "condition": "gt", "value": "100"}]'),
          retreive_reviews: z.boolean().optional().describe('Whether to retrieve reviews from Magento. To retrieve reviews, you must install the Reviews API module.'),
          // Recursive inputs for webhook continuation
          _currentPage: z.number().optional().describe('Current page number (used internally for webhook continuation)'),
          _totalCount: z.number().optional().describe('Total number of products (used internally for webhook continuation)'),
          _tableId: z.string().optional().describe('ID of the Botpress table (used internally for webhook continuation)'),
          _runId: z.string().optional().describe('Sync run ID (used internally for webhook continuation)'),
          _customAttributeCodes: z.array(z.string()).optional().describe('Custom attribute codes (used internally for webhook continuation)'),
          _attributeMappings: z.string().optional().describe('Attribute mappings as a JSON string (used internally for webhook continuation)'),
          _filterCriteria: z.string().optional().describe('Filter criteria string (used internally for webhook continuation)'),
          _currentPageProductIndex: z.number().optional().describe('Current product index within the page (used internally for webhook continuation)'),
        }),
      },
      output: {
        schema: z.object({
          success: z.boolean().describe('Whether the sync was successful'),
          synced_count: z.number().describe('Number of products synced'),
          total_count: z.number().describe('Total number of products found'),
          table_name: z.string().describe('Name of the table products were synced to'),
          status: z.string().describe('Status of the sync'),
          error: z.string().optional().describe('Error message if sync failed'),
        }),
      },
    },
  },
  events: {
    magentoSyncContinue: {
      title: 'Magento Sync Continue',
      description: 'Triggered to continue syncing products from Magento in batches',
      schema: z.object({
        table_name: z.string().describe('Name of the Botpress table to sync products to'),
        custom_columns_to_add_to_table: z.string().optional().describe('Comma-separated list of custom product attributes to sync'),
        filters_json: z.string().optional().describe('JSON array of filter objects'),
        retreive_reviews: z.boolean().optional().describe('Whether to retrieve reviews from Magento'),
        _currentPage: z.number().optional().describe('Current page number'),
        _totalCount: z.number().optional().describe('Total number of products'),
        _tableId: z.string().optional().describe('ID of the Botpress table'),
        _runId: z.string().optional().describe('Sync run ID'),
        _customAttributeCodes: z.array(z.string()).optional().describe('Custom attribute codes'),
        _attributeMappings: z.string().optional().describe('Attribute mappings as a JSON string'),
        _filterCriteria: z.string().optional().describe('Filter criteria string'),
        _currentPageProductIndex: z.number().optional().describe('Current product index within the page'),
      }),
    },
  },
})
