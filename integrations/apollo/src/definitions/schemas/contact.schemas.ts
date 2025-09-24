import { z } from '@botpress/sdk'

/**
 * Contact-related schemas
 */

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

/** Single sequence participation state for a contact */
export const ContactCampaignStatusSchema = z
  .object({
    id: z.string().describe('Unique identifier for this contact campaign status record'),
    emailer_campaign_id: z.string().describe('ID of the email sequence (emailer campaign) this status belongs to'),
    send_email_from_user_id: z
      .string()
      .describe('ID of the user who is sending emails for this contact in the sequence'),
    inactive_reason: z
      .string()
      .nullable()
      .optional()
      .describe('Reason why the contact is inactive in this sequence, if applicable'),
    status: z
      .enum(['active', 'failed', 'paused', 'finished'])
      .describe('Current status of the contact in this email sequence'),
    added_at: z.string().datetime().describe('Timestamp when the contact was added to this sequence'),
    added_by_user_id: z.string().describe('ID of the user who added this contact to the sequence'),
    finished_at: z
      .string()
      .datetime()
      .nullable()
      .optional()
      .describe('Timestamp when the contact finished/completed the sequence'),
    paused_at: z
      .string()
      .datetime()
      .nullable()
      .optional()
      .describe('Timestamp when the contact was paused in the sequence'),
    auto_unpause_at: z
      .string()
      .datetime()
      .nullable()
      .optional()
      .describe('Scheduled timestamp for automatically unpausing the contact'),
    send_email_from_email_address: z
      .string()
      .nullable()
      .optional()
      .describe('Specific email address used to send emails to this contact'),
    send_email_from_email_account_id: z
      .string()
      .describe('ID of the email account used to send emails to this contact'),
    manually_set_unpause: z.boolean().nullable().optional().describe('Whether the unpause was manually set by a user'),
    failure_reason: z.string().nullable().optional().describe("Specific reason for failure if status is 'failed'"),
    current_step_id: z
      .string()
      .nullable()
      .optional()
      .describe('ID of the current step in the sequence that the contact is on'),
    in_response_to_emailer_message_id: z
      .string()
      .nullable()
      .optional()
      .describe('ID of the emailer message this campaign status is in response to'),
    cc_emails: z
      .array(z.string())
      .nullable()
      .optional()
      .describe('Email addresses to CC when sending emails to this contact'),
    bcc_emails: z
      .array(z.string())
      .nullable()
      .optional()
      .describe('Email addresses to BCC when sending emails to this contact'),
    to_emails: z
      .array(z.string())
      .nullable()
      .optional()
      .describe('Additional email addresses to include in the TO field'),
    current_step_position: z
      .number()
      .int()
      .nullable()
      .optional()
      .describe('Position number of the current step in the sequence (1-based)'),
  })
  .describe(`Array of campaign statuses showing the contact's participation in email sequences`)

/** A phone number record associated with the contact */
export const PhoneNumberSchema = z
  .object({
    raw_number: z.string().nullable().optional().describe('Original phone number text as entered'),
    sanitized_number: z.string().nullable().optional().describe('Normalized/cleaned phone number'),
    type: z.string().nullable().optional().describe('Type of phone (e.g., work, mobile)'),
    position: z.number().int().nullable().optional().describe('Ordering position of this phone number (UI default 0)'),
    status: z.string().nullable().optional().describe('Validation/enrichment status for this phone number'),
    dnc_status: z.string().nullable().optional().describe('Do-Not-Call status'),
    dnc_other_info: z
      .union([z.string(), z.object({})])
      .nullable()
      .optional()
      .describe('Additional DNC information/details'),
    dialer_flags: z.string().nullable().optional().describe('Dialer flags or metadata for outbound calling'),
  })
  .describe('Phone number object linked to the contact')

/** A label that can be attached to the contact (and/or related entities) */
export const LabelSchema = z
  .object({
    id: z.string().describe('Label ID'),
    modality: z.string().nullable().optional().describe('Label modality or domain'),
    cached_count: z.number().int().nullable().optional().describe('Cached count for this label (UI default 0)'),
    name: z.string().nullable().optional().describe('Human-readable label name'),
    created_at: z.string().nullable().optional().describe('Label creation timestamp'),
    updated_at: z.string().nullable().optional().describe('Last update timestamp for the label'),
    user_id: z.string().nullable().optional().describe('Owner user ID for this label'),
  })
  .describe('Label object')

