import {
  CreateContactInputSchema,
  SearchContactsInputSchema,
  UpdateContactInputSchema,
} from 'src/misc/custom-schemas/contact-schemas'
import { CreateContactUi, SearchContactsUi, UpdateContactUi } from 'src/misc/custom-uis/contact-uis'
import { RecordResultSchema, SearchOutputSchema } from 'src/misc/custom-schemas/common-schemas'

const createContact = {
  title: 'Create Contact',
  description: 'Create a Salesforce Contact',
  input: {
    schema: CreateContactInputSchema,
    ui: CreateContactUi,
  },
  output: {
    schema: RecordResultSchema,
  },
}

const updateContact = {
  title: 'Update Contact',
  description: 'Update a Salesforce Contact',
  input: {
    schema: UpdateContactInputSchema,
    ui: UpdateContactUi,
  },
  output: {
    schema: RecordResultSchema,
  },
}

const searchContacts = {
  title: 'Search Contacts',
  description: 'Search Salesforce Contacts',
  input: {
    schema: SearchContactsInputSchema,
    ui: SearchContactsUi,
  },
  output: {
    schema: SearchOutputSchema,
  },
}

export const contactActionDefinitions = {
  createContact,
  searchContacts,
  updateContact,
}
