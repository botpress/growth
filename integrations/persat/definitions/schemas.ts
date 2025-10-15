import { z } from '@botpress/sdk'

export const SearchSchema = z.object({
  uid_client: z.string().title('Client ID to search for').min(1),
})

export const ClientSchema = z.object({
  uid_client: z.string().title('Client ID').describe('The customer number/ID (alphanumeric). Must be unique.'),
  company_name: z.string().optional().describe('Client name, company name, or trade name.'),
  company_description: z.string().optional().describe('Client description.'),
  latitude: z.number().optional().describe('Customer location, latitude.'),
  longitude: z.number().optional().describe('Customer location, longitude.'),
  service_time: z.number().optional().describe('Service time. Used by the routing algorithm.'),
  wt: z
    .array(z.number())
    .title('Opening and closing time')
    .optional()
    .describe(
      'Opening and closing times of the establishment. Should contain exactly 2 numbers: [open, close] times in minutes.'
    ),
  street: z.string().optional().describe('Street where the client is located (exclude number).'),
  street_nbr: z.string().optional().describe('Street number.'),
  neighborhood: z.string().optional().describe("Neighborhood, e.g. 'Devoto'."),
  city: z.string().optional().describe("City, e.g. 'CABA'."),
  country: z.string().optional().describe("Country, e.g. 'Argentina'."),
  last_updated: z.string().optional().describe('Last update timestamp (ISO 8601).'),
  custom_fields: z
    .string()
    .displayAs<any>({
      id: 'text',
      params: {
        allowDynamicVariable: true,
        growVertically: true,
        multiLine: true,
        resizable: true,
      },
    })
    .title('Custom Fields (JSON)')
    .describe('JSON string containing fieldId:value pairs, e.g. {"123":"Retail"}')
    .optional(),
  type_id: z
    .number()
    .optional()
    .describe('Client type identifier. Must be valid; otherwise, a 409 CONFLICT will be returned.'),
  group_id: z
    .number()
    .optional()
    .describe('Client group identifier. Must be valid; otherwise, a 409 CONFLICT will be returned.'),
})

export const CreateClientInputSchema = ClientSchema.extend({
  company_name: z.string(),
})

export const ClientResponseDataSchema = ClientSchema.extend({
  custom_fields: z.object({}).passthrough().optional(),
}).passthrough()

export const ClientResponseSchema = z.object({
  success: z.literal(true),
  data: ClientResponseDataSchema,
})

export const UpdateClientResponseSchema = z.object({
  success: z.literal(true),
  data: ClientResponseDataSchema.partial().passthrough(),
})

export const SubmitFormInputSchema = z
  .object({
    uid_client: z.string().min(1).title('Customer identifier'),
    df_data: z
      .object({
        schema_id: z.number().title('Form template identifier'),
        formvalues: z
          .string()
          .displayAs<any>({
            id: 'text',
            params: {
              allowDynamicVariable: true,
              growVertically: true,
              multiLine: true,
              resizable: true,
            },
          })
          .title('Form Values (JSON)')
          .describe('JSON string containing widgetId:value pairs, e.g. {"widget-1":"Yes"}')
          .optional(),
      })
      .required(),
  })
  .required()

// SubmitFormMappedSchema removed: direct form submission uses provided values

export const FilterableClientDataSchema = ClientSchema.partial().passthrough()

export const SubmitFormResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    _id: z.string(),
    created: z.string(),
    created_by_user_name: z.string(),
    created_by_user_id: z.number(),
    client: z.object({
      id: z.number(),
      name: z.string(),
      uid_client: z.string(),
    }),
    df_data: z.object({
      schema_id: z.number(),
      results: z.object({
        last_updated: z.string(),
        formvalues: z.object({}).passthrough().title('Form values').describe('Key-value pairs of form field answers.'),
      }),
    }),
    state: z.object({
      color: z.string(),
      deleted: z.boolean(),
      id: z.number(),
      name: z.string(),
    }),
  }),
})
