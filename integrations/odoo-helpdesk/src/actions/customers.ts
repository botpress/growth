import * as bp from '.botpress'
import { RuntimeError } from '@botpress/client'
import { executeOdooMethod, getAuthenticatedCookie } from 'src/services/odoo'
import { customerSchema, Customer } from 'definitions/schemas'
import { z } from '@botpress/sdk'

export const createCustomer: bp.Integration['actions']['createCustomer'] = async ({
  ctx, client, input, logger
}) => {
  logger.forBot().info(`Creating customer: ${JSON.stringify(input)}`)

  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })
  const { id, email, name, phone } = input

  const customerPayload: Record<string, any> = {
    email,
    phone,
    name,
  }

  const odooId = (await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'res.partner',
    method: 'create',
    args: [customerPayload],
    logger,
  })) as Customer['odooId']

  // Store the mapping of bp id to odoo id
  const { state } = (await client.getOrSetState({
    type: 'integration',
    name: 'customerIdMapping',
    id: ctx.integrationId,
    payload: { customerIdMapping: {} },
  } as any)) as unknown as {
    state: { payload: { customerIdMapping: Record<string, string> } }
  }

  const mapping = state.payload?.customerIdMapping || {}
  if (odooId) {
    mapping[id] = odooId.toString()
  }

  await client.setState({
    type: 'integration',
    name: 'customerIdMapping',
    id: ctx.integrationId,
    payload: { customerIdMapping: mapping },
  } as any)

  return {
    customer: {
      id,
      odooId,
      email,
      name,
      phone,
    } as Customer
  }
}

const fetchCustomer = async ({
  ctx,
  input: { id, odooId, email },
  logger,
}: {
  ctx: bp.Context
  input: { id: string; odooId?: string; email?: string }
  logger: bp.Logger
}): Promise<{ customer: z.infer<typeof customerSchema> }> => {
  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })
  const fields = ['id', 'email', 'name', 'phone']
  const filters: any[] = odooId ? [['id', '=', odooId]] : email ? [['email', '=', email]] : []

  let rawCustomer: Array<Record<string, any>> = await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'res.partner',
    method: 'search_read',
    args: [filters, fields],
    logger,
  }) as Array<Customer>

  if (rawCustomer.length === 0 || !rawCustomer[0])
    throw new RuntimeError('Customer not found')

  if (rawCustomer.length > 1)
    throw new RuntimeError('Multiple customers found for the same id')

  const customer = rawCustomer[0] as Customer

  return {
    customer: {
      id,
      odooId: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
    } as z.infer<typeof customerSchema>,
  }
}
export const fetchCustomerById: bp.Integration['actions']['fetchCustomerById'] = async ({
  ctx,
  client,
  input,
  logger,
}) => {
  logger.forBot().info(`Fetching customer by id: ${JSON.stringify(input)}`)

  // Look up the odoo id from the bp id mapping
  const { state } = (await client.getOrSetState({
    type: 'integration',
    name: 'customerIdMapping',
    id: ctx.integrationId,
    payload: { customerIdMapping: {} },
  } as any)) as unknown as {
    state: { payload: { customerIdMapping: Record<string, string> } }
  }

  const mapping = state.payload?.customerIdMapping || {}
  const odooId = mapping[input.id]

  if (!odooId) {
    throw new RuntimeError(`No Odoo ID found for customer ID: ${input.id}`)
  }

  return fetchCustomer({ ctx, input: { id: input.id, odooId }, logger })
}
export const fetchCustomerByOdooId: bp.Integration['actions']['fetchCustomerByOdooId'] = async ({
  ctx,
  input,
  logger,
}) => {
  logger.forBot().info(`Fetching customer by odoo id: ${JSON.stringify(input)}`)
  return fetchCustomer({ ctx, input: { id: input.id, odooId: input.odooId }, logger })
}
export const fetchCustomerByEmail: bp.Integration['actions']['fetchCustomerByEmail'] = async ({
  ctx,
  input,
  logger,
}) => {
  logger.forBot().info(`Fetching customer by email: ${JSON.stringify(input)}`)
  return fetchCustomer({ ctx, input: { id: input.id, email: input.email }, logger })
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
  let currentCustomer: { customer: Customer }

  // Determine odoo id based on input
  if (input.id) {
    // Look up the odoo id from the bp id mapping
    const { state } = (await client.getOrSetState({
      type: 'integration',
      name: 'customerIdMapping',
      id: ctx.integrationId,
      payload: { customerIdMapping: {} },
    } as any)) as unknown as {
      state: { payload: { customerIdMapping: Record<string, string> } }
    }

    const mapping = state.payload?.customerIdMapping || {}
    const mappedOdooId = mapping[input.id]

    if (!mappedOdooId) {
      throw new RuntimeError(`No Odoo ID found for customer ID: ${input.id}`)
    }

    odooId = mappedOdooId
    currentCustomer = await fetchCustomer({ ctx, input: { id: input.id, odooId }, logger })
  } else if (input.email) {
    currentCustomer = await fetchCustomer({ ctx, input: { id: '', email: input.email }, logger })
    if (!currentCustomer.customer?.odooId) {
      throw new RuntimeError('Customer not found or missing Odoo ID')
    }
    odooId = currentCustomer.customer.odooId
  } else {
    throw new RuntimeError('Must provide an id or email to update a customer')
  }

  // Build the update payload with only the fields that are provided
  const customerPayload: Record<string, any> = {}
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
      args: [[odooIdNumber], customerPayload],
      logger,
    })) as boolean,
  }
}

export const updateCustomerById: bp.Integration['actions']['updateCustomerById'] = async ({ ctx, client, input, logger }) => {
  logger.forBot().info(`Updating customer by id: ${JSON.stringify(input)}`)
  return updateCustomer({ ctx, client, input, logger })
}
export const updateCustomerByEmail: bp.Integration['actions']['updateCustomerByEmail'] = async ({ ctx, client, input, logger }) => {
  logger.forBot().info(`Updating customer by email: ${JSON.stringify(input)}`)
  return updateCustomer({ ctx, client, input, logger })
}
