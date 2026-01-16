import { z } from '@botpress/sdk'

export const ticketSchema = z.object({
  customerOdooId: z.number().describe('The Odoo customer ID associated with the ticket'),
  id: z.number().describe('The ticket ID'),
  name: z.string().describe('The name of the ticket'),
  description: z.string().describe('The description of the ticket'),
  teamId: z.number().describe('The helpdesk team ID associated with the ticket'),
  priority: z.number().describe('The priority of the ticket').optional(),
  stageId: z.number().describe('The stage ID associated with the ticket').optional(),
})
export type Ticket = z.infer<typeof ticketSchema>

const ticketPayloadSchema = z.object({
  name: z.string().describe('The name of the ticket'),
  description: z.string().describe('The description of the ticket'),
  team_id: z.number().describe('The helpdesk team ID associated with the ticket'),
  priority: z.number().describe('The priority of the ticket').optional(),
  partner_id: z.number().describe('The customer ID associated with the ticket'),
  stage_id: z.number().describe('The stage ID associated with the ticket').optional(),
})
export type TicketPayload = z.infer<typeof ticketPayloadSchema>

export const ticketResponseSchema = ticketPayloadSchema.extend({
  id: z.number().describe('The ticket ID'),
})
export type TicketResponse = z.infer<typeof ticketResponseSchema>