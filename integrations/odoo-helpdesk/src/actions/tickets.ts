import * as bp from '.botpress'
import { RuntimeError } from '@botpress/client'
import { executeOdooMethod, getAuthenticatedCookie } from 'src/services/odoo'

export const createTicket: bp.Integration['actions']['createTicket'] = async ({ ctx, input, logger }) => {
  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })
  const { name, description, teamId, priority, stageId, customerId } = input

  const ticketPayload: Record<string, any> = {
    name,
    description,
    team_id: teamId,
    priority,
    partner_id: customerId,
    ...(stageId ? { stage_id: stageId } : {}),
  }

  const ticketId = (await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'helpdesk.ticket',
    method: 'create',
    args: [ticketPayload],
    logger,
  })) as number

  return {
    ticket: {
      customerId,
      name,
      description,
      teamId,
      priority,
      stageId,
      id: ticketId,
    },
  }
}

export const fetchTicketById: bp.Integration['actions']['fetchTicketById'] = async ({ ctx, input, logger }) => {
  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })
  const { id } = input

  const filters = [id]
  const fields = ['id', 'name', 'description', 'team_id', 'priority', 'stage_id', 'partner_id']

  const rawTicket = (await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'helpdesk.ticket',
    method: 'read',
    args: [filters, fields],
    logger,
  })) as Array<Record<string, any>>

  if (rawTicket.length === 0) {
    throw new RuntimeError('Ticket not found')
  }
  if (rawTicket.length > 1) {
    throw new RuntimeError('Multiple tickets found for the same id')
  }

  // At this point, we've verified rawTicket has exactly one element
  const ticket = rawTicket[0]
  if (!ticket) {
    throw new RuntimeError('Ticket not found')
  }

  return {
    ticket: {
      customerId: ticket.partner_id,
      id: ticket.id,
      name: ticket.name,
      description: ticket.description,
      teamId: ticket.team_id,
      priority: ticket.priority,
      stageId: ticket.stage_id,
    },
  }
}

export const fetchTicketsByCustomerId: bp.Integration['actions']['fetchTicketsByCustomerId'] = async ({
  ctx,
  input,
  logger,
}) => {
  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })
  const { customerId } = input
  const filters: any[] = [['partner_id', '=', customerId]]
  const fields: string[] = ['id', 'name', 'description', 'team_id', 'priority', 'stage_id']

  const rawTickets = await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'helpdesk.ticket',
    method: 'search_read',
    args: [filters, fields],
    logger,
  })
  return {
    tickets: rawTickets.map((ticket: any) => ({
      customerId: ticket.partner_id,
      id: ticket.id,
      name: ticket.name,
      description: ticket.description,
      teamId: ticket.team_id,
      priority: ticket.priority,
      stageId: ticket.stage_id,
    })) as Array<{
      customerId: number
      id: number
      name: string
      description: string
      teamId: number
      priority: string
      stageId: number
    }>,
  }
}

export const fetchTicketsByCustomerEmail: bp.Integration['actions']['fetchTicketsByCustomerEmail'] = async ({
  ctx,
  input,
  logger,
}) => {
  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })
  const { customerEmail } = input
  const filters: any[] = [['partner_id.email', '=', customerEmail]]
  const fields: string[] = ['id', 'name', 'description', 'team_id', 'priority', 'stage_id']
  const rawTickets = await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'helpdesk.ticket',
    method: 'search_read',
    args: [filters, fields],
    logger,
  })
  return {
    tickets: rawTickets.map((ticket: any) => ({
      customerId: ticket.partner_id,
      id: ticket.id,
      name: ticket.name,
      description: ticket.description,
      teamId: ticket.team_id,
      priority: ticket.priority,
      stageId: ticket.stage_id,
    })) as Array<{
      customerId: number
      id: number
      name: string
      description: string
      teamId: number
      priority: string
      stageId: number
    }>,
  }
}

export const updateTicket: bp.Integration['actions']['updateTicket'] = async ({ ctx, input, logger }) => {
  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })
  const { ticket } = input

  const newTicketPayload: Record<string, any> = {
    name: input.name ?? ticket.name,
    description: input.description ?? ticket.description,
    team_id: input.teamId ?? ticket.teamId,
    priority: input.priority ?? ticket.priority,
    stage_id: input.stageId ?? ticket.stageId ?? null,
  }

  const success = (await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'helpdesk.ticket',
    method: 'write',
    args: [[ticket.id], newTicketPayload],
    logger,
  })) as boolean

  return {
    success,
  }
}
