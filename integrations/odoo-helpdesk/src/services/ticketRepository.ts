import * as bp from '.botpress'
import { RuntimeError } from '@botpress/client'
import { executeOdooMethod, getAuthenticatedCookie } from './odoo'
import {
  createTicketResultSchema,
  createTicketPayloadSchema,
  fetchTicketResultsSchema,
  ticketSchema,
  Ticket,
  CreateTicketPayload,
  CreateTicketResult,
  FetchTicketResult,
  FetchTicketResults,
  UpdateTicketPayload,
  OdooRequestArgs,
  OdooRequestFilters,
  OdooRequestFields,
  OdooRequestKwargs,
  OdooRequestMethod,
  OdooResponseObject,
} from 'definitions/schemas'
import { z } from '@botpress/sdk'

/**
 * Repository responsible for ticket data operations with Odoo.
 * Follows Single Responsibility Principle - only handles Odoo API interactions for tickets.
 * Follows Dependency Inversion Principle - depends on abstractions (Odoo service functions).
 */
export class TicketRepository {
  private readonly odooApiUrl: string
  private readonly logger: bp.Logger
  private readonly getCookie: () => Promise<string>

  constructor(odooApiUrl: string, logger: bp.Logger, getCookie: () => Promise<string>) {
    this.odooApiUrl = odooApiUrl
    this.logger = logger
    this.getCookie = getCookie
  }

  /**
   * Creates a new ticket in Odoo.
   *
   * @param payload - The ticket data to create
   * @returns The created ticket's Odoo ID
   */
  async create(payload: CreateTicketPayload): Promise<number> {
    const cookie = await this.getCookie()
    const validatedPayload = createTicketPayloadSchema.parse(payload)

    const ticketId: CreateTicketResult = await executeOdooMethod({
      odooApiUrl: this.odooApiUrl,
      cookie,
      model: 'helpdesk.ticket',
      method: 'create',
      args: [validatedPayload],
      schema: createTicketResultSchema,
      logger: this.logger,
    })

    return ticketId
  }

  /**
   * Fetches a ticket from Odoo by ticket ID.
   *
   * @param ticketId - The Odoo ticket ID
   * @returns The ticket object
   * @throws RuntimeError if ticket is not found or multiple tickets found
   */
  async findById(ticketId: number): Promise<Ticket> {
    const rawTickets = await this.findByFilter([ticketId], 'read')

    if (rawTickets.length === 0) {
      throw new RuntimeError(`Ticket with id ${ticketId} not found`)
    }

    if (rawTickets.length > 1) {
      throw new RuntimeError(`Multiple tickets found for id ${ticketId}: ${rawTickets.length} results`)
    }

    const ticketResult = rawTickets[0]
    if (!ticketResult || typeof ticketResult.id !== 'number') {
      throw new RuntimeError('Invalid ticket result: missing or invalid id')
    }

    return this.mapTicketResponseToTicket(ticketResult)
  }

  /**
   * Fetches tickets from Odoo by customer Odoo ID with pagination.
   *
   * @param customerOdooId - The Odoo customer ID
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of tickets per page
   * @returns Array of tickets
   */
  async findByCustomerId(customerOdooId: number, page: number = 1, pageSize: number = 100): Promise<Ticket[]> {
    const rawTickets = await this.findByFilter([['partner_id', '=', customerOdooId]], 'search_read', page, pageSize)

    return rawTickets.map((ticket) => this.mapTicketResponseToTicket(ticket))
  }

  /**
   * Fetches tickets from Odoo by customer email with pagination.
   *
   * @param customerEmail - The customer email address
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of tickets per page
   * @returns Array of tickets
   */
  async findByCustomerEmail(customerEmail: string, page: number = 1, pageSize: number = 100): Promise<Ticket[]> {
    const rawTickets = await this.findByFilter(
      [['partner_id.email', '=', customerEmail]],
      'search_read',
      page,
      pageSize
    )

    return rawTickets.map((ticket) => this.mapTicketResponseToTicket(ticket))
  }

