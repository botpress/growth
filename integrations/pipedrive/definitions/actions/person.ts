import { z, ActionDefinition } from '@botpress/sdk'
import { addPersonSchema, updatePersonSchema, findPersonSchema, outputPersonSchema } from '../schemas'

const addPerson: ActionDefinition = {
  title: 'Add Person',
  description: 'Add a person in Pipedrive',
  input: {
      schema: addPersonSchema
  },
  output: { 
      schema: z.object({
        person: outputPersonSchema.title('Person').describe('Person data returned by Pipedrive API')
      })
  }
}

const updatePerson: ActionDefinition = {
  title: 'Update Person',
  description: 'Update a person in Pipedrive',
  input: {
      schema: updatePersonSchema
  },
  output: { 
      schema: z.object({
        person: outputPersonSchema.title('Person').describe('Person data returned by Pipedrive API')
      })
  }
}

const findPerson: ActionDefinition = {
  title: 'Find Person',
  description: 'Search for a person in Pipedrive',
  input: {
      schema: findPersonSchema
  },
  output: { 
      schema: z.object({
        persons: z.array(outputPersonSchema).title('Persons').describe('Array of persons found by Pipedrive API')
      })
  }
}

export const actions = {
  addPerson,
  updatePerson,
  findPerson
} as const