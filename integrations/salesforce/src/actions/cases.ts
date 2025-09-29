import { Action, SalesforceObject } from 'src/misc/types'
import { createSalesforceRecord } from './generic/create-salesforce-record'
import { updateSalesforceRecord } from './generic/update-salesforce-record'
import { fetchSalesforceRecords } from './generic/fetch-salesforce-records'
import { Output as CreateOutput } from '.botpress/implementation/actions/createCase/output'
import { Output as UpdateOutput } from '.botpress/implementation/actions/updateCase/output'
import { Output as SearchOutput } from '.botpress/implementation/actions/searchCases/output'

export const createCase: Action['createCase'] = async (props): Promise<CreateOutput> => {
  return await createSalesforceRecord(SalesforceObject.Case, props)
}

export const updateCase: Action['updateCase'] = async (props): Promise<UpdateOutput> => {
  return await updateSalesforceRecord(SalesforceObject.Case, props)
}

export const searchCases: Action['searchCases'] = async (props): Promise<SearchOutput> => {
  return await fetchSalesforceRecords(SalesforceObject.Case, props)
}

export const CaseActions = {
  createCase,
  updateCase,
  searchCases,
}
