import * as bp from '.botpress'
import { RuntimeError } from '@botpress/client'
import { executeOdooMethod, getAuthenticatedCookie } from 'src/services/odoo'
import {
  customerSchema,
  createCustomerResultSchema,
  fetchCustomerResultSchema,
  updateCustomerPayloadSchema,
  Customer,
  CreateCustomerPayload,
  CreateCustomerResult,
  FetchCustomerResult,
  UpdateCustomerPayload,
  OdooRequestFilters,
  OdooRequestFields,
  OdooRequestArgs,
} from 'definitions/schemas'
import { z } from '@botpress/sdk'

export const createCustomer: bp.Integration['actions']['createCustomer'] = async ({
  ctx,
  client,
  input: { id, email, name, phone },
  logger,
}) => {
  logger.forBot().debug(`Creating customer: ${JSON.stringify({ id, email, name, phone })}`)

  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })

  const customerPayload: CreateCustomerPayload = {
    email,
    phone,
    name,
  }

  const odooId: CreateCustomerResult = await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'res.partner',
    method: 'create',
    args: [customerPayload],
    schema: createCustomerResultSchema,
    logger,
  })

  // Store the mapping of bp id to odoo id (as string for storage)
  const { state } = await client.getOrSetState({
    type: 'integration',
    name: 'customerIdMapping',
    id: ctx.integrationId,
    payload: { customerIdMapping: {} },
  })

  const mapping = state.payload?.customerIdMapping || {}
  mapping[id] = odooId

  await client.setState({
    type: 'integration',
    name: 'customerIdMapping',
    id: ctx.integrationId,
    payload: { customerIdMapping: mapping },
  })

  return { odooId }
}

const fetchCustomer = async ({
  ctx,
  input: { id, odooId, email },
  logger,
}: {
  ctx: bp.Context
  input: { id?: string; odooId?: number; email?: string }
  logger: bp.Logger
}): Promise<{ customer: Customer }> => {
  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })
  const filters: OdooRequestFilters = odooId ? [['id', '=', odooId]] : email ? [['email', '=', email]] : []
  const fields: OdooRequestFields = ['id', 'email', 'name', 'phone']
  const args: OdooRequestArgs = [filters, fields]

  let rawCustomer: FetchCustomerResult = await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'res.partner',
    method: 'search_read',
    args,
    logger,
    schema: fetchCustomerResultSchema,
  })

  if (rawCustomer.length === 0 || rawCustomer[0]?.id === undefined) throw new RuntimeError('Customer not found')
  if (rawCustomer.length > 1) throw new RuntimeError('Multiple customers found for the same id')

  const customer: Customer = customerSchema.parse({
    id,
    odooId: rawCustomer[0].id,
    email: rawCustomer[0].email,
    name: rawCustomer[0].name,
    phone: rawCustomer[0].phone,
  })

  return { customer }
}
export const fetchCustomerById: bp.Integration['actions']['fetchCustomerById'] = async ({
  ctx,
  client,
  input,
  logger,
}): Promise<{ customer: Customer }> => {
  logger.forBot().info(`Fetching customer by id: ${JSON.stringify(input)}`)

  // Look up the odoo id from the bp id mapping
  const { state } = await client.getOrSetState({
    type: 'integration',
    name: 'customerIdMapping',
    id: ctx.integrationId,
    payload: { customerIdMapping: {} },
  })

  const mapping = state.payload?.customerIdMapping || {}
  const odooId = mapping[input.id]

  if (!odooId) throw new RuntimeError(`No Odoo ID found for customer ID: ${input.id}`)
  return fetchCustomer({ ctx, input: { id: input.id, odooId }, logger })
}
export const fetchCustomerByOdooId: bp.Integration['actions']['fetchCustomerByOdooId'] = async ({
  ctx,
  input,
  logger,
}): Promise<{ customer: Customer }> => {
  logger.forBot().info(`Fetching customer by odoo id: ${JSON.stringify(input)}`)
  return fetchCustomer({ ctx, input: { id: input.id, odooId: input.odooId }, logger })
}
export const fetchCustomerByEmail: bp.Integration['actions']['fetchCustomerByEmail'] = async ({
  ctx,
  input,
  logger,
}): Promise<{ customer: Customer }> => {
  logger.forBot().info(`Fetching customer by email: ${JSON.stringify(input)}`)
  return fetchCustomer({ ctx, input: { email: input.email, id: input.id }, logger })
}

const updateCustomer = async ({
  ctx,
  client,
  input,
  logger,
}: {
  ctx: bp.Context
  client: bp.Client
  input: { id?: string; email?: string; name?: string; phone?: string; odooId?: number }
  logger: bp.Logger
}): Promise<{ success: boolean }> => {
  logger.forBot().info(`Updating customer: ${JSON.stringify(input)}`)
  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })

  let odooId: number = input.odooId || 0
  let currentCustomer: Customer

  // Determine odoo id based on input
  if (input.id) {
    // Look up the odoo id from the bp id mapping
    const { state } = await client.getOrSetState({
      type: 'integration',
      name: 'customerIdMapping',
      id: ctx.integrationId,
      payload: { customerIdMapping: {} },
    })

    const mapping = state.payload?.customerIdMapping || {}
    const mappedOdooId = mapping[input.id]

    if (!mappedOdooId) throw new RuntimeError(`No Odoo ID found for customer ID: ${input.id}`)

    odooId = mappedOdooId
  } else if (input.odooId) {
    odooId = input.odooId
  } else if (input.email) {
    currentCustomer = (await fetchCustomer({ ctx, input: { email: input.email }, logger })).customer
    if (currentCustomer.odooId === undefined) throw new RuntimeError('Customer not found or missing Odoo ID')
    odooId = currentCustomer.odooId
  } else {
    throw new RuntimeError('Must provide an id or email to update a customer')
  }

  // Build the update payload with only the fields that are provided
  const customerPayload: UpdateCustomerPayload = updateCustomerPayloadSchema.parse(input)

  // If no fields to update, return early
  if (Object.keys(customerPayload).length === 0) {
    throw new RuntimeError('No fields provided to update')
  }

  const success: boolean = await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'res.partner',
    method: 'write',
    args: [[odooId], customerPayload],
    logger,
    schema: z.boolean(),
  })

  return { success }
}
export const updateCustomerById: bp.Integration['actions']['updateCustomerById'] = async ({
  ctx,
  client,
  input,
  logger,
}) => {
  logger.forBot().info(`Updating customer by id: ${JSON.stringify(input)}`)
  return updateCustomer({ ctx, client, input, logger })
}
export const updateCustomerByOdooId: bp.Integration['actions']['updateCustomerByOdooId'] = async ({
  ctx,
  client,
  input,
  logger,
}) => {
  logger.forBot().info(`Updating customer by odoo id: ${JSON.stringify(input)}`)
  return updateCustomer({ ctx, client, input, logger })
}
export const updateCustomerByEmail: bp.Integration['actions']['updateCustomerByEmail'] = async ({
  ctx,
  client,
  input,
  logger,
}) => {
  logger.forBot().info(`Updating customer by email: ${JSON.stringify(input)}`)
  return updateCustomer({ ctx, client, input, logger })
}
