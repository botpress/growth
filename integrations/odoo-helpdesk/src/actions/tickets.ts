import { z } from '@botpress/sdk'
import * as bp from '.botpress'
import { RuntimeError } from '@botpress/client'
import { executeOdooMethod, getAuthenticatedCookie } from 'src/services/odoo'
import {
  createTicketResultSchema,
  createTicketPayloadSchema,
  fetchTicketResultsSchema,
  Ticket,
  CreateTicketPayload,
  FetchTicketResult,
  FetchTicketResults,
  UpdateTicketPayload,
  CreateTicketResult,
  OdooRequestArgs,
  OdooRequestFilters,
  OdooRequestFields,
  OdooRequestKwargs,
  OdooRequestMethod,
  OdooResponseObject,
} from 'definitions/schemas'

/**
 * Maps Odoo TicketResponse to our Ticket schema
 * Odoo returns relational fields as tuples [id, name], so we extract just the ID
 * Some fields can be false when not set (e.g., partner_id, stage_id)
 */
const mapTicketResponseToTicket = (response: FetchTicketResult): Ticket => {
  const extractId = (field: OdooResponseObject) => {
    return Array.isArray(field) && field.length > 0 ? field[0] : undefined
  }

  const customerOdooId = extractId(response.partner_id)
  const stageId = extractId(response.stage_id)
  return {
    id: response.id,
    customerOdooId,
    name: response.name,
    description: response.description,
    teamId: response.team_id[0],
    priority: response.priority === false ? '0' : String(response.priority),
    stageId,
  }
}

export const createTicket: bp.Integration['actions']['createTicket'] = async ({
  ctx,
  input: { name, description, teamId, priority, stageId, customerOdooId },
  logger,
}) => {
  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })

  const ticketPayload: CreateTicketPayload = createTicketPayloadSchema.parse({
    name,
    description,
    team_id: teamId,
    partner_id: customerOdooId,
    ...(priority !== undefined ? { priority: String(priority) } : {}),
    ...(stageId ? { stage_id: stageId } : {}),
  })

  const ticketId: CreateTicketResult = await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'helpdesk.ticket',
    method: 'create',
    args: [ticketPayload],
    schema: createTicketResultSchema,
    logger,
  })

  // Fetch the created ticket to return complete data
  const { tickets }: { tickets: FetchTicketResults } = await fetchRawTickets({
    ctx,
    method: 'read',
    filters: [ticketId],
    logger,
  })

  if (tickets.length !== 1) throw new RuntimeError('Failed to fetch created ticket')

  const ticketResult = tickets[0]
  if (ticketResult === undefined || ticketResult === null || ticketResult.id === undefined || isNaN(ticketResult.id))
    throw new RuntimeError('Invalid ticket result')

  return {
    ticketId: ticketResult.id,
  }
}

const fetchRawTickets = async ({
  ctx,
  method,
  filters,
  pageSize = 100,
  page = 1,
  logger,
}: {
  ctx: bp.Context
  method: OdooRequestMethod
  filters: OdooRequestFilters
  pageSize?: number
  page?: number
  logger: bp.Logger
}): Promise<{ tickets: FetchTicketResults }> => {
  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })
  const fields: OdooRequestFields = ['id', 'name', 'description', 'team_id', 'priority', 'stage_id', 'partner_id']
  const args: OdooRequestArgs = [filters, fields]
  const kwargs: OdooRequestKwargs =
    method === 'search_read'
      ? {
          limit: pageSize,
          offset: (page - 1) * pageSize,
          order: 'create_date DESC',
        }
      : {}
  const schema = fetchTicketResultsSchema
  logger.forBot().info(`Fetching tickets ${JSON.stringify({ method, args, kwargs, pageSize, page })}`)
  const tickets: FetchTicketResults = await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'helpdesk.ticket',
    method,
    args,
    kwargs,
    schema,
    logger,
  })
  logger.forBot().info(`Fetched tickets: ${JSON.stringify(tickets)}`)
  return { tickets }
}

export const fetchTicketById: bp.Integration['actions']['fetchTicketById'] = async ({ ctx, input: { id }, logger }) => {
  const { tickets } = await fetchRawTickets({
    ctx,
    method: 'read',
    filters: [id],
    logger,
  })

  logger.forBot().info(`Fetched tickets: ${JSON.stringify(tickets)}`)

  if (tickets.length === 0) throw new RuntimeError(`Ticket with id ${id} not found`)
  if (tickets.length > 1) throw new RuntimeError(`Multiple tickets found for id ${id}`)

  // We've already validated length > 0, so this is safe
  const ticketResult = tickets[0]
  if (ticketResult === undefined || ticketResult === null || ticketResult.id === undefined || ticketResult.id === null)
    throw new RuntimeError('Invalid ticket result')

  return {
    ticket: mapTicketResponseToTicket(ticketResult),
  }
}

export const fetchTicketsByCustomerId: bp.Integration['actions']['fetchTicketsByCustomerId'] = async ({
  ctx,
  input: { customerOdooId, page, pageSize },
  logger,
}) => {
  const { tickets }: { tickets: FetchTicketResults } = await fetchRawTickets({
    ctx,
    method: 'search_read',
    filters: [['partner_id', '=', customerOdooId]],
    pageSize,
    page,
    logger,
  })
  return {
    tickets: tickets.map(mapTicketResponseToTicket),
  }
}

export const fetchTicketsByCustomerEmail: bp.Integration['actions']['fetchTicketsByCustomerEmail'] = async ({
  ctx,
  input: { customerEmail, page, pageSize },
  logger,
}) => {
  const { tickets }: { tickets: FetchTicketResults } = await fetchRawTickets({
    ctx,
    method: 'search_read',
    filters: [['partner_id.email', '=', customerEmail]],
    pageSize,
    page,
    logger,
  })
  return {
    tickets: tickets.map(mapTicketResponseToTicket),
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
  const updatePayload: Partial<UpdateTicketPayload> = {}

  if (name !== undefined) updatePayload.name = name
  if (description !== undefined) updatePayload.description = description
  if (teamId !== undefined) updatePayload.team_id = teamId
  if (stageId !== undefined) updatePayload.stage_id = stageId
  if (priority !== undefined) updatePayload.priority = priority

  // Only update if there are fields to update
  if (Object.keys(updatePayload).length === 0) throw new RuntimeError('No fields provided to update a ticket.')

  logger.forBot().info(`Updating ticket ${ticketId} with payload: ${JSON.stringify(updatePayload)}`)

  const success: boolean = await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'helpdesk.ticket',
    method: 'write',
    args: [[ticketId], updatePayload],
    logger,
    schema: z.boolean(),
  })

  return { success }
}
