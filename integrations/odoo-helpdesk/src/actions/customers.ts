import * as bp from '.botpress'
import { RuntimeError } from '@botpress/client'
import { executeOdooMethod, getAuthenticatedCookie } from 'src/services/odoo'
import { Customer } from 'definitions/schemas'

export const createCustomer: bp.Integration['actions']['createCustomer'] = async ({
  ctx,
  client,
  input: { id, email, name, phone },
  logger,
}) => {
  logger.forBot().info(`Creating customer: ${JSON.stringify({ id, email, name, phone })}`)

  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })

  const customerPayload: Record<string, string> = {
    email,
    phone,
    name,
  }

  const odooIdResult = (await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'res.partner',
    method: 'create',
    args: [customerPayload],
    logger,
  })) as string | number

  const odooId: number = typeof odooIdResult === 'number' ? odooIdResult : parseInt(odooIdResult as string, 10)

  // Store the mapping of bp id to odoo id (as string for storage)
  const { state } = await client.getOrSetState({
    type: 'integration',
    name: 'customerIdMapping',
    id: ctx.integrationId,
    payload: { customerIdMapping: {} },
  })

  const mapping = state.payload?.customerIdMapping || {}
  mapping[id] = odooId.toString()

  await client.setState({
    type: 'integration',
    name: 'customerIdMapping',
    id: ctx.integrationId,
    payload: { customerIdMapping: mapping },
  })

  return {
    odooId,
  }
}

const fetchCustomer = async ({
  ctx,
  input: { id, odooId, email },
  logger,
}: {
  ctx: bp.Context
  input: { id?: string; odooId?: string; email?: string }
  logger: bp.Logger
}): Promise<Customer> => {
  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })
  const fields = ['id', 'email', 'name', 'phone']
  const filters: (string | number)[][] = odooId ? [['id', '=', odooId]] : email ? [['email', '=', email]] : []

  let rawCustomer: Array<Record<string, string>> = (await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'res.partner',
    method: 'search_read',
    args: [filters, fields] as (string | number)[][],
    logger,
  })) as Array<Record<string, string>>

  if (rawCustomer.length === 0 || !rawCustomer[0]) throw new RuntimeError('Customer not found')

  if (rawCustomer.length > 1) throw new RuntimeError('Multiple customers found for the same id')

  const customerData = rawCustomer[0]

  const customer: Customer = {
    odooId: customerData.id as unknown as number,
    email: customerData.email as string,
    name: customerData.name as string,
    phone: customerData.phone as string,
  }

  if (id) {
    customer.id = id
  }

  return customer
}
export const fetchCustomerById: bp.Integration['actions']['fetchCustomerById'] = async ({
  ctx,
  client,
  input,
  logger,
}) => {
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

  if (!odooId) {
    throw new RuntimeError(`No Odoo ID found for customer ID: ${input.id}`)
  }

  const customer = await fetchCustomer({ ctx, input: { id: input.id, odooId }, logger })
  return { customer }
}
export const fetchCustomerByOdooId: bp.Integration['actions']['fetchCustomerByOdooId'] = async ({
  ctx,
  input,
  logger,
}) => {
  logger.forBot().info(`Fetching customer by odoo id: ${JSON.stringify(input)}`)
  const customer = await fetchCustomer({ ctx, input: { id: input.id, odooId: input.odooId }, logger })
  return { customer }
}
export const fetchCustomerByEmail: bp.Integration['actions']['fetchCustomerByEmail'] = async ({
  ctx,
  input,
  logger,
}) => {
  logger.forBot().info(`Fetching customer by email: ${JSON.stringify(input)}`)
  const customer = await fetchCustomer({ ctx, input: { email: input.email }, logger })
  return { customer }
}

const updateCustomer = async ({
  ctx,
  client,
  input,
  logger,
}: {
  ctx: bp.Context
  client: bp.Client
  input: { id?: string; email?: string; name?: string; phone?: string }
  logger: bp.Logger
}): Promise<{ success: boolean }> => {
  logger.forBot().info(`Updating customer: ${JSON.stringify(input)}`)
  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })

  let odooId: string
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

    if (!mappedOdooId) {
      throw new RuntimeError(`No Odoo ID found for customer ID: ${input.id}`)
    }

    odooId = mappedOdooId
    currentCustomer = await fetchCustomer({ ctx, input: { id: input.id, odooId }, logger })
  } else if (input.email) {
    currentCustomer = await fetchCustomer({ ctx, input: { email: input.email }, logger })
    const customerOdooId = currentCustomer.odooId
    if (customerOdooId === undefined) {
      throw new RuntimeError('Customer not found or missing Odoo ID')
    }
    odooId = customerOdooId.toString()
  } else {
    throw new RuntimeError('Must provide an id or email to update a customer')
  }

  // Build the update payload with only the fields that are provided
  const customerPayload: Record<string, string> = {}
  if (input.email !== undefined) {
    customerPayload.email = input.email
  }
  if (input.name !== undefined) {
    customerPayload.name = input.name
  }
  if (input.phone !== undefined) {
    customerPayload.phone = input.phone
  }

  // If no fields to update, return early
  if (Object.keys(customerPayload).length === 0) {
    throw new RuntimeError('No fields provided to update')
  }

  const odooIdNumber = parseInt(odooId, 10)

  return {
    success: (await executeOdooMethod({
      odooApiUrl: ctx.configuration.odooApiUrl,
      cookie,
      model: 'res.partner',
      method: 'write',
      args: [[odooIdNumber], customerPayload] as unknown as (number | Record<string, string>)[],
      logger,
    })) as boolean,
  }
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
export const updateCustomerByEmail: bp.Integration['actions']['updateCustomerByEmail'] = async ({
  ctx,
  client,
  input,
  logger,
}) => {
  logger.forBot().info(`Updating customer by email: ${JSON.stringify(input)}`)
  return updateCustomer({ ctx, client, input, logger })
}
