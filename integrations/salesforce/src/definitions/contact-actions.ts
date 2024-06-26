import {
  CreateContactInputSchema,
  CreateContactOutputSchema,
  DeleteContactInputSchema,
  DeleteContactOutputSchema,
  SearchContactsInputSchema,
  SearchContactsOutputSchema,
  UpdateContactInputSchema,
  UpdateContactOutputSchema,
} from "src/misc/custom-schemas/contact-schemas";
import {
  CreateContactUi,
  DeleteContactUi,
  SearchContactsUi,
  UpdateContactUi,
} from "src/misc/custom-uis/contact-uis";

const createContact = {
  title: "Create Contact",
  description: "Create a Salesforce Contact",
  input: {
    schema: CreateContactInputSchema,
    ui: CreateContactUi,
  },
  output: {
    schema: CreateContactOutputSchema,
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
    schema: UpdateContactOutputSchema,
  },
};

const deleteContacts = {
  title: "Delete Contacts",
  description: "Delete Salesforce Contacts",
  input: {
    schema: DeleteContactInputSchema,
    ui: DeleteContactUi,
  },
  output: {
    schema: DeleteContactOutputSchema,
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
  deleteContacts,
  updateContact,
};
