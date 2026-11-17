import { z } from '@botpress/sdk'

/**
 * Base filter element schema - can be extended by other schemas.
 */
export const odooRequestFilterSchema = z.union([
  z
    .tuple([
      z.string().describe('The field name'),
      z.string().describe('The operator'),
      z
        .union([
          z.string().describe('The value to filter by'),
          z.number().describe('The value to filter by'),
          z.boolean().describe('The value to filter by'),
          z.union([
            z.array(z.string()).describe('The strings to filter by'),
            z.array(z.number()).describe('The numbers to filter by'),
          ]),
        ])
        .describe('The value to filter by'),
    ])
    .describe('The filters to apply to the Odoo request. Must be paired with method "search_read"'),
  z.number().describe('The Odoo ID. Must be paired with method "read" or "write"'),
])

export const odooRequestModelsSchema = z.enum(['helpdesk.ticket', 'helpdesk.stage', 'helpdesk.team', 'res.partner'])
export const odooRequestMethodsSchema = z.enum(['create', 'read', 'write', 'search', 'search_read'])
export const odooRequestFiltersSchema = z.array(odooRequestFilterSchema)
export const odooRequestFieldsSchema = z
  .array(z.string())
  .describe('The fields to retrieve from the Odoo request. Must be paired with method "search_read"')

const odooRequestKwargsValueSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(odooRequestKwargsValueSchema),
    z.record(z.string(), odooRequestKwargsValueSchema),
  ])
)
export const odooRequestKwargsSchema = z
  .record(z.string(), odooRequestKwargsValueSchema)
  .optional()
  .describe('The keyword arguments to pass to the Odoo request')

export const odooResponseFruitfulObjectSchema = z.tuple([z.number(), z.string()])
export const odooResponseObjectSchema = z.union([odooResponseFruitfulObjectSchema, z.boolean()])

/**
 * Zod schema for Odoo API response wrapper.
 * Used to validate all Odoo API responses before processing.
 */
export const odooApiResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  result: z.unknown(),
  error: z
    .object({
      code: z.number(),
      message: z.string(),
      data: z.unknown().optional(),
    })
    .optional(),
  id: z.number().nullable().optional().describe('The ID of the Odoo API response'),
})

export type OdooRequestModel = z.infer<typeof odooRequestModelsSchema>
export type OdooRequestMethod = z.infer<typeof odooRequestMethodsSchema>
export type OdooRequestFilters = z.infer<typeof odooRequestFiltersSchema>
export type OdooRequestFields = z.infer<typeof odooRequestFieldsSchema>
export type OdooRequestKwargs = z.infer<typeof odooRequestKwargsSchema>
export type OdooResponseFruitfulObject = z.infer<typeof odooResponseFruitfulObjectSchema>
export type OdooResponseObject = z.infer<typeof odooResponseObjectSchema>
export type OdooApiResponse = z.infer<typeof odooApiResponseSchema>
