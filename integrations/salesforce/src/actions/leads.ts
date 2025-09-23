import { Action, SalesforceObject } from 'src/misc/types'
import { createSalesforceRecord } from './generic/create-salesforce-record'
import { updateSalesforceRecord } from './generic/update-salesforce-record'
import { fetchSalesforceRecords } from './generic/fetch-salesforce-records'
import { Output as CreateOutput } from '.botpress/implementation/actions/createLead/output'
import { Output as UpdateOutput } from '.botpress/implementation/actions/updateLead/output'
import { Output as SearchOutput } from '.botpress/implementation/actions/searchLeads/output'

export const createLead: Action['createLead'] = async (props): Promise<CreateOutput> => {
  return await createSalesforceRecord(SalesforceObject.Lead, props)
}

export const updateLead: Action['updateLead'] = async (props): Promise<UpdateOutput> => {
  return await updateSalesforceRecord(SalesforceObject.Lead, props)
}

export const searchLeads: Action['searchLeads'] = async (props): Promise<SearchOutput> => {
  return await fetchSalesforceRecords(SalesforceObject.Lead, props)
}

export const LeadActions = {
  createLead,
  updateLead,
  searchLeads,
}
