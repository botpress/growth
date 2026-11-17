import * as bp from '.botpress'
import { RuntimeError } from '@botpress/client'
import { executeOdooMethod, getAuthenticatedCookie } from './odoo'
import {
  customerSchema,
  createCustomerPayloadSchema,
  createCustomerResultSchema,
  fetchCustomerResultSchema,
  updateCustomerPayloadSchema,
  Customer,
  CreateCustomerPayload,
  CreateCustomerResult,
  UpdateCustomerPayload,
  OdooRequestFilters,
  OdooRequestFields,
  OdooRequestArgs,
} from 'definitions/schemas'
import { z } from '@botpress/sdk'

/**
 * Repository responsible for customer data operations with Odoo.
 * Follows Single Responsibility Principle - only handles Odoo API interactions for customers.
 * Follows Dependency Inversion Principle - depends on abstractions (Odoo service functions).
 */
export class CustomerRepository {
  private readonly odooApiUrl: string
  private readonly logger: bp.Logger
  private readonly getCookie: () => Promise<string>

  constructor(odooApiUrl: string, logger: bp.Logger, getCookie: () => Promise<string>) {
    this.odooApiUrl = odooApiUrl
    this.logger = logger
    this.getCookie = getCookie
  }

  /**
   * Creates a new customer in Odoo.
   *
   * @param payload - The customer data to create
   * @returns The created customer's Odoo ID
   */
  async create(payload: CreateCustomerPayload): Promise<number> {
    const cookie = await this.getCookie()
    const validatedPayload = createCustomerPayloadSchema.parse(payload)

    const odooId: CreateCustomerResult = await executeOdooMethod({
      odooApiUrl: this.odooApiUrl,
      cookie,
      model: 'res.partner',
      method: 'create',
      args: [validatedPayload],
      schema: createCustomerResultSchema,
      logger: this.logger,
    })

    return odooId
  }

  /**
   * Fetches a customer from Odoo by Odoo ID.
   *
   * @param odooId - The Odoo customer ID
   * @returns The customer object
   * @throws RuntimeError if customer is not found or multiple customers found
   */
  async findByOdooId(odooId: number): Promise<Customer> {
    return this.findByFilter([['id', '=', odooId]])
  }

  /**
   * Fetches a customer from Odoo by email.
   *
   * @param email - The customer email address
   * @returns The customer object
   * @throws RuntimeError if customer is not found or multiple customers found
   */
  async findByEmail(email: string): Promise<Customer> {
    return this.findByFilter([['email', '=', email]])
  }

  /**
   * Updates a customer in Odoo.
   *
   * @param odooId - The Odoo customer ID
   * @param payload - The customer data to update
   * @returns Success status of the update operation
   * @throws RuntimeError if no fields are provided to update
   */
  async update(odooId: number, payload: UpdateCustomerPayload): Promise<boolean> {
    const cookie = await this.getCookie()
    const validatedPayload = updateCustomerPayloadSchema.parse(payload)

    if (Object.keys(validatedPayload).length === 0) {
      throw new RuntimeError('No fields provided to update')
    }

    const success: boolean = await executeOdooMethod({
      odooApiUrl: this.odooApiUrl,
      cookie,
      model: 'res.partner',
      method: 'write',
      args: [[odooId], validatedPayload],
      logger: this.logger,
      schema: z.boolean(),
    })

    return success
  }

  /**
   * Internal method to find a customer by filter.
   * Throws if no customer found or multiple customers found.
   *
   * @param filters - The Odoo request filters
   * @returns The customer object
   * @throws RuntimeError if customer is not found or multiple customers found
   */
  private async findByFilter(filters: OdooRequestFilters): Promise<Customer> {
    const cookie = await this.getCookie()
    const fields: OdooRequestFields = ['id', 'email', 'name', 'phone']
    const args: OdooRequestArgs = [filters, fields]

    const rawCustomer: z.infer<typeof fetchCustomerResultSchema> = await executeOdooMethod({
      odooApiUrl: this.odooApiUrl,
      cookie,
      model: 'res.partner',
      method: 'search_read',
      args,
      logger: this.logger,
      schema: fetchCustomerResultSchema,
    })

    if (rawCustomer.length === 0) {
      throw new RuntimeError('Customer not found')
    }

    if (rawCustomer.length > 1) {
      throw new RuntimeError(`Multiple customers found: ${rawCustomer.length} results`)
    }

    const firstCustomer = rawCustomer[0]
    if (!firstCustomer || typeof firstCustomer.id !== 'number') {
      throw new RuntimeError('Invalid customer data: missing or invalid id')
    }

    return customerSchema.parse({
      odooId: firstCustomer.id,
      email: firstCustomer.email,
      name: firstCustomer.name,
      phone: firstCustomer.phone,
    })
  }
}

/**
 * Factory function to create a CustomerRepository instance.
 * This follows Dependency Inversion Principle by injecting dependencies.
 *
 * @param ctx - The Botpress context
 * @param logger - The logger instance
 * @returns A new CustomerRepository instance
 */
export function createCustomerRepository(ctx: bp.Context, logger: bp.Logger): CustomerRepository {
  return new CustomerRepository(ctx.configuration.odooApiUrl, logger, async () => {
    return getAuthenticatedCookie({ ...ctx.configuration, logger })
  })
}
