import {
  CreateContactInputSchema,
  DeleteContactInputSchema,
  SearchContactsInputSchema,
  SearchContactsOutputSchema,
  UpdateContactInputSchema,
} from "src/misc/custom-schemas/contact-schemas";
import {
  CreateContactUi,
  DeleteContactUi,
  SearchContactsUi,
  UpdateContactUi,
} from "src/misc/custom-uis/contact-uis";
import { RecordResultSchema } from "src/misc/custom-schemas/common-schemas";

const createContact = {
  title: "Create Contact",
  description: "Create a Salesforce Contact",
  input: {
    schema: CreateContactInputSchema,
    ui: CreateContactUi,
  },
  output: {
    schema: RecordResultSchema,
  },
};

const updateContact = {
  title: "Update Contact",
  description: "Update a Salesforce Contact",
  input: {
    schema: UpdateContactInputSchema,
    ui: UpdateContactUi,
  },
  output: {
    schema: RecordResultSchema,
  },
};

const deleteContact = {
  title: "Delete Contact",
  description: "Delete Salesforce Contact",
  input: {
    schema: DeleteContactInputSchema,
    ui: DeleteContactUi,
  },
  output: {
    schema: RecordResultSchema,
  },
};

const searchContacts = {
  title: "Search Contacts",
  description: "Search Salesforce Contacts",
  input: {
    schema: SearchContactsInputSchema,
    ui: SearchContactsUi,
  },
  output: {
    schema: SearchContactsOutputSchema,
  },
};

export const contactActionDefinitions = {
  createContact,
  searchContacts,
  deleteContact,
  updateContact,
};
