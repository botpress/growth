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
  .describe('Array of campaign statuses showing the contact’s participation in email sequences')

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

/** Account information associated with a contact */
export const AccountSchema = z
  .object({
    id: z.string().describe('Account ID'),
    name: z.string().nullable().optional().describe('Account/company name'),
    website_url: z.string().nullable().optional().describe('Company website URL'),
    blog_url: z.string().nullable().optional().describe('Company blog URL'),
    angellist_url: z.string().nullable().optional().describe('AngelList profile URL'),
    linkedin_url: z.string().nullable().optional().describe('LinkedIn company page URL'),
    twitter_url: z.string().nullable().optional().describe('Twitter/X profile URL'),
    facebook_url: z.string().nullable().optional().describe('Facebook page URL'),
    primary_phone: z.record(z.any()).nullable().optional().describe('Primary phone information'),
    languages: z.array(z.string()).nullable().optional().describe('Languages used by the company'),
    alexa_ranking: z.number().nullable().optional().describe('Alexa website ranking'),
    phone: z.string().nullable().optional().describe('Company phone number'),
    linkedin_uid: z.string().nullable().optional().describe('LinkedIn unique identifier'),
    founded_year: z.number().nullable().optional().describe('Year the company was founded'),
    publicly_traded_symbol: z.string().nullable().optional().describe('Stock ticker symbol'),
    publicly_traded_exchange: z.string().nullable().optional().describe('Stock exchange'),
    logo_url: z.string().nullable().optional().describe('Company logo URL'),
    crunchbase_url: z.string().nullable().optional().describe('Crunchbase profile URL'),
    primary_domain: z.string().nullable().optional().describe('Primary domain name'),
    domain: z.string().nullable().optional().describe('Domain name'),
    team_id: z.string().nullable().optional().describe('Team ID'),
    organization_id: z.string().nullable().optional().describe('Organization ID'),
    account_stage_id: z.string().nullable().optional().describe('Account stage ID'),
    source: z.string().nullable().optional().describe('Account source'),
    original_source: z.string().nullable().optional().describe('Original source'),
    creator_id: z.string().nullable().optional().describe('Creator user ID'),
    owner_id: z.string().nullable().optional().describe('Owner user ID'),
    created_at: z.string().nullable().optional().describe('Account creation timestamp'),
    phone_status: z.string().nullable().optional().describe('Phone verification status'),
    hubspot_id: z.string().nullable().optional().describe('HubSpot account ID'),
    salesforce_id: z.string().nullable().optional().describe('Salesforce account ID'),
    crm_owner_id: z.string().nullable().optional().describe('CRM owner ID'),
    parent_account_id: z.string().nullable().optional().describe('Parent account ID'),
    sanitized_phone: z.string().nullable().optional().describe('Sanitized phone number'),
    account_playbook_statuses: z.array(z.any()).nullable().optional().describe('Playbook statuses'),
    account_rule_config_statuses: z
      .array(
        z.object({
          _id: z.string().nullable().optional(),
          created_at: z.string().nullable().optional(),
          rule_action_config_id: z.string().nullable().optional(),
          rule_config_id: z.string().nullable().optional(),
          status_cd: z.string().nullable().optional(),
          updated_at: z.string().nullable().optional(),
          id: z.string().nullable().optional(),
          key: z.string().nullable().optional(),
        })
      )
      .nullable()
      .optional()
      .describe('Rule configuration statuses'),
    existence_level: z.string().nullable().optional().describe('Data completeness level'),
    label_ids: z.array(z.string()).nullable().optional().describe('Label IDs'),
    typed_custom_fields: z.record(z.any()).nullable().optional().describe('Custom fields'),
    custom_field_errors: z.record(z.any()).nullable().optional().describe('Custom field errors'),
    modality: z.string().nullable().optional().describe('Modality type'),
    source_display_name: z.string().nullable().optional().describe('Display name for source'),
    crm_record_url: z.string().nullable().optional().describe('CRM record URL'),
  })
  .describe('Account/company information')

/** Employment history record for a person */
export const EmploymentHistorySchema = z
  .object({
    _id: z.string().describe('Internal ID'),
    created_at: z.string().nullable().optional().describe('Creation timestamp'),
    current: z.boolean().nullable().optional().describe('Whether this is the current employment'),
    degree: z.string().nullable().optional().describe('Degree obtained'),
    description: z.string().nullable().optional().describe('Job description'),
    emails: z.array(z.string()).nullable().optional().describe('Associated emails'),
    end_date: z.string().nullable().optional().describe('Employment end date'),
    grade_level: z.string().nullable().optional().describe('Grade level'),
    kind: z.string().nullable().optional().describe('Type of employment'),
    major: z.string().nullable().optional().describe('Major field of study'),
    organization_id: z.string().nullable().optional().describe('Organization ID'),
    organization_name: z.string().nullable().optional().describe('Name of the organization'),
    raw_address: z.string().nullable().optional().describe('Raw address'),
    start_date: z.string().nullable().optional().describe('Employment start date'),
    title: z.string().nullable().optional().describe('Job title'),
    updated_at: z.string().nullable().optional().describe('Last update timestamp'),
    id: z.string().nullable().optional().describe('Employment history ID'),
    key: z.string().nullable().optional().describe('Employment history key'),
  })
  .describe('Employment history record')

/** Funding event information */
export const FundingEventSchema = z
  .object({
    id: z.string().describe('Funding event ID'),
    date: z.string().nullable().optional().describe('Funding date'),
    news_url: z.string().nullable().optional().describe('News article URL'),
    type: z.string().nullable().optional().describe('Funding type (e.g., Series A, Series B)'),
    investors: z.string().nullable().optional().describe('List of investors'),
    amount: z.string().nullable().optional().describe('Funding amount'),
    currency: z.string().nullable().optional().describe('Currency symbol'),
  })
  .describe('Funding event information')

