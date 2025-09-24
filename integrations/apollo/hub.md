# Apollo.io Integration Documentation

## Overview

Connect your Botpress chatbot to Apollo.io, a powerful sales intelligence and engagement platform. Use this integration to search for contacts, enrich person data, create and update contacts, and leverage Apollo's extensive B2B database to enhance your sales and marketing workflows.

**Integration Name:** apollo

## Key Features

- Create and update contacts in Apollo.io
- Search contacts from your team's Apollo.io account
- Enrich person data with detailed information
- Bulk enrich multiple people at once
- Access comprehensive B2B contact and company data

## Prerequisites

- An Apollo.io API Key
- An active Apollo.io account with appropriate permissions

### API Key Requirements

- Must be a valid Apollo.io API key
- Needs access to manage Contacts and search functionality
- May consume enrichment credits based on your Apollo pricing plan

## Configuration

The integration requires a single setting.

### Configuration schema:

```json
{
  "apiKey": {
    "type": "string",
    "required": true,
    "secret": true,
    "title": "API Key",
    "description": "Your Apollo.io API Key"
  }
}
```

### Setup Steps

1. Log into your Apollo.io account
2. Navigate to Settings > Integrations > API Keys
3. Create a new API key or copy an existing one
4. Paste it into the integration configuration in Botpress
5. Save the configuration

## Actions

### createContact

Creates a new contact in your Apollo.io account.

**Input:**

- `first_name` (optional): Contact first name
- `last_name` (optional): Contact last name
- `email` (optional): Contact email address
- `organization_name` (optional): Organization/company name
- `title` (optional): Job title
- `account_id` (optional): Account ID in Apollo
- `website_url` (optional): Website URL
- `label_names` (optional): Array of label names to assign
- `contact_stage_id` (optional): Contact stage ID
- `present_raw_address` (optional): Contact address
- `direct_phone` (optional): Direct phone number
- `corporate_phone` (optional): Corporate phone number
- `mobile_phone` (optional): Mobile phone number
- `home_phone` (optional): Home phone number
- `other_phone` (optional): Other phone number
- `typed_custom_fields` (optional): Custom fields as key-value pairs

**Output:**

- `contact`: The created contact object with all details
- `success`: Whether the contact was successfully created
- `message`: Status message about the contact creation

### updateContact

Updates an existing contact in Apollo.io.

**Input:**

- `contact_id` (required): The ID of the contact to update in Apollo
- All other fields from createContact are optional for updating

**Output:**

- `contact`: The updated contact object
- `success`: Whether the contact was successfully updated
- `message`: Status message about the contact update

### searchContact

Search for contacts from your team's Apollo.io account with powerful filtering options.

**Input:**

- `q_keywords` (optional): Keywords to narrow search. Can include combinations of names, job titles, employers (company names), and email addresses
- `contact_stage_ids` (optional): Array of Apollo IDs for contact stages to include in results
- `sort_by_field` (optional): Field to sort results by. Valid options:
  - `contact_last_activity_date`
  - `contact_email_last_opened_at`
  - `contact_email_last_clicked_at`
  - `contact_created_at`
  - `contact_updated_at`
- `sort_ascending` (optional): Set true to sort in ascending order (default: false)
- `page` (optional): Page number of results to return
- `per_page` (optional): Number of contacts to return per page

**Output:**

- `contacts`: Array of contact results with full details
- `pagination`: Pagination metadata (page, per_page, total_entries, total_pages)
- `breadcrumbs`: Search filters applied
- `success`: Whether the search was successful
- `message`: Status message about the search

### enrichPerson

Enrich a person's data using Apollo.io's extensive database.

**Input:**

- `first_name` (optional): First name
- `last_name` (optional): Last name
- `name` (optional): Full name
- `email` (optional): Email address
- `hashed_email` (optional): Hashed email address
- `organization_name` (optional): Name of the person's employer
- `domain` (optional): The domain name for the person's employer (without www. or @)
- `id` (optional): Apollo ID for the person
- `linkedin_url` (optional): LinkedIn profile URL
- `reveal_personal_emails` (optional): Set to true to enrich with personal emails (consumes credits)
- `reveal_phone_numbers` (optional): Set to true to enrich with phone numbers (consumes credits, requires webhook_url)
- `webhook_url` (optional): Required if reveal_phone_numbers is true. URL for asynchronous phone number delivery

**Output:**

- `person`: Enriched person data including:
  - Contact information
  - Employment history
  - Organization details
  - Social profiles
  - Location data
  - Engagement likelihood
- `success`: Whether the enrichment was successful
- `message`: Status message about the enrichment

### bulkEnrichPeople

Enrich multiple people at once using Apollo.io's bulk enrichment capability.

**Input:**

- `people` (required): Array of people to enrich, each containing:
  - Same fields as enrichPerson (first_name, last_name, email, etc.)
- `reveal_personal_emails` (optional): Set to true for all people (consumes credits)
- `reveal_phone_numbers` (optional): Set to true for all people (consumes credits, requires webhook_url)
- `webhook_url` (optional): Required if reveal_phone_numbers is true

**Output:**

- `matches`: Array of enriched person data
- `total_requested_enrichments`: Total number of enrichments requested
- `unique_enriched_records`: Number of unique records enriched
- `missing_records`: Number of records not found
- `credits_consumed`: Number of Apollo credits consumed
- `success`: Whether the bulk enrichment was successful
- `message`: Status message

## Contact Schema

When working with contacts, the following fields are commonly available:

- `id`: Unique contact ID
- `first_name`, `last_name`, `name`: Name fields
- `email`: Primary email address
- `email_status`: Email verification status
- `title`: Job title
- `organization_name`: Company name
- `linkedin_url`: LinkedIn profile
- `phone_numbers`: Array of phone number objects
- `contact_stage_id`: Pipeline stage
- `owner_id`: Owner user ID
- `created_at`, `updated_at`: Timestamps
- `typed_custom_fields`: Custom field values
- And many more fields for comprehensive contact management

## Notes and Tips

- **Enrichment Credits**: The `reveal_personal_emails` and `reveal_phone_numbers` options consume credits from your Apollo pricing plan
- **Phone Number Verification**: When revealing phone numbers, Apollo verifies them asynchronously and delivers results via webhook
- **Search Optimization**: Use `per_page` parameter to limit results and speed up searches
- **Bulk Operations**: Use bulk enrichment for better performance when processing multiple people
- **Domain Format**: When providing domain names, exclude prefixes like "www." or "@"
- **Authentication Errors**: Ensure your API key is valid and has appropriate permissions

## Use Cases

- **Lead Enrichment**: Automatically enrich new leads with comprehensive B2B data
- **Contact Management**: Keep your CRM contacts synchronized with Apollo's database
- **Sales Intelligence**: Search for prospects based on specific criteria
- **Data Enhancement**: Bulk enrich existing contact lists with missing information
- **Lead Scoring**: Use enrichment data to qualify and score leads
