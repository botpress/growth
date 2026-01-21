import * as bp from '.botpress'
import { RuntimeError } from '@botpress/client'
import { createTicketRepository, TicketRepository } from 'src/services/ticketRepository'
import { CreateTicketPayload, UpdateTicketPayload } from 'definitions/schemas'

/**
 * Creates a new ticket in Odoo.
 *
 * @param ctx - The Botpress context
 * @param input - Ticket creation input with name, description, teamId, priority, stageId, and customerOdooId
 * @param logger - The logger instance
 * @returns The created ticket's Odoo ID
 */
export const createTicket: bp.Integration['actions']['createTicket'] = async ({
  ctx,
  input: { name, description, teamId, priority, stageId, customerOdooId },
  logger,
}) => {
  logger.forBot().debug(`Creating ticket: name=${name}, teamId=${teamId}`)

  const repository = createTicketRepository(ctx, logger)

  const ticketPayload: CreateTicketPayload = {
    name,
    description,
    team_id: teamId,
    partner_id: customerOdooId,
    priority: priority !== undefined ? String(priority) : '0',
    ...(stageId ? { stage_id: stageId } : {}),
  }

  const ticketId = await repository.create(ticketPayload)

  // Fetch the created ticket to return complete data.
  const ticket = await repository.findById(ticketId)

  logger.forBot().info(`Ticket created successfully: ticketId=${ticket.id}`)
  return {
    ticketId: ticket.id,
  }
}

/**
 * Fetches a ticket by Odoo ticket ID.
 *
 * @param ctx - The Botpress context
 * @param input - Input containing the ticket ID
 * @param logger - The logger instance
 * @returns The ticket object
 * @throws RuntimeError if ticket is not found
 */
export const fetchTicketById: bp.Integration['actions']['fetchTicketById'] = async ({ ctx, input: { id }, logger }) => {
  logger.forBot().debug(`Fetching ticket by id: ${id}`)

  const repository = createTicketRepository(ctx, logger)
  const ticket = await repository.findById(id)

  logger.forBot().info(`Ticket fetched successfully: ticketId=${ticket.id}`)
  return {
    ticket,
  }
}

/**
 * Fetches tickets by customer Odoo ID with pagination.
 *
 * @param ctx - The Botpress context
 * @param input - Input containing customerOdooId, page, and pageSize
 * @param logger - The logger instance
 * @returns Array of tickets
 */
export const fetchTicketsByCustomerId: bp.Integration['actions']['fetchTicketsByCustomerId'] = async ({
  ctx,
  input: { customerOdooId, page, pageSize },
  logger,
}) => {
  logger.forBot().debug(`Fetching tickets by customer id: ${customerOdooId}, page=${page}, pageSize=${pageSize}`)

  const repository = createTicketRepository(ctx, logger)
  const tickets = await repository.findByCustomerId(customerOdooId, page, pageSize)

  logger.forBot().info(`Fetched ${tickets.length} tickets for customer: ${customerOdooId}`)
  return {
    tickets,
  }
}

/**
 * Fetches tickets by customer email with pagination.
 *
 * @param ctx - The Botpress context
 * @param input - Input containing customerEmail, page, and pageSize
 * @param logger - The logger instance
 * @returns Array of tickets
 */
export const fetchTicketsByCustomerEmail: bp.Integration['actions']['fetchTicketsByCustomerEmail'] = async ({
  ctx,
  input: { customerEmail, page, pageSize },
  logger,
}) => {
  logger.forBot().debug(`Fetching tickets by customer email: ${customerEmail}, page=${page}, pageSize=${pageSize}`)

  const repository = createTicketRepository(ctx, logger)
  const tickets = await repository.findByCustomerEmail(customerEmail, page, pageSize)

  logger.forBot().info(`Fetched ${tickets.length} tickets for customer email: ${customerEmail}`)
  return {
    tickets,
  }
}

/**
 * Updates a ticket in Odoo.
 *
 * @param ctx - The Botpress context
 * @param input - Input containing ticketId and fields to update
 * @param logger - The logger instance
 * @returns Success status of the update operation
 * @throws RuntimeError if no fields are provided to update
 */
export const updateTicket: bp.Integration['actions']['updateTicket'] = async ({
  ctx,
  input: { ticketId, name, description, teamId, priority, stageId },
  logger,
}) => {
  logger.forBot().debug(`Updating ticket: ticketId=${ticketId}`)

  const repository = createTicketRepository(ctx, logger)

  const updatePayload: Partial<UpdateTicketPayload> = {
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(teamId !== undefined && { team_id: teamId }),
    ...(stageId !== undefined && { stage_id: stageId }),
    ...(priority !== undefined && { priority }),
  }

  const success = await repository.update(ticketId, updatePayload)

  logger.forBot().info(`Ticket updated successfully: ticketId=${ticketId}`)
  return { success }
}
