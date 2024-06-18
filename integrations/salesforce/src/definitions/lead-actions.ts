import { RecordResultSchema } from "src/misc/custom-schemas/common-schemas";
import {
  CreateLeadInputSchema,
  UpdateLeadInputSchema,
  DeleteLeadInputSchema,
  SearchLeadsInputSchema,
  SearchLeadsOutputSchema,
} from "src/misc/custom-schemas/lead-schemas";
import {
  CreateLeadUi,
  UpdateLeadUi,
  DeleteLeadUi,
  SearchLeadsUi,
} from "src/misc/custom-uis/lead-uis";

const createLead = {
  title: "Create Lead",
  description: "Create a Salesforce Lead",
  input: {
    schema: CreateLeadInputSchema,
    ui: CreateLeadUi,
  },
  output: {
    schema: RecordResultSchema,
  },
};

const updateLead = {
  title: "Update Lead",
  description: "Update a Salesforce Lead",
  input: {
    schema: UpdateLeadInputSchema,
    ui: UpdateLeadUi,
  },
  output: {
    schema: RecordResultSchema,
  },
};

const deleteLead = {
  title: "Delete Lead",
  description: "Delete Salesforce Lead",
  input: {
    schema: DeleteLeadInputSchema,
    ui: DeleteLeadUi,
  },
  output: {
    schema: RecordResultSchema,
  },
};

const searchLeads = {
  title: "Search Leads",
  description: "Search Salesforce Leads",
  input: {
    schema: SearchLeadsInputSchema,
    ui: SearchLeadsUi,
  },
  output: {
    schema: SearchLeadsOutputSchema,
  },
};

export const leadActionDefinitions = {
  createLead,
  updateLead,
  deleteLead,
  searchLeads,
};
