import { Action, SalesforceObject } from "src/misc/types";
import { createSalesforceObject } from "./generic/create-salesforce-object";
import { updateSalesforceObject } from "./generic/update-salesforce-object";
import { deleteSalesforceObject } from "./generic/delete-salesforce-object";
import { fetchSalesforceObjects } from "./generic/fetch-salesforce-objects";
import { Output as CreateOutput } from ".botpress/implementation/actions/createCase/output";
import { Output as UpdateOutput } from ".botpress/implementation/actions/updateCase/output";
import { Output as DeleteOutput } from ".botpress/implementation/actions/deleteCase/output";
import { Output as SearchOutput } from ".botpress/implementation/actions/searchCases/output";

export const createCase: Action["createCase"] = async (
  props
): Promise<CreateOutput> => {
  return await createSalesforceObject(SalesforceObject.Case, props);
};

export const updateCase: Action["updateCase"] = async (
  props
): Promise<UpdateOutput> => {
  return await updateSalesforceObject(SalesforceObject.Case, props);
};

export const deleteCase: Action["deleteCase"] = async (
  props
): Promise<DeleteOutput> => {
  return await deleteSalesforceObject(SalesforceObject.Case, props);
};

export const searchCases: Action["searchCases"] = async (
  props
): Promise<SearchOutput> => {
  return await fetchSalesforceObjects(SalesforceObject.Case, props);
};

export default {
  createCase,
  updateCase,
  deleteCase,
  searchCases,
};
