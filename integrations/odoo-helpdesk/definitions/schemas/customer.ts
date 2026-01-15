import { z } from '@botpress/sdk'

export const customerSchema = z.object({
  id: z.string().describe('The id of the customer'),
  odooId: z.string().describe('The Odoo ID of the customer').optional(),
  email: z.string().describe('The email of the customer'),
  name: z.string().describe('The name of the customer').optional(),
  phone: z.string().describe('The phone of the customer').optional(),
})