import { z } from '@botpress/sdk'
import { ContactSchema } from './contact.schemas'
import { AccountSchema, OrganizationSchema } from './misc.schemas'

/**
 * Search-related schemas
 */

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

/** Extended contact schema with additional fields from search response */
export const SearchContactSchema = ContactSchema.extend({
  existence_level: z.string().nullable().optional().describe('Data completeness level'),
  account: AccountSchema.nullable().optional().describe('Associated account information'),
  organization: OrganizationSchema.nullable().optional().describe('Associated organization information'),
  next_contact_id: z.string().nullable().optional().describe('Next contact ID'),
  time_zone: z.string().nullable().optional().describe('Contact time zone'),
  city: z.string().nullable().optional().describe('City'),
  state: z.string().nullable().optional().describe('State/Province'),
  country: z.string().nullable().optional().describe('Country'),
  contact_job_change_event: z.any().nullable().optional().describe('Job change event information'),
}).describe('Contact object from search results')

/** Breadcrumb for search refinement */
export const SearchBreadcrumbSchema = z
  .object({
    label: z.string().describe('Breadcrumb label/category'),
    signal_field_name: z.string().nullable().optional().describe('Field name used for filtering'),
    value: z.string().nullable().optional().describe('Filter value'),
    display_name: z.string().nullable().optional().describe('Human-readable display name'),
  })
  .describe('Search breadcrumb for filtering')

/** Pagination information */
export const PaginationSchema = z
  .object({
    page: z.number().describe('Current page number'),
    per_page: z.number().describe('Results per page'),
    total_entries: z.number().describe('Total number of results'),
    total_pages: z.number().describe('Total number of pages'),
  })
  .describe('Pagination metadata')

/** Search contacts response */
export const SearchContactsResponseSchema = z
  .object({
    contacts: z.array(SearchContactSchema).describe('Array of contact results'),
    breadcrumbs: z.array(SearchBreadcrumbSchema).describe('Search breadcrumbs/filters applied'),
    partial_results_only: z.boolean().nullable().optional().describe('Whether results are partial'),
    has_join: z.boolean().nullable().optional().describe('Whether query has joins'),
    disable_eu_prospecting: z.boolean().nullable().optional().describe('EU prospecting disabled flag'),
    partial_results_limit: z.number().nullable().optional().describe('Limit for partial results'),
    pagination: PaginationSchema.describe('Pagination information'),
    num_fetch_result: z.number().nullable().describe('Number of fetched results'),
  })
  .describe('Response from contact search API')

// Type exports
export type SearchPayload = z.infer<typeof SearchPayloadSchema>
export type SearchContact = z.infer<typeof SearchContactSchema>
export type SearchContactsResponse = z.infer<typeof SearchContactsResponseSchema>
