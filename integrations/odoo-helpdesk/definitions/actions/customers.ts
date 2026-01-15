import { z, ActionDefinition } from '@botpress/sdk'
import { customerSchema } from 'definitions/schemas'

export const createCustomer: ActionDefinition = {
  title: 'Create Customer',
  description: 'Create a new customer',
  input: {
    schema: z.object({
      bpId: z.number().title('BP ID').describe('The id of the customer'),
      odooId: z.number().title('Odoo ID').describe('The Odoo ID of the customer').optional(),
      email: z.string().title('Email').describe('The email of the customer'),
      firstName: z.string().title('First Name').describe('The first name of the customer').optional(),
      lastName: z.string().title('Last Name').describe('The last name of the customer').optional(),
      phone: z.string().title('Phone').describe('The phone of the customer').optional(),
    }),
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