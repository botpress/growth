import { Action, SalesforceObject } from "src/misc/types";
import { createSalesforceObject } from "./generic/create-salesforce-object";
import { updateSalesforceObject } from "./generic/update-salesforce-object";
import { deleteSalesforceObject } from "./generic/delete-salesforce-object";
import { fetchSalesforceObjects } from "./generic/fetch-salesforce-objects";
import { Output as CreateOutput } from ".botpress/implementation/actions/createContact/output";
import { Output as UpdateOutput } from ".botpress/implementation/actions/updateContact/output";
import { Output as DeleteOutput } from ".botpress/implementation/actions/deleteContact/output";
import { Output as SearchOutput } from ".botpress/implementation/actions/searchContacts/output";

export const createContact: Action["createContact"] = async (
  props
): Promise<CreateOutput> => {
  return await createSalesforceObject(SalesforceObject.Contact, props);
};

export const updateContact: Action["updateContact"] = async (
  props
): Promise<UpdateOutput> => {
  return await updateSalesforceObject(SalesforceObject.Contact, props);
};

export const deleteContact: Action["deleteContact"] = async (
  props
): Promise<DeleteOutput> => {
  return await deleteSalesforceObject(SalesforceObject.Contact, props);
};

export const searchContacts: Action["searchContacts"] = async (
  props
): Promise<SearchOutput> => {
  return await fetchSalesforceObjects(SalesforceObject.Contact, props);
};

export default {
  createContact,
  updateContact,
  deleteContact,
  searchContacts,
};
