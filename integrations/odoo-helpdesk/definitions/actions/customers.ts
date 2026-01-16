import { z, ActionDefinition } from '@botpress/sdk'
import { customerSchema } from 'definitions/schemas'

export const createCustomer: ActionDefinition = {
  title: 'Create Customer',
  description: 'Create a new customer',
  input: {
    schema: z.object({
      id: z.string().title('ID').describe('The id of the customer'),
      email: z.string().title('Email').describe('The email of the customer'),
      name: z.string().title('Name').describe('The name of the customer').optional(),
      phone: z.string().title('Phone').describe('The phone of the customer').optional(),
    }),
  },
  output: {
    schema: z.object({
      customer: customerSchema.title('Customer').describe('The created customer').optional(),
    }),
  },
}

export const fetchCustomerById: ActionDefinition = {
  title: 'Fetch Customer By ID',
  description: 'Fetch a customer by id',
  input: {
    schema: z.object({
      id: z.string().title('ID').describe('The id of the customer to fetch'),
    }),
  },
  output: {
    schema: z.object({
      customer: customerSchema.title('Customer').describe('The fetched customer').optional(),
    }),
  },
}

export const fetchCustomerByOdooId: ActionDefinition = {
  title: 'Fetch Customer By Odoo ID',
  description: 'Fetch a customer by odoo id',
  input: {
    schema: z.object({
      id: z.string().title('ID').describe('The id of the customer to fetch'),
      odooId: z.string().title('Odoo ID').describe('The odoo id of the customer to fetch'),
    }),
  },
  output: {
    schema: z.object({
      customer: customerSchema.title('Customer').describe('The fetched customer').optional(),
    }),
  },
}

export const fetchCustomerByEmail: ActionDefinition = {
  title: 'Fetch Customer By Email',
  description: 'Fetch a customer by email',
  input: {
    schema: z.object({
      id: z.string().title('ID').describe('The id of the customer to fetch'),
      email: z.string().title('Email').describe('The email of the customer to fetch'),
    }),
  },
  output: {
    schema: z.object({
      customer: customerSchema.title('Customer').describe('The fetched customer').optional(),
    }),
  },
}

export const updateCustomerById: ActionDefinition = {
  title: 'Update Customer',
  description: 'Update a customer by id',
  input: {
    schema: z.object({
      id: z.string().title('ID').describe('The id of the customer to update'),
      email: z.string().title('Email').describe('The new email of the customer').optional(),
      name: z.string().title('Name').describe('The new name of the customer').optional(),
      phone: z.string().title('Phone').describe('The new phone of the customer').optional(),
    }),
  },
  output: {
    schema: z.object({
      success: z.boolean().title('Success').describe('The success of the update'),
      error: z.string().title('Error').describe('The error message if the update failed').optional(),
    }),
  },
}

export const updateCustomerByEmail: ActionDefinition = {
  title: 'Update Customer By Email',
  description: 'Update a customer by email',
  input: {
    schema: z.object({
      email: z.string().title('Email').describe('The email of the customer to update'),
      name: z.string().title('Name').describe('The new name of the customer').optional(),
      phone: z.string().title('Phone').describe('The new phone of the customer').optional(),
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
  fetchCustomerById,
  fetchCustomerByEmail,
  fetchCustomerByOdooId,
  updateCustomerById,
  updateCustomerByEmail,
} as const