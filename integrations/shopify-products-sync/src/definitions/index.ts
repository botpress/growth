import { z, IntegrationDefinitionProps } from '@botpress/sdk'
import { productCreated, productDeleted, productUpdated } from './events'

export const configuration = {
  schema: z.object({
    shopDomain: z
      .string({
        description: 'Your Shopify shop domain (e.g., yourstoreid.myshopify.com)',
      })
      .min(1),
    apiKey: z
      .string({
        description: 'Shopify Admin API Access Token',
      })
      .min(1),
    knowledgeBaseId: z
      .string({
        description: 'ID of the Knowledge Base you wish to synchronize with your Shopify products',
      })
      .min(1),
  }),
} satisfies IntegrationDefinitionProps['configuration']

export const states = {} satisfies IntegrationDefinitionProps['states']

export const actions = {
  syncKb: {
    title: 'Sync KB',
    description: 'Sync products from Shopify to Botpress Knowledge Base',
    input: {
      schema: z.object({}),
    },
    output: {
      schema: z.object({
        success: z.boolean().describe('Whether the sync was successful'),
        message: z.string().describe('Status message'),
        productsCount: z.number().describe('Number of products synced'),
      }),
    },
  },
} satisfies IntegrationDefinitionProps['actions']

export const events = {
  productCreated,
  productDeleted,
  productUpdated,
} satisfies IntegrationDefinitionProps['events']