import { z } from '@botpress/sdk'
import { odooResponseFruitfulObjectSchema, odooResponseObjectSchema } from './odoo'

export const ticketSchema = z.object({
  id: z.number().describe('The ticket ID'),
  name: z.string().describe('The name of the ticket'),
  description: z.string().describe('The description of the ticket'),
  teamId: z.number().describe('The helpdesk team ID associated with the ticket'),
  priority: z.string().describe('The priority of the ticket').default('0'),
  customerOdooId: z.number().describe('The Odoo customer ID associated with the ticket').optional(),
  stageId: z.number().describe('The stage ID associated with the ticket').optional(),
})

export const createTicketPayloadSchema = z.object({
  name: z.string().describe('The name of the ticket'),
  description: z.string().describe('The description of the ticket'),
  team_id: z.number().describe('The helpdesk team ID associated with the ticket'),
  partner_id: z.number().describe('The customer ID associated with the ticket'),
  priority: z
    .string()
    .describe('The priority of the ticket as a string (e.g., "0", "1", "2", "3")')
    .optional()
    .default('0'),
  stage_id: z.number().describe('The stage ID associated with the ticket').optional(),
})

export const createTicketResultSchema = z.number().describe('The Odoo ID of the created ticket')

export const fetchTicketResultSchema = z.object({
  id: z.number().describe('The ticket ID'),
  name: z.string().describe('The name of the ticket'),
  description: z.string().describe('The description of the ticket'),
  team_id: odooResponseFruitfulObjectSchema.describe('The helpdesk team ID and name as a tuple [id, name]'),
  priority: z
    .union([z.string(), z.boolean()])
    .describe('The priority of the ticket as a string (e.g., "0", "1", "2", "3", or false if not set)'),
  partner_id: odooResponseObjectSchema.describe(
    'The customer ID and name as a tuple [id, name], or false if no partner is assigned'
  ),
  stage_id: odooResponseObjectSchema.describe(
    'The stage ID and name as a tuple [id, name], or false if no stage is assigned'
  ),
})

export const fetchTicketResultsSchema = z.array(fetchTicketResultSchema)

export const updateTicketPayloadSchema = z.object({
  name: z.string().describe('The name of the ticket').optional(),
  description: z.string().describe('The description of the ticket').optional(),
  team_id: z.number().describe('The helpdesk team ID associated with the ticket').optional(),
  priority: z.string().describe('The priority of the ticket as a string (e.g., "0", "1", "2", "3")').optional(),
  partner_id: z.number().describe('The customer ID associated with the ticket').optional(),
  stage_id: z.number().describe('The stage ID associated with the ticket').optional(),
})

export type Ticket = z.infer<typeof ticketSchema>
export type CreateTicketPayload = z.infer<typeof createTicketPayloadSchema>
export type CreateTicketResult = z.infer<typeof createTicketResultSchema>
export type FetchTicketResult = z.infer<typeof fetchTicketResultSchema>
export type FetchTicketResults = z.infer<typeof fetchTicketResultsSchema>
export type UpdateTicketPayload = z.infer<typeof updateTicketPayloadSchema>
