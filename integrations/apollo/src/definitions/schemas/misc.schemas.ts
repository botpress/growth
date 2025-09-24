import { z } from '@botpress/sdk'

/**
 * Miscellaneous schemas - Account, Organization, and related entities
 */

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
