import { Action, SalesforceObject } from 'src/misc/types'
import { createSalesforceRecord } from './generic/create-salesforce-record'
import { updateSalesforceRecord } from './generic/update-salesforce-record'
import { fetchSalesforceRecords } from './generic/fetch-salesforce-records'
import { Output as CreateOutput } from '.botpress/implementation/actions/createContact/output'
import { Output as UpdateOutput } from '.botpress/implementation/actions/updateContact/output'
import { Output as SearchOutput } from '.botpress/implementation/actions/searchContacts/output'

export const createContact: Action['createContact'] = async (props): Promise<CreateOutput> => {
  return await createSalesforceRecord(SalesforceObject.Contact, props)
}

export const updateContact: Action['updateContact'] = async (props): Promise<UpdateOutput> => {
  return await updateSalesforceRecord(SalesforceObject.Contact, props)
}

export const searchContacts: Action['searchContacts'] = async (props): Promise<SearchOutput> => {
  return await fetchSalesforceRecords(SalesforceObject.Contact, props)
}

export const ContactActions = {
  createContact,
  updateContact,
  searchContacts,
}
