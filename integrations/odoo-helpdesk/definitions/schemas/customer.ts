import { z } from '@botpress/sdk'

export const customerSchema = z.object({
  id: z.string().describe('The id of the customer').optional(),
  odooId: z.number().describe('The Odoo ID of the customer').optional(),
  email: z.string().describe('The email of the customer'),
  name: z.string().describe('The name of the customer').optional(),
  phone: z.string().describe('The phone of the customer').optional(),
})

export const createCustomerPayloadSchema = z.object({
  email: z.string().describe('The email of the customer'),
  phone: z.string().describe('The phone of the customer').optional(),
  name: z.string().describe('The name of the customer').optional(),
})
export const createCustomerResultSchema = z.number().describe('The Odoo ID of the created customer')

export const fetchCustomerResultSchema = z
  .array(
    z
      .object({
        id: z.number().describe('The Odoo ID of the customer'),
        name: z.string().describe('The name of the customer'),
        email: z.string().describe('The email of the customer'),
        phone: z.string().describe('The phone of the customer'),
      })
      .describe('Possible fields of a customer response record')
  )
  .describe('The list of customers returned by a customer search')

export const updateCustomerPayloadSchema = z.object({
  email: z.string().describe('The email of the customer').optional(),
  name: z.string().describe('The name of the customer').optional(),
  phone: z.string().describe('The phone of the customer').optional(),
})

export type Customer = z.infer<typeof customerSchema>
export type CreateCustomerPayload = z.infer<typeof createCustomerPayloadSchema>
export type CreateCustomerResult = z.infer<typeof createCustomerResultSchema>
export type FetchCustomerResult = z.infer<typeof fetchCustomerResultSchema>
export type UpdateCustomerPayload = z.infer<typeof updateCustomerPayloadSchema>
