import { Input as SearchContactsInput } from ".botpress/implementation/actions/searchContacts/input";
import { Input as SearchLeadsInput } from ".botpress/implementation/actions/searchLeads/input";
import { Input as SearchCasesInput } from ".botpress/implementation/actions/searchCases/input";

export const getSearchContactsQuery = (input: SearchContactsInput): string => {
  let query = `SELECT Id, Name, FirstName, LastName, Email, AccountId, Title, Phone FROM Contact WHERE`;
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
    query += " " + conditions.join(" AND ");
  } else {
    throw new Error("No search criterias provided");
  }

  return query;
};

export const getSearchLeadsQuery = (input: SearchLeadsInput): string => {
  let query = `SELECT Id, Name, FirstName, LastName, Email, AccountId, Title, Phone FROM Leads WHERE`;
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
    query += " " + conditions.join(" AND ");
  } else {
    throw new Error("No search criterias provided");
  }

  return query;
};

export const getSearchCasesQuery = (input: SearchCasesInput): string => {
  let query = `SELECT Id, Subject, Description, Priority, SuppliedName FROM Case WHERE`;
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
    query += " " + conditions.join(" AND ");
  } else {
    throw new Error("No search criteria provided");
  }

  return query;
};
