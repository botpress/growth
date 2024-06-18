import { Input as SearchContactsInput } from ".botpress/implementation/actions/searchContacts/input";
import { Input as SearchLeadsInput } from ".botpress/implementation/actions/searchLeads/input";
import { Input as SearchCasesInput } from ".botpress/implementation/actions/searchCases/input";
import { SalesforceObject } from "../types";

const getSearchContactsQuery = (input: SearchContactsInput): string => {
  let query = `SELECT Id, Name, FirstName, LastName, Email, AccountId, Title, Phone FROM Contact`;
  let conditions = [];

  if (input.id) {
    conditions.push(`Id = '${input.id}'`);
  }
  if (input.name) {
    conditions.push(`Name LIKE '%${input.name}%'`);
  }
  if (input.email) {
    conditions.push(`Email = '${input.email}'`);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  console.log(query, "quuuu");
  return query;
};

const getSearchLeadsQuery = (input: SearchLeadsInput): string => {
  let query = `SELECT Id, Name, FirstName, LastName, Company, Email, Title, Phone FROM Lead`;
  let conditions = [];

  if (input.id) {
    conditions.push(`Id = '${input.id}'`);
  }
  if (input.name) {
    conditions.push(`Name LIKE '%${input.name}%'`);
  }
  if (input.email) {
    conditions.push(`Email = '${input.email}'`);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  return query;
};

const getSearchCasesQuery = (input: SearchCasesInput): string => {
  let query = `SELECT Id, Subject, Description, Priority, SuppliedName FROM Case`;
  let conditions: string[] = [];

  if (input.Id) {
    conditions.push(`Id = '${input.Id}'`);
  }
  if (input.Subject) {
    conditions.push(`Subject LIKE '%${input.Subject}%'`);
  }
  if (input.SuppliedName) {
    conditions.push(`SuppliedName LIKE '%${input.SuppliedName}%'`);
  }
  if (input.Description) {
    conditions.push(`Description LIKE '%${input.Description}%'`);
  }
  if (input.Priority) {
    conditions.push(`Priority = '${input.Priority}'`);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  return query;
};

export const getSearchQuery = <T>(
  objectType: SalesforceObject,
  input: T
): string => {
  const queryMap = new Map<SalesforceObject, Function>([
    [SalesforceObject.Contact, getSearchContactsQuery],
    [SalesforceObject.Lead, getSearchLeadsQuery],
    [SalesforceObject.Case, getSearchCasesQuery],
  ]);

  return queryMap.get(objectType)?.(input);
};
