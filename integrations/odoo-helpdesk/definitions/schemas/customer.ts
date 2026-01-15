import { z } from '@botpress/sdk'

export const customerSchema = z.object({
  bpId: z.number().describe('The botpress ID of the customer'),
  email: z.string().describe('The email of the customer'),
  odooId: z.number().describe('The Odoo ID of the customer').optional(),
  firstName: z.string().describe('The first name of the customer').optional(),
  lastName: z.string().describe('The last name of the customer').optional(),
  phone: z.string().describe('The phone of the customer').optional(),
})