  /**
   * Updates a ticket in Odoo.
   *
   * @param ticketId - The Odoo ticket ID
   * @param payload - The ticket data to update
   * @returns Success status of the update operation
   * @throws RuntimeError if no fields are provided to update
   */
  async update(ticketId: number, payload: Partial<UpdateTicketPayload>): Promise<boolean> {
    const cookie = await this.getCookie()

    // Build update payload with only provided fields.
    const updatePayload: Partial<UpdateTicketPayload> = {}
    if (payload.name !== undefined) updatePayload.name = payload.name
    if (payload.description !== undefined) updatePayload.description = payload.description
    if (payload.team_id !== undefined) updatePayload.team_id = payload.team_id
    if (payload.stage_id !== undefined) updatePayload.stage_id = payload.stage_id
    if (payload.priority !== undefined) updatePayload.priority = payload.priority

    if (Object.keys(updatePayload).length === 0) {
      throw new RuntimeError('No fields provided to update a ticket')
    }

    const success: boolean = await executeOdooMethod({
      odooApiUrl: this.odooApiUrl,
      cookie,
      model: 'helpdesk.ticket',
      method: 'write',
      args: [[ticketId], updatePayload],
      logger: this.logger,
      schema: z.boolean(),
    })

    return success
  }

  /**
   * Internal method to find tickets by filter.
   *
   * @param filters - The Odoo request filters
   * @param method - The Odoo request method ('read' or 'search_read')
   * @param page - Page number (1-indexed, only for search_read)
   * @param pageSize - Number of tickets per page (only for search_read)
   * @returns Array of raw ticket results
   */
  private async findByFilter(
    filters: OdooRequestFilters,
    method: OdooRequestMethod,
    page: number = 1,
    pageSize: number = 100
  ): Promise<FetchTicketResults> {
    const cookie = await this.getCookie()
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

    this.logger.forBot().debug(`Fetching tickets: method=${method}, page=${page}, pageSize=${pageSize}`)

    const tickets: FetchTicketResults = await executeOdooMethod({
      odooApiUrl: this.odooApiUrl,
      cookie,
      model: 'helpdesk.ticket',
      method,
      args,
      kwargs,
      schema: fetchTicketResultsSchema,
      logger: this.logger,
    })

    this.logger.forBot().debug(`Fetched ${tickets.length} tickets`)
    return tickets
  }

  /**
   * Maps Odoo TicketResponse to our Ticket schema.
   * Odoo returns relational fields as tuples [id, name], so we extract just the ID.
   * Some fields can be false when not set (e.g., partner_id, stage_id).
   *
   * @param response - The Odoo ticket response to map
   * @returns The mapped Ticket object
   * @throws RuntimeError if team_id is invalid
   */
  private mapTicketResponseToTicket(response: FetchTicketResult): Ticket {
    const extractId = (field: OdooResponseObject): number | undefined => {
      if (Array.isArray(field) && field.length > 0 && typeof field[0] === 'number') {
        return field[0]
      }
      return undefined
    }

    const customerOdooId = extractId(response.partner_id)
    const stageId = extractId(response.stage_id)

    // Validate team_id is a tuple with a number.
    let teamId: number
    if (Array.isArray(response.team_id) && response.team_id.length > 0 && typeof response.team_id[0] === 'number') {
      teamId = response.team_id[0]
    } else {
      throw new RuntimeError('Invalid team_id in ticket response')
    }

    return ticketSchema.parse({
      id: response.id,
      customerOdooId,
      name: response.name,
      description: response.description,
      teamId,
      priority: response.priority === false ? '0' : String(response.priority),
      stageId,
    })
  }
}

/**
 * Factory function to create a TicketRepository instance.
 * This follows Dependency Inversion Principle by injecting dependencies.
 *
 * @param ctx - The Botpress context
 * @param logger - The logger instance
 * @returns A new TicketRepository instance
 */
export function createTicketRepository(ctx: bp.Context, logger: bp.Logger): TicketRepository {
  return new TicketRepository(ctx.configuration.odooApiUrl, logger, async () => {
    return getAuthenticatedCookie({ ...ctx.configuration, logger })
  })
}
