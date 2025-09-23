import { Input as SearchContactsInput } from '.botpress/implementation/actions/searchContacts/input'
import { Input as SearchLeadsInput } from '.botpress/implementation/actions/searchLeads/input'
import { Input as SearchCasesInput } from '.botpress/implementation/actions/searchCases/input'

import { SalesforceObject } from '../types'

type SearchInput = SearchLeadsInput & SearchContactsInput & SearchCasesInput

export const getSearchQuery = (objectType: SalesforceObject, input: SearchInput, objectFields: string): string => {
  let query = `SELECT ${objectFields} FROM ${objectType}`
  const conditions: string[] = []

  const fields = [
    { key: 'Id', operator: '=' },
    { key: 'Name', operator: 'LIKE' },
    { key: 'Email', operator: '=' },
    { key: 'Subject', operator: 'LIKE' },
    { key: 'Description', operator: 'LIKE' },
    { key: 'Status', operator: '=' },
  ]

  fields.forEach(({ key, operator }) => {
    if (input[key as keyof SearchInput]) {
      const value = operator === 'LIKE' ? `%${input[key as keyof SearchInput]}%` : input[key as keyof SearchInput]

      conditions.push(`${key} ${operator} '${value}'`)
    }
  })

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ')
  }

  return query
}
