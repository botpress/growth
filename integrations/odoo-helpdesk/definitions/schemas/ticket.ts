import { z } from '@botpress/sdk'
import { customerSchema } from './customer'

export const ticketSchema = z.object({
  customer: customerSchema.describe('The customer associated with the ticket'),
  odooTicketSubject: z.string().describe('The Odoo ticket subject'),
  odooTicketDescription: z.string().describe('The Odoo ticket description'),
  odooTicketStatus: z.string().describe('The Odoo ticket status'),
  odooTicketPriority: z.string().describe('The Odoo ticket priority'),
  odooTicketId: z.number().describe('The Odoo ticket ID').optional(),
  odooTicketCreatedAt: z.string().describe('The Odoo ticket created at').optional(),
  odooTicketUpdatedAt: z.string().describe('The Odoo ticket updated at').optional(),
})