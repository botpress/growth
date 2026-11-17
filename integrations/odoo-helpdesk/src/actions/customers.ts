import * as bp from '.botpress'
import { RuntimeError } from '@botpress/client'
import { Customer, CreateCustomerPayload, UpdateCustomerPayload } from 'definitions/schemas'
import { CustomerIdMappingService } from 'src/services/customerIdMapping'
import { createCustomerRepository, CustomerRepository } from 'src/services/customerRepository'

/**
 * Creates a new customer in Odoo and stores the ID mapping.
 *
 * @param ctx - The Botpress context
 * @param client - The Botpress client
 * @param input - Customer creation input with id, email, name, and phone
 * @param logger - The logger instance
 * @returns The created customer's Odoo ID
 */
export const createCustomer: bp.Integration['actions']['createCustomer'] = async ({
  ctx,
  client,
  input: { id, email, name, phone },
  logger,
}): Promise<{ odooId: number }> => {
  logger.forBot().debug(`Creating customer: id=${id}, email=${email}`)

  const repository = createCustomerRepository(ctx, logger)
  const idMappingService = new CustomerIdMappingService(client, ctx.integrationId)

  const customerPayload: CreateCustomerPayload = {
    email,
    phone,
    name,
  }

  const odooId = await repository.create(customerPayload)
  await idMappingService.setMapping(id, odooId)

  logger.forBot().info(`Customer created successfully: id=${id}, odooId=${odooId}`)
  return { odooId }
}

/**
 * Helper function to fetch a customer using the repository.
 * Adds the Botpress ID to the customer object if provided.
 *
 * @param repository - The customer repository instance
 * @param id - Optional Botpress customer ID
 * @param odooId - Optional Odoo customer ID
 * @param email - Optional customer email
 * @returns The customer object with optional Botpress ID
 * @throws RuntimeError if neither odooId nor email is provided
 */
async function fetchCustomerWithId(
  repository: CustomerRepository,
  id: string | undefined,
  odooId: number | undefined,
  email: string | undefined
): Promise<{ customer: Customer }> {
  let customer: Customer

  if (odooId) {
    customer = await repository.findByOdooId(odooId)
  } else if (email) {
    customer = await repository.findByEmail(email)
  } else {
    throw new RuntimeError('Must provide either odooId or email to fetch customer')
  }

  if (id) {
    customer = { ...customer, id }
  }

  return { customer }
}

/**
 * Fetches a customer by Botpress customer ID.
 *
 * @param ctx - The Botpress context
 * @param client - The Botpress client
 * @param input - Input containing the Botpress customer ID
 * @param logger - The logger instance
 * @returns The customer object
 * @throws RuntimeError if customer is not found
 */
export const fetchCustomerById: bp.Integration['actions']['fetchCustomerById'] = async ({
  ctx,
  client,
  input,
  logger,
}): Promise<{ customer: Customer }> => {
  logger.forBot().debug(`Fetching customer by id: ${input.id}`)

  const repository = createCustomerRepository(ctx, logger)
  const idMappingService = new CustomerIdMappingService(client, ctx.integrationId)

  const odooId = await idMappingService.getOdooId(input.id)
  return fetchCustomerWithId(repository, input.id, odooId, undefined)
}

/**
 * Fetches a customer by Odoo customer ID.
 *
 * @param ctx - The Botpress context
 * @param input - Input containing the Odoo customer ID and optional Botpress ID
 * @param logger - The logger instance
 * @returns The customer object
 * @throws RuntimeError if customer is not found
 */
export const fetchCustomerByOdooId: bp.Integration['actions']['fetchCustomerByOdooId'] = async ({
  ctx,
  input,
  logger,
}): Promise<{ customer: Customer }> => {
  logger.forBot().debug(`Fetching customer by odoo id: ${input.odooId}`)

  const repository = createCustomerRepository(ctx, logger)
  return fetchCustomerWithId(repository, input.id, input.odooId, undefined)
}

/**
 * Fetches a customer by email address.
 *
 * @param ctx - The Botpress context
 * @param input - Input containing the customer email and optional Botpress ID
 * @param logger - The logger instance
 * @returns The customer object
 * @throws RuntimeError if customer is not found
 */
export const fetchCustomerByEmail: bp.Integration['actions']['fetchCustomerByEmail'] = async ({
  ctx,
  input,
  logger,
}): Promise<{ customer: Customer }> => {
  logger.forBot().debug(`Fetching customer by email: ${input.email}`)

  const repository = createCustomerRepository(ctx, logger)
  return fetchCustomerWithId(repository, input.id, undefined, input.email)
}

