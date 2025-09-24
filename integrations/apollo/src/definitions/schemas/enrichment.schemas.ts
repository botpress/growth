import { z } from '@botpress/sdk'
import { ContactSchema } from './contact.schemas'
import { OrganizationSchema, EmploymentHistorySchema } from './misc.schemas'

/**
 * Enrichment-related schemas
 */

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

export const EnrichmentPayloadSchema = z.object({
  ...PersonPayloadSchema.shape,
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

export const BulkEnrichmentPayloadSchema = z.object({
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
  people: z.array(PersonPayloadSchema).describe('Array of people to enrich'),
})

/** Person information from enrichment */
export const PersonSchema = z
  .object({
    id: z.string().describe('Person ID'),
    first_name: z.string().nullable().describe('First name'),
    last_name: z.string().nullable().optional().describe('Last name'),
    name: z.string().nullable().describe('Full name'),
    linkedin_url: z.string().nullable().optional().describe('LinkedIn profile URL'),
    title: z.string().nullable().optional().describe('Job title'),
    email_status: z.string().nullable().optional().describe('Email verification status'),
    photo_url: z.string().nullable().optional().describe('Profile photo URL'),
    twitter_url: z.string().nullable().optional().describe('Twitter profile URL'),
    github_url: z.string().nullable().optional().describe('GitHub profile URL'),
    facebook_url: z.string().nullable().optional().describe('Facebook profile URL'),
    extrapolated_email_confidence: z.number().nullable().optional().describe('Email confidence score'),
    headline: z.string().nullable().optional().describe('Professional headline'),
    email: z.string().nullable().optional().describe('Email address'),
    organization_id: z.string().nullable().optional().describe('Organization ID'),
    employment_history: z.array(EmploymentHistorySchema).nullable().optional().describe('Employment history'),
    state: z.string().nullable().optional().describe('State/Province'),
    city: z.string().nullable().optional().describe('City'),
    country: z.string().nullable().optional().describe('Country'),
    postal_code: z.string().nullable().optional().describe('Postal code'),
    formatted_address: z.string().nullable().optional().describe('Formatted address'),
    time_zone: z.string().nullable().optional().describe('Time zone'),
    contact_id: z.string().nullable().optional().describe('Associated contact ID'),
    contact: ContactSchema.nullable().optional().describe('Associated contact information'),
    revealed_for_current_team: z.boolean().nullable().optional().describe('Whether revealed for current team'),
    organization: OrganizationSchema.nullable().optional().describe('Organization information'),
    is_likely_to_engage: z.boolean().nullable().optional().describe('Engagement likelihood'),
    intent_strength: z.string().nullable().optional().describe('Intent strength'),
    show_intent: z.boolean().describe('Whether to show intent'),
    departments: z.array(z.string()).optional().describe('Departments'),
    subdepartments: z.array(z.string()).optional().describe('Subdepartments'),
    functions: z.array(z.string()).optional().describe('Job functions'),
    seniority: z.string().nullable().optional().describe('Seniority level'),
  })
  .describe('Person information from enrichment')

/** Enrich person API response */
export const EnrichPersonResponseSchema = z
  .object({
    person: PersonSchema.describe('Enriched person data'),
  })
  .describe('Response from person enrichment API')

export const BulkEnrichPersonResponseSchema = z
  .object({
    status: z.string().nullable().optional().describe('Status'),
    error_code: z.string().nullable().optional().describe('Error code'),
    error_message: z.string().nullable().optional().describe('Error message'),
    total_requested_enrichments: z.number().nullable().optional().describe('Total requested enrichments'),
    unique_enriched_records: z.number().nullable().optional().describe('Unique enriched records'),
    missing_records: z.number().nullable().optional().describe('Missing records'),
    credits_consumed: z.number().nullable().optional().describe('Credits consumed'),
    matches: z.array(PersonSchema.nullable()).describe('List of people that were enriched'),
  })
  .describe('Response from bulk person enrichment API')

// Type exports
export type PersonPayload = z.infer<typeof PersonPayloadSchema>
export type Person = z.infer<typeof PersonSchema>
export type EnrichmentPayload = z.infer<typeof EnrichmentPayloadSchema>
export type BulkEnrichmentPayload = z.infer<typeof BulkEnrichmentPayloadSchema>
export type EnrichPersonResponse = z.infer<typeof EnrichPersonResponseSchema>
export type BulkEnrichPersonResponse = z.infer<typeof BulkEnrichPersonResponseSchema>
