import { z, IntegrationDefinitionProps } from '@botpress/sdk'
import {
  ContactPayloadSchema,
  EnrichmentPayloadSchema,
  BulkEnrichmentPayloadSchema,
  SearchPayloadSchema,
} from 'src/definitions/schemas'

export const createContact = {
  title: 'Create Contact',
  description: 'Create a new contact in Apollo.io',
  input: {
    schema: ContactPayloadSchema,
  },
  output: {
    schema: z.object({}).passthrough(),
  },
}

export const updateContact = {
  title: 'Update Contact',
  description: 'Update a contact in Apollo.io',
  input: {
    schema: z.object({
      contact_id: z.string().describe('The ID of the contact to update in Apollo'),
      ...ContactPayloadSchema.shape,
    }),
  },
  output: {
    schema: z.object({
      apiResponse: z.object({}).passthrough(),
    }),
  },
}

export const searchContact = {
  title: 'Search Contacts',
  description: "Find contacts from your team's Apollo.io account",
  input: {
    schema: SearchPayloadSchema,
  },
  output: {
    schema: z.object({
      apiResponse: z.object({}).passthrough(),
    }),
  },
}

export const enrichPerson = {
  title: 'Enrich Person',
  description: "Enrich a person from your team's Apollo.io account",
  input: {
    schema: EnrichmentPayloadSchema,
  },
  output: {
    schema: z.object({
      apiResponse: z.object({}).passthrough(),
    }),
  },
}

export const bulkEnrichPeople = {
  title: 'Bulk Enrich People',
  description: "Enrich a list of people from your team's Apollo.io account",
  input: {
    schema: BulkEnrichmentPayloadSchema,
  },
  output: {
    schema: z.object({
      apiResponse: z.object({}).passthrough(),
    }),
  },
}

export const actions = {
  createContact,
  updateContact,
  searchContact,
  enrichPerson,
  bulkEnrichPeople,
} satisfies IntegrationDefinitionProps['actions']
