import * as bp from '.botpress'
import { RuntimeError } from '@botpress/client'
import { executeOdooMethod, getAuthenticatedCookie } from 'src/services/odoo'
import { Ticket, TicketPayload, TicketResponse } from 'definitions/schemas'

// Common fields to fetch from Odoo (id is automatically included by Odoo's read method)
const TICKET_FIELDS = ['id', 'name', 'description', 'team_id', 'priority', 'stage_id', 'partner_id'] as const

/**
 * Maps Odoo TicketResponse to our Ticket schema
 * Odoo returns relational fields as tuples [id, name], so we extract just the ID
 */
const mapTicketResponseToTicket = (response: TicketResponse): Ticket => ({
  id: response.id,
  customerOdooId: Array.isArray(response.partner_id) ? response.partner_id[0] : response.partner_id,
  name: response.name,
  description: response.description,
  teamId: Array.isArray(response.team_id) ? response.team_id[0] : response.team_id,
  priority: response.priority !== undefined && response.priority !== null ? String(response.priority) : undefined,
  stageId: response.stage_id
    ? Array.isArray(response.stage_id)
      ? response.stage_id[0]
      : response.stage_id
    : undefined,
})

export const createTicket: bp.Integration['actions']['createTicket'] = async ({
  ctx,
  input: { name, description, teamId, priority, stageId, customerOdooId },
  logger,
}) => {
  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })

  const ticketPayload: TicketPayload = {
    name,
    description,
    team_id: teamId,
    ...(priority !== undefined ? { priority: String(priority) } : {}),
    partner_id: customerOdooId,
    ...(stageId ? { stage_id: stageId } : {}),
  }

  const ticketId = (await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'helpdesk.ticket',
    method: 'create',
    args: [ticketPayload] as unknown as Record<string, string>[],
    logger,
  })) as TicketResponse['id']

  // Fetch the created ticket to return complete data
  const ticketResponses = (await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'helpdesk.ticket',
    method: 'read',
    args: [[ticketId], [...TICKET_FIELDS]],
    logger,
  })) as Array<TicketResponse>

  const ticketResponse = ticketResponses[0]
  if (!ticketResponse) {
    throw new RuntimeError('Failed to fetch created ticket')
  }

  return {
    ticketId: mapTicketResponseToTicket(ticketResponse).id,
  }
}

export const fetchTicketById: bp.Integration['actions']['fetchTicketById'] = async ({ ctx, input: { id }, logger }) => {
  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })

  const ticketResponses = (await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'helpdesk.ticket',
    method: 'read',
    args: [[id], [...TICKET_FIELDS]],
    logger,
  })) as Array<TicketResponse>

  if (ticketResponses.length === 0) throw new RuntimeError(`Ticket with id ${id} not found`)
  if (ticketResponses.length > 1) throw new RuntimeError(`Multiple tickets found for id ${id}`)

  // We've already validated length > 0, so this is safe
  const ticketResponse = ticketResponses[0]!
  return {
    ticket: mapTicketResponseToTicket(ticketResponse),
  }
}

export const fetchTicketsByCustomerId: bp.Integration['actions']['fetchTicketsByCustomerId'] = async ({
  ctx,
  input: { customerOdooId },
  logger,
}) => {
  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })
  const filters: (string | number)[][] = [['partner_id', '=', customerOdooId]]

  const ticketResponses = (await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'helpdesk.ticket',
    method: 'search_read',
    args: [filters, [...TICKET_FIELDS]] as (string | number)[][],
    logger,
  })) as Array<TicketResponse>

  return {
    tickets: ticketResponses.map(mapTicketResponseToTicket),
  }
}

export const fetchTicketsByCustomerEmail: bp.Integration['actions']['fetchTicketsByCustomerEmail'] = async ({
  ctx,
  input: { customerEmail },
  logger,
}) => {
  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })
  const filters: (string | number | boolean)[][] = [['partner_id.email', '=', customerEmail]]

  const ticketResponses = (await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'helpdesk.ticket',
    method: 'search_read',
    args: [filters, [...TICKET_FIELDS]] as (string | number)[][],
    logger,
  })) as Array<TicketResponse>

  return {
    tickets: ticketResponses.map(mapTicketResponseToTicket),
  }
}

export const updateTicket: bp.Integration['actions']['updateTicket'] = async ({
  ctx,
  input: { ticketId, name, description, teamId, priority, stageId },
  logger,
}) => {
  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })

  // Build update payload with only provided fields (Odoo's write only updates provided fields)
  // Fields with .optional() will be undefined when not provided by the user
  const updatePayload: Partial<TicketPayload> = {}

  if (name !== undefined) updatePayload.name = name
  if (description !== undefined) updatePayload.description = description
  if (teamId !== undefined) updatePayload.team_id = teamId
  if (stageId !== undefined) updatePayload.stage_id = stageId
  if (priority !== undefined) updatePayload.priority = priority

  // Only update if there are fields to update
  if (Object.keys(updatePayload).length === 0) throw new RuntimeError('No fields provided to update a ticket.')

  logger.forBot().info(`Updating ticket ${ticketId} with payload: ${JSON.stringify(updatePayload)}`)

  const success = (await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'helpdesk.ticket',
    method: 'write',
    args: [[ticketId], updatePayload] as unknown as (number | Record<string, string>)[],
    logger,
  })) as boolean

  return { success }
}
