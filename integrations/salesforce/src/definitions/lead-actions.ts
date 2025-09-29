import { RecordResultSchema, SearchOutputSchema } from 'src/misc/custom-schemas/common-schemas'
import {
  CreateLeadInputSchema,
  UpdateLeadInputSchema,
  SearchLeadsInputSchema,
} from 'src/misc/custom-schemas/lead-schemas'
import { CreateLeadUi, UpdateLeadUi, SearchLeadsUi } from 'src/misc/custom-uis/lead-uis'

const createLead = {
  title: 'Create Lead',
  description: 'Create a Salesforce Lead',
  input: {
    schema: CreateLeadInputSchema,
    ui: CreateLeadUi,
  },
  output: {
    schema: RecordResultSchema,
  },
}

const updateLead = {
  title: 'Update Lead',
  description: 'Update a Salesforce Lead',
  input: {
    schema: UpdateLeadInputSchema,
    ui: UpdateLeadUi,
  },
  output: {
    schema: RecordResultSchema,
  },
}

const searchLeads = {
  title: 'Search Leads',
  description: 'Search Salesforce Leads',
  input: {
    schema: SearchLeadsInputSchema,
    ui: SearchLeadsUi,
  },
  output: {
    schema: SearchOutputSchema,
  },
}

export const leadActionDefinitions = {
  createLead,
  updateLead,
  searchLeads,
}