/** Technology information */
export const TechnologySchema = z
  .object({
    uid: z.string().describe('Technology unique identifier'),
    name: z.string().nullable().optional().describe('Technology name'),
    category: z.string().nullable().optional().describe('Technology category'),
  })
  .describe('Technology information')

/** Organization information */
export const OrganizationSchema = z
  .object({
    id: z.string().describe('Organization ID'),
    name: z.string().nullable().optional().describe('Organization name'),
    website_url: z.string().nullable().optional().describe('Website URL'),
    blog_url: z.string().nullable().optional().describe('Blog URL'),
    angellist_url: z.string().nullable().optional().describe('AngelList URL'),
    linkedin_url: z.string().nullable().optional().describe('LinkedIn URL'),
    twitter_url: z.string().nullable().optional().describe('Twitter URL'),
    facebook_url: z.string().nullable().optional().describe('Facebook URL'),
    primary_phone: z.record(z.any()).nullable().optional().describe('Primary phone'),
    languages: z.array(z.string()).nullable().optional().describe('Languages'),
    alexa_ranking: z.number().nullable().optional().describe('Alexa ranking'),
    phone: z.string().nullable().optional().describe('Phone number'),
    linkedin_uid: z.string().nullable().optional().describe('LinkedIn UID'),
    founded_year: z.number().nullable().optional().describe('Founded year'),
    publicly_traded_symbol: z.string().nullable().optional().describe('Stock symbol'),
    publicly_traded_exchange: z.string().nullable().optional().describe('Stock exchange'),
    logo_url: z.string().nullable().optional().describe('Logo URL'),
    crunchbase_url: z.string().nullable().optional().describe('Crunchbase URL'),
    primary_domain: z.string().nullable().optional().describe('Primary domain'),
    industry: z.string().optional().nullable().describe('Industry classification'),
    keywords: z.array(z.string()).optional().describe('Associated keywords'),
    estimated_num_employees: z.number().optional().nullable().describe('Estimated employee count'),
    industries: z.array(z.string()).optional().describe('Industry categories'),
    secondary_industries: z.array(z.string()).optional().describe('Secondary industries'),
    snippets_loaded: z.boolean().optional().nullable().describe('Whether snippets are loaded'),
    industry_tag_id: z.string().optional().nullable().describe('Industry tag ID'),
    industry_tag_hash: z.record(z.string()).optional().describe('Industry tag hash map'),
    retail_location_count: z.number().optional().nullable().describe('Number of retail locations'),
    raw_address: z.string().optional().nullable().describe('Full raw address'),
    street_address: z.string().optional().nullable().describe('Street address'),
    city: z.string().optional().nullable().describe('City'),
    state: z.string().optional().nullable().describe('State/Province'),
    postal_code: z.string().optional().nullable().describe('Postal code'),
    country: z.string().optional().nullable().describe('Country'),
    owned_by_organization_id: z.string().nullable().optional().describe('Parent organization ID'),
    seo_description: z.string().optional().nullable().describe('SEO description'),
    short_description: z.string().optional().nullable().describe('Short company description'),
    suborganizations: z.array(z.any()).optional().describe('Suborganizations'),
    num_suborganizations: z.number().optional().nullable().describe('Number of suborganizations'),
    annual_revenue_printed: z.string().optional().nullable().describe('Formatted annual revenue'),
    annual_revenue: z.number().optional().nullable().describe('Annual revenue in numbers'),
    total_funding: z.number().optional().nullable().describe('Total funding amount'),
    total_funding_printed: z.string().optional().nullable().describe('Formatted total funding'),
    latest_funding_round_date: z.string().optional().nullable().describe('Latest funding round date'),
    latest_funding_stage: z.string().optional().nullable().describe('Latest funding stage'),
    funding_events: z.array(FundingEventSchema).optional().describe('Funding events'),
    technology_names: z.array(z.string()).optional().describe('Technology names'),
    current_technologies: z.array(TechnologySchema).optional().describe('Current technologies'),
    org_chart_root_people_ids: z.array(z.string()).optional().describe('Org chart root people IDs'),
    org_chart_sector: z.string().optional().nullable().describe('Org chart sector'),
    org_chart_removed: z.boolean().optional().nullable().describe('Whether removed from org chart'),
    org_chart_show_department_filter: z.boolean().optional().nullable().describe('Show department filter in org chart'),
  })
  .describe('Organization information')

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

export type PersonPayload = z.infer<typeof PersonPayloadSchema>
export type SearchPayload = z.infer<typeof SearchPayloadSchema>
export type Person = z.infer<typeof PersonSchema>
export type ContactPayload = z.infer<typeof ContactPayloadSchema>
export type Contact = z.infer<typeof ContactSchema>
export type SearchContact = z.infer<typeof SearchContactSchema>
export type EnrichmentPayload = z.infer<typeof EnrichmentPayloadSchema>
export type BulkEnrichmentPayload = z.infer<typeof BulkEnrichmentPayloadSchema>

// Response Types
export type ContactResponse = z.infer<typeof ContactResponseSchema>
export type SearchContactsResponse = z.infer<typeof SearchContactsResponseSchema>
export type EnrichPersonResponse = z.infer<typeof EnrichPersonResponseSchema>
export type BulkEnrichPersonResponse = z.infer<typeof BulkEnrichPersonResponseSchema>
