import { z, ActionDefinition } from '@botpress/sdk'
import { customerSchema } from 'definitions/schemas'

export const createCustomer: ActionDefinition = {
  title: 'Create Customer',
  description: 'Create a new customer',
  input: {
    schema: z.object({}),
  },
  output: {
    schema: z.object({
      customer: customerSchema.title('Customer').describe('The created customer').optional(),
    }),
  },
}

export const fetchCustomer: ActionDefinition = {
  title: 'Fetch Customer',
  description: 'Fetch a customer by id',
  input: {
    schema: z.object({
      customerId: z.number().title('Customer ID').describe('The id of the customer to fetch'),
    }),
  },
  output: {
    schema: z.object({
      customer: customerSchema.title('Customer').describe('The fetched customer').optional(),
    }),
  },
}

export const updateCustomer: ActionDefinition = {
  title: 'Update Customer',
  description: 'Update a customer by id',
  input: {
    schema: z.object({
      customer: customerSchema.title('Customer').describe('The customer to update'),
    }),
  },
  output: {
    schema: z.object({
      success: z.boolean().title('Success').describe('The success of the update'),
      error: z.string().title('Error').describe('The error message if the update failed').optional(),
    }),
  },
}

export const actions = {
  createCustomer,
  fetchCustomer,
  updateCustomer,
} as const