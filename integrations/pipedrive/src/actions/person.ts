import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import { v2 } from 'pipedrive'
import { getApiConfig } from '../auth'
import { addPersonSchema, updatePersonSchema, findPersonSchema, outputPersonSchema } from '../../definitions/schemas'

export const addPerson: bp.IntegrationProps['actions']['addPerson'] = async ({ ctx, input }) => {
  try {
    const personsApi = new v2.PersonsApi(await getApiConfig({ ctx }))

    const { emailValue, emailPrimary, phoneValue, phonePrimary, ...rest } = addPersonSchema.parse(input)
    
    const addPersonRequest: v2.AddPersonRequest = {
      ...rest,
      ...(emailValue && { emails: [{ value: emailValue, primary: !!emailPrimary }] }),
      ...(phoneValue && { phones: [{ value: phoneValue, primary: !!phonePrimary }] }),
    }
    
    const req: v2.PersonsApiAddPersonRequest = { AddPersonRequest: addPersonRequest }
    const res = await personsApi.addPerson(req)

    const parsedPerson = outputPersonSchema.parse(res.data)

    return { person: parsedPerson }
  } catch (error) {
    console.error(error)
    throw new RuntimeError(`Failed to create person: ${error}`)
  }
}

export const updatePerson: bp.IntegrationProps['actions']['updatePerson'] = async ({ ctx, input }) => {
    try {
      const personsApi = new v2.PersonsApi(await getApiConfig({ ctx }))

      const { person_id, emailValue, emailPrimary, phoneValue, phonePrimary, ...rest } = updatePersonSchema.parse(input)
      
      const updatePersonRequest: v2.UpdatePersonRequest = {
        ...rest,
        ...(emailValue && { emails: [{ value: emailValue, primary: !!emailPrimary }] }),
        ...(phoneValue && { phones: [{ value: phoneValue, primary: !!phonePrimary }] }),
      }
      
      const req: v2.PersonsApiUpdatePersonRequest = { id: person_id, UpdatePersonRequest: updatePersonRequest }
      const res = await personsApi.updatePerson(req)

      const parsedPerson = outputPersonSchema.parse(res.data)

      return { person: parsedPerson }
    } catch (error) {
        console.error(error)
        throw new RuntimeError(`Failed to update person: ${error}`)
    }
}

export const findPerson: bp.IntegrationProps['actions']['findPerson'] = async ({ ctx, input }) => {
    try {
      const personsApi = new v2.PersonsApi(await getApiConfig({ ctx }))

      const { term, fields, organization_id, exact_match } = findPersonSchema.parse(input)
      
      const req: v2.PersonsApiSearchPersonsRequest = { 
        term, 
        ...(fields && { fields: fields as any }), 
        ...(organization_id !== undefined && { organization_id }), 
        ...(exact_match !== undefined && { exact_match }) 
      }
  
      const res = await personsApi.searchPersons(req)

      const parsedPersons = (res.data?.items || []).map(item => outputPersonSchema.parse(item))
      
      return { persons: parsedPersons }
    } catch (error) {
        console.error(error)
        throw new RuntimeError(`Failed to find person: ${error}`)
    }
}