/**
 * Helper function to determine the Odoo ID from various input options.
 * Follows Single Responsibility Principle - only handles ID resolution logic.
 *
 * @param repository - The customer repository instance
 * @param idMappingService - The ID mapping service instance
 * @param input - Input object containing id, email, or odooId
 * @returns The resolved Odoo ID
 * @throws RuntimeError if no valid identifier is provided or customer is not found
 */
async function resolveOdooId(
  repository: CustomerRepository,
  idMappingService: CustomerIdMappingService,
  input: { id?: string; email?: string; odooId?: number }
): Promise<number> {
  if (input.id) {
    return idMappingService.getOdooId(input.id)
  }

  if (input.odooId) {
    return input.odooId
  }

  if (input.email) {
    const customer = await repository.findByEmail(input.email)
    if (customer.odooId === undefined) {
      throw new RuntimeError('Customer not found or missing Odoo ID')
    }
    return customer.odooId
  }

  throw new RuntimeError('Must provide an id, odooId, or email to update a customer')
}

/**
 * Helper function to update a customer.
 * Follows Single Responsibility Principle - only handles update orchestration.
 *
 * @param repository - The customer repository instance
 * @param idMappingService - The ID mapping service instance
 * @param input - Input object containing customer identifier and fields to update
 * @returns Success status of the update operation
 * @throws RuntimeError if no valid identifier is provided or customer is not found
 */
async function updateCustomer(
  repository: CustomerRepository,
  idMappingService: CustomerIdMappingService,
  input: { id?: string; email?: string; name?: string; phone?: string; odooId?: number }
): Promise<{ success: boolean }> {
  const odooId = await resolveOdooId(repository, idMappingService, input)

  const customerPayload: UpdateCustomerPayload = {
    ...(input.email !== undefined && { email: input.email }),
    ...(input.name !== undefined && { name: input.name }),
    ...(input.phone !== undefined && { phone: input.phone }),
  }

  const success = await repository.update(odooId, customerPayload)
  return { success }
}

/**
 * Updates a customer by Botpress customer ID.
 *
 * @param ctx - The Botpress context
 * @param client - The Botpress client
 * @param input - Input containing the Botpress customer ID and fields to update
 * @param logger - The logger instance
 * @returns Success status of the update operation
 * @throws RuntimeError if customer is not found or no fields are provided
 */
export const updateCustomerById: bp.Integration['actions']['updateCustomerById'] = async ({
  ctx,
  client,
  input,
  logger,
}) => {
  logger.forBot().debug(`Updating customer by id: ${input.id}`)

  const repository = createCustomerRepository(ctx, logger)
  const idMappingService = new CustomerIdMappingService(client, ctx.integrationId)

  const result = await updateCustomer(repository, idMappingService, input)
  logger.forBot().info(`Customer updated successfully: id=${input.id}`)
  return result
}

/**
 * Updates a customer by Odoo customer ID.
 *
 * @param ctx - The Botpress context
 * @param client - The Botpress client
 * @param input - Input containing the Odoo customer ID and fields to update
 * @param logger - The logger instance
 * @returns Success status of the update operation
 * @throws RuntimeError if customer is not found or no fields are provided
 */
export const updateCustomerByOdooId: bp.Integration['actions']['updateCustomerByOdooId'] = async ({
  ctx,
  client,
  input,
  logger,
}) => {
  logger.forBot().debug(`Updating customer by odoo id: ${input.odooId}`)

  const repository = createCustomerRepository(ctx, logger)
  const idMappingService = new CustomerIdMappingService(client, ctx.integrationId)

  const result = await updateCustomer(repository, idMappingService, input)
  logger.forBot().info(`Customer updated successfully: odooId=${input.odooId}`)
  return result
}

/**
 * Updates a customer by email address.
 *
 * @param ctx - The Botpress context
 * @param client - The Botpress client
 * @param input - Input containing the customer email and fields to update
 * @param logger - The logger instance
 * @returns Success status of the update operation
 * @throws RuntimeError if customer is not found or no fields are provided
 */
export const updateCustomerByEmail: bp.Integration['actions']['updateCustomerByEmail'] = async ({
  ctx,
  client,
  input,
  logger,
}) => {
  logger.forBot().debug(`Updating customer by email: ${input.email}`)

  const repository = createCustomerRepository(ctx, logger)
  const idMappingService = new CustomerIdMappingService(client, ctx.integrationId)

  const result = await updateCustomer(repository, idMappingService, input)
  logger.forBot().info(`Customer updated successfully: email=${input.email}`)
  return result
}
