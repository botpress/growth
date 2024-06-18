import { Action, SalesforceObject } from "src/misc/types";
import { createSalesforceObject } from "./generic/create-salesforce-object";
import { updateSalesforceObject } from "./generic/update-salesforce-object";
import { deleteSalesforceObject } from "./generic/delete-salesforce-object";
import { fetchSalesforceObjects } from "./generic/fetch-salesforce-objects";
import { Output as CreateOutput } from ".botpress/implementation/actions/createLead/output";
import { Output as UpdateOutput } from ".botpress/implementation/actions/updateLead/output";
import { Output as DeleteOutput } from ".botpress/implementation/actions/deleteLead/output";
import { Output as SearchOutput } from ".botpress/implementation/actions/searchLeads/output";

export const createLead: Action["createLead"] = async (
  props
): Promise<SearchOutput> => {
  return await createSalesforceObject(SalesforceObject.Lead, props);
};

export const updateLead: Action["updateLead"] = async (
  props
): Promise<UpdateOutput> => {
  return await updateSalesforceObject(SalesforceObject.Lead, props);
};

export const deleteLead: Action["deleteLead"] = async (
  props
): Promise<DeleteOutput> => {
  return await deleteSalesforceObject(SalesforceObject.Lead, props);
};

export const searchLeads: Action["searchLeads"] = async (
  props
): Promise<SearchOutput> => {
  const k = await fetchSalesforceObjects(SalesforceObject.Lead, props);
  console.log(k, "kkkkk");
  return k;
};

export default {
  createLead,
  updateLead,
  deleteLead,
  searchLeads,
};
