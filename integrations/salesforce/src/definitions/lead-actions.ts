import {
  CreateLeadInputSchema,
  CreateLeadOutputSchema,
  UpdateLeadInputSchema,
  UpdateLeadOutputSchema,
  DeleteLeadsInputSchema,
  DeleteLeadsOutputSchema,
  SearchLeadsInputSchema,
  SearchLeadsOutputSchema,
} from "src/misc/custom-schemas/lead-schemas";
import {
  CreateLeadUi,
  UpdateLeadUi,
  DeleteLeadsUi,
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
    schema: CreateLeadOutputSchema,
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
    schema: UpdateLeadOutputSchema,
  },
};

const deleteLeads = {
  title: "Delete Leads",
  description: "Delete Salesforce Leads",
  input: {
    schema: DeleteLeadsInputSchema,
    ui: DeleteLeadsUi,
  },
  output: {
    schema: DeleteLeadsOutputSchema,
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
  deleteLeads,
  searchLeads,
};
