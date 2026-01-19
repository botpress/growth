import { z } from '@botpress/sdk'

export const customerSchema = z.object({
  id: z.string().describe('The id of the customer').optional(),
  odooId: z.number().describe('The Odoo ID of the customer').optional(),
  email: z.string().describe('The email of the customer'),
  name: z.string().describe('The name of the customer').optional(),
  phone: z.string().describe('The phone of the customer').optional(),
})

export type Customer = z.infer<typeof customerSchema>

const customerPayloadSchema = z.object({
  email: z.string().describe('The email of the customer'),
  phone: z.string().describe('The phone of the customer').optional(),
  name: z.string().describe('The name of the customer').optional(),
})

export type CustomerPayload = z.infer<typeof customerPayloadSchema>
