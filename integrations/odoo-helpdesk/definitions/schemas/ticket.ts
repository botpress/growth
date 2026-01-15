import { z } from '@botpress/sdk'

export const ticketSchema = z.object({
  customerId: z.number().describe('The customer ID associated with the ticket'),
  id: z.number().describe('The ticket ID'),
  name: z.string().describe('The name of the ticket'),
  description: z.string().describe('The description of the ticket'),
  teamId: z.number().describe('The helpdesk team ID associated with the ticket'),
  priority: z.string().describe('The priority of the ticket').optional(),
  stageId: z.number().describe('The stage ID associated with the ticket').optional(),
})