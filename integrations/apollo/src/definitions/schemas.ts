import { z } from '@botpress/sdk'

export const ContactPayloadSchema = z.object({
  first_name: z.string().optional().describe('Contact first name'),
  last_name: z.string().optional().describe('Contact last name'),
  email: z.string().email().optional().describe('Contact email address'),
  organization_name: z.string().optional().describe('Organization/company name'),
  title: z.string().optional().describe('Job title'),
  account_id: z.string().optional().describe('Account ID in Apollo'),
  website_url: z.string().url().optional().describe('Website URL'),
  label_names: z.array(z.string()).optional().describe('Array of label names to assign'),
  contact_stage_id: z.string().optional().describe('Contact stage ID'),
  present_raw_address: z.string().optional().describe('Contact address'),
  direct_phone: z.string().optional().describe('Direct phone number'),
  corporate_phone: z.string().optional().describe('Corporate phone number'),
  mobile_phone: z.string().optional().describe('Mobile phone number'),
  home_phone: z.string().optional().describe('Home phone number'),
  other_phone: z.string().optional().describe('Other phone number'),
  typed_custom_fields: z.record(z.string()).optional().describe('Custom fields as key-value pairs'),
})

export const SearchPayloadSchema = z.object({
  q_keywords: z
    .string()
    .optional()
    .describe(
      `Keywords to narrow search. Can include combinations of names, job titles, employers (company names), and email addresses (Eg. "John Doe", "John Botpress", "John Director Botpress", "john@botpress.com", "John john@xyz.com", etc.).`
    ),
  contact_stage_ids: z
    .array(z.string())
    .optional()
    .describe(
      'Apollo IDs for the contact stages that you want to include in your search results. Adding multiple IDs will return matching contacts from all of the specified stages.'
    ),
  sort_by_field: z
    .string()
    .optional()
    .describe(
      'Field to sort the search results by. Valid options are "contact_last_activity_date", "contact_email_last_opened_at", "contact_email_last_clicked_at", "contact_created_at" and "contact_updated_at".'
    ),
  sort_ascending: z
    .boolean()
    .optional()
    .describe(
      'Set true to sort the results in ascending order. Default is false. Must be used in conjunction with sortByField.'
    ),
  page: z.number().optional().describe('Page number of results to return.'),
  per_page: z
    .number()
    .optional()
    .describe(
      'Number of contacts to return per page. Limiting the number of contacts returned will speed up the search process.'
    ),
})

export const PersonPayloadSchema = z.object({
  first_name: z.string().optional().describe('First name'),
  last_name: z.string().optional().describe('Last name'),
  name: z.string().optional().describe('Full name'),
  email: z.string().email().optional().describe('Email address'),
  hashed_email: z.string().optional().describe('Hashed email address'),
  organization_name: z.string().optional().describe("Name of the person's employer"),
  domain: z
    .string()
    .optional()
    .describe("The domain name for the person's current or previous employer. Do NOT include www., @ or similar."),
  id: z.string().optional().describe('Apollo ID for the person'),
  linkedin_url: z.string().url().optional().describe('LinkedIn profile URL'),
})

export const EnrichmentQueryParamsSchema = z.object({
  reveal_personal_emails: z
    .boolean()
    .optional()
    .describe(
      `Set to true if you want to enrich the person's data with personal emails. This potentially consumes credits as part of your Apollo pricing plan. The default value is false.`
    ),
  reveal_phone_numbers: z
    .boolean()
    .optional()
    .describe(
      `Set to true if you want to enrich the person's data with all available phone numbers, including mobile phone numbers. This potentially consumes credits as part of your Apollo pricing plan. The default value is false. If this parameter is set to true, you must enter a webhook URL for the webhook_url parameter. Apollo will asynchronously verify phone numbers for you, then send a JSON response that includes only details about the person's phone numbers to the webhook URL you provide. It can take several minutes for the phone numbers to be delivered.`
    ),
  webhook_url: z
    .string()
    .url()
    .optional()
    .describe(
      `If you set the reveal_phone_number parameter to true, this parameter becomes mandatory. Otherwise, do not use this parameter. Enter the webhook URL that specifies where Apollo should send a JSON response that includes the phone number you requested. Apollo suggests testing this flow to ensure you receive the separate response with the phone number. If phone numbers are not revealed delivered to the webhook URL, try applying UTF-8 encoding to the webhook URL.`
    ),
})

export const EnrichmentPayloadSchema = z.object({
  ...PersonPayloadSchema.shape,
  ...EnrichmentQueryParamsSchema.shape,
})

export const BulkEnrichmentPayloadSchema = z.object({
  ...EnrichmentQueryParamsSchema.shape,
  people: z.array(PersonPayloadSchema).describe('Array of people to enrich'),
})

export const ApiResponseSchema = z.object({
  apiResponse: z.object({}).passthrough(),
  message: z.string().describe('Status message about the API response'),
})

export type ContactPayload = z.infer<typeof ContactPayloadSchema>
export type SearchPayload = z.infer<typeof SearchPayloadSchema>
export type EnrichmentPayload = z.infer<typeof EnrichmentPayloadSchema>
export type BulkEnrichmentPayload = z.infer<typeof BulkEnrichmentPayloadSchema>
