import { z, ActionDefinition } from '@botpress/sdk'
import { customerSchema, createCustomerPayloadSchema, createCustomerResultSchema } from 'definitions/schemas'

export const createCustomer: ActionDefinition = {
  title: 'Create Customer',
  description: 'Create a new customer',
  input: {
    schema: createCustomerPayloadSchema.extend({
      id: z.string().title('ID').describe('The id of the customer'),
    }),
  },
  output: {
    schema: z.object({
      odooId: createCustomerResultSchema
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
      odooId: z.number().title('Odoo ID').describe('The odoo id of the customer to fetch'),
      id: z
        .string()
        .title('ID')
        .describe('The id of the customer to fetch. If provided, the returned customer will have this id.')
        .optional(),
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
      email: z.string().title('Email').describe('The email of the customer to fetch'),
      id: z
        .string()
        .title('ID')
        .describe('The id of the customer to fetch. If provided, the returned customer will have this id.')
        .optional(),
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
    }),
  },
}

export const updateCustomerByOdooId: ActionDefinition = {
  title: 'Update Customer By Odoo ID',
  description: 'Update a customer by odoo id',
  input: {
    schema: z.object({
      odooId: z.number().title('Odoo ID').describe('The odoo id of the customer to update'),
      email: z.string().title('Email').describe('The new email of the customer').optional(),
      name: z.string().title('Name').describe('The new name of the customer').optional(),
      phone: z.string().title('Phone').describe('The new phone of the customer').optional(),
    }),
  },
  output: {
    schema: z.object({
      success: z.boolean().title('Success').describe('The success of the update'),
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
    }),
  },
}

export const actions = {
  createCustomer,
  fetchCustomerById,
  fetchCustomerByEmail,
  fetchCustomerByOdooId,
  updateCustomerById,
  updateCustomerByOdooId,
  updateCustomerByEmail,
} as const
