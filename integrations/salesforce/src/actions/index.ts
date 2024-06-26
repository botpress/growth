import * as bp from ".botpress";
import { createContact } from "./contacts/create-contact";
import { searchContacts } from "./contacts/search-contacts";
import { deleteContacts } from "./contacts/delete-contacts";
import { updateContact } from "./contacts/update-contact";

import { createLead } from "./leads/create-lead";
import { updateLead } from "./leads/update-lead";
import { deleteLeads } from "./leads/delete-leads";
import { searchLeads } from "./leads/search-leads";

import { createCase } from "./cases/create-case";
import { updateCase } from "./cases/update-case";
import { searchCases } from "./cases/search-cases";
import { deleteCase } from "./cases/delete-case";

export const actions = {
  createContact,
  searchContacts,
  deleteContacts,
  updateContact,
  createLead,
  updateLead,
  deleteLeads,
  searchLeads,
  createCase,
  updateCase,
  searchCases,
  deleteCase,
} satisfies bp.IntegrationProps["actions"];
