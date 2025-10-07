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
    .tuple([z.number(), z.number()])
    .optional()
    .describe('Opening and closing times of the establishment (in minutes). Used by the routing algorithm.'),
  street: z.string().optional().describe('Street where the client is located (exclude number).'),
  street_nbr: z.string().optional().describe('Street number.'),
  neighborhood: z.string().optional().describe("Neighborhood, e.g. 'Devoto'."),
  city: z.string().optional().describe("City, e.g. 'CABA'."),
  country: z.string().optional().describe("Country, e.g. 'Argentina'."),
  last_updated: z.string().optional().describe('Last update timestamp (ISO 8601).'),
  custom_fields: z
    .record(z.object({ name: z.string(), value: z.string().nullable().optional() }).passthrough())
    .optional()
    .describe('Custom fields on the customer record (may include required fields).'),
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

export const ClientResponseSchema = z.object({
  success: z.literal(true),
  data: CreateClientInputSchema.passthrough(),
})

export const UpdateClientResponseSchema = z.object({
  success: z.literal(true),
  data: ClientSchema.partial().passthrough(),
})
