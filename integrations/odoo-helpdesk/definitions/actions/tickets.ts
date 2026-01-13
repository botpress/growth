import { z, ActionDefinition } from '@botpress/sdk'
import { customerSchema, ticketSchema } from 'definitions/schemas'

export const createTicket: ActionDefinition = {
  title: 'Create Ticket',
  description: 'Create a new ticket',
  input: {
    schema: z.object({
      subject: z.string().title('Subject').describe('The subject of the ticket'),
      description: z.string().title('Description').describe('The description of the ticket'),
      status: z.string().title('Status').describe('The status of the ticket'),
      priority: z.string().title('Priority').describe('The priority of the ticket'),
      customer: customerSchema.title('Customer').describe('The customer associated with the ticket'),
    }),
  },
  output: {
    schema: z.object({
      odooTicket: ticketSchema.title('Odoo Ticket').describe('The created ticket').optional(),
    }),
  },
}

export const fetchTicket: ActionDefinition = {
  title: 'Fetch Ticket',
  description: 'Fetch a ticket by id',
  input: {
    schema: z.object({
      odooTicketId: z.number().title('Odoo Ticket ID').describe('The id of the ticket to fetch'),
    }),
  },
  output: {
    schema: z.object({
      odooTicket: ticketSchema.title('Odoo Ticket').describe('The fetched ticket').optional(),
    }),
  },
}

export const fetchTickets: ActionDefinition = {
  title: 'Fetch Tickets by Customer',
  description: 'Fetch all tickets by customer',
  input: {
    schema: z.object({
      customerId: z.number().title('Customer ID').describe('The id of the customer'),
    }),
  },
  output: {
    schema: z.object({
      odooTickets: z.array(ticketSchema).title('Odoo Tickets').describe('The list of tickets associated with the customer'),
    }),
  },
}

export const updateTicket: ActionDefinition = {
  title: 'Update Ticket',
  description: 'Update a ticket by id',
  input: {
    schema: z.object({
      odooTicket: ticketSchema.title('Odoo Ticket').describe('The ticket to update'),
      subject: z.string().title('Subject').describe('The subject of the ticket'),
      description: z.string().title('Description').describe('The description of the ticket'),
      status: z.string().title('Status').describe('The status of the ticket'),
      priority: z.string().title('Priority').describe('The priority of the ticket'),
    }),
  },
  output: {
    schema: z.object({
      success: z.boolean().title('Success').describe('The success of the update'),
      error: z.string().title('Error').describe('The error message if the update failed').optional(),
    }),
  },
}

export const closeTicket: ActionDefinition = {
  title: 'Close Ticket',
  description: 'Close a ticket by id',
  input: {
    schema: z.object({
      odooTicketId: z.number().title('Odoo Ticket ID').describe('The id of the ticket to close'),
    }),
  },
  output: {
    schema: z.object({
      odooTicket: ticketSchema.title('Odoo Ticket').describe('The closed ticket').optional(),
      error: z.string().title('Error').describe('The error message if the ticket was not closed successfully').optional(),
    }),
  },
}

export const actions = {
  createTicket,
  fetchTicket,
  fetchTickets,
  updateTicket,
  closeTicket,
} as const