/** Contact email information */
export const ContactEmailSchema = z
  .object({
    email: z.string().describe('Email address'),
    email_md5: z.string().describe('MD5 hash of email'),
    email_sha256: z.string().describe('SHA256 hash of email'),
    email_status: z.string().describe('Email verification status'),
    email_source: z.string().nullable().optional().describe('Source of email'),
    extrapolated_email_confidence: z.number().nullable().optional().describe('Confidence score'),
    position: z.number().nullable().optional().describe('Position in email list'),
    email_from_customer: z.boolean().nullable().optional().describe('Whether email is from customer'),
    free_domain: z.boolean().nullable().optional().describe('Whether domain is free (e.g., gmail.com)'),
  })
  .describe('Contact email information')

/** Core contact record */
export const ContactSchema = z
  .object({
    // Collections
    contact_roles: z.array(z.unknown()).nullable().optional().describe('Array of contact roles'),
    emailer_campaign_ids: z
      .array(z.unknown())
      .nullable()
      .optional()
      .describe('List of emailer campaign IDs linked to the contact'),
    label_ids: z.array(z.string()).nullable().optional().describe('Array of label IDs attached to the contact'),
    contact_emails: z
      .array(ContactEmailSchema)
      .nullable()
      .optional()
      .describe('Array of email addresses/objects for the contact'),

    contact_rule_config_statuses: z
      .array(z.unknown())
      .nullable()
      .optional()
      .optional()
      .describe('Statuses from contact rule engine configurations'),

    // Identifiers & profile
    id: z.string().describe('Unique contact ID'),
    first_name: z.string().nullable().optional().describe('Contact first name'),
    last_name: z.string().nullable().optional().describe('Contact last name'),
    name: z.string().nullable().optional().describe('Full name'),
    linkedin_url: z.string().nullable().optional().describe('LinkedIn profile URL'),
    title: z.string().nullable().optional().describe('Job title'),
    contact_stage_id: z.string().nullable().optional().describe('Pipeline/contact stage ID'),
    owner_id: z.string().nullable().optional().describe('Owner user ID of this contact'),
    creator_id: z.string().nullable().optional().describe('Creator user ID of this contact'),
    person_id: z.string().nullable().optional().describe('External/linked person ID'),
    email_needs_tickling: z
      .union([z.boolean(), z.string()])
      .nullable()
      .optional()
      .describe('Email follow-up tickle indicator'), // Docs are conflicting on whether this is a boolean or a string
    organization_name: z.string().nullable().optional().describe('Organization/company name'),
    source: z.string().nullable().optional().describe('Contact source'),
    original_source: z.string().nullable().optional().describe('Original source where the contact was obtained'),
    organization_id: z.string().nullable().optional().describe('Organization/company ID'),
    headline: z.string().nullable().optional().describe('Professional headline'),
    photo_url: z.string().nullable().optional().describe('Profile photo URL'),
    present_raw_address: z.string().nullable().optional().describe('Raw current address text'),
    linkedin_uid: z.string().nullable().optional().describe('LinkedIn unique identifier'),
    extrapolated_email_confidence: z
      .union([z.string(), z.number()])
      .nullable()
      .optional()
      .describe('Confidence score for extrapolated email'), // Docs are conflicting on whether this is a string or a number
    salesforce_id: z.string().nullable().optional().describe('Salesforce generic record ID'),
    salesforce_lead_id: z.string().nullable().optional().describe('Salesforce Lead ID'),
    salesforce_contact_id: z.string().nullable().optional().describe('Salesforce Contact ID'),
    salesforce_account_id: z.string().nullable().optional().describe('Salesforce Account ID'),
    crm_owner_id: z.string().nullable().optional().describe('CRM owner user ID'),
    created_at: z.string().nullable().optional().describe('Contact creation timestamp (string in UI)'),
    direct_dial_status: z.string().nullable().optional().describe('Direct-dial status'),
    direct_dial_enrichment_failed_at: z
      .string()
      .nullable()
      .optional()
      .describe('Timestamp when direct-dial enrichment failed'),
    email_status: z.string().nullable().optional().describe('Email status'),
    email_source: z.string().nullable().optional().describe('Source of the email address'),
    account_id: z.string().nullable().optional().describe('Linked account ID'),
    last_activity_date: z.string().nullable().optional().describe('Last activity date'),
    hubspot_vid: z.string().nullable().optional().describe('HubSpot contact VID'),
    hubspot_company_id: z.string().nullable().optional().describe('HubSpot company ID'),
    crm_id: z.string().nullable().optional().describe('Generic CRM record ID'),
    sanitized_phone: z.string().nullable().optional().describe('Sanitized/normalized phone value'),
    merged_crm_ids: z.string().nullable().optional().describe('Comma-separated or serialized merged CRM IDs'),
    updated_at: z.string().nullable().optional().describe('Last update timestamp (string in UI)'),
    suggested_from_rule_engine_config_id: z
      .string()
      .nullable()
      .optional()
      .describe('Rule engine config ID that suggested this contact'),
    email_unsubscribed: z.string().nullable().optional().describe('Email unsubscribe status/details'),
    source_display_name: z.string().nullable().optional().describe('Human-friendly display name for source'),
    twitter_url: z.string().nullable().optional().describe('Twitter/X profile URL'),
    crm_record_url: z.string().nullable().optional().describe('Direct URL to CRM record'),
    email_status_unavailable_reason: z
      .string()
      .nullable()
      .optional()
      .describe('Reason why email status could not be determined'),
    email_true_status: z.string().nullable().optional().describe('Verified/true email status'),
    email: z.string().nullable().optional().describe('Primary email address'),
    next_contact_id: z.string().nullable().optional().describe('Next/linked contact ID'),
    time_zone: z.string().nullable().optional().describe('Contact time zone'),
    city: z.string().nullable().optional().describe('City'),
    state: z.string().nullable().optional().describe('State/Province'),
    country: z.string().nullable().optional().describe('Country'),
    intent_strength: z.string().nullable().optional().describe('Intent strength score/bucket'),
    account_phone_note: z.string().nullable().optional().describe('Notes related to the account phone'),

    // Booleans
    queued_for_crm_push: z
      .boolean()
      .nullable()
      .optional()
      .describe('Queued to be pushed/synced to CRM (UI default true)'),
    has_pending_email_arcgate_request: z
      .boolean()
      .nullable()
      .optional()
      .describe('Whether there is a pending Arcgate email request (UI default true)'),
    has_email_arcgate_request: z
      .boolean()
      .nullable()
      .optional()
      .describe('Whether an Arcgate email request exists (UI default true)'),
    updated_email_true_status: z
      .boolean()
      .nullable()
      .optional()
      .describe('Indicates the email true status was updated (UI default true)'),
    email_from_customer: z
      .boolean()
      .nullable()
      .optional()
      .describe('Email address provided by the customer (UI default true)'),
    show_intent: z.boolean().nullable().optional().describe('Whether to display intent (UI default true)'),
    free_domain: z.boolean().nullable().optional().describe('Email belongs to a free domain (UI default true)'),
    is_likely_to_engage: z
      .boolean()
      .nullable()
      .optional()
      .describe('Contact is predicted likely to engage (UI default true)'),
    email_domain_catchall: z.boolean().nullable().optional().describe('Email domain is a catch-all (UI default true)'),

    // Arbitrary objects
    typed_custom_fields: z.record(z.any()).nullable().optional().describe('Typed custom field values'),
    custom_field_errors: z.record(z.any()).nullable().optional().describe('Custom field validation errors'),

    // Nested collections
    contact_campaign_statuses: z
      .array(ContactCampaignStatusSchema)
      .nullable()
      .optional()
      .describe('Array of campaign statuses for this contact'),
    phone_numbers: z
      .array(PhoneNumberSchema)
      .nullable()
      .optional()
      .describe('Phone numbers associated with the contact'),
  })
  .describe('Primary contact object')

/** Top-level payload */
export const ContactResponseSchema = z.object({
  contact: ContactSchema.describe('The contact record to be created'),
  labels: z.array(LabelSchema).nullable().optional().describe('Array of labels included with this request'),
})

// Type exports
export type ContactPayload = z.infer<typeof ContactPayloadSchema>
export type Contact = z.infer<typeof ContactSchema>
export type ContactResponse = z.infer<typeof ContactResponseSchema>
