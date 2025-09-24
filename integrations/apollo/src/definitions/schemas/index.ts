/**
 * Central export point for all Apollo integration schemas
 */

// Contact schemas
export {
  ContactPayloadSchema,
  ContactCampaignStatusSchema,
  PhoneNumberSchema,
  LabelSchema,
  ContactEmailSchema,
  ContactSchema,
  ContactResponseSchema,
  // Types
  type ContactPayload,
  type Contact,
  type ContactResponse,
} from './contact.schemas'

// Enrichment schemas
export {
  PersonPayloadSchema,
  EnrichmentPayloadSchema,
  BulkEnrichmentPayloadSchema,
  PersonSchema,
  EnrichPersonResponseSchema,
  BulkEnrichPersonResponseSchema,
  // Types
  type PersonPayload,
  type Person,
  type EnrichmentPayload,
  type BulkEnrichmentPayload,
  type EnrichPersonResponse,
  type BulkEnrichPersonResponse,
} from './enrichment.schemas'

// Search schemas
export {
  SearchPayloadSchema,
  SearchContactSchema,
  SearchBreadcrumbSchema,
  PaginationSchema,
  SearchContactsResponseSchema,
  // Types
  type SearchPayload,
  type SearchContact,
  type SearchContactsResponse,
} from './search.schemas'

// Miscellaneous schemas
export {
  AccountSchema,
  EmploymentHistorySchema,
  FundingEventSchema,
  TechnologySchema,
  OrganizationSchema,
} from './misc.schemas'
