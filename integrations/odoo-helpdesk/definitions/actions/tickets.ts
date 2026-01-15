import { z, ActionDefinition } from '@botpress/sdk'
import { ticketSchema } from 'definitions/schemas'

export const createTicket: ActionDefinition = {
  title: 'Create Ticket',
  description: 'Create a new ticket',
  input: {
    schema: z.object({
      name: z.string().title('Name').describe('The name of the ticket'),
      description: z.string().title('Description').describe('The description of the ticket'),
      teamId: z.number().title('Team ID').describe('The helpdesk team ID associated with the ticket'),
      priority: z.string().title('Priority').describe('The priority of the ticket'),
      customerId: z.number().title('Customer ID').describe('The customer ID associated with the ticket'),
      stageId: z.number().title('Stage ID').describe('The stage ID associated with the ticket').optional(),
    }),
  },
  output: {
    schema: z.object({
      ticket: ticketSchema.title('Ticket').describe('The created ticket').optional(),
    }),
  },
}

export const fetchTicketById: ActionDefinition = {
  title: 'Fetch Ticket',
  description: 'Fetch a ticket by id',
  input: {
    schema: z.object({
      id: z.number().title('Ticket ID').describe('The id of the ticket to fetch'),
    }),
  },
  output: {
    schema: z.object({
      ticket: ticketSchema.title('Ticket').describe('The fetched ticket').optional(),
    }),
  },
}

export const fetchTicketsByCustomerId: ActionDefinition = {
  title: 'Fetch Tickets by Customer',
  description: 'Fetch all tickets by customer',
  input: {
    schema: z.object({
      customerId: z.number().title('Customer ID').describe('The id of the customer'),
    }),
  },
  output: {
    schema: z.object({
      tickets: z.array(ticketSchema).title('Tickets').describe('The list of tickets associated with the customer'),
    }),
  },
}

export const fetchTicketsByCustomerEmail: ActionDefinition = {
  title: 'Fetch Tickets by Customer Email',
  description: 'Fetch all tickets by customer email',
  input: {
    schema: z.object({
      customerEmail: z.string().title('Customer Email').describe('The email of the customer'),
    }),
  },
  output: {
    schema: z.object({
      tickets: z.array(ticketSchema).title('Tickets').describe('The list of tickets associated with the customer'),
    }),
  },
}

export const updateTicket: ActionDefinition = {
  title: 'Update Ticket',
  description: 'Update a ticket by id',
  input: {
    schema: z.object({
      ticket: ticketSchema.title('Ticket').describe('The ticket to update'),
      name: z.string().title('Name').describe('The name of the ticket').optional(),
      description: z.string().title('Description').describe('The description of the ticket').optional(),
      teamId: z.number().title('Team ID').describe('The helpdesk team ID associated with the ticket').optional(),
      priority: z.string().title('Priority').describe('The priority of the ticket').optional(),
      stageId: z.number().title('Stage ID').describe('The stage ID associated with the ticket').optional(),
    }),
  },
  output: {
    schema: z.object({
      success: z.boolean().title('Success').describe('The success of the update')
    }),
  },
}

export const actions = {
  createTicket,
  fetchTicketById,
  fetchTicketsByCustomerId,
  fetchTicketsByCustomerEmail,
  updateTicket,
} as const