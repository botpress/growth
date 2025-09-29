import {
  CreateCaseInputSchema,
  SearchCasesInputSchema,
  UpdateCaseInputSchema,
} from 'src/misc/custom-schemas/case-schemas'
import { CreateContactUi, SearchContactsUi, UpdateContactUi } from 'src/misc/custom-uis/contact-uis'
import { RecordResultSchema, SearchOutputSchema } from 'src/misc/custom-schemas/common-schemas'

const createCase = {
  title: 'Create Case',
  description: 'Create a Salesforce Case',
  input: {
    schema: CreateCaseInputSchema,
    ui: CreateContactUi,
  },
  output: {
    schema: RecordResultSchema,
  },
}

const updateCase = {
  title: 'Update Case',
  description: 'Update a Salesforce Case',
  input: {
    schema: UpdateCaseInputSchema,
    ui: UpdateContactUi,
  },
  output: {
    schema: RecordResultSchema,
  },
}

const searchCases = {
  title: 'Search Cases',
  description: 'Search Salesforce Cases',
  input: {
    schema: SearchCasesInputSchema,
    ui: SearchContactsUi,
  },
  output: {
    schema: SearchOutputSchema,
  },
}

export const caseActionDefinitions = {
  createCase,
  searchCases,
  updateCase,
}
